import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('starts with the verified defaults and a calibration-derived pulse', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(message.text());
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'ECG Lab' })).toBeVisible();
  await expect(page.getByLabel('Rhythm preset')).toHaveValue('sinus');
  await expect(page.getByRole('button', { name: 'V3', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Paper speed')).toHaveValue('25');
  await expect(page.getByLabel('Gain')).toHaveValue('20');
  await expect(page.getByRole('button', { name: /ECG paper grid/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Single lead' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('img', { name: /^V3 synthetic ECG waveform, 10 seconds, 25 mm\/s, 20 mm\/mV, ECG grid visible$/ })).toBeVisible();

  const pulse = page.getByRole('img', { name: /One millivolt, 200 millisecond calibration pulse/ });
  const pulseHeight = await pulse.evaluate(element => {
    const paths = Array.from(element.querySelectorAll('path'));
    const calibrationPath = paths.at(-1)?.getAttribute('d') ?? '';
    const verticalCoordinates = calibrationPath.match(/^M 0 ([\d.]+) H [\d.]+ V ([\d.]+)/);
    if (!verticalCoordinates) throw new Error('Calibration pulse path did not expose its vertical segment');
    return Math.abs(Number(verticalCoordinates[1]) - Number(verticalCoordinates[2]));
  });
  expect(pulseHeight).toBe(80);
  expect(runtimeErrors).toEqual([]);
});

test('machine controls preserve the recording and keep all twelve rows aligned', async ({ page }) => {
  await page.goto('/');
  const trace = page.getByRole('img', { name: /synthetic ECG waveform/ });
  const v3Path = await trace.locator('path').last().getAttribute('d');

  await page.getByRole('button', { name: 'V4', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'V4 rhythm strip' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'V4', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await trace.locator('path').last().getAttribute('d')).not.toBe(v3Path);

  const leadNames = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  for (const lead of leadNames) {
    const leadButton = page.getByRole('button', { name: lead, exact: true });
    await leadButton.click();
    await expect(leadButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: `${lead} rhythm strip` })).toBeVisible();
  }
  await page.getByRole('button', { name: 'V4', exact: true }).click();

  await page.getByLabel('Paper speed').selectOption('50');
  await expect(trace).toHaveAttribute('viewBox', /^0 0 2000 /);
  const singleViewport = page.getByRole('region', { name: 'ECG waveform viewport' });
  const singleScrolls = await singleViewport.evaluate(element => element.scrollWidth > element.clientWidth);
  expect(singleScrolls).toBe(true);

  await page.getByLabel('Gain').selectOption('5');
  await expect(page.getByRole('img', { name: /5 millimetres per millivolt and 50 millimetres per second/ })).toBeVisible();
  const gridToggle = page.getByRole('button', { name: /ECG paper grid/ });
  await gridToggle.click();
  await expect(gridToggle).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: '12 leads' }).click();
  await expect(page.getByRole('heading', { name: '12-lead overview' })).toBeVisible();
  const multiViewport = page.getByRole('region', { name: '12-lead ECG waveform viewport' });
  const waveforms = page.getByRole('img', { name: /synthetic ECG waveform/ });
  await expect(waveforms).toHaveCount(12);
  const viewBoxes = await waveforms.evaluateAll(elements => elements.map(element => element.getAttribute('viewBox')));
  expect(new Set(viewBoxes).size).toBe(1);
  const timeCoordinates = await waveforms.evaluateAll(elements => elements.map(element => {
    const paths = Array.from(element.querySelectorAll('path'));
    const tracePath = paths.at(-1)?.getAttribute('d') ?? '';
    return Array.from(tracePath.matchAll(/(?:^M| L) ([\d.]+) /g), match => match[1]);
  }));
  expect(new Set(timeCoordinates.map(coordinates => JSON.stringify(coordinates))).size).toBe(1);
  for (const lead of leadNames) {
    await expect(page.getByRole('img', { name: new RegExp(`^${lead} synthetic ECG waveform`) })).toBeVisible();
  }
  expect(await multiViewport.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);

  await page.getByRole('button', { name: 'Single lead' }).click();
  await expect(page.getByRole('heading', { name: 'V4 rhythm strip' })).toBeVisible();
});

test('manual interval measurements keep their units across machine settings and reset correctly', async ({ page }) => {
  await page.goto('/');
  const result = page.getByRole('status');
  const measurement = page.getByLabel('Measurement');
  const start = page.getByLabel('Start point (ms)');
  const end = page.getByLabel('End point (ms)');

  await start.fill('100');
  await end.fill('900');
  await expect(result).toContainText('800 ms');
  await expect(result).toContainText('75 bpm');

  await measurement.selectOption('PR');
  await expect(result).toContainText('160 ms');
  await measurement.selectOption('QRS');
  await expect(result).toContainText('80 ms');
  await measurement.selectOption('QT');
  await expect(result).toContainText('300 ms');
  await measurement.selectOption('RR');

  await page.getByLabel('Paper speed').selectOption('12.5');
  await page.getByLabel('Gain').selectOption('5');
  await expect(result).toContainText('800 ms');
  await expect(result).toContainText('75 bpm');
  await page.getByRole('button', { name: 'Reset points' }).click();
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('800');
  await expect(result).toContainText('800 ms');
});

test('theme toggle is keyboard accessible, recolours SVG traces and persists after reload', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle theme' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const trace = page.getByRole('img', { name: /^V3 synthetic ECG waveform/ });
  const getTraceColour = () => trace.locator('path').last().evaluate(element => getComputedStyle(element).stroke);
  const lightTraceColour = await getTraceColour();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  expect(await toggle.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');

  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkTraceColour = await getTraceColour();
  expect(darkTraceColour).not.toBe(lightTraceColour);

  const darkGridColour = await trace.locator('defs pattern[id^="major-"] path').evaluate(element => getComputedStyle(element).stroke);
  expect(darkGridColour).not.toBe('none');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await getTraceColour()).toBe(darkTraceColour);
});

