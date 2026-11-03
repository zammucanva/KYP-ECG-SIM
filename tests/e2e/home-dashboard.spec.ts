import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type Section = 'Home' | 'ECG simulator' | 'Rhythm Challenge' | 'Virtual Patients' | 'Academy';
const nav = (page: Page, name: Section) => page.getByRole('button', { name, exact: true }).click();
const home = (page: Page) => page.locator('.home');
const card = (page: Page, heading: string) => home(page).locator('section.home-card', { has: page.getByRole('heading', { name: heading }) });

/** Completes the first guided exercise through the real interface. */
async function completeFirstExercise(page: Page) {
  await nav(page, 'Home');
  await home(page).getByRole('button', { name: 'Start your first exercise' }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByLabel('Start point (ms)').fill('240');
  await page.getByLabel('End point (ms)').fill('1040');
  await page.getByRole('button', { name: 'Record reading' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.locator('.exercise-status')).toContainText('Passed');
}

test.describe('Home dashboard: honest state', () => {
  test('the simulator stays the landing page, and Home is the first tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.module-nav button').first()).toHaveText('Home');
    await expect(page.getByRole('button', { name: 'ECG simulator', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('with nothing saved it shows an empty state and invents no figures', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Home');
    await expect(page.getByRole('heading', { name: 'Start learning the ECG' })).toBeVisible();
    await expect(home(page)).toContainText('Nothing saved yet.');
    const text = (await home(page).textContent()) ?? '';
    expect(text).not.toMatch(/Level \d/);
    expect(text).not.toMatch(/\d+%/);
    await expect(card(page, 'Continue learning')).toContainText('A short guided exercise is a good first step.');
    await expect(card(page, 'Resume an experiment')).toContainText('No saved experiments yet.');
    await expect(card(page, 'Guided exercises')).toContainText('0 of 5 completed.');
    await expect(card(page, 'Rhythm Challenge')).toContainText('No strips answered yet.');
    await expect(card(page, 'Rhythm Challenge').getByRole('button', { name: /Review missed strips \(0\)/ })).toBeDisabled();
    await expect(card(page, 'Virtual patients')).toContainText('0 of 6 fictional cases completed.');
    await expect(card(page, 'Your progress')).toContainText('Nothing recorded yet.');
  });

  test('corrupt stored progress shows the empty state instead of failing', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('ecg-lab-academy-v1', '{"version":9}');
      window.localStorage.setItem('ecg-lab-exercise-progress-v1', 'not json');
      window.localStorage.setItem('ecg-lab-experiments-v1', '{"version":4,"snapshots":[1]}');
    });
    await page.goto('/');
    await nav(page, 'Home');
    await expect(page.getByRole('heading', { name: 'Start learning the ECG' })).toBeVisible();
    await expect(card(page, 'Resume an experiment')).toContainText('No saved experiments yet.');
  });
});

