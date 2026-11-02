import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** The bedside monitor's visible trace window on phones and desktop. Same scale, different span. */
const monitor = (page: Page) => page.locator('.bedside');
const ecgFigure = (page: Page) => page.locator('.bedside-trace.ecg');
const simTime = async (page: Page) => Number(await monitor(page).getAttribute('data-simulation-time-ms'));
const windowButton = (page: Page, seconds: 3 | 6) => page.getByRole('group', { name: 'Visible trace window' }).getByRole('button', { name: `${seconds} s`, exact: true });

async function openRunning(page: Page, width: number) {
  await page.setViewportSize({ width, height: 860 });
  await page.clock.install({ time: new Date('2026-11-02T10:00:00Z') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Bedside Monitor', exact: true }).click();
  await page.getByRole('button', { name: 'Start scenario: On the monitor: Occasional skipped beats' }).click();
  await page.getByRole('button', { name: 'Go to the bedside monitor' }).click();
  await page.getByRole('button', { name: 'Start scenario', exact: true }).click();
  await page.clock.runFor(8_000);
}

/** Rendered CSS pixels per simulated second for the ECG trace. */
async function pixelsPerSecond(page: Page) {
  const box = (await ecgFigure(page).locator('svg').boundingBox())!;
  return box.width / (Number(await ecgFigure(page).getAttribute('data-window-ms')) / 1000);
}

for (const width of [320, 375]) {
  test(`phone width ${width}px: 3-second window by default, larger trace, same scale, no overflow`, async ({ page }) => {
    test.setTimeout(60_000);
    await openRunning(page, width);
    await expect(ecgFigure(page)).toHaveAttribute('data-window-ms', '3000');
    await expect(ecgFigure(page).locator('figcaption')).toContainText('last 3 s · 25 mm/s · 10 mm/mV');
    await expect(windowButton(page, 3)).toHaveAttribute('aria-pressed', 'true');
    for (const channel of ['pleth', 'resp']) await expect(page.locator(`.bedside-trace.${channel}`)).toHaveAttribute('data-window-ms', '3000');
    await expect(ecgFigure(page).locator('.bedside-ticks line')).toHaveCount(4);
    const shortScale = await pixelsPerSecond(page);

    const before = await simTime(page);
    await windowButton(page, 6).click();
    await expect(ecgFigure(page)).toHaveAttribute('data-window-ms', '6000');
    await expect(ecgFigure(page).locator('figcaption')).toContainText('last 6 s');
    const longScale = await pixelsPerSecond(page);
    expect(shortScale / longScale).toBeGreaterThan(1.8);
    // Changing the window never touches the shared clock.
    await page.clock.runFor(1_000);
    expect(await simTime(page)).toBeGreaterThan(before + 800);
    await expect(monitor(page)).toHaveAttribute('data-playing', 'true');

    for (const control of [windowButton(page, 3), windowButton(page, 6), page.getByRole('button', { name: 'Pause', exact: true }), page.getByRole('button', { name: 'Reset scenario' })]) {
      expect((await control.boundingBox())!.height, 'touch target height').toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect((await new AxeBuilder({ page }).include('.scenario').analyze()).violations.map(item => item.id)).toEqual([]);
  });
}

test('desktop keeps the 6-second window; the toggle works from the keyboard; strips stay 6 seconds', async ({ page }) => {
  test.setTimeout(60_000);
  await openRunning(page, 1280);
  await expect(ecgFigure(page)).toHaveAttribute('data-window-ms', '6000');
  await expect(windowButton(page, 6)).toHaveAttribute('aria-pressed', 'true');
  await expect(ecgFigure(page).locator('.bedside-ticks line')).toHaveCount(7);

  await windowButton(page, 3).focus();
  await page.keyboard.press('Enter');
  await expect(ecgFigure(page)).toHaveAttribute('data-window-ms', '3000');
  await windowButton(page, 6).focus();
  await page.keyboard.press('Space');
  await expect(ecgFigure(page)).toHaveAttribute('data-window-ms', '6000');

  await page.clock.runFor(14_000);
  await windowButton(page, 3).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Record 6-second strip' }).click();
  await expect(page.locator('.scenario-questions')).toContainText(/Strip recorded from 00:\d\d to 00:\d\d\./);
  const text = (await page.locator('.scenario-questions').getByText(/Strip recorded from/).textContent())!;
  const [, from, to] = text.match(/from 00:(\d\d) to 00:(\d\d)/)!;
  expect(Number(to) - Number(from)).toBe(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
