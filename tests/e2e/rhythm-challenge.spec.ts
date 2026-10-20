import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const nav = (page: Page, name: 'ECG simulator' | 'Rhythm Challenge' | 'Academy' | 'Learn') => page.getByRole('button', { name, exact: true }).click();
const chooseMode = (page: Page, label: string) => page.locator('label.mode-card').filter({ has: page.locator('strong', { hasText: new RegExp(`^${label}$`) }) }).click();

async function startNsr(page: Page, mode = 'Learn') {
  await nav(page, 'Rhythm Challenge');
  await chooseMode(page, mode);
  await page.getByLabel('Category').selectOption('nsr');
  await page.getByRole('button', { name: /^Start/ }).click();
}

async function answer(page: Page, label: string, rate?: string) {
  await page.getByRole('radio', { name: label, exact: true }).check();
  if (rate !== undefined) await page.getByLabel(/Heart-rate estimate/).fill(rate);
  await page.getByRole('button', { name: 'Submit answer' }).click();
}

const feedback = (page: Page) => page.locator('.challenge-feedback');

test.describe('Rhythm Challenge', () => {
  test('Learn session: strip, hints, scoring, results, Academy XP, and persistence after reload', async ({ page }) => {
    await page.goto('/');
    await startNsr(page);
    await expect(page.getByRole('heading', { name: 'Question 1 of 2' })).toBeVisible();
    const strip = page.getByRole('img', { name: /Six-second synthetic ECG strip, lead II/ });
    await expect(strip).toBeVisible();
    expect(await strip.getAttribute('aria-label')).not.toMatch(/normal sinus/i);
    expect(await strip.locator('path').count()).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Show hint (0/3)' }).click();
    await expect(page.getByRole('list', { name: 'Hints' })).toContainText('regular');

    await answer(page, 'Normal sinus rhythm', '80');
    await expect(feedback(page)).toContainText('Correct');
    await expect(feedback(page)).toContainText('Within range: 80 per minute');
    await expect(feedback(page)).toContainText('Draft teaching text, not clinical guidance');
    await expect(page.getByRole('button', { name: 'Submit answer' })).toHaveCount(0);
    await feedback(page).locator('summary').click();
    await expect(feedback(page)).toContainText('Cannot be determined');

    await page.getByRole('button', { name: 'Next question' }).click();
    await expect(page.getByRole('heading', { name: 'Question 2 of 2' })).toBeVisible();
    await expect(page.getByLabel(/Heart-rate estimate/)).toHaveValue('');
    await answer(page, 'Normal sinus rhythm', '80');
    await page.getByRole('button', { name: 'See results' }).click();

    await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();
    await expect(page.locator('.challenge-stats')).toContainText('100%');
    await expect(page.locator('.challenge-stats')).toContainText('+45');
    await expect(page.getByRole('list', { name: 'Achievements unlocked' })).toContainText('First rhythm identified');

    await page.getByRole('button', { name: 'View Academy' }).click();
    await expect(page.getByText('Level 1')).toBeVisible();
    await expect(page.getByText(/45 XP · 45 of 50 toward level 2/)).toBeVisible();
    await expect(page.locator('.academy-achievements li.earned', { hasText: 'First rhythm identified' })).toContainText('Earned');

    await page.reload();
    await nav(page, 'Academy');
    await expect(page.getByText(/45 XP · 45 of 50 toward level 2/)).toBeVisible();
    await expect(page.locator('.academy-achievements li.earned', { hasText: 'First rhythm identified' })).toBeVisible();
  });

  test('a wrong answer can be retried unscored in Learn mode, and missed strips are offered for review', async ({ page }) => {
    await page.goto('/');
    await startNsr(page);
    await answer(page, 'Cannot be determined from this strip');
    await expect(feedback(page)).toContainText('Not quite');
    await expect(feedback(page)).toContainText('declaring it undeterminable');
    await page.getByRole('button', { name: 'Try this strip again' }).click();
    await answer(page, 'Normal sinus rhythm');
    await expect(feedback(page)).toContainText('retries are not scored');
    await page.getByRole('button', { name: 'Next question' }).click();
    await answer(page, 'Normal sinus rhythm');
    await page.getByRole('button', { name: 'See results' }).click();
    await expect(page.locator('.challenge-stats')).toContainText('50%');
    await expect(page.locator('.challenge-missed')).toContainText('you answered: Cannot be determined');

    await page.getByRole('button', { name: 'New session' }).click();
    const review = page.getByRole('button', { name: 'Review missed strips (1)' });
    await expect(review).toBeEnabled();
    await review.click();
    await expect(page.getByRole('heading', { name: 'Question 1 of 1' })).toBeVisible();
  });

  test('Practice mode has no retry button after a miss', async ({ page }) => {
    await page.goto('/');
    await startNsr(page, 'Practice');
    await answer(page, 'Cannot be determined from this strip');
    await expect(feedback(page)).toContainText('Not quite');
    await expect(page.getByRole('button', { name: 'Try this strip again' })).toHaveCount(0);
  });

  test('timed challenge: countdown, pause hides the strip and freezes time, expiry ends with a partial summary', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await startNsr(page, 'Timed challenge');
    await expect(page.getByRole('timer')).toHaveText('2:00');
    await expect(page.getByRole('button', { name: /Show hint/ })).toHaveCount(0);

    await page.clock.runFor(30_000);
    await expect(page.getByRole('timer')).toHaveText('1:30');
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('img', { name: /Six-second synthetic ECG strip/ })).toHaveCount(0);
    await page.clock.runFor(60_000);
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByRole('timer')).toHaveText('1:30');

    await page.clock.runFor(91_000);
    await expect(page.getByRole('heading', { name: 'Time is up' })).toBeVisible();
    await expect(page.locator('.challenge-stats')).toContainText('0 of 2');
    await expect(page.getByText(/Answer at least 2 questions to earn the session completion bonus/)).toBeVisible();
    await expect(page.locator('.challenge-stats')).toContainText('+0');
  });

  test('a session survives navigating away, and a timed session pauses by itself', async ({ page }) => {
    await page.goto('/');
    await startNsr(page);
    await answer(page, 'Normal sinus rhythm', '80');
    await nav(page, 'Academy');
    await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
    await nav(page, 'Rhythm Challenge');
    await expect(page.getByRole('heading', { name: 'Question 1 of 2' })).toBeVisible();
    await expect(feedback(page)).toContainText('Correct');

    await page.reload();
    await startNsr(page, 'Timed challenge');
    await nav(page, 'ECG simulator');
    await nav(page, 'Rhythm Challenge');
    await expect(page.getByText(/Paused/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  });

  test('keyboard: arrow keys choose an answer and Enter in the rate field submits', async ({ page }) => {
    await page.goto('/');
    await startNsr(page);
    const options = page.getByRole('radio');
    await options.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toBeChecked();
    await page.getByRole('radio', { name: 'Normal sinus rhythm', exact: true }).check();
    await page.getByLabel(/Heart-rate estimate/).fill('80');
    await page.keyboard.press('Enter');
    await expect(feedback(page)).toContainText('Correct');
    await expect(page.getByRole('status').filter({ hasText: /Correct/ }).first()).toBeVisible();
  });
});

