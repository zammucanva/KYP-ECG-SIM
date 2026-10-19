import { expect, test } from '@playwright/test';

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
  await expect(page.getByRole('img', { name: 'synthetic ECG waveform' })).toBeVisible();

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
  const trace = page.getByRole('img', { name: 'synthetic ECG waveform' });
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
    await expect(page.getByRole('img', { name: `${lead} synthetic ECG waveform`, exact: true })).toBeVisible();
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

  const trace = page.getByRole('img', { name: 'synthetic ECG waveform' });
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
});