test('desktop, tablet and mobile layouts keep controls readable and long strips scroll inside the viewport', async ({ page }) => {
  await page.goto('/');
  const speed = page.getByLabel('Paper speed');
  const multiLead = page.getByRole('button', { name: '12 leads' });

  for (const viewport of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(speed).toBeVisible();
    await expect(page.getByLabel('Gain')).toBeVisible();
    await expect(multiLead).toBeVisible();
  }

  await speed.selectOption('50');
  await multiLead.click();
  const viewport = page.getByRole('region', { name: '12-lead ECG waveform viewport' });
  const dimensions = await viewport.evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  const pageOverflowsHorizontally = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(pageOverflowsHorizontally).toBe(false);
  const controlsBounds = await page.locator('.controls').boundingBox();
  const monitorBounds = await page.locator('.monitor').boundingBox();
  expect(controlsBounds).not.toBeNull();
  expect(monitorBounds).not.toBeNull();
  expect(controlsBounds!.y).toBeLessThan(monitorBounds!.y);
});

test('main controls and waveform regions remain keyboard-operable with visible focus', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
  await expect(themeToggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(themeToggle).toHaveAttribute('aria-pressed', 'true');

  const lead = page.getByRole('button', { name: 'V4', exact: true });
  await lead.focus();
  await page.keyboard.press('Enter');
  await expect(lead).toHaveAttribute('aria-pressed', 'true');

  const preset = page.getByLabel('Rhythm preset');
  await preset.focus();
  await page.keyboard.press('ArrowDown');
  await expect(preset).toHaveValue('brady');

  const speed = page.getByLabel('Paper speed');
  await speed.focus();
  await page.keyboard.press('End');
  await expect(speed).toHaveValue('50');
  const gain = page.getByLabel('Gain');
  await gain.focus();
  await page.keyboard.press('Home');
  await expect(gain).toHaveValue('5');

  const grid = page.getByRole('button', { name: /ECG paper grid/ });
  await grid.focus();
  await page.keyboard.press('Space');
  await expect(grid).toHaveAttribute('aria-pressed', 'false');

  await expect(page.getByRole('img', { name: /^V4 synthetic ECG waveform, 10 seconds, 50 mm\/s, 5 mm\/mV, ECG grid hidden$/ })).toBeVisible();
  const singleViewport = page.getByRole('region', { name: /ECG waveform viewport for V4, 50 mm\/s, 5 mm\/mV/ });
  await singleViewport.focus();
  const singleFocusStyle = await singleViewport.evaluate(element => getComputedStyle(element).outlineWidth);
  expect(parseFloat(singleFocusStyle)).toBeGreaterThan(0);

  const multiLeadButton = page.getByRole('button', { name: '12 leads' });
  await multiLeadButton.focus();
  await page.keyboard.press('Enter');
  const multiViewport = page.getByRole('region', { name: '12-lead ECG waveform viewport' });
  await multiViewport.focus();
  const focusStyle = await multiViewport.evaluate(element => ({
    outlineStyle: getComputedStyle(element).outlineStyle,
    outlineWidth: getComputedStyle(element).outlineWidth,
    outlineColor: getComputedStyle(element).outlineColor,
  }));
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0);

  const measurement = page.getByLabel('Measurement');
  await measurement.focus();
  await page.keyboard.press('ArrowDown');
  await expect(measurement).toHaveValue('PR');
  const start = page.getByLabel('Start point (ms)');
  await start.focus();
  await page.keyboard.press('ArrowUp');
  await expect(start).toHaveValue('124');
  const reset = page.getByRole('button', { name: 'Reset points' });
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(start).toHaveValue('120');
  await expect(page.getByRole('status')).toContainText('160 ms');
});

