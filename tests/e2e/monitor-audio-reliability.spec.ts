import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Monitor sound reliability and the deteriorating scenario end to end. AudioContext is wrapped
 * (test-only): it records the pitch the app schedules for each oscillator (setValueAtTime, not the
 * live .value), keeps the instances so a browser interruption can be simulated, and counts closes.
 * Simulated time runs on Playwright's fake clock.
 */
const monitor = (page: Page) => page.locator('.bedside');
const SCENARIO = 'A rapidly worsening monitor';

async function instrumentAudio(page: Page) {
  await page.addInitScript(() => {
    const log = { starts: [] as number[], contexts: [] as AudioContext[], closed: 0 };
    (window as unknown as { __audio: typeof log }).__audio = log;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(...args: ConstructorParameters<typeof AudioContext>) { super(...args); log.contexts.push(this); }
      close() { log.closed += 1; return super.close(); }
      createOscillator() {
        const oscillator = super.createOscillator();
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
const tones = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { starts: number[] } }).__audio.starts);
const beats = async (page: Page) => (await tones(page)).filter(frequency => frequency === 880).length;
const closed = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { closed: number } }).__audio.closed);

async function open(page: Page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.clock.install({ time: new Date('2026-11-03T10:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
  await page.getByRole('button', { name: `Start scenario: ${SCENARIO}` }).click();
  await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
}

/** Beat tones started during `ms` of simulated time. */
async function beatsDuring(page: Page, ms: number) {
  const before = await beats(page);
  await page.clock.runFor(ms);
  return (await beats(page)) - before;
}

test('heartbeat tone follows every stage of the deterioration; pause, mute, reset and completion behave', async ({ page }) => {
  test.setTimeout(180_000);
  await instrumentAudio(page);
  await open(page);
  // Test sound works before the scenario has started.
  await page.getByRole('button', { name: 'Test sound' }).click();
  await expect.poll(() => beats(page)).toBe(1);
  await expect(monitor(page)).toHaveAttribute('data-audio-status', 'running');
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();

  await page.clock.runFor(10_000);
  const at88 = await beatsDuring(page, 10_000);
  await page.clock.runFor(10_000); // into the 118 stage (00:25)
  const at118 = await beatsDuring(page, 10_000);
  await expect(monitor(page)).toHaveAttribute('data-heart-rate', '118');
  await page.clock.runFor(15_000); // into the 135 stage (00:50)
  const at135 = await beatsDuring(page, 10_000);
  await expect(monitor(page)).toHaveAttribute('data-heart-rate', '135');
  await expect(page.getByTestId('alarm-bar')).toHaveClass(/priority-medium/);
  await page.clock.runFor(15_000); // into the 180 stage (01:15)
  const at180 = await beatsDuring(page, 10_000);
  await expect(monitor(page)).toHaveAttribute('data-heart-rate', '180');
  await expect(page.getByTestId('alarm-bar')).toHaveClass(/priority-high/);
  // Ten seconds at each rate: about rate / 6 beeps, always increasing.
  for (const [count, rate] of [[at88, 88], [at118, 118], [at135, 135], [at180, 180]]) {
    expect(Math.abs(count - rate / 6), `beeps at ${rate}/min`).toBeLessThanOrEqual(1.5);
  }
  expect(at88 < at118 && at118 < at135 && at135 < at180).toBe(true);

  // Pause: nothing new. Mute: nothing new, alarm still shown. Unmute: beeping returns.
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await beatsDuring(page, 3_000)).toBe(0);
  await page.getByRole('checkbox', { name: 'Mute' }).check();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  expect(await beatsDuring(page, 3_000)).toBe(0);
  await expect(monitor(page)).toHaveAttribute('data-alarm-ids', /hr-critical-high/);
  await page.getByRole('checkbox', { name: 'Mute' }).uncheck();
  expect(await beatsDuring(page, 3_000)).toBeGreaterThanOrEqual(8);

  // Completion at 02:00: the clock stops and no tone is scheduled after it.
  await page.clock.runFor(30_000);
  await expect(monitor(page)).toHaveAttribute('data-playing', 'false');
  await expect(monitor(page)).toHaveAttribute('data-simulation-time-ms', '120000');
  expect(await beatsDuring(page, 5_000)).toBe(0);

  // Reset: back to 00:00, alarms cleared, silent until started again.
  await page.getByRole('button', { name: 'Reset scenario' }).click();
  await expect(monitor(page)).toHaveAttribute('data-simulation-time-ms', '0');
  await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');
  expect(await beatsDuring(page, 3_000)).toBe(0);

  // Leaving the section releases the audio context.
  expect(await closed(page)).toBe(0);
  await page.getByRole('button', { name: 'Academy', exact: true }).click();
  await expect.poll(() => closed(page)).toBe(1);
});

test('a browser interruption is shown on the monitor, stops scheduling, and can be resumed with a tap', async ({ page }) => {
  test.setTimeout(90_000);
  await instrumentAudio(page);
  await open(page);
  await page.locator('.bedside-head').getByRole('button', { name: 'Turn on monitor sound' }).click();
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  await page.clock.runFor(8_000);
  expect(await beatsDuring(page, 3_000)).toBeGreaterThanOrEqual(3);

  // Simulate the browser suspending audio (screen lock, another app, background tab).
  await page.evaluate(() => (window as unknown as { __audio: { contexts: AudioContext[] } }).__audio.contexts[0].suspend());
  await expect(monitor(page)).toHaveAttribute('data-audio-status', 'interrupted');
  const resume = page.locator('.bedside-head').getByRole('button', { name: 'Sound paused by the browser: tap to resume' });
  await expect(resume).toBeVisible();
  await expect(page.locator('.bedside-sound [role="status"]')).toContainText('The browser paused the sound');
  expect(await beatsDuring(page, 3_000)).toBe(0);

  await resume.click();
  await expect(monitor(page)).toHaveAttribute('data-audio-status', 'running');
  expect(await beatsDuring(page, 3_000)).toBeGreaterThanOrEqual(3);
});

test('the deteriorating scenario completes with the critical alarm in its debrief, credits the Academy once, and remembers sound settings', async ({ page }) => {
  test.setTimeout(150_000);
  await open(page);
  await page.getByLabel('Volume').fill('0.3');
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  await page.clock.runFor(90_000);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Record 6-second strip' }).click();
  await page.getByRole('radio', { name: 'Heart rate above the critical limit' }).check();
  await page.getByRole('radio', { name: 'Ventricular tachycardia', exact: true }).check();
  await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
  await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
  const debrief = page.locator('.scenario-debrief');
  await expect(debrief).toContainText('✔ Alarm: correct.');
  // The value recorded is the averaged rate at the moment it crossed the critical limit.
  await expect(debrief).toContainText(/Heart rate above the critical limit” at 01:1\d: Heart rate above the critical limit: 1[5-8]\d \/min \(critical high 150\)/);
  await expect(debrief).toContainText('00:50: the heart rate rose from 118 to 135 per minute (Sinus tachycardia)');
  await expect(debrief).toContainText('01:15: the rhythm changed from Sinus tachycardia to Ventricular tachycardia');
  await expect(debrief).toContainText('✔ Rhythm: correct.');
  await expect(debrief).toContainText('alarm cleared: Heart rate above the high limit');
  await expect(debrief).toContainText('does not teach management');
  await expect(debrief).toContainText(/\+\d+ XP for this scenario\./);
  await debrief.getByRole('button', { name: 'View Academy' }).click();
  await expect(page.getByText('Monitored scenarios completed').locator('..')).toContainText(/1 of \d+/);

  await page.reload();
  await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
  await page.getByRole('button', { name: `Replay scenario: ${SCENARIO}` }).click();
  await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
  await expect(page.getByLabel('Volume')).toHaveValue('0.3');
  await expect(monitor(page)).toHaveAttribute('data-audio-status', 'off');
});

for (const width of [375, 390, 430, 768, 1024, 1280]) {
  test(`critical monitor at ${width}px: sound control on screen, nothing clipped or overflowing, accessible`, async ({ page }) => {
    test.setTimeout(120_000);
    await open(page, width);
    const toggle = page.locator('.bedside-head').getByRole('button', { name: 'Turn on monitor sound' });
    await expect(toggle).toBeInViewport();
    expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(width < 561 ? 44 : 36);
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await page.clock.runFor(90_000);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(page.getByTestId('alarm-bar')).toHaveClass(/priority-high/);
    const clipped = await page.evaluate(() => [...document.querySelectorAll('.bedside-alarm-bar, .bedside-alarm-bar li, .bedside-tile, .bedside-head')]
      .filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.className || element.tagName));
    expect(clipped).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => `${item.id}: ${item.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('dark theme and reduced motion: accessible, and traces update once per second instead of scrolling', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { try { localStorage.setItem('ecg-lab-theme', 'dark'); } catch { /* ignore */ } });
  await open(page, 390);
  await expect(page.getByText('Reduced motion is on, so the traces update once per second instead of scrolling.')).toBeVisible();
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  const seen = new Set<string>();
  for (let step = 0; step < 20; step += 1) {
    await page.clock.runFor(250);
    seen.add((await monitor(page).getAttribute('data-simulation-time-ms'))!);
  }
  // Five simulated seconds sampled 20 times: the display changed about five times, not twenty.
  expect(seen.size).toBeLessThanOrEqual(7);
  await page.clock.runFor(85_000);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => item.id)).toEqual([]);
});
