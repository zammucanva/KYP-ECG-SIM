import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PREVIEW = '/?medication-preview=drafts';
const medication = (page: Page) => page.locator('.medication');
const nav = (page: Page, name: 'ECG simulator' | 'Medication Center' | 'Academy' | 'Learn') => page.getByRole('button', { name, exact: true }).click();
const openPreview = async (page: Page) => {
  await page.goto(PREVIEW);
  await nav(page, 'Medication Center');
};
const drugNames = ['Metoprolol', 'Diltiazem', 'Digoxin', 'Amiodarone', 'Adenosine'];

test.describe('Medication Center gating', () => {
  test('learners see no medicine content, only the reason, while nothing is published', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Medication Center');
    await expect(medication(page).getByText('No medication profiles have been published yet.')).toBeVisible();
    await expect(medication(page).getByRole('note')).toContainText('not a prescribing tool: it gives no doses and no advice about any patient');
    await expect(page.getByLabel('Search medicines')).toHaveCount(0);
    const text = (await medication(page).textContent()) ?? '';
    for (const name of drugNames) expect(text).not.toContain(name);
    expect(text).not.toContain('Authoring preview');
  });

  test('look-alike flags do not unlock drafts; only the documented flag does', async ({ page }) => {
    for (const search of ['?medication-preview=true', '?medication-preview=1', '?medication-preview=DRAFTS', '?preview=drafts', '?medication-preview=']) {
      await page.goto(`/${search}`);
      await nav(page, 'Medication Center');
      await expect(medication(page).getByText('No medication profiles have been published yet.'), search).toBeVisible();
      await expect(page.getByLabel('Search medicines'), search).toHaveCount(0);
    }
    await openPreview(page);
    await expect(page.getByLabel('Search medicines')).toBeVisible();
  });

  test('the preview labels drafts everywhere and states the evidence honestly', async ({ page }) => {
    await openPreview(page);
    await expect(medication(page).getByRole('note').filter({ hasText: 'Authoring preview: these are draft, unreviewed records' })).toBeVisible();
    await expect(medication(page).getByText('Draft: unreviewed', { exact: true })).toHaveCount(5);
    await page.getByRole('button', { name: 'Open profile: Digoxin' }).click();
    await expect(medication(page).getByRole('heading', { name: 'Digoxin' })).toBeFocused();
    await expect(medication(page)).toContainText('Status: Draft: unreviewed · version 0.1.0');
    await expect(medication(page).getByRole('note').filter({ hasText: 'Authoring preview' })).toBeVisible();
    await expect(medication(page).getByText(/Evidence: no source attached/).first()).toBeVisible();
    await expect(medication(page).getByRole('heading', { name: 'Safety considerations' }).locator('..')).toContainText('Not yet written');
    await expect(medication(page).getByRole('heading', { name: 'Interactions' }).locator('..')).toContainText('Not yet written');
    await expect(medication(page)).toContainText('Sections not yet written: safety considerations, interactions.');
    await expect(medication(page)).toContainText('No related lessons are published yet');
    await expect(medication(page)).not.toContainText('source verified');
  });

  test('no profile contains a dose, a quantity with units or prescribing language', async ({ page }) => {
    await openPreview(page);
    for (const name of drugNames) {
      await page.getByRole('button', { name: `Open profile: ${name}` }).click();
      const text = ((await medication(page).textContent()) ?? '').replace(/gives no doses and (?:is )?not (?:prescribing or )?patient-specific advice|not a prescribing tool: it gives no doses and no advice about any patient|gives no doses/gi, '');
      expect(text, name).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|ug|kg|ml|units?|iu|mmol|meq)\b/i);
      expect(text, name).not.toMatch(/\b(?:dose|doses|dosing|dosage|prescrib\w*|regimen|titrat\w*|twice daily|once daily)\b/i);
      await page.getByRole('button', { name: 'Back to medicines' }).click();
    }
  });
});