test.describe('Guided Lab to Academy', () => {
  test('finishing an exercise records XP and an achievement, and leads on to the challenge', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('details.guided-exercises > summary').click();
    await page.getByLabel('Start point (ms)').fill('240');
    await page.getByLabel('End point (ms)').fill('1040');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('.exercise-status')).toContainText('Passed');
    await expect(page.getByRole('group', { name: 'Next steps' })).toBeVisible();

    await nav(page, 'Academy');
    await expect(page.getByText('Exercises completed').locator('..')).toContainText('1');
    await expect(page.getByText(/25 XP · 25 of 50 toward level 2/)).toBeVisible();
    await expect(page.locator('.academy-achievements li.earned', { hasText: 'First exercise' })).toBeVisible();

    await nav(page, 'ECG simulator');
    await page.locator('details.guided-exercises > summary').click();
    await page.getByRole('button', { name: /Practise rate estimation in the Rhythm Challenge/ }).click();
    await expect(page.getByRole('heading', { name: 'Read the strip, name the rhythm' })).toBeVisible();
  });

  test('the grid exercise validates pulse size against the settings and shows a hint', async ({ page }) => {
    await page.goto('/');
    await page.locator('details.guided-exercises > summary').click();
    await page.getByRole('button', { name: /Read the calibration pulse/ }).click();
    await page.getByRole('button', { name: 'Show hint (0/3)' }).click();
    await expect(page.getByRole('list', { name: 'Hints' })).toBeVisible();
    // Defaults are 25 mm/s and 20 mm/mV: pulse is 20 mm tall and 5 mm wide.
    await page.getByLabel('Calibration pulse height (mm)').fill('20');
    await page.getByLabel('Calibration pulse width (mm)').fill('5');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.locator('aside.controls').getByLabel('Gain').selectOption('10');
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('50');
    await page.getByLabel('Calibration pulse height (mm)').fill('10');
    await page.getByLabel('Calibration pulse width (mm)').fill('10');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.locator('.exercise-status')).toContainText('Passed');
  });
});