test('reduced-motion preference receives a static interface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.locator('body').evaluate(() => Array.from(document.querySelectorAll('button, select, input, svg')).map(element => {
    const style = getComputedStyle(element);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  }));
  expect(motion.every(style => style.animation === '0s' && style.transition === '0s')).toBe(true);
});

test('Learn navigation keeps draft content private and preserves simulator and theme state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'V4', exact: true }).click();
  await page.getByLabel('Paper speed').selectOption('12.5');
  await page.getByLabel('Gain').selectOption('10');
  await page.getByLabel('Start point (ms)').fill('100');
  await page.getByLabel('End point (ms)').fill('900');
  await page.getByRole('button', { name: 'Toggle theme' }).click();

  const learnNav = page.getByRole('button', { name: 'Learn', exact: true });
  await learnNav.focus();
  await page.keyboard.press('Enter');
  await expect(learnNav).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Learn ECG fundamentals' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No lessons are published yet' })).toBeVisible();
  await expect(page.getByText('What an ECG measures', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/draft answers or unreviewed clinical statement/i)).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const learnAxeFindings: string[] = [];
  const scanLearnState = async (state: string) => {
    const axeResult = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    learnAxeFindings.push(...axeResult.violations.map(violation => `${state}: ${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`));
  };
  await scanLearnState('dark desktop Learn');
  const themeToggle = page.getByRole('button', { name: 'Toggle theme' });
  await themeToggle.click();
  await scanLearnState('light desktop Learn');

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await scanLearnState('light mobile Learn');
  await themeToggle.click();
  await scanLearnState('dark mobile Learn');
  expect(learnAxeFindings).toEqual([]);
  await page.getByRole('button', { name: 'ECG simulator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'V4 rhythm strip' })).toBeVisible();
  await expect(page.getByLabel('Paper speed')).toHaveValue('12.5');
  await expect(page.getByLabel('Gain')).toHaveValue('10');
  await expect(page.getByLabel('Start point (ms)')).toHaveValue('100');
  await expect(page.getByRole('button', { name: 'V4', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('axe scans the primary light, dark, 12-lead and mobile states without suppressing rules', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const findings: string[] = [];
  const scan = async (state: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    findings.push(...result.violations.map(violation =>
      `${state}: ${violation.id} ${violation.impact ?? 'unknown'} — ${violation.nodes.map(node => `${node.target.join(' ')} (${node.failureSummary ?? ''})`).join('; ')}`,
    ));
  };

  await scan('light single-lead desktop');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await scan('dark single-lead desktop');
  await page.getByRole('button', { name: '12 leads' }).click();
  await scan('dark 12-lead desktop');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await scan('light 12-lead desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await scan('light 12-lead mobile');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await scan('dark 12-lead mobile');

  expect(findings, findings.join('\n')).toEqual([]);
});
