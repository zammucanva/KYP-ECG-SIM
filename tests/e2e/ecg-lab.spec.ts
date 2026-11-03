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
  const waveform = page.getByRole('img', { name: /^V3 synthetic educational ECG waveform, moving paper sweep, 25 mm\/s, 20 mm\/mV, ECG grid visible$/ });
  await expect(waveform).toBeVisible();
  const liveViewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  await expect(liveViewport).toHaveAttribute('data-playing', 'true');
  await expect.poll(async () => Number(await liveViewport.getAttribute('data-simulation-time-ms'))).toBeGreaterThan(0);

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
  const trace = page.getByRole('img', { name: /synthetic educational ECG waveform/ });
  const v3Path = await trace.locator('path').last().getAttribute('d');
  const v3Viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  const timeBeforeLeadChange = Number(await v3Viewport.getAttribute('data-simulation-time-ms'));

  await page.getByRole('button', { name: 'V4', exact: true }).click();
  const v4Viewport = page.getByRole('region', { name: /ECG waveform viewport for V4/ });
  expect(Number(await v4Viewport.getAttribute('data-simulation-time-ms'))).toBeGreaterThanOrEqual(timeBeforeLeadChange);
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
  await expect(trace).toHaveAttribute('aria-label', /50 mm\/s/);
  const singleViewport = page.getByRole('region', { name: 'ECG waveform viewport' });
  await expect(singleViewport).toHaveAttribute('data-speed-mm-s', '50');
  const singleFits = await singleViewport.evaluate(element => element.scrollWidth <= element.clientWidth + 1);
  expect(singleFits).toBe(true);

  await page.getByLabel('Gain').selectOption('5');
  await expect(page.getByRole('img', { name: /5 millimetres per millivolt and 50 millimetres per second/ })).toBeVisible();
  const gridToggle = page.getByRole('button', { name: /ECG paper grid/ });
  await gridToggle.click();
  await expect(gridToggle).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: '12 leads' }).click();
  await expect(page.getByRole('heading', { name: '12-lead overview' })).toBeVisible();
  const multiViewport = page.getByRole('region', { name: '12-lead ECG waveform viewport' });
  const waveforms = page.getByRole('img', { name: /synthetic educational ECG waveform/ });
  await expect(waveforms).toHaveCount(12);
  const viewBoxes = await waveforms.evaluateAll(elements => elements.map(element => element.getAttribute('viewBox')));
  expect(new Set(viewBoxes).size).toBe(1);
  const logicalScales = await waveforms.evaluateAll(elements => elements.map(element => {
    const svg = element as SVGSVGElement;
    return svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  }));
  logicalScales.forEach(scale => expect(scale).toBeCloseTo(0.8, 1));
  const timeCoordinates = await waveforms.evaluateAll(elements => elements.map(element => {
    const paths = Array.from(element.querySelectorAll('path'));
    const tracePath = paths.at(-1)?.getAttribute('d') ?? '';
    return Array.from(tracePath.matchAll(/(?:^M| L) ([\d.]+) /g), match => match[1]);
  }));
  expect(new Set(timeCoordinates.map(coordinates => JSON.stringify(coordinates))).size).toBe(1);
  for (const lead of leadNames) {
    await expect(page.getByRole('img', { name: new RegExp(`^${lead} synthetic educational ECG waveform`) })).toBeVisible();
  }
  expect(await multiViewport.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);

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

