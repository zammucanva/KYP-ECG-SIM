import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * The deteriorating scenario: the heartbeat tone speeds up with the heart rate, and the alarm
 * escalates to high priority past the scenario's critical limit. AudioContext is wrapped (test-only)
 * to count the tones the app actually starts; simulated time runs on Playwright's fake clock.
 */
const monitor = (page: Page) => page.locator('.bedside');

async function instrumentAudio(page: Page) {
  await page.addInitScript(() => {
    const log = { starts: [] as number[] };
    (window as unknown as { __audioLog: typeof log }).__audioLog = log;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      createOscillator() {
        const oscillator = super.createOscillator();
        // The app schedules pitch with setValueAtTime, so record the scheduled value, not .value.
        let scheduled = oscillator.frequency.value;
        const setValueAtTime = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        oscillator.frequency.setValueAtTime = (value: number, time: number) => { scheduled = value; return setValueAtTime(value, time); };
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (when?: number) => { log.starts.push(Math.round(scheduled)); start(when); };
        return oscillator;
      }
    } as typeof AudioContext;
  });
}
const beatTones = (page: Page) => page.evaluate(() => (window as unknown as { __audioLog: { starts: number[] } }).__audioLog.starts.filter(frequency => frequency === 880).length);

async function openDeterioration(page: Page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.clock.install({ time: new Date('2026-11-03T10:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
  await page.getByRole('button', { name: 'Start scenario: A rapidly worsening monitor' }).click();
  await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
}

test('the heartbeat tone speeds up as the patient deteriorates, and the alarm escalates to high priority', async ({ page }) => {
  test.setTimeout(120_000);
  await instrumentAudio(page);
  await openDeterioration(page);
  // The sound control is on the monitor screen itself.
  await page.locator('.bedside-head').getByRole('button', { name: 'Turn on monitor sound' }).click();
  await expect(monitor(page)).toHaveAttribute('data-audio-status', 'running');
  await expect(page.locator('.bedside-head').getByRole('button', { name: 'Turn sound off' })).toBeVisible();
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();

  await page.clock.runFor(10_000);
  const atStart = await beatTones(page);
  await page.clock.runFor(5_000);
  const slow = (await beatTones(page)) - atStart;
  await expect(monitor(page)).toHaveAttribute('data-heart-rate', '88');
  await expect(page.getByTestId('alarm-bar')).toHaveText('No active alarms');

  await page.clock.runFor(70_000);
  await expect(monitor(page)).toHaveAttribute('data-heart-rate', '180');
  await expect(monitor(page)).toHaveAttribute('data-alarm-ids', /hr-critical-high/);
  await expect(page.getByTestId('alarm-bar')).toHaveClass(/priority-high/);
  await expect(page.getByTestId('alarm-bar')).toContainText('Heart rate above the critical limit: 180 /min (critical high 150)');
  await expect(page.getByTestId('tile-hr')).toHaveClass(/alarmed/);
  const before = await beatTones(page);
  await page.clock.runFor(5_000);
  const fast = (await beatTones(page)) - before;

  // 88/min gives about 7 beeps in 5 s; 180/min gives about 15.
  expect(slow).toBeGreaterThanOrEqual(6);
  expect(slow).toBeLessThanOrEqual(8);
  expect(fast).toBeGreaterThanOrEqual(14);
  expect(fast).toBeLessThanOrEqual(16);
  // The high-priority alarm burst is louder in pattern than the beeps: more pulses at alarm pitches.
  const alarmPulses = await page.evaluate(() => (window as unknown as { __audioLog: { starts: number[] } }).__audioLog.starts.filter(frequency => frequency === 784 || frequency === 990).length);
  expect(alarmPulses).toBeGreaterThanOrEqual(10);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await beatTones(page);
  await page.getByRole('button', { name: 'Test sound' }).click();
  await expect.poll(() => beatTones(page)).toBe(paused + 1);
});

test('on a phone the sound control is at the top of the monitor, and the escalated screen has no overflow or axe violations', async ({ page }) => {
  test.setTimeout(120_000);
  await openDeterioration(page, 375);
  const toggle = page.locator('.bedside-head').getByRole('button', { name: 'Turn on monitor sound' });
  await expect(toggle).toBeVisible();
  const toggleBox = (await toggle.boundingBox())!;
  const ecgBox = (await page.locator('.bedside-trace.ecg').boundingBox())!;
  expect(toggleBox.y).toBeLessThan(ecgBox.y);
  expect(toggleBox.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  await page.clock.runFor(80_000);
  await expect(page.getByTestId('alarm-bar')).toHaveClass(/priority-high/);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => `${item.id}: ${item.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
});
