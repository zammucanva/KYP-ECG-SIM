import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Bedside monitor scenario. Simulated time is driven by Playwright's fake clock, which also drives
 * requestAnimationFrame, so the scenario's rhythm change at 00:40 is reached deterministically.
 * AudioContext is wrapped (test-only) to count real Web Audio usage without listening to it.
 */
const SCENARIO = /Start scenario: A change on the monitor while resting/;
const monitor = (page: Page) => page.locator('.bedside');
const simTime = async (page: Page) => Number(await monitor(page).getAttribute('data-simulation-time-ms'));
const tracePath = (page: Page, channel: 'ecg' | 'pleth' | 'resp') => page.locator(`.bedside-trace.${channel} path`).getAttribute('d');

async function instrumentAudio(page: Page) {
  await page.addInitScript(() => {
    const log = { created: 0, closed: 0, starts: 0 };
    (window as unknown as { __audioLog: typeof log }).__audioLog = log;
    const Original = window.AudioContext;
    if (!Original) return;
    window.AudioContext = class extends Original {
      constructor(...args: ConstructorParameters<typeof AudioContext>) { super(...args); log.created += 1; }
      close() { log.closed += 1; return super.close(); }
      createOscillator() {
        const oscillator = super.createOscillator();
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (when?: number) => { log.starts += 1; start(when); };
        return oscillator;
      }
    } as typeof AudioContext;
  });
}
const audioLog = (page: Page) => page.evaluate(() => (window as unknown as { __audioLog: { created: number; closed: number; starts: number } }).__audioLog);

