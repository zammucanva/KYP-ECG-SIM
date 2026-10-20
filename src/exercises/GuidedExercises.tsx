import { useMemo, useRef, useState } from 'react';
import type { ManualMeasurementSet } from '../engine/measurement-sets';
import type { MachineConfig } from '../engine/types';
import { exerciseRegistry, type ExerciseDefinition } from './definitions';
import { evaluateExercise, type ExerciseEvaluation } from './evaluate';
import {
  entryFor,
  readExerciseProgress,
  recordCheckResult,
  recordReading,
  resetExercise,
  retryExercise,
  writeExerciseProgress,
  type ExerciseProgress,
} from './progress';
import type { ProgressStorage } from '../learn/progress';

type GuidedExercisesProps = {
  config: MachineConfig;
  measurement: ManualMeasurementSet | undefined;
  /** Injectable for tests; defaults to this browser's local storage. */
  storage?: ProgressStorage | null;
};

function localStorageOrNull(): ProgressStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function GuidedExercises({ config, measurement, storage }: GuidedExercisesProps) {
  const storageRef = useRef<ProgressStorage | null>(storage === undefined ? localStorageOrNull() : storage);
  const initial = useMemo(() => (storageRef.current ? readExerciseProgress(storageRef.current) : { progress: { version: 1 as const, exercises: {} } }), []);
  const [progress, setProgress] = useState<ExerciseProgress>(initial.progress);
  const [selectedId, setSelectedId] = useState<string>(exerciseRegistry[0].id);
  const [widthText, setWidthText] = useState('');
  const [status, setStatus] = useState(initial.notice ?? '');
  const [evaluation, setEvaluation] = useState<ExerciseEvaluation | null>(null);

  const definition: ExerciseDefinition = exerciseRegistry.find(item => item.id === selectedId) ?? exerciseRegistry[0];
  const entry = entryFor(progress, definition);
  const needsWidth = definition.kind === 'paper-speed-grid';
  const stepIndex = Math.min(entry.readings.length, definition.steps.length - 1);

  const commit = (next: ExerciseProgress, message: string) => {
    setProgress(next);
    const storageHandle = storageRef.current;
    const saved = storageHandle ? writeExerciseProgress(storageHandle, next) : false;
    setStatus(saved ? message : `${message} Progress could not be saved in this browser.`);
  };

  const select = (id: string) => {
    setSelectedId(id);
    setEvaluation(null);
    setWidthText('');
    setStatus('');
  };

  const record = () => {
    if (!measurement) {
      setStatus('Select a measurement set before recording a reading.');
      return;
    }
    const answerMm = needsWidth && widthText.trim() !== '' ? Number(widthText) : undefined;
    if (needsWidth && (answerMm === undefined || !Number.isFinite(answerMm) || answerMm < 0)) {
      setStatus('Enter the interval width in millimetres (a non-negative number) before recording.');
      return;
    }
    try {
      const next = recordReading(progress, definition, {
        lead: config.lead,
        paperSpeed: config.paperSpeed,
        gain: config.gain,
        preset: config.preset,
        startMs: measurement.startMs,
        endMs: measurement.endMs,
        ...(answerMm === undefined ? {} : { answerMm }),
      });
      setEvaluation(null);
      commit(next, `Reading ${Math.min(entry.readings.length + 1, definition.requiredReadings)} of ${definition.requiredReadings} recorded.`);
    } catch {
      setStatus('That reading is not valid and was not recorded.');
    }
  };

  const check = () => {
    const result = evaluateExercise(definition, entry.readings);
    setEvaluation(result);
    commit(recordCheckResult(progress, definition, result.passed), result.passed ? 'Passed. Every check below is met.' : 'Not yet. See the checks below, then retry.');
  };

  const retry = () => {
    setEvaluation(null);
    setWidthText('');
    commit(retryExercise(progress, definition), 'Readings cleared. Record new readings to try again.');
  };

  const reset = () => {
    setEvaluation(null);
    setWidthText('');
    commit(resetExercise(progress, definition), 'Exercise reset, including attempts and completion.');
  };

  return (
    <details className="guided-exercises">
      <summary>Guided exercises <small>draft · unreviewed · synthetic signal</small></summary>
      <p>Short practice tasks that use the markers and controls above. Checks compare your marker times with the simulator’s own event times; they are not clinical interpretation. These exercises are drafts and have not been reviewed.</p>
      <div className="exercise-picker" role="group" aria-label="Choose an exercise">
        {exerciseRegistry.map(item => {
          const itemEntry = entryFor(progress, item);
          return (
            <button type="button" key={item.id} className="measurement-set-select" aria-pressed={item.id === definition.id} onClick={() => select(item.id)}>
              {item.title}{itemEntry.passed ? ' — completed' : ''}
            </button>
          );
        })}
      </div>

      <section className="exercise-detail" aria-labelledby="exercise-title">
        <h3 id="exercise-title">{definition.title}</h3>
        <p>{definition.objective}</p>
        <p className="exercise-progress">Step {stepIndex + 1} of {definition.steps.length} · Readings {entry.readings.length} of {definition.requiredReadings} · Attempts {entry.attempts}{entry.passed ? ' · Completed' : ''}</p>
        <ol className="exercise-steps" aria-label="Exercise steps">
          {definition.steps.map((step, index) => (
            <li key={step.id} aria-current={index === stepIndex ? 'step' : undefined}>{step.instruction}</li>
          ))}
        </ol>
        <p className="exercise-principle"><strong>Principle:</strong> {definition.principle}</p>
        <p className="exercise-current" aria-label="Current settings">
          Now: lead {config.lead} · {config.paperSpeed} mm/s · {config.gain} mm/mV · {config.preset} ·
          {measurement ? ` ${measurement.name}: Start ${measurement.startMs.toFixed(0)} ms, End ${measurement.endMs.toFixed(0)} ms` : ' no measurement selected'}
        </p>
        {needsWidth && (
          <label className="exercise-width">Interval width on paper (mm)
            <input type="number" min="0" step="0.5" value={widthText} onChange={event => setWidthText(event.target.value)} />
          </label>
        )}
        <div className="exercise-actions">
          <button type="button" className="add-measurement" onClick={record}>Record reading</button>
          <button type="button" className="add-measurement" onClick={check} disabled={entry.readings.length === 0}>Check answer</button>
          <button type="button" className="measurement-set-select" onClick={retry}>Retry</button>
          <button type="button" className="delete-measurement" onClick={reset}>Reset exercise</button>
        </div>
        {entry.readings.length > 0 && (
          <ol className="exercise-readings" aria-label="Recorded readings">
            {entry.readings.map((reading, index) => (
              <li key={index}>Reading {index + 1}: lead {reading.lead}, {reading.paperSpeed} mm/s, {reading.gain} mm/mV, Start {reading.startMs.toFixed(0)} ms, End {reading.endMs.toFixed(0)} ms{reading.answerMm === undefined ? '' : `, width ${reading.answerMm} mm`}</li>
            ))}
          </ol>
        )}
        <p className="experiment-storage-status exercise-status" role="status" aria-live="polite">{status}</p>
        {evaluation && (
          <ul className="exercise-checks" aria-label="Check results">
            {evaluation.checks.map(item => (
              <li key={item.id}><strong>{item.passed ? 'Pass' : 'Not yet'}:</strong> {item.message}</li>
            ))}
          </ul>
        )}
      </section>
    </details>
  );
}
