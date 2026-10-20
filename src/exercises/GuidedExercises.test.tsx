import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ManualMeasurementSet } from '../engine/measurement-sets';
import type { MachineConfig } from '../engine/types';
import type { ProgressStorage } from '../learn/progress';
import { GuidedExercises } from './GuidedExercises';
import { EXERCISE_PROGRESS_STORAGE_KEY } from './progress';

afterEach(cleanup);

const config: MachineConfig = { lead: 'II', paperSpeed: 25, gain: 10, showGrid: true, preset: 'sinus' };
const onBeats: ManualMeasurementSet = { id: 'm1', name: 'R–R interval', kind: 'RR', startMs: 240, endMs: 1040 };
const offBeats: ManualMeasurementSet = { ...onBeats, startMs: 0, endMs: 800 };

function memoryStorage(initial: string | null = null): ProgressStorage & { value: string | null; failWrite: boolean } {
  return {
    value: initial,
    failWrite: false,
    getItem() { return this.value; },
    setItem(_key, value) { if (this.failWrite) throw new Error('full'); this.value = value; },
    removeItem() { this.value = null; },
  };
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Guided exercises'));
}

describe('GuidedExercises', () => {
  it('labels the exercises as unreviewed drafts on a synthetic signal', async () => {
    render(<GuidedExercises config={config} measurement={onBeats} storage={memoryStorage()} />);
    expect(screen.getByText(/draft · unreviewed · synthetic signal/)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Measure an R–R interval|Gain changes height|Find the same beat|One interval, two paper speeds/ })).toHaveLength(4);
  });

  it('progresses from recording to a passing check and persists across a remount', async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    const { unmount } = render(<GuidedExercises config={config} measurement={onBeats} storage={storage} />);
    await open(user);
    expect(screen.getByText(/Step 1 of 3 · Readings 0 of 1 · Attempts 0/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Check answer' }) as HTMLButtonElement).disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByText(/Readings 1 of 1/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Reading 1 of 1 recorded.');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status').textContent).toContain('Passed');
    const results = within(screen.getByRole('list', { name: 'Check results' }));
    expect(results.getAllByText(/^Pass:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Attempts 1 · Completed/)).toBeTruthy();
    expect(storage.value).toContain('"passed":true');

    unmount();
    render(<GuidedExercises config={config} measurement={onBeats} storage={storage} />);
    await open(user);
    expect(screen.getByText(/Attempts 1 · Completed/)).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Recorded readings' })).toBeTruthy();
  });

  it('gives actionable feedback on a miss, then supports retry and reset', async () => {
    const user = userEvent.setup();
    render(<GuidedExercises config={config} measurement={offBeats} storage={memoryStorage()} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status').textContent).toContain('Not yet');
    expect(screen.getAllByText(/^Not yet:/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Attempts 1/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText(/Readings 0 of 1 · Attempts 1/)).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Check results' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    await user.click(screen.getByRole('button', { name: 'Reset exercise' }));
    expect(screen.getByText(/Readings 0 of 1 · Attempts 0/)).toBeTruthy();
  });

  it('requires a measurement and, for the paper-speed exercise, a valid width', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<GuidedExercises config={config} measurement={undefined} storage={memoryStorage()} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByRole('status').textContent).toContain('Select a measurement set');

    rerender(<GuidedExercises config={config} measurement={onBeats} storage={memoryStorage()} />);
    await user.click(screen.getByRole('button', { name: /One interval, two paper speeds/ }));
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByRole('status').textContent).toContain('Enter the interval width');
    await user.type(screen.getByLabelText('Interval width on paper (mm)'), '20');
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByText(/Readings 1 of 2/)).toBeTruthy();
    expect(screen.getByText(/width 20 mm/)).toBeTruthy();
  });

  it('starts safely from corrupt stored progress and reports a failed save', async () => {
    const user = userEvent.setup();
    const corrupt = memoryStorage('{"version":9}');
    render(<GuidedExercises config={config} measurement={onBeats} storage={corrupt} />);
    await open(user);
    expect(screen.getByRole('status').textContent).toMatch(/discarded/);
    expect(corrupt.value).toBeNull();

    corrupt.failWrite = true;
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByRole('status').textContent).toContain('could not be saved');
    expect(EXERCISE_PROGRESS_STORAGE_KEY).toBeTruthy();
  });

  it('works without any storage', async () => {
    const user = userEvent.setup();
    render(<GuidedExercises config={config} measurement={onBeats} storage={null} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByRole('status').textContent).toContain('could not be saved');
    expect(screen.getByText(/Readings 1 of 1/)).toBeTruthy();
  });
});
