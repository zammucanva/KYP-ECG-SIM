import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Connected learner journeys through Home and the bedside monitor. Simulated time is driven by
 * Playwright's fake clock (which also drives requestAnimationFrame) so scenario events are reached
 * deterministically.
 */
const monitor = (page: Page) => page.locator('.bedside');
const homeCard = (page: Page) => page.getByRole('heading', { name: 'Bedside monitor', exact: true }).locator('..');
const simTime = async (page: Page) => Number(await monitor(page).getAttribute('data-simulation-time-ms'));

async function openHome(page: Page) {
  await page.clock.install({ time: new Date('2026-11-02T10:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
}

test.describe('Home and monitored scenarios', () => {
  test('a recommended scenario can be paused, resumed from Home at the same time, completed, and stays completed after reload', async ({ page }) => {
    test.setTimeout(120_000);
    await openHome(page);
    const card = homeCard(page);
    await expect(card).toContainText(/0 of \d+ monitored scenarios completed/);
    const recommended = card.locator('.home-recommended');
    await expect(recommended).toContainText('Recommended');
    await expect(recommended).toContainText('The next monitored scenario you have not completed.');

    // Open the decision scenario directly from its row.
    await card.getByRole('button', { name: 'Start monitored scenario: A falling SpO₂ number with a steady ECG' }).click();
    await expect(page.getByRole('heading', { name: 'The situation' })).toBeVisible();
    await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await page.clock.runFor(35_000);
    await page.getByRole('button', { name: 'Ask the patient to rest the hand, and reposition the finger sensor' }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const pausedAt = await simTime(page);

    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(card).toContainText(`Paused at 00:${String(Math.floor(pausedAt / 1000)).padStart(2, '0')}`);
    await expect(recommended).toContainText(`You paused this scenario at 00:${String(Math.floor(pausedAt / 1000)).padStart(2, '0')}.`);
    await recommended.getByRole('button', { name: /^Resume scenario: A falling SpO₂/ }).click();

    await expect(page.getByText(/^Resumed at 00:3\d\. Your bedside actions and recorded strip were restored\./)).toBeVisible();
    expect(await simTime(page)).toBe(Math.round(pausedAt));
    await expect(page.getByRole('button', { name: 'Ask the patient to rest the hand, and reposition the finger sensor' })).toBeDisabled();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.clock.runFor(6_000);
    await expect(page.getByTestId('tile-spo2')).toContainText('98');
    await expect(monitor(page)).toHaveAttribute('data-alarm-ids', '');

    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('radio', { name: 'SpO₂ poor signal' }).check();
    await page.getByRole('radio', { name: /signal is unreliable/ }).check();
    await page.getByRole('radio', { name: /The ECG: intervals/ }).check();
    await page.getByRole('button', { name: 'Submit answers and see the debrief' }).click();
    await expect(page.locator('.scenario-debrief')).toContainText('+40 XP for this scenario.');
    await expect(page.locator('.scenario-debrief')).toContainText('✔ Bedside check: done.');

    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(card).toContainText(/1 of \d+ monitored scenarios completed/);
    await expect(card.getByRole('button', { name: 'Replay monitored scenario: A falling SpO₂ number with a steady ECG' })).toBeVisible();
    await expect(recommended).not.toContainText('A falling SpO₂ number');
    await expect(page.getByRole('heading', { name: 'Your progress' }).locator('..')).toContainText(/Monitored scenarios completed: 1 of \d+/);
    expect((await new AxeBuilder({ page }).include('.home').analyze()).violations.map(item => item.id)).toEqual([]);

    await page.reload();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(card).toContainText(/1 of \d+ monitored scenarios completed/);
    await expect(card).not.toContainText('Paused at');
  });

  test('restarting from Home discards the paused run, and the nav entry never reopens a stale request', async ({ page }) => {
    test.setTimeout(90_000);
    await openHome(page);
    const card = homeCard(page);
    await card.getByRole('button', { name: 'Start monitored scenario: A falling SpO₂ number with a steady ECG' }).click();
    await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
    await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
    await page.clock.runFor(12_000);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await card.locator('.home-recommended').getByRole('button', { name: 'Restart from the beginning' }).click();
    await expect(page.getByRole('heading', { name: 'The situation' })).toBeVisible();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(card).not.toContainText('Paused at');

    await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Monitored scenarios' })).toBeVisible();
  });
});