test.describe('Home dashboard: actions lead to real places', () => {
  test('Start your first exercise opens that exercise in the simulator with focus on it', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Home');
    await home(page).getByRole('button', { name: 'Start your first exercise' }).click();
    await expect(page.getByRole('button', { name: 'ECG simulator', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('details.guided-exercises')).toHaveAttribute('open', '');
    await expect(page.getByRole('heading', { name: 'Measure an R–R interval' })).toBeFocused();
  });

  test('an exercise chosen from the list opens that exercise, whichever it is', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Home');
    await card(page, 'Guided exercises').getByRole('button', { name: /Start exercise: Find the same beat in two leads/ }).click();
    await expect(page.locator('details.guided-exercises')).toHaveAttribute('open', '');
    await expect(page.getByRole('heading', { name: 'Find the same beat in two leads' })).toBeFocused();
  });

  test('progress through an exercise is reflected: in progress, then completed, with the next one offered', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Home');
    await home(page).getByRole('button', { name: 'Start your first exercise' }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByLabel('Start point (ms)').fill('240');
    await page.getByLabel('End point (ms)').fill('1040');
    await page.getByRole('button', { name: 'Record reading' }).click();

    await nav(page, 'Home');
    await expect(card(page, 'Continue learning')).toContainText('Measure an R–R interval');
    await expect(card(page, 'Continue learning')).toContainText('1 of 1 reading recorded, 0 attempts so far.');
    await expect(card(page, 'Guided exercises')).toContainText('In progress · 1 of 1 readings');

    await card(page, 'Continue learning').getByRole('button', { name: 'Continue exercise: Measure an R–R interval' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('.exercise-status')).toContainText('Passed');

    await nav(page, 'Home');
    await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
    await expect(card(page, 'Guided exercises')).toContainText('1 of 5 completed.');
    await expect(card(page, 'Guided exercises').getByText('Completed', { exact: true })).toHaveCount(1);
    await expect(card(page, 'Continue learning')).toContainText('Gain changes height, not timing');
    await expect(card(page, 'Continue learning')).toContainText('The next guided exercise you have not started.');
    await expect(card(page, 'Your progress')).toContainText('Level 1');
    await expect(card(page, 'Your progress')).toContainText('25 XP');
    await expect(card(page, 'Your progress')).toContainText('Exercises completed: 1 of 5');
    await expect(card(page, 'Your progress').getByRole('list', { name: 'Recent activity' })).toContainText('+25 XP');
  });

  test('Resume an experiment shows the real saved experiment and restores it through the confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('50');
    await page.locator('aside.controls').getByLabel('Gain').selectOption('10');
    await page.locator('details.experiment-workspace > summary').click();
    await page.getByLabel('Experiment name').fill('Fast paper, low gain');
    await page.getByRole('button', { name: 'Save experiment' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Saved “Fast paper, low gain” locally in this browser.' })).toBeVisible();
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('12.5');
    await page.locator('aside.controls').getByLabel('Gain').selectOption('5');

    await nav(page, 'Home');
    await expect(card(page, 'Resume an experiment')).toContainText('Fast paper, low gain');
    await expect(card(page, 'Resume an experiment')).toContainText('V3 · 50 mm/s · 10 mm/mV');
    await card(page, 'Resume an experiment').getByRole('button', { name: 'Resume “Fast paper, low gain”' }).click();

    await expect(page.locator('details.experiment-workspace')).toHaveAttribute('open', '');
    await expect(page.getByRole('group', { name: 'Restore saved experiment confirmation' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restore now' })).toBeFocused();
    // Nothing is applied until the learner confirms.
    await expect(page.locator('aside.controls').getByLabel('Paper speed')).toHaveValue('12.5');
    await page.getByRole('button', { name: 'Restore now' }).click();
    await expect(page.locator('aside.controls').getByLabel('Paper speed')).toHaveValue('50');
    await expect(page.locator('aside.controls').getByLabel('Gain')).toHaveValue('10');
    await expect(page.getByRole('status').filter({ hasText: 'Playback is paused.' })).toBeVisible();
  });

  test('cancelling the resume leaves the current settings alone', async ({ page }) => {
    await page.goto('/');
    await page.locator('details.experiment-workspace > summary').click();
    await page.getByRole('button', { name: 'Save experiment' }).click();
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('50');
    await nav(page, 'Home');
    await card(page, 'Resume an experiment').getByRole('button', { name: /^Resume/ }).click();
    await page.getByRole('button', { name: 'Cancel restore' }).click();
    await expect(page.locator('aside.controls').getByLabel('Paper speed')).toHaveValue('50');
  });

  test('missed strips are counted from real answers, and the review starts from Home', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Rhythm Challenge');
    await page.locator('label.mode-card').filter({ has: page.locator('strong', { hasText: /^Practice$/ }) }).click();
    await page.getByLabel('Category').selectOption('nsr');
    await page.getByRole('button', { name: /^Start/ }).click();
    for (let question = 0; question < 2; question += 1) {
      await page.getByRole('radio', { name: 'Cannot be determined from this strip', exact: true }).check();
      await page.getByRole('button', { name: 'Submit answer' }).click();
      await page.getByRole('button', { name: question === 0 ? 'Next question' : 'See results' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();

    await nav(page, 'Home');
    await expect(card(page, 'Rhythm Challenge')).toContainText('2 strips answered · rhythm accuracy 0%');
    const review = card(page, 'Rhythm Challenge').getByRole('button', { name: 'Review missed strips (2)' });
    await expect(review).toBeEnabled();
    await review.click();
    await expect(page.getByRole('heading', { name: 'Question 1 of 2' })).toBeVisible();
    await expect(page.locator('.challenge').getByText('PRACTICE', { exact: true })).toBeVisible();
  });

  test('the review does not replace a session already in progress', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Rhythm Challenge');
    await page.locator('label.mode-card').filter({ has: page.locator('strong', { hasText: /^Practice$/ }) }).click();
    await page.getByLabel('Category').selectOption('nsr');
    await page.getByRole('button', { name: /^Start/ }).click();
    await page.getByRole('radio', { name: 'Cannot be determined from this strip', exact: true }).check();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await page.getByRole('button', { name: 'Next question' }).click();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await page.getByRole('button', { name: 'See results' }).click();
    await page.getByRole('button', { name: 'New session' }).click();
    await page.getByLabel('Category').selectOption('nsr');
    await page.getByRole('button', { name: /^Start/ }).click();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();

    await nav(page, 'Home');
    await card(page, 'Rhythm Challenge').getByRole('button', { name: /^Review missed strips/ }).click();
    await expect(page.getByRole('heading', { name: 'Question 1 of 2' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true })).toBeChecked();
  });

  test('Begin a challenge, Open the cases and View progress go to the right sections', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Home');
    await card(page, 'Rhythm Challenge').getByRole('button', { name: 'Begin a challenge' }).click();
    await expect(page.getByRole('heading', { name: 'Read the strip, name the rhythm' })).toBeVisible();
    await nav(page, 'Home');
    await card(page, 'Virtual patients').getByRole('button', { name: 'Open the cases' }).click();
    await expect(page.getByRole('heading', { name: 'Fictional cases, real strips' })).toBeVisible();
    await nav(page, 'Home');
    await card(page, 'Your progress').getByRole('button', { name: 'View progress' }).click();
    await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
  });

  test('a completed case study shows on Home with the next case', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Virtual Patients');
    await page.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }).click();
    await page.getByRole('button', { name: 'Next: inspect the ECG' }).click();
    await page.getByRole('button', { name: 'Next: interpret' }).click();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await page.getByRole('button', { name: 'Submit interpretation' }).click();
    await nav(page, 'Home');
    await expect(card(page, 'Virtual patients')).toContainText('1 of 6 fictional cases completed.');
    await expect(card(page, 'Virtual patients')).toContainText('Next: An irregular heartbeat for several days');
    await expect(card(page, 'Your progress')).toContainText('Case studies completed: 1 of 6');
  });
});

test.describe('Home dashboard: layout and accessibility', () => {
  async function populate(page: Page) {
    await completeFirstExercise(page);
    await page.locator('details.experiment-workspace > summary').click();
    await page.getByRole('button', { name: 'Save experiment' }).click();
  }

  for (const size of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
    test(`empty and populated Home are axe-clean without overflow at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const check = async (label: string) => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${label} overflow`).toBeLessThanOrEqual(0);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
      };
      await nav(page, 'Home');
      await check('empty');
      await populate(page);
      await nav(page, 'Home');
      await expect(page.getByRole('heading', { name: 'Pick up where you left off' })).toBeVisible();
      await check('populated');
    });
  }

  test('dark theme: empty and populated Home are axe-clean', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Toggle theme/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const check = async (label: string) => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
    };
    await nav(page, 'Home');
    await check('empty');
    await populate(page);
    await nav(page, 'Home');
    await check('populated');
  });

  for (const font of ['Verdana', 'Courier New', 'Georgia']) {
    test(`no horizontal overflow on Home with ${font} at 375px`, async ({ page }) => {
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
      await nav(page, 'Home');
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await populate(page);
      await nav(page, 'Home');
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
    });
  }

  test('keyboard: Enter on the first action opens the exercise with focus on it, and reduced motion adds no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await nav(page, 'Home');
    const durations = await page.evaluate(() => [...document.querySelectorAll('.home *')].map(element => getComputedStyle(element).animationDuration).filter(value => value !== '0s'));
    expect(durations).toEqual([]);
    await home(page).getByRole('button', { name: 'Start your first exercise' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Measure an R–R interval' })).toBeFocused();
  });
});