test.describe('Academy', () => {
  test('shows an honest empty state, then confirms before resetting progress', async ({ page }) => {
    await page.goto('/');
    await nav(page, 'Academy');
    await expect(page.getByText(/Nothing recorded yet/)).toBeVisible();
    await expect(page.locator('.academy').getByText(/Level \d/)).toHaveCount(0);

    await startNsr(page);
    await answer(page, 'Normal sinus rhythm', '80');
    await page.getByRole('button', { name: 'Next question' }).click();
    await answer(page, 'Normal sinus rhythm', '80');
    await page.getByRole('button', { name: 'See results' }).click();
    await nav(page, 'Academy');
    await expect(page.getByText('Level 1')).toBeVisible();

    await page.getByRole('button', { name: 'Reset Academy progress' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Level 1')).toBeVisible();
    await page.getByRole('button', { name: 'Reset Academy progress' }).click();
    await page.getByRole('button', { name: 'Reset now' }).click();
    await expect(page.getByText(/Nothing recorded yet/)).toBeVisible();
    await page.reload();
    await nav(page, 'Academy');
    await expect(page.getByText(/Nothing recorded yet/)).toBeVisible();
  });

  test('corrupt stored progress is reset with a notice and the app stays usable', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('ecg-lab-academy-v1', '{"version":9,"awards":{}}'));
    await page.goto('/');
    await nav(page, 'Academy');
    await expect(page.getByRole('status').filter({ hasText: /reset/ })).toBeVisible();
    await expect(page.getByText(/Nothing recorded yet/)).toBeVisible();
    await startNsr(page);
    await expect(page.getByRole('heading', { name: 'Question 1 of 2' })).toBeVisible();
  });
});

test.describe('layout and accessibility of the learning screens', () => {
  for (const size of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
    test(`setup, question, feedback, results and Academy are axe-clean without overflow at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      const checkPage = async (label: string) => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${label} overflow`).toBeLessThanOrEqual(0);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
      };
      await nav(page, 'Rhythm Challenge');
      await checkPage('setup');
      await page.getByLabel('Category').selectOption('nsr');
      await page.getByRole('button', { name: /^Start/ }).click();
      await checkPage('question');
      await page.getByRole('button', { name: 'Show hint (0/3)' }).click();
      await answer(page, 'Normal sinus rhythm', '80');
      await feedback(page).locator('summary').click();
      await checkPage('feedback');
      await page.getByRole('button', { name: 'Next question' }).click();
      await answer(page, 'Normal sinus rhythm', '80');
      await page.getByRole('button', { name: 'See results' }).click();
      await checkPage('results');
      await nav(page, 'Academy');
      await checkPage('academy');
    });
  }

  for (const font of ['Verdana', 'Courier New', 'Georgia']) {
    test(`no horizontal overflow on the challenge and Academy with ${font} at 375px`, async ({ page }) => {
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
      await nav(page, 'Rhythm Challenge');
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByLabel('Category').selectOption('avb-2to1');
      await page.getByRole('button', { name: /^Start/ }).click();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await page.getByRole('radio').last().check();
      await page.getByRole('button', { name: 'Submit answer' }).click();
      await feedback(page).locator('summary').click();
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
      await nav(page, 'Academy');
      expect(await overflow()).toEqual({ pixels: 0, offenders: [] });
    });
  }

  test('dark theme: setup, question, feedback, results and Academy are axe-clean', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Toggle theme/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const checkPage = async (label: string) => {
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(result.violations.map(violation => `${label}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
    };
    await nav(page, 'Rhythm Challenge');
    await checkPage('setup');
    await page.getByLabel('Category').selectOption('nsr');
    await page.getByRole('button', { name: /^Start/ }).click();
    await checkPage('question');
    await answer(page, 'Cannot be determined from this strip');
    await feedback(page).locator('summary').click();
    await checkPage('incorrect feedback');
    await page.getByRole('button', { name: 'Try this strip again' }).click();
    await answer(page, 'Normal sinus rhythm', '80');
    await checkPage('correct feedback');
    await page.getByRole('button', { name: 'Next question' }).click();
    await answer(page, 'Normal sinus rhythm', '80');
    await page.getByRole('button', { name: 'See results' }).click();
    await checkPage('results');
    await nav(page, 'Academy');
    await checkPage('academy');
  });

  test('reduced motion: the learning screens run without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await startNsr(page);
    const durations = await page.evaluate(() => [...document.querySelectorAll('.challenge *')].map(element => getComputedStyle(element).animationDuration).filter(value => value !== '0s'));
    expect(durations).toEqual([]);
  });
});
