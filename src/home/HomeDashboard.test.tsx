import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applySession, emptyAcademyProgress, recordExerciseCompleted } from '../academy/progress';
import { createExperimentState } from '../engine/experiment-state';
import { exerciseRegistry } from '../exercises/definitions';
import { emptyExerciseProgress, recordCheckResult, recordReading } from '../exercises/progress';
import { createSession, nextQuestion, submitAnswer } from '../rhythm/session';
import { HomeDashboard } from './HomeDashboard';
import { buildHomeSummary, type HomeSummary } from './summary';

afterEach(cleanup);

const [first, second] = exerciseRegistry;
const NOW = '2026-10-21T10:00:00.000Z';
const reading = { lead: 'II', paperSpeed: 25, gain: 10, preset: 'sinus', startMs: 240, endMs: 1040 } as const;

function handlers() {
  return { onStartExercise: vi.fn(), onResumeExperiment: vi.fn(), onBeginChallenge: vi.fn(), onReviewMissed: vi.fn(), onOpenPatients: vi.fn(), onOpenAcademy: vi.fn(), onOpenSimulator: vi.fn() };
}
function show(summary: HomeSummary) {
  const calls = handlers();
  render(<HomeDashboard summary={summary} {...calls} />);
  return calls;
}
const emptySummary = () => buildHomeSummary({ academy: emptyAcademyProgress(), exerciseProgress: emptyExerciseProgress(), savedExperiments: [] });

function populatedSummary() {
  let exerciseProgress = recordCheckResult(recordReading(emptyExerciseProgress(), first, reading), first, true);
  exerciseProgress = recordReading(exerciseProgress, second, reading);
  let academy = recordExerciseCompleted(emptyAcademyProgress(), first.id, first.version, first.title, NOW).progress;
  const created = createSession({ mode: 'practice', categoryIds: ['nsr'], difficulties: null, questionCount: 2, durationSec: null, seed: 4 });
  if (!created.ok) throw new Error(created.error);
  let state = created.state;
  while (state.status === 'in-progress') state = nextQuestion(submitAnswer(state, 'vt'));
  academy = applySession(academy, state, NOW).progress;
  const snapshot = createExperimentState({
    snapshotId: 'experiment-a', name: 'Lead V3 at 50 mm/s', theme: 'light',
    machine: { lead: 'V3', paperSpeed: 50, gain: 10, showGrid: true, preset: 'sinus' }, view: 'single',
    playback: { elapsedMs: 1200, wasPlaying: false }, measurements: [], selectedMeasurementId: null, annotations: [], selectedAnnotationId: null, authoredRegionReferences: [],
  }, '2026-10-20T08:15:00.000Z');
  return buildHomeSummary({ academy, exerciseProgress, savedExperiments: [snapshot] });
}

