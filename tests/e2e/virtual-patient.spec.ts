import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const nav = (page: Page, name: 'ECG simulator' | 'Rhythm Challenge' | 'Virtual Patients' | 'Academy') => page.getByRole('button', { name, exact: true }).click();
const patients = (page: Page) => page.locator('.patients');
const tracePath = (page: Page, scope: string) => page.locator(`${scope} svg[role="img"] path[stroke="var(--trace)"]`).first().getAttribute('d');

async function openFirstCase(page: Page) {
  await nav(page, 'Virtual Patients');
  await page.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }).click();
}

async function completeFirstCase(page: Page, rate = '72', rhythm = 'Normal sinus rhythm') {
  await openFirstCase(page);
  await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
  await page.getByLabel(/Heart-rate estimate/).fill(rate);
  await page.getByRole('button', { name: 'Next: interpret' }).click();
  await page.getByRole('radio', { name: rhythm, exact: true }).check();
  await page.getByRole('button', { name: 'Submit interpretation' }).click();
}

test.describe('Virtual Patients', () => {
  test('a case runs from the story to a debrief, credits the Academy, and persists after reload', async ({ page }) => {
    await page.goto('/');
    await completeFirstCase(page);
    await expect(patients(page).getByRole('heading', { name: /Correct/ })).toBeVisible();
    await expect(patients(page)).toContainText('Within range: 72 per minute');
    await expect(patients(page)).toContainText('heart rate about 72 per minute, measured from this strip');
    await expect(patients(page)).toContainText('has not been written or reviewed yet, so none is given');
    await expect(patients(page)).toContainText('+40 XP for this case study.');
    await expect(patients(page).getByRole('list', { name: 'Achievements unlocked' })).toContainText('First case study');

    await page.getByRole('button', { name: 'View Academy' }).click();
    await expect(page.getByText('Case studies completed').locator('..')).toContainText('1 of 6');
    await expect(page.getByText(/40 XP · 40 of 50 toward level 2/)).toBeVisible();
    await expect(page.locator('.academy-achievements li.earned', { hasText: 'First case study' })).toBeVisible();

    await page.reload();
    await nav(page, 'Virtual Patients');
    await expect(page.getByRole('button', { name: /Review case: Awareness of the heartbeat/ })).toBeVisible();
    await expect(patients(page).getByText('Completed', { exact: true })).toHaveCount(1);
    await nav(page, 'Academy');
    await expect(page.getByText('Case studies completed').locator('..')).toContainText('1 of 6');
  });

  test('the heart rate is withheld until the learner has answered', async ({ page }) => {
    await page.goto('/');
    await openFirstCase(page);
    await expect(patients(page).getByText('Measure it from the ECG on the next step')).toBeVisible();
    await expect(patients(page)).not.toContainText('about 72 per minute');
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
    await expect(patients(page)).not.toContainText('about 72 per minute');
    await page.getByRole('button', { name: 'Next: interpret' }).click();
    await expect(patients(page)).not.toContainText('about 72 per minute');
    await expect(page.getByRole('button', { name: 'Submit interpretation' })).toBeDisabled();
  });

  test('replaying a completed case pays nothing more, and a wrong answer still completes the case once', async ({ page }) => {
    await page.goto('/');
    await completeFirstCase(page, '72', 'Cannot be determined from this strip');
    await expect(patients(page).getByRole('heading', { name: /Not quite/ })).toBeVisible();
    await expect(patients(page)).toContainText('The best answer is Normal sinus rhythm');
    await expect(patients(page)).toContainText('+20 XP for this case study.');

    await patients(page).getByRole('button', { name: 'Back to cases' }).click();
    await page.getByRole('button', { name: /Review case: Awareness of the heartbeat/ }).click();
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
    await page.getByRole('button', { name: 'Next: interpret' }).click();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await page.getByRole('button', { name: 'Submit interpretation' }).click();
    await expect(patients(page)).toContainText('No additional XP');
    await nav(page, 'Academy');
    await expect(page.getByText(/20 XP · 20 of 50 toward level 2/)).toBeVisible();
  });

  test('the ECG in a case is the same waveform definition used by the Rhythm Challenge', async ({ page }) => {
    await page.goto('/');
    await openFirstCase(page);
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
    const patientTrace = await tracePath(page, '.patients');
    expect(patientTrace).toBeTruthy();

    await nav(page, 'Rhythm Challenge');
    await page.locator('label.mode-card').filter({ has: page.locator('strong', { hasText: /^Practice$/ }) }).click();
    await page.getByLabel('Category').selectOption('nsr');
    await page.getByRole('button', { name: /^Start/ }).click();
    const challengeTraces: (string | null)[] = [await tracePath(page, '.challenge')];
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await page.getByRole('button', { name: 'Next question' }).click();
    challengeTraces.push(await tracePath(page, '.challenge'));
    expect(challengeTraces).toContain(patientTrace);
  });

  test('keyboard: stepping, choosing with arrow keys and submitting with Enter, with focus moving to each step heading', async ({ page }) => {
    await page.goto('/');
    await openFirstCase(page);
    await expect(patients(page).getByRole('heading', { name: 'The story' })).toBeFocused();
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).focus();
    await page.keyboard.press('Enter');
    await expect(patients(page).getByRole('heading', { name: 'Inspect the ECG and estimate the rate' })).toBeFocused();
    await page.getByRole('button', { name: 'Next: interpret' }).focus();
    await page.keyboard.press('Enter');
    await expect(patients(page).getByRole('heading', { name: 'Choose an interpretation' })).toBeFocused();
    const options = patients(page).getByRole('radio');
    await options.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toBeChecked();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await page.getByRole('button', { name: 'Submit interpretation' }).focus();
    await page.keyboard.press('Enter');
    await expect(patients(page).getByRole('heading', { name: /Correct|Not quite/ })).toBeFocused();
  });

  test('switching lead changes the strip, and leaving mid-case keeps the step', async ({ page }) => {
    await page.goto('/');
    await openFirstCase(page);
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
    const before = await tracePath(page, '.patients');
    await page.getByRole('button', { name: 'V1', exact: true }).click();
    await expect(page.getByRole('img', { name: /lead V1/ })).toBeVisible();
    expect(await tracePath(page, '.patients')).not.toBe(before);
    await nav(page, 'Academy');
    await nav(page, 'Virtual Patients');
    await expect(page.locator('.patient-steps li[aria-current="step"]')).toContainText('ECG and rate');
    await expect(page.getByRole('img', { name: /lead V1/ })).toBeVisible();
  });
});

