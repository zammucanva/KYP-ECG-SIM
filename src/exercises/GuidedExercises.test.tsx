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

  it('reveals hints one at a time, calls onCompleted once on the first pass, and offers next steps', async () => {
    const user = userEvent.setup();
    const completed: string[] = [];
    let openedChallenge = 0;
    render(<GuidedExercises config={config} measurement={onBeats} storage={memoryStorage()} onCompleted={definition => completed.push(definition.id)} onOpenChallenge={() => { openedChallenge += 1; }} />);
    await open(user);

    expect(screen.queryByRole('list', { name: 'Hints' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show hint (0/3)' }));
    expect(within(screen.getByRole('list', { name: 'Hints' })).getAllByRole('listitem')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Show hint (1/3)' }));
    await user.click(screen.getByRole('button', { name: 'Show hint (2/3)' }));
    expect((screen.getByRole('button', { name: 'Show hint (3/3)' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('group', { name: 'Next steps' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(completed).toEqual(['rr-interval-measurement']);

    const next = within(screen.getByRole('group', { name: 'Next steps' }));
    await user.click(next.getByRole('button', { name: /Practise rate estimation/ }));
    expect(openedChallenge).toBe(1);
    await user.click(next.getByRole('button', { name: /Next exercise: Gain changes height/ }));
    expect(screen.getByRole('heading', { name: 'Gain changes height, not timing' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Next steps' })).toBeNull();
  });

  it('does not report completion for a miss or for a retry after a pass', async () => {
    const user = userEvent.setup();
    const completed: string[] = [];
    render(<GuidedExercises config={config} measurement={offBeats} storage={memoryStorage()} onCompleted={definition => completed.push(definition.id)} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(completed).toEqual([]);
  });

  it('collects two lengths for the grid exercise and validates them against the calibration pulse', async () => {
    const user = userEvent.setup();
    const completed: string[] = [];
    const { rerender } = render(<GuidedExercises config={{ ...config, gain: 10, paperSpeed: 25 }} measurement={onBeats} storage={memoryStorage()} onCompleted={definition => completed.push(definition.id)} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: /Read the calibration pulse/ }));
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByRole('status').textContent).toContain('pulse height and width');
    await user.type(screen.getByLabelText('Calibration pulse height (mm)'), '10');
    await user.type(screen.getByLabelText('Calibration pulse width (mm)'), '5');
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    expect(screen.getByText(/height 10 mm, width 5 mm/)).toBeTruthy();

    rerender(<GuidedExercises config={{ ...config, gain: 20, paperSpeed: 50 }} measurement={onBeats} storage={memoryStorage()} onCompleted={definition => completed.push(definition.id)} />);
    await user.clear(screen.getByLabelText('Calibration pulse height (mm)'));
    await user.type(screen.getByLabelText('Calibration pulse height (mm)'), '20');
    await user.clear(screen.getByLabelText('Calibration pulse width (mm)'));
    await user.type(screen.getByLabelText('Calibration pulse width (mm)'), '10');
    await user.click(screen.getByRole('button', { name: 'Record reading' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status').textContent).toContain('Passed');
    expect(completed).toEqual(['grid-and-calibration']);
  });
});

