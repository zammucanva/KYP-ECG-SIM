import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AcademyDashboard } from '../academy/AcademyDashboard';
import { emptyAcademyProgress, type AcademyProgress, type ApplyResult } from '../academy/progress';
import { RhythmChallenge } from './RhythmChallenge';
import type { SessionState } from './session';

afterEach(cleanup);

const rewards = (overrides: Partial<ApplyResult> = {}): ApplyResult => ({ progress: emptyAcademyProgress(), xpGained: 25, achievements: ['first-correct-rhythm'], alreadyApplied: false, ...overrides });

function setup(props: Partial<Parameters<typeof RhythmChallenge>[0]> = {}) {
  const ended: SessionState[] = [];
  const onSessionEnded = vi.fn((state: SessionState) => { ended.push(state); return rewards(); });
  const onOpenAcademy = vi.fn();
  const view = render(<RhythmChallenge active missedCaseIds={[]} onSessionEnded={onSessionEnded} onOpenAcademy={onOpenAcademy} timedBestScore={0} {...props} />);
  return { ...view, ended, onSessionEnded, onOpenAcademy };
}

async function startNsr(user: ReturnType<typeof userEvent.setup>, mode: 'Learn' | 'Practice' | 'Timed challenge' = 'Learn') {
  await user.click(screen.getByRole('radio', { name: new RegExp(`^${mode}`) }));
  await user.selectOptions(screen.getByLabelText('Category'), 'nsr');
  await user.click(screen.getByRole('button', { name: /^Start/ }));
}
const answer = (user: ReturnType<typeof userEvent.setup>, label: string) => user.click(screen.getByRole('radio', { name: label }));