test.describe('Virtual Patient layout and accessibility', () => {
  for (const size of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
    test(`every step is axe-clean without overflow at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const check = async (label: string) => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${label} overflow`).toBeLessThanOrEqual(0);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
      };
      await nav(page, 'Virtual Patients');
      await check('list');
      await page.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }).click();
      await check('presentation');
      await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
      await check('ecg');
      await page.getByRole('button', { name: 'Next: interpret' }).click();
      await check('interpretation');
      await page.getByRole('radio', { name: 'Cannot be determined from this strip', exact: true }).check();
      await page.getByRole('button', { name: 'Submit interpretation' }).click();
      await page.locator('.patients details summary').click();
      await check('debrief');
    });
  }

  test('dark theme: every step is axe-clean', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Toggle theme/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const check = async (label: string) => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
    };
    await nav(page, 'Virtual Patients');
    await check('list');
    await page.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }).click();
    await check('presentation');
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
    await check('ecg');
    await page.getByRole('button', { name: 'Next: interpret' }).click();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await check('interpretation');
    await page.getByRole('button', { name: 'Submit interpretation' }).click();
    await check('debrief');
    await nav(page, 'Academy');
    await check('academy');
  });

  for (const font of ['Verdana', 'Courier New', 'Georgia']) {
    test(`no horizontal overflow on any step with ${font} at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await page.addStyleTag({ content: `* { font-family: ${font} !important; }` });
      const overflow = () => page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll('body *')]
          .filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.right > viewportWidth + 0.5; })
          .slice(0, 5)
          .map(element => `${element.tagName}.${(element as HTMLElement).className}`);
        return { pixels: document.documentElement.scrollWidth - viewportWidth, offenders };
      });
      await nav(page, 'Virtual Patients');
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByRole('button', { name: /Start case: An irregular heartbeat/ }).click();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByRole('button', { name: 'Next: interpret' }).click();
      await page.getByRole('radio').last().check();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByRole('button', { name: 'Submit interpretation' }).click();
      await page.locator('.patients details summary').click();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
    });
  }
});