async function openMonitor(page: Page) {
  await page.clock.install({ time: new Date('2026-11-02T10:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
  await page.getByRole('button', { name: SCENARIO }).click();
  await expect(page.getByRole('heading', { name: 'The situation' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
  await expect(monitor(page)).toBeVisible();
}

/** Advances simulated time by running animation frames; the monitor's clock follows them. */
async function advance(page: Page, ms: number) {
  await page.clock.runFor(ms);
}

async function reachChange(page: Page) {
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  await advance(page, 47_000);
  await expect(monitor(page)).toHaveAttribute('data-phase', 'fast-regular');
}

test.describe('Bedside monitor scenario', () => {
  test('does not start by itself; baseline channels render; the rhythm change raises the configured alarm', async ({ page }) => {
    await openMonitor(page);
    await advance(page, 3_000);
    expect(await simTime(page)).toBe(0);
    await expect(monitor(page)).toHaveAttribute('data-playing', 'false');
    await expect(page.getByText('Watch the monitor. The questions open once the monitor shows a change.')).toBeVisible();

    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await advance(page, 12_000);
    expect(await simTime(page)).toBeGreaterThan(11_000);
    await expect(monitor(page)).toHaveAttribute('data-heart-rate', '72');
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');
    await expect(page.getByTestId('alarm-bar')).toHaveText('No active alarms');
    await expect(page.getByTestId('tile-spo2')).toContainText('98');
    await expect(page.getByTestId('tile-spo2')).toContainText('PR 72 /min');
    await expect(page.getByTestId('tile-nibp')).toContainText('122/76');
    await expect(page.getByTestId('tile-nibp')).toContainText('MAP 91 (calculated)');
    await expect(page.getByText('SIMULATION · generated teaching data · not connected to a patient')).toBeVisible();

    const ecgBefore = await tracePath(page, 'ecg');
    const plethBefore = await tracePath(page, 'pleth');
    expect(ecgBefore?.split('L').length).toBeGreaterThan(1000);
    expect(plethBefore?.length).toBeGreaterThan(100);
    await advance(page, 500);
    expect(await tracePath(page, 'ecg')).not.toBe(ecgBefore);
    expect(await tracePath(page, 'pleth')).not.toBe(plethBefore);

    await advance(page, 35_000);
    await expect(monitor(page)).toHaveAttribute('data-phase', 'fast-regular');
    await expect(monitor(page)).toHaveAttribute('data-heart-rate', '170');
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', 'hr-high');
    await expect(page.getByTestId('alarm-bar')).toContainText('Heart rate above the high limit: 170 /min (limit high 120)');
    await expect(page.getByTestId('tile-hr')).toHaveClass(/alarmed/);
    // The cuff has not measured since the change, so the old pressure is still shown.
    await expect(page.getByTestId('tile-nibp')).toContainText('measured at 00:35');
    await expect(page.getByText('The monitor has changed. Pause when you are ready, record a strip, then answer.')).toBeVisible();
  });

  test('silencing pauses alarm sound but the alarm stays active until its condition clears', async ({ page }) => {
    await openMonitor(page);
    await reachChange(page);
    await page.getByRole('button', { name: 'Silence alarm sound (60 s)' }).click();
    await expect(page.getByRole('button', { name: /Alarm sound silenced until/ })).toBeDisabled();
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', 'hr-high');
    await expect(page.getByTestId('alarm-bar')).toContainText('Heart rate above the high limit');
  });

  test('pause holds simulated time, resume continues, and reset returns to the start with alarms cleared', async ({ page }) => {
    await openMonitor(page);
    await reachChange(page);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await simTime(page);
    await advance(page, 5_000);
    expect(await simTime(page)).toBe(paused);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await advance(page, 2_000);
    expect(await simTime(page)).toBeGreaterThan(paused + 1_500);

    await page.getByRole('button', { name: 'Reset scenario' }).click();
    expect(await simTime(page)).toBe(0);
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');
    await expect(monitor(page)).toHaveAttribute('data-phase', 'baseline');
    await expect(page.getByRole('button', { name: 'Start scenario', exact: true })).toBeVisible();
  });

  test('sound is off until asked for, follows playback, mutes, and is released when leaving the section', async ({ page }) => {
    await instrumentAudio(page);
    await openMonitor(page);
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await advance(page, 5_000);
    expect(await audioLog(page)).toEqual({ created: 0, closed: 0, starts: 0 });
    await expect(page.getByText('Sound off', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Turn on monitor sound' }).click();
    await expect(monitor(page)).toHaveAttribute('data-audio-status', 'running');
    await advance(page, 5_000);
    const afterFiveSeconds = (await audioLog(page)).starts;
    // About six beats at 72 per minute; tones are only ever scheduled for real beat events.
    expect(afterFiveSeconds).toBeGreaterThanOrEqual(5);
    expect(afterFiveSeconds).toBeLessThanOrEqual(8);

    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await advance(page, 5_000);
    expect((await audioLog(page)).starts).toBe(afterFiveSeconds);

    // Mute while paused, then resume: no new tone may start while muted.
    await page.getByRole('checkbox', { name: 'Mute' }).check();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await advance(page, 5_000);
    expect((await audioLog(page)).starts).toBe(afterFiveSeconds);
    await expect(page.getByText('Sound on (muted)')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Mute' }).uncheck();
    await page.getByLabel('Volume').fill('0.2');
    await page.getByLabel('Beat tone from').selectOption('pleth');
    await advance(page, 5_000);
    expect((await audioLog(page)).starts).toBeGreaterThan(afterFiveSeconds);

    expect((await audioLog(page)).closed).toBe(0);
    await page.getByRole('button', { name: 'Academy', exact: true }).click();
    await expect.poll(async () => (await audioLog(page)).closed).toBe(1);
  });

  test('a completed scenario updates the Academy and persists after reload', async ({ page }) => {
    await openMonitor(page);
    await reachChange(page);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const submit = page.getByRole('button', { name: 'Submit answers and see the debrief' });
    await expect(submit).toBeDisabled();
    await page.getByRole('radio', { name: 'Heart rate above the high limit' }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await expect(page.getByText('Use “Record 6-second strip” on the monitor to capture the rhythm first.')).toBeVisible();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await expect(page.locator('.scenario-questions .rhythm-strip svg path').first()).toHaveAttribute('d', /L/);
    await page.getByRole('radio', { name: 'Supraventricular tachycardia', exact: true }).check();
    await submit.click();

    const debrief = page.locator('.scenario-debrief');
    await expect(debrief.getByRole('heading', { name: 'Debrief' })).toBeVisible();
    await expect(debrief).toContainText('✔ Alarm: correct.');
    await expect(debrief).toContainText('✔ Rhythm: correct.');
    await expect(debrief).toContainText('✔ Heart-rate source: correct.');
    await expect(debrief).toContainText('00:40: the rhythm changed from Normal sinus rhythm to Supraventricular tachycardia');
    await expect(debrief).toContainText('not rules for real patients');
    await expect(debrief).toContainText('+45 XP for this scenario.');
    await expect(debrief.getByRole('list', { name: 'Achievements unlocked' })).toContainText('First monitored scenario');

    await debrief.getByRole('button', { name: 'View Academy' }).click();
    await expect(page.getByText(/45 XP/).first()).toBeVisible();
    await expect(page.locator('.academy-achievements li.earned', { hasText: 'First monitored scenario' })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
    await expect(page.getByRole('button', { name: /Replay scenario: A change on the monitor/ })).toBeVisible();
    await expect(page.locator('.patient-card', { hasText: 'A change on the monitor' })).toContainText('Completed');
  });

  test('replaying a completed scenario pays no further XP', async ({ page }) => {
    test.setTimeout(120_000); // two fast-forwarded runs to 00:47
    await openMonitor(page);
    await reachChange(page);
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await page.getByRole('radio', { name: 'Heart rate above the high limit' }).check();
    await page.getByRole('radio', { name: 'Supraventricular tachycardia', exact: true }).check();
    await page.getByRole('radio', { name: /The pulse oximeter/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
    await expect(page.locator('.scenario-debrief')).toContainText('✖ Heart-rate source: not quite.');
    await page.getByRole('button', { name: 'Replay the scenario' }).click();
    expect(await simTime(page)).toBe(0);
    await reachChange(page);
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await page.getByRole('radio', { name: 'Heart rate above the high limit' }).check();
    await page.getByRole('radio', { name: 'Supraventricular tachycardia', exact: true }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
    await expect(page.locator('.scenario-debrief')).toContainText('No additional XP: this scenario was already completed.');
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`has no horizontal overflow or axe violations at 375 px and desktop (${theme})`, async ({ page }) => {
      test.setTimeout(120_000); // two fast-forwarded runs to 00:47
      await page.addInitScript(value => { try { localStorage.setItem('ecg-lab-theme', value); } catch { /* ignore */ } }, theme);
      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await openMonitor(page);
        await reachChange(page);
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await page.getByRole('button', { name: 'Record 6-second strip' }).click();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
        const results = await new AxeBuilder({ page }).include('.scenario').analyze();
        expect(results.violations.map(item => `${item.id}: ${item.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
        // Leaving keeps this run paused; the next width starts the scenario fresh.
        await page.evaluate(() => localStorage.removeItem('ecg-lab-scenario-runs-v1'));
      }
    });
  }
});

test.describe('Bedside decision scenario: pulse-oximeter signal', () => {
  const DECISION = /Start scenario: A falling SpO₂ number with a steady ECG/;

  async function openDecision(page: Page) {
    await page.clock.install({ time: new Date('2026-11-02T10:00:00Z') });
    await page.goto('/');
    await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
    await page.getByRole('button', { name: DECISION }).click();
    await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  }

  test('the artefact raises only a technical alarm; the bedside check restores the signal; the decision is debriefed and credited', async ({ page }) => {
    test.setTimeout(90_000);
    await openDecision(page);
    await advance(page, 20_000);
    await expect(page.getByText('Nothing needs doing yet. Bedside actions become available once the monitor shows a change.')).toBeVisible();
    await expect(page.getByTestId('tile-spo2')).toContainText('98');
    const heartRate = await monitor(page).getAttribute('data-heart-rate');

    await advance(page, 15_000);
    await expect(monitor(page)).toHaveAttribute('data-phase', 'hand-movement');
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', 'spo2-poor-signal');
    await expect(page.getByTestId('tile-spo2')).toContainText('84');
    await expect(page.getByTestId('tile-spo2')).toContainText('Poor signal');
    await expect(monitor(page)).toHaveAttribute('data-heart-rate', heartRate!);
    await expect(page.getByTestId('alarm-bar')).toHaveClass(/priority-low/);
    await expect(page.getByRole('button', { name: 'Record 6-second strip' })).toHaveCount(0);
    expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => item.id)).toEqual([]);

    const check = page.getByRole('button', { name: 'Ask the patient to rest the hand, and reposition the finger sensor' });
    await check.click();
    await expect(check).toBeDisabled();
    await expect(page.locator('.scenario-actions')).toContainText(/Done at 00:3\d\./);
    await advance(page, 6_000);
    await expect(page.getByTestId('tile-spo2')).toContainText('98');
    await expect(page.getByTestId('tile-spo2')).not.toContainText('Poor signal');
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');

    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('radio', { name: 'SpO₂ poor signal' }).check();
    await page.getByRole('radio', { name: /The pulse-oximeter signal is unreliable/ }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();

    const debrief = page.locator('.scenario-debrief');
    await expect(debrief).toContainText('✔ Alarm: correct.');
    await expect(debrief).toContainText('✔ Evidence: well judged.');
    await expect(debrief).toContainText('✔ Bedside check: done.');
    // The action time depends on when the click lands; the rule checked is the 4 s effect delay.
    const actionText = await debrief.getByText(/You took the bedside step at/).textContent();
    const [, takenAt, effectAt] = actionText!.match(/at 00:(\d\d)\. The simulated effect began at 00:(\d\d): SpO₂ 98% with a good signal/)!;
    expect(Number(effectAt) - Number(takenAt)).toBe(4);
    await expect(debrief).toContainText('00:30: the SpO₂ signal quality became poor; the SpO₂ number moved from 98% to 84%.');
    await expect(debrief).toContainText('alarm cleared: SpO₂ poor signal');
    await expect(debrief).toContainText('+40 XP for this scenario.');
    expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => item.id)).toEqual([]);

    await page.reload();
    await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
    await expect(page.locator('.patient-card', { hasText: 'A falling SpO₂ number' })).toContainText('Completed');
  });

  test('without the bedside check and with a face-value reading, the debrief explains why', async ({ page }) => {
    test.setTimeout(90_000);
    await openDecision(page);
    await advance(page, 36_000);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('radio', { name: 'SpO₂ poor signal' }).check();
    await page.getByRole('radio', { name: /Oxygen saturation has truly fallen/ }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
    const debrief = page.locator('.scenario-debrief');
    await expect(debrief).toContainText('✖ Evidence: not quite.');
    await expect(debrief).toContainText('Best supported:');
    await expect(debrief).toContainText('✖ Bedside check: not done.');
    await expect(debrief).toContainText('+25 XP for this scenario.');
  });
});
