import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Virtual Patient cases on the bedside monitor, and the connected learner journey through Home.
 * Simulated time runs on Playwright's fake clock (which drives requestAnimationFrame).
 */
const monitor = (page: Page) => page.locator('.bedside');
const homeCard = (page: Page) => page.getByRole('heading', { name: 'Bedside monitor', exact: true }).locator('..');
const nav = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();

async function boot(page: Page) {
  await page.clock.install({ time: new Date('2026-11-02T10:00:00Z') });
  await page.goto('/');
}

async function completeStaticCase(page: Page) {
  await nav(page, 'Virtual Patients');
  await page.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }).click();
  await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
  await page.getByLabel(/Heart-rate estimate/).fill('72');
  await page.getByRole('button', { name: 'Next: interpret' }).click();
  await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
  await page.getByRole('button', { name: 'Submit interpretation' }).click();
  await expect(page.locator('.patients').getByRole('heading', { name: /Correct/ })).toBeVisible();
}

async function answerLeadOffCase(page: Page) {
  await page.getByRole('radio', { name: 'ECG lead off' }).check();
  await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
  await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
  await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
}

test.describe('Connected learner journey', () => {
  test('Home recommends the monitored version of a completed case; it runs, credits once, persists, and replays without XP', async ({ page }) => {
    test.setTimeout(150_000);
    await boot(page);
    await completeStaticCase(page);

    // 1-2. Home recommends this patient's monitored version, from the recorded completion.
    await nav(page, 'Home');
    const recommended = homeCard(page).locator('.home-recommended');
    await expect(recommended).toContainText('On the monitor: Awareness of the heartbeat after exercise');
    await expect(recommended).toContainText('You completed this patient\'s case study; this is the same fictional patient on a bedside monitor.');
    const xpBefore = Number((await page.getByRole('heading', { name: 'Your progress' }).locator('..').getByText(/^Level \d+ · \d+ XP$/).textContent())!.match(/(\d+) XP/)![1]);

    // 3-4. Open it and inspect the synthetic ECG and vital signs.
    await recommended.getByRole('button', { name: 'Start scenario: On the monitor: Awareness of the heartbeat after exercise' }).click();
    await expect(page.getByRole('heading', { name: 'The situation' })).toBeVisible();
    await expect(page.locator('.scenario')).toContainText('one ECG electrode comes loose');
    await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await page.clock.runFor(15_000);
    await expect(monitor(page)).toHaveAttribute('data-heart-rate', '72');
    await expect(page.getByTestId('tile-nibp')).toContainText('118/74');
    await expect(page.getByTestId('tile-temp')).toContainText('36.7');

    // 5. The configured event: an electrode comes loose at 00:25.
    await page.clock.runFor(13_000);
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', 'ecg-lead-off');
    await expect(page.getByTestId('tile-hr')).toContainText('Lead off');
    await expect(page.locator('.bedside-trace.ecg')).toContainText('Lead off: no ECG signal');
    await expect(page.getByTestId('tile-spo2')).toContainText('PR 72 /min');
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await expect(page.locator('.scenario-questions')).toContainText('an ECG lead was off during part of it, so there is no complete trace to show');
    await expect(page.locator('.scenario-questions .rhythm-strip')).toHaveCount(0);

    // 6. The learner decision: restore the signal, then record and answer.
    await page.getByRole('button', { name: 'Reattach the loose ECG electrode' }).click();
    await page.clock.runFor(10_000);
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');
    await expect(monitor(page)).toHaveAttribute('data-heart-rate', '72');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await expect(page.locator('.scenario-questions .rhythm-strip svg path').first()).toHaveAttribute('d', /L/);
    await answerLeadOffCase(page);

    // 7-8. Debrief and progress credit.
    const debrief = page.locator('.scenario-debrief');
    await expect(debrief).toContainText('✔ Alarm: correct.');
    await expect(debrief).toContainText('✔ Rhythm: correct.');
    await expect(debrief).toContainText('00:25: an ECG lead came off.');
    await expect(debrief).toContainText('you took the bedside step “Reattach the loose ECG electrode”');
    await expect(debrief).toContainText('alarm cleared: ECG lead off');
    // 20 completion + 10 rhythm + 5 alarm + 1 practice credit (the rhythm was already identified in the case study).
    await expect(debrief).toContainText('+36 XP for this scenario.');

    // 9-10. Home reflects the completion and moves the recommendation on.
    await nav(page, 'Home');
    await expect(homeCard(page)).toContainText(/1 of \d+ monitored scenarios completed/);
    await expect(recommended).not.toContainText('Awareness of the heartbeat');
    await expect(page.getByText(new RegExp(`^Level \\d+ · ${xpBefore + 36} XP$`))).toBeVisible();

    // 11. Reload: progress persists.
    await page.reload();
    await nav(page, 'Home');
    await expect(homeCard(page)).toContainText(/1 of \d+ monitored scenarios completed/);
    await expect(page.getByText(new RegExp(`^Level \\d+ · ${xpBefore + 36} XP$`))).toBeVisible();

    // 12. Replay: no further XP.
    await homeCard(page).getByRole('button', { name: 'Replay monitored scenario: On the monitor: Awareness of the heartbeat after exercise' }).click();
    await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await page.clock.runFor(27_000);
    await page.getByRole('button', { name: 'Reattach the loose ECG electrode' }).click();
    await page.clock.runFor(10_000);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await answerLeadOffCase(page);
    await expect(page.locator('.scenario-debrief')).toContainText('No additional XP: this scenario was already completed.');
    await nav(page, 'Home');
    await expect(page.getByText(new RegExp(`^Level \\d+ · ${xpBefore + 36} XP$`))).toBeVisible();
  });

  test('a Virtual Patient debrief opens the same patient on the bedside monitor', async ({ page }) => {
    await boot(page);
    await completeStaticCase(page);
    await page.getByRole('button', { name: 'Put this patient on the bedside monitor' }).click();
    await expect(page.getByRole('heading', { name: 'On the monitor: Awareness of the heartbeat after exercise' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The situation' })).toBeVisible();
  });
});

test.describe('Monitored patient cases', () => {
  async function open(page: Page, title: string) {
    await boot(page);
    await nav(page, 'Bedside Monitor');
    await page.getByRole('button', { name: `Start scenario: ${title}` }).click();
    await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  }

  test('irregular heartbeat: the pulse rate from the oximeter reads below the ECG heart rate, and no alarm is the right answer', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, 'On the monitor: An irregular heartbeat for several days');
    let seenLower = false;
    for (let step = 0; step < 12 && !seenLower; step += 1) {
      await page.clock.runFor(2_500);
      const hr = Number(await monitor(page).getAttribute('data-heart-rate'));
      const pr = Number((await page.getByTestId('tile-spo2').textContent())!.match(/PR (\d+) \/min/)?.[1] ?? Number.NaN);
      if (Number.isFinite(pr) && hr > 0 && pr < hr) seenLower = true;
    }
    expect(seenLower).toBe(true);
    // With no alarm the questions open 20 s into the assessed period; keep watching until then.
    while (Number(await monitor(page).getAttribute('data-simulation-time-ms')) < 21_000) await page.clock.runFor(2_000);
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await page.getByRole('radio', { name: 'No alarm was raised' }).check();
    await page.getByRole('radio', { name: 'Atrial fibrillation', exact: true }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
    const debrief = page.locator('.scenario-debrief');
    await expect(debrief).toContainText('✔ Alarm: correct.');
    await expect(debrief).toContainText('No alarm was raised before you answered.');
    await expect(debrief).toContainText('✔ Rhythm: correct.');
    await expect(debrief).toContainText('a beat that comes very soon after the previous one gives no detectable finger pulse');
  });

  test('sudden fast heartbeat: a strip outside the assessed period is refused, and the alarm clears when the rhythm settles', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, 'On the monitor: A sudden, fast, regular heartbeat');
    await page.clock.runFor(10_000);
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', 'hr-high');
    await page.clock.runFor(42_000);
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');
    await expect(monitor(page)).toHaveAttribute('data-heart-rate', '88');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await expect(page.locator('.scenario-questions')).toContainText('is outside 00:00–00:45, the period this question asks about');
    await expect(page.getByRole('button', { name: 'Submit answers and see the debrief' })).toBeDisabled();
    // Replaying from the start lets the learner record inside the fast period.
    await page.getByRole('button', { name: 'Reset scenario' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await page.clock.runFor(12_000);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    await page.getByRole('radio', { name: 'Heart rate above the high limit' }).check();
    await page.getByRole('radio', { name: 'Supraventricular tachycardia', exact: true }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
    await expect(page.locator('.scenario-debrief')).toContainText('✔ Rhythm: correct.');
    await expect(page.locator('.scenario-debrief')).toContainText('✔ Alarm: correct.');
  });

  test('a monitored patient case has no overflow or axe violations at phone width', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 812 });
    await open(page, 'On the monitor: Occasional skipped beats');
    await page.clock.runFor(25_000);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Record 6-second strip' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => item.id)).toEqual([]);
  });
});
