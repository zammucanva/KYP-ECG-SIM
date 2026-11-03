import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { emptyAcademyProgress, type ApplyResult } from '../academy/progress';
import { patientCases, type PatientCase } from './cases';
import { VirtualPatient } from './VirtualPatient';

afterEach(cleanup);

const awarded = (overrides: Partial<ApplyResult> = {}): ApplyResult => ({ progress: emptyAcademyProgress(), xpGained: 40, achievements: ['first-case-study'], alreadyApplied: false, ...overrides });

function setup(props: Partial<Parameters<typeof VirtualPatient>[0]> = {}) {
  const onCompleted = vi.fn(() => awarded());
  const onOpenAcademy = vi.fn();
  const onOpenChallenge = vi.fn();
  render(<VirtualPatient completed={{}} onCompleted={onCompleted} onOpenAcademy={onOpenAcademy} onOpenChallenge={onOpenChallenge} {...props} />);
  return { onCompleted, onOpenAcademy, onOpenChallenge };
}

async function toInterpretation(user: ReturnType<typeof userEvent.setup>, rate?: string) {
  await user.click(screen.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }));
  await user.click(screen.getByRole('button', { name: 'Next: inspect the ECG' }));
  if (rate) await user.type(screen.getByLabelText(/Heart-rate estimate/), rate);
  await user.click(screen.getByRole('button', { name: 'Next: interpret' }));
}

