import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { introductoryKnowledgeChecks, introductoryLessons } from '../content/learn/records';
import type { LessonRecord } from '../content/types';
import { allLeads, generateLeadSignals } from '../engine/signal';
import { Demonstration } from './Demonstrations';
import { LearnMode, KnowledgeCheck, LessonReader } from './LearnMode';
import {
  emptyLearnProgress,
  LEARN_PROGRESS_STORAGE_KEY,
  LEARN_PROGRESS_VERSION,
  learnProgressSchema,
  markLessonComplete,
  markLessonSectionComplete,
  markLessonStarted,
  readLearnProgress,
  recordKnowledgeCheckAttempt,
  writeLearnProgress,
  type LearnProgress,
  type ProgressStorage,
} from './progress';

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

function memoryStorage(initial: string | null = null): ProgressStorage & { value: string | null } {
  return {
    value: initial,
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; },
    removeItem() { this.value = null; },
  };
}

function ReaderHarness({ lesson, next }: { lesson: LessonRecord; next: LessonRecord }) {
  const [progress, setProgress] = useState<LearnProgress>(emptyLearnProgress());
  return <LessonReader
    lesson={lesson}
    next={next}
    questions={introductoryKnowledgeChecks.filter(question => lesson.lessonContent.knowledgeCheckIds.includes(question.id))}
    progress={progress}
    onProgress={action => setProgress(action)}
    onNavigate={vi.fn()}
  />;
}

describe('versioned local Learn progress', () => {
  it('persists a small validated record with lesson and check progress', () => {
    let progress = markLessonStarted(emptyLearnProgress(), 'lesson.one');
    progress = markLessonSectionComplete(progress, 'lesson.one', 'section.one');
    progress = recordKnowledgeCheckAttempt(progress, 'lesson.one', 'question.one', true);
    progress = markLessonComplete(progress, 'lesson.one');
    const storage = memoryStorage();

    expect(writeLearnProgress(storage, progress)).toBe(true);
    expect(storage.value).toContain(`"version":${LEARN_PROGRESS_VERSION}`);
    expect(readLearnProgress(storage).lessons['lesson.one']).toEqual(progress.lessons['lesson.one']);
    expect(learnProgressSchema.safeParse(JSON.parse(storage.value!)).success).toBe(true);
    expect(storage.value).not.toContain('email');
  });

  it('clears corrupt and outdated storage and recovers to an empty versioned state', () => {
    for (const stored of ['{broken', JSON.stringify({ version: 0, lessons: {} })]) {
      const storage = memoryStorage(stored);
      expect(readLearnProgress(storage)).toEqual(emptyLearnProgress());
      expect(storage.value).toBeNull();
    }
  });

  it('does not throw or claim persistence when storage is unavailable', () => {
    const storage: ProgressStorage = {
      getItem: () => { throw new Error('disabled'); },
      setItem: () => { throw new Error('disabled'); },
      removeItem: () => { throw new Error('disabled'); },
    };
    expect(readLearnProgress(storage)).toEqual(emptyLearnProgress());
    expect(writeLearnProgress(storage, emptyLearnProgress())).toBe(false);
  });

  it('rejects impossible progress relationships', () => {
    expect(learnProgressSchema.safeParse({
      version: LEARN_PROGRESS_VERSION,
      lessons: { 'lesson.one': { started: false, completed: true, completedSectionIds: [], knowledgeChecks: {} } },
    }).success).toBe(false);
  });
});