describe('Home dashboard with nothing saved', () => {
  it('shows an honest empty state with three ways in, and no invented figures', async () => {
    const user = userEvent.setup();
    const calls = show(emptySummary());
    expect(screen.getByRole('heading', { name: 'Start learning the ECG' })).toBeTruthy();
    expect(screen.getByText(/Nothing saved yet/)).toBeTruthy();
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/Level \d/);
    expect(text).not.toMatch(/\d+%/);
    expect(text).not.toMatch(/\bXP\b.*\bXP\b/);
    expect(screen.getByText('0 of 5 completed.')).toBeTruthy();
    expect(screen.getByText('No saved experiments yet. Save one from the ECG simulator and it will appear here.')).toBeTruthy();
    expect(screen.getByText('No strips answered yet.')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Review missed strips \(0\)/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Missed strips will appear here once you have answered some.')).toBeTruthy();
    expect(screen.getByText(/Nothing recorded yet\. Finish an exercise/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Start your first exercise' }));
    expect(calls.onStartExercise).toHaveBeenCalledWith(first.id);
    await user.click(screen.getByRole('button', { name: 'Begin a Rhythm Challenge' }));
    await user.click(screen.getByRole('button', { name: 'Try a virtual patient' }));
    await user.click(screen.getByRole('button', { name: 'Open the ECG simulator' }));
    expect(calls.onBeginChallenge).toHaveBeenCalledTimes(1);
    expect(calls.onOpenPatients).toHaveBeenCalledTimes(1);
    expect(calls.onOpenSimulator).toHaveBeenCalledTimes(1);
  });
});

describe('Home dashboard with saved state', () => {
  it('continues the exercise in progress and lists every exercise with its real state', async () => {
    const user = userEvent.setup();
    const calls = show(populatedSummary());
    expect(screen.getByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy();
    expect(screen.queryByText(/Nothing saved yet/)).toBeNull();
    const card = within(screen.getByRole('heading', { name: 'Continue learning' }).closest('section') as HTMLElement);
    expect(card.getByText(second.title)).toBeTruthy();
    expect(card.getByText(/1 of 2 readings recorded, 0 attempts so far\./)).toBeTruthy();
    await user.click(card.getByRole('button', { name: `Continue exercise: ${second.title}` }));
    expect(calls.onStartExercise).toHaveBeenCalledWith(second.id);

    expect(screen.getByText('1 of 5 completed.')).toBeTruthy();
    expect(screen.getByRole('button', { name: `Review exercise: ${first.title}` })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: `Continue exercise: ${second.title}` })).toHaveLength(2);
    expect(screen.getAllByText('Not started')).toHaveLength(exerciseRegistry.length - 2);
    expect(screen.getByText(/In progress · 1 of 2 readings/)).toBeTruthy();
    expect(screen.getAllByText('Completed')).toHaveLength(1);
  });

  it('offers the latest saved experiment by name with its real settings and saved date', async () => {
    const user = userEvent.setup();
    const calls = show(populatedSummary());
    expect(screen.getByText('Saved 2026-10-20 · V3 · 50 mm/s · 10 mm/mV · 1200 ms')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Resume “Lead V3 at 50 mm/s”' }));
    expect(calls.onResumeExperiment).toHaveBeenCalledWith('experiment-a');
  });

  it('enables the missed-strip review only when something is recorded, and says how many', async () => {
    const user = userEvent.setup();
    const summary = populatedSummary();
    const calls = show(summary);
    const review = screen.getByRole('button', { name: `Review missed strips (${summary.challenge.missedCount})` }) as HTMLButtonElement;
    expect(summary.challenge.missedCount).toBeGreaterThan(0);
    expect(review.disabled).toBe(false);
    await user.click(review);
    expect(calls.onReviewMissed).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/2 strips answered · rhythm accuracy 0%/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Begin a challenge' }));
    expect(calls.onBeginChallenge).toHaveBeenCalledTimes(1);
  });

  it('shows progress exactly as recorded and links to the Academy', async () => {
    const user = userEvent.setup();
    const summary = populatedSummary();
    const calls = show(summary);
    expect(screen.getByText(`Level ${summary.progress.level}`)).toBeTruthy();
    expect(screen.getByText(new RegExp(`${summary.progress.xp} XP`))).toBeTruthy();
    expect(screen.getByText('Exercises completed: 1 of 5')).toBeTruthy();
    expect(screen.getByText('Rhythm accuracy: 0%')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Recent activity' })).getAllByRole('listitem').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'View progress' }));
    expect(calls.onOpenAcademy).toHaveBeenCalledTimes(1);
  });

  it('points at the next virtual patient and handles the "all done" and "none available" states', async () => {
    const user = userEvent.setup();
    const calls = show(populatedSummary());
    expect(screen.getByText('0 of 6 fictional cases completed.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Open the cases' }));
    expect(calls.onOpenPatients).toHaveBeenCalledTimes(1);
    cleanup();

    let done = emptyExerciseProgress();
    for (const definition of exerciseRegistry) done = recordCheckResult(recordReading(done, definition, reading), definition, true);
    show(buildHomeSummary({ academy: emptyAcademyProgress(), exerciseProgress: done, savedExperiments: [] }));
    expect(screen.getByText(/You have completed every guided exercise/)).toBeTruthy();
    expect(within(screen.getByRole('heading', { name: 'Continue learning' }).closest('section') as HTMLElement).getByRole('button', { name: 'Begin a Rhythm Challenge' })).toBeTruthy();
  });
});