describe('Virtual Patient', () => {
  it('lists every case as fictional learning material with its completion state', () => {
    setup({ completed: { [patientCases[1].id]: patientCases[1].version } });
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(patientCases.length);
    expect(screen.getByText(/fictional patient with simulated observations/)).toBeTruthy();
    expect(screen.getByText(/not a clinical tool/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Review case: An irregular heartbeat/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start case: Awareness of the heartbeat/ })).toBeTruthy();
    expect(screen.getAllByText('Completed')).toHaveLength(1);
  });

  it('walks the four steps in order and withholds the heart rate until after answering', async () => {
    const user = userEvent.setup();
    const { onCompleted } = setup();
    await user.click(screen.getByRole('button', { name: /Start case: Awareness of the heartbeat/ }));

    expect(screen.getByRole('note').textContent).toMatch(/Fictional patient · simulated observations/);
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain('Presentation');
    expect(screen.getByText('Measure it from the ECG on the next step')).toBeTruthy();
    expect(screen.queryByText(/about 72 per minute/)).toBeNull();
    expect(document.activeElement?.textContent).toBe('The story');

    await user.click(screen.getByRole('button', { name: 'Next: inspect the ECG' }));
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain('ECG and rate');
    expect(screen.getByRole('img', { name: /Six-second synthetic ECG strip, lead II/ }).getAttribute('aria-label')).not.toMatch(/sinus/i);
    await user.click(screen.getByRole('button', { name: 'V1' }));
    expect(screen.getByRole('img', { name: /lead V1/ })).toBeTruthy();
    await user.type(screen.getByLabelText(/Heart-rate estimate/), '72');

    await user.click(screen.getByRole('button', { name: 'Next: interpret' }));
    expect(screen.getByText(/Your rate estimate: 72 per minute/)).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Cannot be determined from this strip' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Submit interpretation' }) as HTMLButtonElement).disabled).toBe(true);
    expect(onCompleted).not.toHaveBeenCalled();

    await user.click(screen.getByRole('radio', { name: 'Normal sinus rhythm' }));
    await user.click(screen.getByRole('button', { name: 'Submit interpretation' }));
    expect(onCompleted).toHaveBeenCalledTimes(1);
    const [patient, evaluation] = onCompleted.mock.calls[0] as unknown as [PatientCase, { rhythmCorrect: boolean; rateStatus: string }];
    expect(patient.id).toBe(patientCases[0].id);
    expect(evaluation).toMatchObject({ rhythmCorrect: true, rateStatus: 'correct' });

    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain('Debrief');
    expect(screen.getByText(/heart rate about 72 per minute, measured from this strip/)).toBeTruthy();
    expect(screen.getByText(/Within range: 72 per minute/)).toBeTruthy();
    expect(screen.getByText('+40 XP for this case study.')).toBeTruthy();
    expect(screen.getByText(/Unlocked: First case study/)).toBeTruthy();
    expect(screen.getByText(/has not been written or reviewed yet, so none is given/)).toBeTruthy();
    expect(screen.getByText(/Estimate the heart rate from a six-second strip/)).toBeTruthy();
    expect(document.activeElement?.textContent).toContain('Correct');
  });

  it('shows what went wrong without leaving the case unfinished, and reports completion only once', async () => {
    const user = userEvent.setup();
    const { onCompleted } = setup();
    await toInterpretation(user);
    await user.click(screen.getByRole('radio', { name: 'Cannot be determined from this strip' }));
    await user.click(screen.getByRole('button', { name: 'Submit interpretation' }));
    expect(screen.getByRole('heading', { name: /Not quite/ })).toBeTruthy();
    expect(screen.getByText(/The best answer is Normal sinus rhythm/)).toBeTruthy();
    expect(screen.getByText(/Expected about 72 per minute/)).toBeTruthy();
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Submit interpretation' })).toBeNull();
  });

  it('says so when a completed case earns nothing more, and offers next steps', async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn(() => awarded({ xpGained: 0, achievements: [], alreadyApplied: true }));
    const { onOpenAcademy, onOpenChallenge } = setup({ onCompleted, completed: { [patientCases[0].id]: patientCases[0].version } });
    await user.click(screen.getByRole('button', { name: /Review case: Awareness of the heartbeat/ }));
    await user.click(screen.getByRole('button', { name: 'Next: inspect the ECG' }));
    await user.click(screen.getByRole('button', { name: 'Next: interpret' }));
    await user.click(screen.getByRole('radio', { name: 'Normal sinus rhythm' }));
    await user.click(screen.getByRole('button', { name: 'Submit interpretation' }));
    expect(screen.getByText(/No additional XP/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'View Academy' }));
    await user.click(screen.getByRole('button', { name: 'Practise in the Rhythm Challenge' }));
    expect(onOpenAcademy).toHaveBeenCalledTimes(1);
    expect(onOpenChallenge).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /Next case: An irregular heartbeat/ }));
    expect(screen.getByRole('heading', { name: 'An irregular heartbeat for several days' })).toBeTruthy();
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toContain('Presentation');
  });

  it('lets the learner go back through the steps without losing the rate estimate', async () => {
    const user = userEvent.setup();
    setup();
    await toInterpretation(user, '70');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect((screen.getByLabelText(/Heart-rate estimate/) as HTMLInputElement).value).toBe('70');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('The story')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Back to cases' }));
    expect(screen.getByRole('heading', { name: 'Fictional cases, real strips' })).toBeTruthy();
  });

  it('fails safely for an invalid case, a missing ECG and an empty registry', async () => {
    const user = userEvent.setup();
    const published = { ...patientCases[0], publicationStatus: 'published' } as unknown as PatientCase;
    const dangling: PatientCase = { ...patientCases[1], rhythmCaseId: 'rhythm.nsr.99' };
    setup({ registry: [published, dangling] });
    await user.click(screen.getAllByRole('button', { name: /Start case/ })[0]);
    expect(screen.getByRole('alert').textContent).toMatch(/not valid and cannot be shown/);
    await user.click(screen.getByRole('button', { name: 'Back to cases' }));
    await user.click(screen.getAllByRole('button', { name: /Start case/ })[1]);
    expect(screen.getByRole('alert').textContent).toMatch(/ECG for this case is not available/);
    cleanup();
    setup({ registry: [] });
    expect(screen.getByText('No cases are available.')).toBeTruthy();
    expect(within(document.body).queryByRole('button', { name: /Start case/ })).toBeNull();
  });
});