describe('Rhythm Challenge', () => {
  it('shows the three modes with an untimed alternative and the educational disclaimer', () => {
    setup();
    expect(screen.getAllByRole('radio', { name: /Learn|Practice|Timed challenge/ })).toHaveLength(3);
    expect(screen.getByText(/Use Learn or Practice for an untimed alternative/)).toBeTruthy();
    expect(screen.getByText(/not a monitoring or diagnostic tool/)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Review missed strips \(0\)/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('runs a Learn session from the strip to scored results and reports the finished session once', async () => {
    const user = userEvent.setup();
    const { ended, onSessionEnded } = setup();
    await startNsr(user);

    expect(screen.getByRole('heading', { name: 'Question 1 of 2' })).toBeTruthy();
    const strip = screen.getByRole('img', { name: /Six-second synthetic ECG strip, lead II, 25 millimetres per second/ });
    expect(strip.getAttribute('aria-label')).not.toMatch(/normal sinus/i);
    expect(screen.getByRole('radio', { name: 'Cannot be determined from this strip' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Submit answer' }) as HTMLButtonElement).disabled).toBe(true);

    await answer(user, 'Normal sinus rhythm');
    await user.type(screen.getByLabelText(/Heart-rate estimate/), '80');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(screen.queryByRole('button', { name: 'Submit answer' })).toBeNull();
    const feedback = screen.getAllByRole('status').find(node => node.textContent?.includes('Correct'));
    expect(feedback?.textContent).toMatch(/Within range: 80 per minute/);
    expect(feedback?.textContent).toMatch(/Explanation:/);

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    expect(screen.getByRole('heading', { name: 'Question 2 of 2' })).toBeTruthy();
    expect((screen.getByLabelText(/Heart-rate estimate/) as HTMLInputElement).value).toBe('');
    await answer(user, 'Normal sinus rhythm');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(onSessionEnded).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'See results' }));

    expect(screen.getByRole('heading', { name: 'Session complete' })).toBeTruthy();
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
    expect(ended[0].answers.every(item => item?.firstEvaluation.rhythmCorrect)).toBe(true);
    expect(screen.getByText('+25')).toBeTruthy();
    expect(screen.getByText('Unlocked: First rhythm identified')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('gives hints without naming the answer, and prevents a second submission after answering', async () => {
    const user = userEvent.setup();
    setup();
    await startNsr(user, 'Practice');
    await user.click(screen.getByRole('button', { name: 'Show hint (0/3)' }));
    const hints = within(screen.getByRole('list', { name: 'Hints' }));
    expect(hints.getAllByRole('listitem')).toHaveLength(1);
    expect(hints.getByText(/regular/)).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Hints' }).textContent).not.toMatch(/sinus/i);
    await answer(user, 'Normal sinus rhythm');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(screen.queryByRole('button', { name: 'Submit answer' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Show hint/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try this strip again' })).toBeNull();
  });

  it('offers an unscored retry after a wrong answer in Learn mode only', async () => {
    const user = userEvent.setup();
    const { ended } = setup();
    await startNsr(user);
    await answer(user, 'Cannot be determined from this strip');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(screen.getAllByRole('status').some(node => node.textContent?.includes('Not quite'))).toBe(true);
    expect(screen.getAllByText(/declaring it undeterminable is not the best answer/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Try this strip again' }));
    await answer(user, 'Normal sinus rhythm');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(screen.getByText(/retries are not scored/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await answer(user, 'Normal sinus rhythm');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    await user.click(screen.getByRole('button', { name: 'See results' }));
    expect(ended).toHaveLength(1);
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText(/you answered: Cannot be determined/)).toBeTruthy();
  });

  it('runs a timed session with a countdown and a pause that hides the strip, and has no hints', async () => {
    const user = userEvent.setup();
    setup();
    await startNsr(user, 'Timed challenge');
    expect(screen.getByRole('timer').textContent).toBe('2:00');
    expect(screen.queryByRole('button', { name: /Show hint/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.queryByRole('img', { name: /Six-second synthetic ECG strip/ })).toBeNull();
    expect(screen.getByText(/Paused/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('img', { name: /Six-second synthetic ECG strip/ })).toBeTruthy();
  });

  it('pauses a timed session by itself when another section is shown', async () => {
    const user = userEvent.setup();
    const { rerender, onSessionEnded, onOpenAcademy } = setup();
    await startNsr(user, 'Timed challenge');
    rerender(<RhythmChallenge active={false} missedCaseIds={[]} onSessionEnded={onSessionEnded} onOpenAcademy={onOpenAcademy} timedBestScore={0} />);
    rerender(<RhythmChallenge active missedCaseIds={[]} onSessionEnded={onSessionEnded} onOpenAcademy={onOpenAcademy} timedBestScore={0} />);
    expect(screen.getByText(/Paused/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
  });

  it('starts a review session from missed strips and refuses an impossible filter', async () => {
    const user = userEvent.setup();
    const { rerender, onSessionEnded, onOpenAcademy } = setup({ missedCaseIds: ['rhythm.svt.01', 'rhythm.vf.02'] });
    const review = screen.getByRole('button', { name: 'Review missed strips (2)' });
    expect((review as HTMLButtonElement).disabled).toBe(false);
    await user.click(review);
    expect(screen.getByRole('heading', { name: 'Question 1 of 2' })).toBeTruthy();
    rerender(<RhythmChallenge active missedCaseIds={['rhythm.svt.01']} onSessionEnded={onSessionEnded} onOpenAcademy={onOpenAcademy} timedBestScore={0} />);
    cleanup();
    setup();
    await user.selectOptions(screen.getByLabelText('Category'), 'vf');
    await user.selectOptions(screen.getByLabelText('Difficulty'), '3');
    await user.click(screen.getByRole('button', { name: /^Start/ }));
    expect(screen.getByRole('alert').textContent).toMatch(/No cases match/);
  });
});

describe('Academy dashboard', () => {
  const baseProps = { notice: undefined, onReset: vi.fn(), onOpenChallenge: vi.fn(), onOpenSimulator: vi.fn() };

  it('explains how progress is earned instead of showing fake numbers when empty', async () => {
    const user = userEvent.setup();
    const onOpenChallenge = vi.fn();
    render(<AcademyDashboard progress={emptyAcademyProgress()} {...baseProps} onOpenChallenge={onOpenChallenge} />);
    expect(screen.getByText(/Nothing recorded yet/)).toBeTruthy();
    expect(screen.queryByText(/Level \d/)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Start a Rhythm Challenge' }));
    expect(onOpenChallenge).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('list', { name: 'Achievements' }).textContent).toMatch(/Locked/);
  });

  it('shows recorded figures only and confirms before resetting', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const progress: AcademyProgress = {
      ...emptyAcademyProgress(),
      awards: { 'exercise:rr-interval-measurement@0.1.0': { xp: 25, label: 'Completed exercise: Measure an R–R interval', at: '2026-10-21T10:00:00.000Z' } },
      exercises: { 'rr-interval-measurement': '0.1.0' },
      achievements: { 'first-exercise': { at: '2026-10-21T10:00:00.000Z' } },
      recent: [{ label: 'Completed exercise: Measure an R–R interval', xp: 25, at: '2026-10-21T10:00:00.000Z' }],
    };
    render(<AcademyDashboard progress={progress} {...baseProps} onReset={onReset} />);
    expect(screen.getByText('Level 1')).toBeTruthy();
    expect(screen.getByText(/25 XP · 25 of 50 toward level 2/)).toBeTruthy();
    expect(screen.getAllByText('No attempts yet')).toHaveLength(2);
    expect(screen.getByText(/\+25 XP · Completed exercise/)).toBeTruthy();
    expect(screen.getByText(/First exercise/).closest('li')?.textContent).toMatch(/Earned/);

    await user.click(screen.getByRole('button', { name: 'Reset Academy progress' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onReset).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Reset Academy progress' }));
    await user.click(screen.getByRole('button', { name: 'Reset now' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