test.describe('Medication Center search and navigation', () => {
  test('search ranks and matches by name, class and term, filters by group, and explains no match', async ({ page }) => {
    await openPreview(page);
    const names = () => medication(page).locator('.medication-list li strong').allTextContents();
    expect(await names()).toEqual(['Adenosine', 'Amiodarone', 'Digoxin', 'Diltiazem', 'Metoprolol']);

    await page.getByLabel('Search medicines').fill('amio');
    expect(await names()).toEqual(['Amiodarone']);
    await expect(medication(page).getByRole('status')).toHaveText('1 medicine shown.');
    await page.getByLabel('Search medicines').fill('SVT');
    expect(await names()).toEqual(['Adenosine']);
    await page.getByLabel('Search medicines').fill('beta-blocker');
    expect(await names()).toEqual(['Metoprolol']);
    await page.getByLabel('Search medicines').fill('');
    await page.getByLabel('Drug group').selectOption('antiarrhythmic');
    expect(await names()).toEqual(['Amiodarone']);
    await page.getByLabel('Search medicines').fill('adenosine');
    await expect(medication(page)).toContainText('No medicine matches this search.');
    await medication(page).getByRole('button', { name: 'Clear search and filter' }).click();
    expect((await names()).length).toBe(5);
    await expect(page.getByLabel('Drug group')).toHaveValue('all');
  });

  test('keyboard: type to search, tab to a result, open it with Enter, and return', async ({ page }) => {
    await openPreview(page);
    await page.getByLabel('Search medicines').focus();
    await page.keyboard.type('dilt');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Open profile: Diltiazem' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(medication(page).getByRole('heading', { name: 'Diltiazem' })).toBeFocused();
    await page.getByRole('button', { name: 'Back to medicines' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Search medicines')).toHaveValue('dilt');
  });

  test('an open profile and the search survive moving to another section and back', async ({ page }) => {
    await openPreview(page);
    await page.getByLabel('Search medicines').fill('metop');
    await page.getByRole('button', { name: 'Open profile: Metoprolol' }).click();
    await nav(page, 'Academy');
    await nav(page, 'Medication Center');
    await expect(medication(page).getByRole('heading', { name: 'Metoprolol' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to medicines' }).click();
    await expect(page.getByLabel('Search medicines')).toHaveValue('metop');
  });

  test('the medication section does not disturb the rest of the app', async ({ page }) => {
    await openPreview(page);
    await nav(page, 'ECG simulator');
    await expect(page.getByLabel('Paper speed')).toHaveValue('25');
    await expect(page.getByLabel('Gain')).toHaveValue('20');
  });
});

test.describe('Medication Center layout and accessibility', () => {
  for (const size of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
    test(`empty state, list and profile are axe-clean without overflow at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      const check = async (label: string) => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${label} overflow`).toBeLessThanOrEqual(0);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
      };
      await page.goto('/');
      await nav(page, 'Medication Center');
      await check('learner empty state');
      await openPreview(page);
      await check('preview list');
      await page.getByLabel('Search medicines').fill('zzzz');
      await check('no match');
      await page.getByLabel('Search medicines').fill('');
      await page.getByRole('button', { name: 'Open profile: Amiodarone' }).click();
      await check('profile');
    });
  }

  test('dark theme: empty state, list and profile are axe-clean', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.getByRole('button', { name: /Toggle theme/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const check = async (label: string) => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
    };
    await nav(page, 'Medication Center');
    await check('list');
    await page.getByRole('button', { name: 'Open profile: Digoxin' }).click();
    await check('profile');
  });

  for (const font of ['Verdana', 'Courier New', 'Georgia']) {
    test(`no horizontal overflow with ${font} at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(PREVIEW);
      await page.addStyleTag({ content: `* { font-family: ${font} !important; }` });
      const overflow = () => page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll('body *')]
          .filter(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.right > viewportWidth + 0.5; })
          .slice(0, 5)
          .map(element => `${element.tagName}.${(element as HTMLElement).className}`);
        return { pixels: document.documentElement.scrollWidth - viewportWidth, offenders };
      });
      await nav(page, 'Medication Center');
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByRole('button', { name: 'Open profile: Amiodarone' }).click();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
    });
  }

  test('reduced motion: no animation on the medication screens', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPreview(page);
    const durations = await page.evaluate(() => [...document.querySelectorAll('.medication *')].map(element => getComputedStyle(element).animationDuration).filter(value => value !== '0s'));
    expect(durations).toEqual([]);
  });
});