describe('Learn catalog and lesson interaction', () => {
  it('never exposes draft lessons or draft answers in the learner catalog', () => {
    render(<LearnMode />);
    expect(screen.getByRole('heading', { name: 'No lessons are published yet' })).toBeTruthy();
    expect(screen.queryByText(introductoryLessons[0].title)).toBeNull();
    expect(screen.queryByText(introductoryKnowledgeChecks[0].prompt)).toBeNull();
    expect(screen.getByText(/only after source verification, educational review, and publication approval/)).toBeTruthy();
  });

  it('keeps the answer key and explanation hidden until a lesson check is submitted, then supports retry', async () => {
    const user = userEvent.setup();
    const question = introductoryKnowledgeChecks[0];
    const onAttempt = vi.fn();
    render(<KnowledgeCheck question={question} onAttempt={onAttempt} />);

    expect(screen.queryByText(question.explanation)).toBeNull();
    const correctOption = screen.getByRole('radio', { name: question.choices[0].text });
    await user.click(correctOption);
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('status').textContent).toContain('Correct.');
    expect(screen.getByText(question.explanation)).toBeTruthy();
    expect(onAttempt).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByText(question.explanation)).toBeNull();
    expect((correctOption as HTMLInputElement).checked).toBe(false);
  });

  it('renders lesson objectives, navigation, source attribution and a focus-managed title', async () => {
    const user = userEvent.setup();
    const navigation = vi.fn();
    render(<LessonReader
      lesson={introductoryLessons[0]}
      next={introductoryLessons[1]}
      questions={[introductoryKnowledgeChecks[0]]}
      progress={emptyLearnProgress()}
      onProgress={action => action(emptyLearnProgress())}
      onNavigate={navigation}
    />);

    const title = screen.getByRole('heading', { level: 2, name: introductoryLessons[0].title });
    expect(document.activeElement).toBe(title);
    expect(screen.getByRole('navigation', { name: 'Lesson sections' })).toBeTruthy();
    expect(screen.getByText(introductoryLessons[0].learningObjectives[0].statement)).toBeTruthy();
    expect(screen.getByRole('link', { name: introductoryLessons[0].sourceReferences[0].title })).toBeTruthy();
    expect(screen.getByText(/Draft preview · not learner-facing/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Next: Electrodes versus leads/ }));
    expect(navigation).toHaveBeenCalledWith(introductoryLessons[1].id);
  });

  it('requires section completion and a submitted lesson check before recording completion', async () => {
    const user = userEvent.setup();
    render(<ReaderHarness lesson={introductoryLessons[0]} next={introductoryLessons[1]} />);
    const completeLesson = screen.getByRole('button', { name: 'Mark lesson complete' });
    expect((completeLesson as HTMLButtonElement).disabled).toBe(true);

    for (const button of screen.getAllByRole('button', { name: 'Mark section complete' })) await user.click(button);
    await user.click(screen.getByRole('radio', { name: introductoryKnowledgeChecks[0].choices[0].text }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect((screen.getByRole('button', { name: 'Mark lesson complete' }) as HTMLButtonElement).disabled).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Mark lesson complete' }));
    expect(screen.getByRole('button', { name: 'Lesson completed' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('persists and resets progress from the Learn catalog', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LEARN_PROGRESS_STORAGE_KEY, JSON.stringify({
      version: LEARN_PROGRESS_VERSION,
      lessons: { 'not-published.lesson': { started: true, completed: false, completedSectionIds: [], knowledgeChecks: {} } },
    }));
    render(<LearnMode />);
    expect(screen.getByRole('button', { name: 'Reset local progress' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reset local progress' }));
    expect(screen.getByRole('status').textContent).toContain('Local lesson progress reset.');
    expect(window.localStorage.getItem(LEARN_PROGRESS_STORAGE_KEY)).toBe(JSON.stringify(emptyLearnProgress()));
    window.localStorage.clear();
  });
});

describe('shared-engine ECG demonstrations', () => {
  it('renders the twelve limb/precordial traces from one aligned signal set', () => {
    const { container } = render(<Demonstration demonstration={{
      id: 'learn.test.leads', kind: 'limb-lead-relationships', title: 'Lead views', description: 'Shared sample data.', leads: allLeads(),
    }} />);
    expect(container.querySelectorAll('.learn-lead-row')).toHaveLength(12);
    const widths = [...container.querySelectorAll('[data-logical-width-units]')].map(item => item.getAttribute('data-logical-width-units'));
    expect(new Set(widths).size).toBe(1);
    const signals = generateLeadSignals('sinus');
    expect(signals.I.map(sample => sample.timeMs)).toEqual(signals.V6.map(sample => sample.timeMs));
  });

  it('uses shared calibration transforms and does not mutate source signal when display controls change', async () => {
    const user = userEvent.setup();
    const sourceBefore = generateLeadSignals('sinus').V3.map(sample => ({ ...sample }));
    render(<Demonstration demonstration={{
      id: 'learn.test.calibration', kind: 'calibration-explorer', title: 'Calibration', description: 'Shared engine transforms.',
    }} />);
    await user.selectOptions(screen.getByLabelText('Demonstration speed'), '50');
    await user.selectOptions(screen.getByLabelText('Demonstration gain'), '5');
    expect(screen.getByRole('status').textContent).toContain('500 logical mm');
    expect(screen.getByRole('status').textContent).toContain('5 logical mm');
    expect(generateLeadSignals('sinus').V3).toEqual(sourceBefore);
    expect(screen.getByRole('img', { name: /1 millivolt is 5 logical millimetres/ })).toBeTruthy();
  });

  it('calculates RR-derived rate with the shared engine function', async () => {
    const user = userEvent.setup();
    render(<Demonstration demonstration={{
      id: 'learn.test.rr', kind: 'rr-rate', title: 'Rate', description: 'RR relationship.', initialRrMs: 800,
    }} />);
    expect(screen.getByRole('status').textContent).toContain('75.0 bpm');
    await user.clear(screen.getByLabelText('RR interval in milliseconds'));
    await user.type(screen.getByLabelText('RR interval in milliseconds'), '600');
    expect(screen.getByRole('status').textContent).toContain('100.0 bpm');
  });
});
