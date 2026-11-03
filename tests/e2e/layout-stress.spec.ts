import { expect, test } from '@playwright/test';

// Runners and learners use different fallback fonts (CI is Linux). Wide and monospaced faces must not
// push the page past the viewport once the measurement, saved-experiment and exercise panels are open.
for (const font of ['Verdana', 'Courier New', 'Georgia']) {
  for (const size of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    test(`no horizontal overflow with ${font} at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.addStyleTag({ content: `* { font-family: ${font} !important; }` });
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.locator('details.annotation-workspace > summary').click();
      await page.getByRole('button', { name: 'Add annotation' }).click();
      await page.locator('details.experiment-workspace > summary').click();
      await page.getByRole('button', { name: 'Save experiment' }).click();
      await page.getByRole('button', { name: 'Restore', exact: true }).first().click();
      await page.getByRole('button', { name: 'Delete', exact: true }).first().click();
      await page.locator('details.guided-exercises > summary').click();
      await page.getByRole('button', { name: 'Record reading' }).click();
      await page.getByRole('button', { name: 'Check answer' }).click();
      const overflow = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll('body *')]
          .filter(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().right > viewportWidth + 0.5)
          .slice(0, 5)
          .map(element => `${element.tagName}.${(element as HTMLElement).className}`);
        return { pixels: document.documentElement.scrollWidth - viewportWidth, offenders };
      });
      expect(overflow).toEqual({ pixels: 0, offenders: [] });
    });
  }
}