test('named manual measurement sets remain independently selectable and deletable', async ({ page }) => {
  await page.goto('/');
  const result = page.getByRole('status');
  const start = page.getByLabel('Start point (ms)');
  const end = page.getByLabel('End point (ms)');
  const first = page.getByRole('button', { name: /R–R interval.*RR.*800 ms/ });
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });

  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await start.fill('100');
  await end.fill('900');
  await expect(result).toContainText('800 ms');
  await expect(viewport).toHaveAttribute('data-marker-start-ms', '100.000');

  await page.getByRole('button', { name: 'Add measurement set' }).click();
  const second = page.getByRole('button', { name: /Measurement 2.*RR.*800 ms/ });
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('800');
  await expect(viewport).toHaveAttribute('data-marker-start-ms', '0.000');
  await page.getByLabel('Set name').fill('Manual QRS');
  await page.getByLabel('Measurement').selectOption('QRS');
  await start.fill('400');
  await end.fill('490');
  await expect(result).toContainText('90 ms');
  await expect(page.getByRole('button', { name: /Manual QRS.*QRS.*90 ms/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(viewport).toHaveAttribute('data-marker-start-ms', '400.000');

  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(start).toHaveValue('100');
  await expect(end).toHaveValue('900');
  await expect(result).toContainText('800 ms');
  await expect(viewport).toHaveAttribute('data-marker-start-ms', '100.000');

  await page.getByRole('button', { name: 'Delete R–R interval' }).click();
  await expect(page.getByRole('button', { name: /Manual QRS.*QRS/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(start).toHaveValue('400');
  await expect(end).toHaveValue('490');
  await expect(viewport).toHaveAttribute('data-marker-start-ms', '400.000');

  await page.getByRole('button', { name: 'Delete Manual QRS' }).click();
  await expect(result).toContainText('No active measurement');
  await expect(start).toBeDisabled();
  await expect(end).toBeDisabled();
  await expect(viewport).toHaveAttribute('data-marker-start-state', 'none');
  await expect(page.getByTestId('measurement-window-status')).toContainText('No active measurement');

  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await expect(page.getByLabel('Set name')).toHaveValue('Measurement 3');
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('800');
});

test('private timeline annotations stay timestamp-anchored without becoming authored teaching content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pause' }).click();
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  const elapsedMs = Number(await viewport.getAttribute('data-simulation-time-ms'));
  const startMs = Math.max(0, Math.floor(elapsedMs) - 120);
  const endMs = Math.floor(elapsedMs);

  await page.locator('details.annotation-workspace > summary').click();
  await expect(page.getByText(/not automated boundary detection or clinical interpretation/i)).toBeVisible();
  await page.getByRole('button', { name: 'Add annotation' }).click();
  await page.getByLabel('Annotation label').fill('Manual landmark');
  await page.getByLabel('Annotation start (ms)').fill(String(startMs));
  await page.getByLabel('Annotation end (ms)').fill(String(endMs));
  const annotation = page.getByRole('button', { name: /Manual landmark.*Learner note/ });
  await expect(annotation).toHaveAttribute('aria-pressed', 'true');
  await expect(viewport).toHaveAttribute('data-annotation-count', '1');
  await expect(page.locator('[data-annotation-id="annotation-1"]')).toHaveCount(1);

  await page.getByLabel('Paper speed').selectOption('12.5');
  await page.getByLabel('Gain').selectOption('5');
  await expect(page.locator('[data-annotation-id="annotation-1"]')).toHaveCount(1);

  await page.getByRole('button', { name: '12 leads' }).click();
  await expect(page.locator('[data-annotation-id="annotation-1"]')).toHaveCount(1);
  await annotation.focus();
  await page.keyboard.press('Enter');
  await expect(annotation).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Delete Manual landmark' }).click();
  await expect(page.getByRole('region', { name: /12-lead ECG waveform viewport/ })).toHaveAttribute('data-annotation-count', '0');
  await expect(page.locator('[data-annotation-id="annotation-1"]')).toHaveCount(0);
});

test('local experiment save, refresh, cancel, restore and delete preserve learner work and stay paused', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  const savedTime = await viewport.getAttribute('data-simulation-time-ms');
  await page.getByLabel('Paper speed').selectOption('50');
  await page.getByLabel('Gain').selectOption('10');
  await page.locator('details.annotation-workspace > summary').click();
  await page.getByRole('button', { name: 'Add annotation' }).click();
  await page.getByLabel('Annotation label').fill('Saved landmark');

  await page.locator('details.experiment-workspace > summary').click();
  await expect(page.getByText('No saved experiments in this browser.')).toBeVisible();
  await page.getByLabel('Experiment name').fill('Lab one');
  await page.getByRole('button', { name: 'Save experiment' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved “Lab one” locally in this browser.' })).toBeVisible();

  await page.reload();
  await page.locator('details.experiment-workspace > summary').click();
  const list = page.getByRole('list', { name: 'Saved experiments' });
  await expect(list.getByText('Lab one')).toBeVisible();

  await page.getByLabel('Paper speed').selectOption('12.5');
  await page.getByLabel('Gain').selectOption('5');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel restore' }).click();
  await expect(page.getByLabel('Paper speed')).toHaveValue('12.5');
  await expect(page.getByLabel('Gain')).toHaveValue('5');

  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Restore saved experiment confirmation' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore now' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Playback is paused.' })).toBeVisible();
  await expect(page.getByLabel('Paper speed')).toHaveValue('50');
  await expect(page.getByLabel('Gain')).toHaveValue('10');
  const restoredViewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  await expect(restoredViewport).toHaveAttribute('data-simulation-time-ms', savedTime ?? '');
  await expect(restoredViewport).toHaveAttribute('data-annotation-count', '1');
  await page.locator('details.annotation-workspace > summary').click();
  await expect(page.getByRole('button', { name: /Saved landmark.*Learner note/ })).toBeVisible();
  await page.waitForTimeout(400);
  await expect(restoredViewport).toHaveAttribute('data-simulation-time-ms', savedTime ?? '');

  await page.getByRole('button', { name: 'Delete', exact: true }).first().click();
  await page.getByRole('button', { name: 'Cancel delete' }).click();
  await expect(list.getByText('Lab one')).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).first().click();
  await page.getByRole('button', { name: 'Delete now' }).click();
  await expect(page.getByText('No saved experiments in this browser.')).toBeVisible();
});

test('corrupt or unavailable local experiment storage leaves the live simulator usable', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('ecg-lab-experiments-v1', JSON.stringify({ version: 1, snapshots: [{ invalid: true }] }));
  });
  await page.goto('/');
  await page.locator('details.experiment-workspace > summary').click();
  await expect(page.getByText('No saved experiments in this browser.')).toBeVisible();
  await expect(page.getByLabel('Paper speed')).toHaveValue('25');

  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Save experiment' }).click();
  await expect(page.getByRole('status').filter({ hasText: /not saved/i })).toBeVisible();
  await expect(page.getByText('No saved experiments in this browser.')).toBeVisible();
});
test('saved-experiment panel, confirmations and mobile layout are axe-clean and do not overflow horizontally', async ({ page }) => {
  for (const size of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('details.experiment-workspace > summary').click();
    await page.getByRole('button', { name: 'Save experiment' }).click();
    await page.getByRole('button', { name: 'Restore', exact: true }).first().click();
    await page.getByRole('button', { name: 'Delete', exact: true }).first().click();
    await expect(page.getByRole('group', { name: 'Restore saved experiment confirmation' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Delete saved experiment confirmation' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
  }
});
test('restore re-reads storage and leaves current work unchanged when the saved record is tampered with', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.locator('details.experiment-workspace > summary').click();
  await page.getByRole('button', { name: 'Save experiment' }).click();
  await page.getByLabel('Paper speed').selectOption('50');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.evaluate(() => {
    const key = 'ecg-lab-experiments-v1';
    const envelope = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    envelope.snapshots[0].version = 99;
    window.localStorage.setItem(key, JSON.stringify(envelope));
  });
  await page.getByRole('button', { name: 'Restore now' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'missing or invalid and was not restored' })).toBeVisible();
  await expect(page.getByLabel('Paper speed')).toHaveValue('50');
  await expect(page.getByText('No saved experiments in this browser.')).toBeVisible();
});
test.describe('guided ECG exercises', () => {
  const openExercises = async (page: import('@playwright/test').Page) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.locator('details.guided-exercises > summary').click();
  };
  const setMarkers = async (page: import('@playwright/test').Page, startMs: number, endMs: number) => {
    await page.getByLabel('Start point (ms)').fill(String(startMs));
    await page.getByLabel('End point (ms)').fill(String(endMs));
  };
  const status = (page: import('@playwright/test').Page) => page.locator('.exercise-status');

  test('R–R exercise: miss, retry, pass, and completion survives a refresh', async ({ page }) => {
    await openExercises(page);
    await expect(page.getByText('draft · unreviewed · synthetic signal')).toBeVisible();
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Not yet');
    await expect(page.getByRole('list', { name: 'Check results' })).toContainText('Not yet:');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('list', { name: 'Check results' })).toHaveCount(0);

    await setMarkers(page, 240, 1040);
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Passed');
    await expect(page.getByRole('list', { name: 'Check results' })).toContainText('75 beats per minute');
    await expect(page.getByText(/Attempts 2 · Completed/)).toBeVisible();

    await page.reload();
    await page.locator('details.guided-exercises > summary').click();
    await expect(page.getByText(/Attempts 2 · Completed/)).toBeVisible();
    await page.getByRole('button', { name: 'Reset exercise' }).click();
    await expect(page.getByText(/Readings 0 of 1 · Attempts 0/)).toBeVisible();
  });

  test('targets follow the rhythm preset instead of fixed times', async ({ page }) => {
    await openExercises(page);
    await page.getByLabel('Rhythm preset').selectOption('brady');
    await setMarkers(page, 240, 1040);
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Not yet');
    await page.getByRole('button', { name: 'Retry' }).click();
    await setMarkers(page, 360, 1560);
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Passed');
  });

  test('gain exercise passes only after the gain changes with unchanged timing', async ({ page }) => {
    await openExercises(page);
    await page.getByRole('button', { name: /Gain changes height/ }).click();
    await page.locator('aside.controls').getByLabel('Gain').selectOption('5');
    await setMarkers(page, 240, 1040);
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByRole('list', { name: 'Check results' })).toContainText('Change the Gain control');
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.locator('aside.controls').getByLabel('Gain').selectOption('20');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Passed');
    await expect(page.getByRole('list', { name: 'Check results' })).toContainText('mm tall at 5 mm/mV');
  });

  test('cross-lead exercise matches the same beat by time in two differently shaped leads', async ({ page }) => {
    await openExercises(page);
    await page.getByRole('button', { name: /Find the same beat/ }).click();
    await page.locator('.lead-grid').getByRole('button', { name: 'II', exact: true }).click();
    await setMarkers(page, 240, 1040);
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.locator('.lead-grid').getByRole('button', { name: 'V1', exact: true }).click();
    await page.getByLabel('Start point (ms)').fill('1040');
    await page.getByLabel('End point (ms)').fill('1100');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Not yet');
    await expect(page.getByRole('list', { name: 'Check results' })).toContainText('different beats');
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.getByLabel('Start point (ms)').fill('245');
    await page.getByLabel('End point (ms)').fill('300');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.locator('.lead-grid').getByRole('button', { name: 'II', exact: true }).click();
    await page.getByLabel('Start point (ms)').fill('265');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Passed');
  });

  test('paper-speed exercise validates widths in millimetres at two speeds', async ({ page }) => {
    await openExercises(page);
    await page.getByRole('button', { name: /One interval, two paper speeds/ }).click();
    await setMarkers(page, 240, 1040);
    await page.getByRole('button', { name: 'Record reading' }).click();
    await expect(status(page)).toContainText('Enter the interval width');
    await page.getByLabel('Interval width on paper (mm)').fill('20');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('50');
    await page.getByLabel('Interval width on paper (mm)').fill('20');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByRole('list', { name: 'Check results' })).toContainText('expected about 40.0 mm at 50 mm/s');
    await page.getByRole('button', { name: 'Retry' }).click();
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('25');
    await page.getByLabel('Interval width on paper (mm)').fill('20');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.locator('aside.controls').getByLabel('Paper speed').selectOption('50');
    await page.getByLabel('Interval width on paper (mm)').fill('40');
    await page.getByRole('button', { name: 'Record reading' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(status(page)).toContainText('Passed');
  });

  test('corrupt stored progress is discarded, exercises are keyboard operable, and layouts stay axe-clean', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('ecg-lab-exercise-progress-v1', '{"version":7}'));
    for (const size of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(size);
      await openExercises(page);
      await expect(status(page)).toContainText('discarded');
      await page.getByRole('button', { name: 'Record reading' }).focus();
      await expect(page.getByRole('button', { name: 'Record reading' })).toBeFocused();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Check answer' }).focus();
      await page.keyboard.press('Space');
      await expect(page.getByRole('list', { name: 'Check results' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(result.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`)).toEqual([]);
      await page.evaluate(() => window.localStorage.setItem('ecg-lab-exercise-progress-v1', '{"version":7}'));
    }
  });

  test('exercise definitions never reach the Learn catalog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Learn', exact: true }).click();
    await expect(page.getByText(/R–R interval measurement|Measure an R–R interval/)).toHaveCount(0);
  });
});
test('theme toggle is keyboard accessible, recolours SVG traces and persists after reload', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle theme' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const trace = page.getByRole('img', { name: /^V3 synthetic educational ECG waveform/ });
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

test('desktop, tablet and mobile layouts keep controls readable without distorting or clipping the live strip', async ({ page }) => {
  await page.goto('/');
  const speed = page.getByLabel('Paper speed');
  const multiLead = page.getByRole('button', { name: '12 leads' });

  for (const viewport of [{ width: 1280, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(speed).toBeVisible();
    await expect(page.getByLabel('Gain')).toBeVisible();
    await expect(multiLead).toBeVisible();
    await expect.poll(async () => page.locator('.live-trace-svg').evaluate(element => {
      const svg = element as SVGSVGElement;
      return svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    })).toBeLessThan(0.85);
    const logicalScale = await page.locator('.live-trace-svg').evaluate(element => {
      const svg = element as SVGSVGElement;
      return svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    });
    expect(logicalScale).toBeCloseTo(0.8, 1);
  }

  await speed.selectOption('50');
  await multiLead.click();
  const viewport = page.getByRole('region', { name: '12-lead ECG waveform viewport' });
  const dimensions = await viewport.evaluate(element => ({ scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
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

  await expect(page.getByRole('img', { name: /^V4 synthetic educational ECG waveform, moving paper sweep, 50 mm\/s, 5 mm\/mV, ECG grid hidden$/ })).toBeVisible();
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

  const playbackPause = page.getByRole('button', { name: 'Pause', exact: true });
  await playbackPause.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: /ECG waveform viewport/ })).toHaveAttribute('data-playing', 'false');
  const playbackResume = page.getByRole('button', { name: 'Start / resume' });
  await playbackResume.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: /ECG waveform viewport/ })).toHaveAttribute('data-playing', 'true');
});

test('reduced-motion preference receives a static interface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.locator('body').evaluate(() => Array.from(document.querySelectorAll('button, select, input, svg')).map(element => {
    const style = getComputedStyle(element);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  }));
  expect(motion.every(style => style.animation === '0s' && style.transition === '0s')).toBe(true);
  const viewport = page.getByRole('region', { name: /ECG waveform viewport/ });
  await expect(viewport).toHaveAttribute('data-playing', 'false');
  await expect(page.getByText('Paused · reduced motion')).toBeVisible();
  await page.getByRole('button', { name: 'Start / resume' }).click();
  await expect(viewport).toHaveAttribute('data-playing', 'true');
});

test('live sweep moves, pauses, resumes continuously, resets, and keeps one bounded trace path', async ({ page }) => {
  await page.goto('/');
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  await expect(viewport).toHaveAttribute('data-playing', 'true');
  await expect.poll(async () => (await page.locator('.live-waveform-path').getAttribute('d'))?.length ?? 0).toBeGreaterThan(5000);
  const firstTime = Number(await viewport.getAttribute('data-simulation-time-ms'));
  const firstPathLength = await page.locator('.live-waveform-path').getAttribute('d').then(value => value?.length ?? 0);
  const gridPattern = page.locator('.live-trace-svg defs pattern[id^="major-"]');
  const firstGridTransform = await gridPattern.getAttribute('patternTransform');
  await page.waitForTimeout(180);
  const movingTime = Number(await viewport.getAttribute('data-simulation-time-ms'));
  expect(movingTime).toBeGreaterThan(firstTime);
  const movingPathLength = await page.locator('.live-waveform-path').getAttribute('d').then(value => value?.length ?? 0);
  expect(movingPathLength).toBeLessThan(firstPathLength + 1000);
  expect(await gridPattern.getAttribute('patternTransform')).not.toBe(firstGridTransform);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedTime = Number(await viewport.getAttribute('data-simulation-time-ms'));
  await page.waitForTimeout(180);
  expect(Number(await viewport.getAttribute('data-simulation-time-ms'))).toBe(pausedTime);

  await page.getByRole('button', { name: 'Start / resume' }).click();
  await expect(viewport).toHaveAttribute('data-playing', 'true');
  const resumeOrigin = Number(await viewport.getAttribute('data-simulation-time-ms'));
  expect(resumeOrigin).toBeGreaterThanOrEqual(pausedTime);
  expect(resumeOrigin - pausedTime).toBeLessThan(250);
  await expect.poll(async () => Number(await viewport.getAttribute('data-simulation-time-ms'))).toBeGreaterThan(resumeOrigin);
  const resumedTime = Number(await viewport.getAttribute('data-simulation-time-ms'));
  expect(resumedTime - resumeOrigin).toBeLessThan(250);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Reset playback' }).click();
  await expect(viewport).toHaveAttribute('data-simulation-time-ms', '0.000');
  await expect(page.getByLabel('Start point (ms)')).toHaveValue('0');
  await expect(page.getByLabel('End point (ms)')).toHaveValue('800');
  await expect(viewport).toHaveAttribute('data-playing', 'false');
});

test('manual start and end markers can be placed on the sweep and retain absolute times across display changes', async ({ page }) => {
  await page.goto('/');
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  await expect.poll(async () => Number(await viewport.getAttribute('data-simulation-time-ms'))).toBeGreaterThan(3_000);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();

  const startRadio = page.getByRole('radio', { name: 'Start', exact: true });
  const endRadio = page.getByRole('radio', { name: 'End', exact: true });
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  for (let tab = 0; tab < 40 && !(await startRadio.evaluate(element => element.matches(':focus-visible'))); tab += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(startRadio).toBeFocused();
  await expect.poll(() => startRadio.evaluate(element => element.matches(':focus-visible'))).toBe(true);
  expect(await startRadio.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('ArrowRight');
  await expect(endRadio).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(startRadio).toBeChecked();

  const svg = page.locator('.live-trace-svg').first();
  const box = await svg.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Live waveform viewport did not have a measurable box');
  const elapsed = Number(await svg.getAttribute('data-simulation-time-ms'));
  const visibleStart = Number(await svg.getAttribute('data-visible-start-ms'));
  const visibleDuration = elapsed - visibleStart;
  const startRatio = 0.85;
  const endRatio = 0.95;
  const expectedStart = visibleStart + visibleDuration * startRatio;
  const expectedEnd = visibleStart + visibleDuration * endRatio;

  await startRadio.click();
  await svg.click({ position: { x: box.width * startRatio, y: box.height * 0.6 } });
  await endRadio.click();
  await svg.click({ position: { x: box.width * endRatio, y: box.height * 0.6 } });
  const start = page.getByLabel('Start point (ms)');
  const end = page.getByLabel('End point (ms)');
  expect(Math.abs(Number(await start.evaluate(element => (element as HTMLInputElement).value)) - expectedStart)).toBeLessThan(0.5);
  expect(Math.abs(Number(await end.evaluate(element => (element as HTMLInputElement).value)) - expectedEnd)).toBeLessThan(0.5);
  const expectedDuration = Math.abs(expectedEnd - expectedStart);
  await expect(page.getByRole('status')).toContainText(`${Math.round(expectedDuration)} ms`);
  await expect(page.getByTestId('measurement-window-status')).toContainText('Start point');
  await expect(page.getByTestId('measurement-window-status')).toContainText('End point');
  await expect(page.getByTestId('measurement-marker-start').first()).toBeVisible();
  await expect(page.getByTestId('measurement-marker-end').first()).toBeVisible();
  await expect(page.getByTestId('measurement-marker-end').first()).toHaveAttribute('data-selected', 'true');
  await expect(page.getByTestId('measurement-marker-end').first()).toContainText('End · active');

  const startTime = await start.evaluate(element => (element as HTMLInputElement).value);
  const endTime = await end.evaluate(element => (element as HTMLInputElement).value);
  const resultBeforeSettings = await page.getByRole('status').locator('strong').allInnerTexts();
  const xAt25 = Number(await page.getByTestId('measurement-marker-start').first().getAttribute('data-x-units'));
  await page.getByLabel('Paper speed').selectOption('50');
  const xAt50 = Number(await page.getByTestId('measurement-marker-start').first().getAttribute('data-x-units'));
  expect(xAt50).not.toBe(xAt25);
  expect(await start.evaluate(element => (element as HTMLInputElement).value)).toBe(startTime);
  expect(await end.evaluate(element => (element as HTMLInputElement).value)).toBe(endTime);
  expect(await page.getByRole('status').locator('strong').allInnerTexts()).toEqual(resultBeforeSettings);

  const xBeforeGain = await page.getByTestId('measurement-marker-start').first().getAttribute('data-x-units');
  const lightMarkerColour = await page.getByTestId('measurement-marker-start').first().locator('line').evaluate(element => getComputedStyle(element).stroke);
  await page.getByLabel('Gain').selectOption('5');
  await expect(page.getByTestId('measurement-marker-start').first()).toHaveAttribute('data-x-units', xBeforeGain!);
  await page.getByRole('button', { name: 'V4', exact: true }).click();
  await expect(page.getByRole('region', { name: /ECG waveform viewport for V4/ })).toHaveAttribute('data-marker-start-ms', Number(startTime).toFixed(3));
  await page.getByRole('button', { name: '12 leads' }).click();
  const starts = page.getByTestId('measurement-marker-start');
  await expect(starts).toHaveCount(12);
  await expect(page.locator('.measurement-marker-text')).toHaveCount(2);
  await expect(page.locator('.measurement-marker-text').nth(0)).toContainText('Start');
  await expect(page.locator('.measurement-marker-text').nth(1)).toContainText('End');
  const alignedStartXs = await starts.evaluateAll(elements => elements.map(element => element.getAttribute('data-x-units')));
  expect(new Set(alignedStartXs).size).toBe(1);
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  const darkMarkerColour = await starts.first().locator('line').evaluate(element => getComputedStyle(element).stroke);
  expect(darkMarkerColour).not.toBe(lightMarkerColour);
  expect(await start.evaluate(element => (element as HTMLInputElement).value)).toBe(startTime);
  expect(await end.evaluate(element => (element as HTMLInputElement).value)).toBe(endTime);
  expect(await page.getByRole('status').locator('strong').allInnerTexts()).toEqual(resultBeforeSettings);
});

test('markers report viewport entry and exit; pause freezes them and playback reset restores example points', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Paper speed').selectOption('50');
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  await expect.poll(async () => Number(await viewport.getAttribute('data-simulation-time-ms'))).toBeGreaterThan(2_300);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();

  const start = page.getByLabel('Start point (ms)');
  const end = page.getByLabel('End point (ms)');
  const visibleStart = Number(await viewport.locator('svg').getAttribute('data-visible-start-ms'));
  expect(visibleStart).toBeGreaterThan(0);
  const justInside = Math.ceil(visibleStart + 60);
  await end.fill(String(justInside + 200));
  await start.fill(String(justInside));
  await expect(viewport).toHaveAttribute('data-marker-start-state', 'visible');
  await page.getByRole('button', { name: '12 leads' }).click();
  await expect(page.locator('.measurement-marker-text')).toHaveCount(2);
  await expect(page.locator('.measurement-marker-text').first()).toContainText('Start');
  expect(Number(await page.locator('[data-testid="measurement-marker-start"] .measurement-marker-label').first().getAttribute('x'))).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Single lead' }).click();
  const frozenX = await page.getByTestId('measurement-marker-start').getAttribute('data-x-units');
  const frozenTime = await viewport.getAttribute('data-simulation-time-ms');
  await page.waitForTimeout(120);
  await expect(viewport).toHaveAttribute('data-simulation-time-ms', frozenTime!);
  await expect(page.getByTestId('measurement-marker-start')).toHaveAttribute('data-x-units', frozenX!);

  await page.getByRole('button', { name: 'Start / resume' }).click();
  await expect.poll(async () => viewport.getAttribute('data-marker-start-state')).toBe('before');
  await expect(start).toHaveValue(String(justInside));
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled();
  const durationAfterExit = await page.getByRole('status').innerText();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(durationAfterExit);

  await page.getByRole('button', { name: 'Reset playback' }).click();
  await expect(viewport).toHaveAttribute('data-simulation-time-ms', '0.000');
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('800');
  await expect(page.getByRole('radio', { name: 'Start', exact: true })).toBeChecked();
  await expect(viewport).toHaveAttribute('data-marker-start-state', 'visible');
  await expect(viewport).toHaveAttribute('data-marker-end-state', 'after');

  await page.getByRole('button', { name: 'Start / resume' }).click();
  await expect(viewport).toHaveAttribute('data-playing', 'true');
  await expect.poll(async () => Number(await viewport.getAttribute('data-simulation-time-ms'))).toBeGreaterThan(50);
  await page.getByRole('button', { name: 'Reset playback' }).click();
  await expect(viewport).toHaveAttribute('data-playing', 'true');
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('800');
});

test('paper speed changes sweep rate while gain and lead changes preserve the shared clock', async ({ page }) => {
  await page.goto('/');
  const viewport = page.getByRole('region', { name: /ECG waveform viewport for V3/ });
  await page.waitForTimeout(120);
  const beforeSpeedChange = Number(await viewport.getAttribute('data-simulation-time-ms'));
  await page.getByLabel('Paper speed').selectOption('50');
  const afterSpeedChange = Number(await viewport.getAttribute('data-simulation-time-ms'));
  expect(afterSpeedChange).toBeGreaterThanOrEqual(beforeSpeedChange);
  expect(afterSpeedChange - beforeSpeedChange).toBeLessThan(1500);
  const timeStart = Number(await viewport.getAttribute('data-simulation-time-ms'));
  const paperStart = Number(await viewport.getAttribute('data-paper-position-units'));
  await page.waitForTimeout(160);
  const timeEnd = Number(await viewport.getAttribute('data-simulation-time-ms'));
  const paperEnd = Number(await viewport.getAttribute('data-paper-position-units'));
  expect((paperEnd - paperStart) / (timeEnd - timeStart)).toBeGreaterThan(0.17);

  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedTime = await viewport.getAttribute('data-simulation-time-ms');
  const path = page.locator('.live-waveform-path');
  const pathBeforeGain = await path.getAttribute('d');
  const geometryBeforeGain = await path.evaluate(element => {
    const svgPath = element as SVGPathElement;
    const viewBox = svgPath.ownerSVGElement!.viewBox.baseVal;
    const points = Array.from(svgPath.getAttribute('d')!.matchAll(/(?:^M| L) ([\d.]+) ([\d.]+)/g), match => [Number(match[1]), Number(match[2])]);
    return { x: points.map(point => point[0]), amplitude: Math.max(...points.map(point => Math.abs(point[1] - viewBox.height / 2))) };
  });
  await page.getByLabel('Gain').selectOption('5');
  const pathAfterGain = await path.getAttribute('d');
  expect(pathAfterGain).not.toBe(pathBeforeGain);
  const geometryAfterGain = await path.evaluate(element => {
    const svgPath = element as SVGPathElement;
    const viewBox = svgPath.ownerSVGElement!.viewBox.baseVal;
    const points = Array.from(svgPath.getAttribute('d')!.matchAll(/(?:^M| L) ([\d.]+) ([\d.]+)/g), match => [Number(match[1]), Number(match[2])]);
    return { x: points.map(point => point[0]), amplitude: Math.max(...points.map(point => Math.abs(point[1] - viewBox.height / 2))) };
  });
  expect(geometryAfterGain.x).toEqual(geometryBeforeGain.x);
  expect(geometryBeforeGain.amplitude / geometryAfterGain.amplitude).toBeCloseTo(4, 0);
  expect(await viewport.getAttribute('data-simulation-time-ms')).toBe(pausedTime);
  await page.getByRole('button', { name: 'V4', exact: true }).click();
  const v4Viewport = page.getByRole('region', { name: /ECG waveform viewport for V4/ });
  await expect(v4Viewport).toBeVisible();
  expect(await v4Viewport.getAttribute('data-simulation-time-ms')).toBe(pausedTime);
  await page.getByRole('button', { name: '12 leads' }).click();
  await expect(page.getByRole('img', { name: /^I synthetic educational ECG waveform/ })).toBeVisible();
  const times = await page.getByRole('img', { name: /synthetic educational ECG waveform/ }).evaluateAll(elements => elements.map(element => element.getAttribute('data-simulation-time-ms')));
  expect(new Set(times).size).toBe(1);
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
