import { useEffect, useMemo, useRef, useState } from 'react';
import { achievementDefinitions, type ApplyResult, type ScenarioOutcome } from '../academy/progress';
import { answerOptions, buildCase, distractorRationale, evaluateAnswer, explanationFor, getRhythmCase, type AnswerEvaluation, type AnswerId } from '../rhythm/cases';
import { RhythmStrip } from '../rhythm/RhythmStrip';
import { STRIP_DURATION_MS } from '../rhythm/rhythms';
import { alarmLabels, type AlarmId, type AlarmLogEntry } from './alarms';
import { BedsideMonitor, formatSimTime } from './BedsideMonitor';
import { monitorScenarios, type MonitorScenario as Scenario } from './scenario';
import { useMonitorRuntime, type MonitorRuntimeOptions } from './useMonitorRuntime';
import { NIBP_FIRST_MS } from './vitals';

type MonitorScenarioProps = {
  /** Completed scenario ids with the version completed, from the Academy. */
  completed: Record<string, string>;
  onCompleted: (scenario: Scenario, outcome: ScenarioOutcome) => ApplyResult;
  onOpenAcademy: () => void;
  onOpenChallenge: () => void;
  registry?: readonly Scenario[];
  runtimeOptions?: MonitorRuntimeOptions;
};

const technicalAlarms = new Set<AlarmId>(['ecg-lead-off', 'spo2-sensor-off', 'spo2-poor-signal']);
const alarmDistractors: AlarmId[] = ['hr-low', 'spo2-low', 'rr-high', 'sys-low', 'hr-high'];
const NO_ALARM = 'none';
/** Questions open this long after the assessed change even if no alarm was raised. */
const QUESTION_DELAY_MS = 20_000;

const hrSourceOptions = [
  { id: 'ecg', label: 'The ECG: intervals between QRS complexes' },
  { id: 'pleth', label: 'The pulse oximeter: intervals between pulses' },
  { id: 'nibp', label: 'The blood-pressure cuff' },
  { id: 'resp', label: 'The respiration channel' },
] as const;
type HrSourceId = (typeof hrSourceOptions)[number]['id'];

/** The first physiological alarm raised during or after the assessed phase: the answer key comes from the simulation itself. */
export function firstAlarmAfter(log: readonly AlarmLogEntry[], fromMs: number): AlarmId | null {
  return log.find(entry => entry.event === 'onset' && entry.atMs >= fromMs && !technicalAlarms.has(entry.id))?.id ?? null;
}

export function alarmChoices(actual: AlarmId | null): { id: string; label: string }[] {
  const ids = [...new Set([...(actual ? [actual] : []), ...alarmDistractors])].slice(0, 4);
  const ordered = ids.sort((a, b) => alarmDistractors.indexOf(a as AlarmId) - alarmDistractors.indexOf(b as AlarmId));
  return [...ordered.map(id => ({ id, label: alarmLabels[id as AlarmId] })), { id: NO_ALARM, label: 'No alarm was raised' }];
}

type Answers = { alarm: string; rhythm: AnswerId | ''; hrSource: HrSourceId | ''; rate: string };
type Result = { evaluation: AnswerEvaluation; alarmCorrect: boolean; actualAlarm: AlarmId | null; hrSourceCorrect: boolean; answers: Answers; answeredAtMs: number; recordedEndMs: number; log: AlarmLogEntry[] };

function ScenarioRun({ scenario, completed, onCompleted, onOpenAcademy, onOpenChallenge, onBack, runtimeOptions }: Omit<MonitorScenarioProps, 'registry'> & { scenario: Scenario; onBack: () => void }) {
  const runtime = useMonitorRuntime(scenario, runtimeOptions);
  const { timeline, snapshot, alarms } = runtime;
  const [step, setStep] = useState<'brief' | 'monitor' | 'debrief'>('brief');
  const [recordedEndMs, setRecordedEndMs] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>({ alarm: '', rhythm: '', hrSource: '', rate: '' });
  const [result, setResult] = useState<Result | null>(null);
  const [rewards, setRewards] = useState<ApplyResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const credited = useRef(false);

  const assessedPhase = scenario.phases.find(phase => phase.id === scenario.assessedPhaseId)!;
  const rhythm = getRhythmCase(assessedPhase.rhythmCaseId)!;
  const options = useMemo(() => answerOptions(rhythm), [rhythm]);
  const firstAlarm = firstAlarmAfter(alarms.log, assessedPhase.startMs);
  const questionsOpen = firstAlarm !== null || snapshot.elapsedMs >= assessedPhase.startMs + QUESTION_DELAY_MS;
  const choices = useMemo(() => alarmChoices(firstAlarm), [firstAlarm]);
  const done = completed[scenario.id] === scenario.version;

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const replay = () => {
    runtime.reset();
    setRecordedEndMs(null);
    setAnswers({ alarm: '', rhythm: '', hrSource: '', rate: '' });
    setResult(null);
    setRewards(null);
    setStep('monitor');
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answers.alarm || !answers.rhythm || !answers.hrSource || recordedEndMs === null || result) return;
    runtime.pause();
    const rate = answers.rate.trim();
    const evaluation = evaluateAnswer(rhythm, answers.rhythm, rate === '' ? undefined : Number(rate));
    const alarmCorrect = (firstAlarm ?? NO_ALARM) === answers.alarm;
    const next: Result = { evaluation, alarmCorrect, actualAlarm: firstAlarm, hrSourceCorrect: answers.hrSource === 'ecg', answers, answeredAtMs: snapshot.elapsedMs, recordedEndMs, log: alarms.log };
    setResult(next);
    if (!credited.current) {
      credited.current = true;
      const awarded = onCompleted(scenario, { rhythm: evaluation, alarmCorrect });
      if (!awarded.alreadyApplied) setRewards(awarded);
    }
    setStep('debrief');
  };

  const fromLabel = buildCase(getRhythmCase(scenario.phases[0].rhythmCaseId)!).category.label;
  const toLabel = buildCase(rhythm).category.label;
  const recordingCoversChange = recordedEndMs !== null && recordedEndMs - STRIP_DURATION_MS >= assessedPhase.startMs;

  return (
    <section className="patients scenario" aria-labelledby="scenario-title">
      <p className="eyebrow">MONITORED SCENARIO</p>
      <h2 id="scenario-title">{scenario.title}</h2>
      <p className="patient-banner" role="note">Fictional patient · generated monitor data · draft teaching material awaiting review · not a clinical tool</p>

      {step === 'brief' && (
        <div className="patient-panel">
          <h3 ref={headingRef} tabIndex={-1}>The situation</h3>
          <p><strong>Age range:</strong> {scenario.ageRange}</p>
          <p>{scenario.presentation}</p>
          <div className="patient-columns">
            <div><h4>Symptoms</h4><ul>{scenario.symptoms.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div><h4>Relevant history</h4><ul>{scenario.history.map(item => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <h4>Your task</h4>
          <p>Start the monitor and watch it. When something changes, record a 6-second strip, then answer three questions: which alarm was raised, what the rhythm is now, and where the heart-rate number comes from. You can pause at any time.</p>
          <p className="challenge-note">Sound is optional and stays off until you turn it on. Every alarm is also shown on screen.</p>
          <div className="challenge-actions">
            <button type="button" className="cta secondary" onClick={onBack}>Back to scenarios</button>
            <button type="button" className="cta" onClick={() => setStep('monitor')}>Go to the bedside monitor</button>
          </div>
        </div>
      )}

      {step === 'monitor' && (
        <>
          <h3 ref={headingRef} tabIndex={-1} className="visually-hidden">Bedside monitor</h3>
          <BedsideMonitor
            timeline={timeline} snapshot={snapshot} alarms={alarms} reducedMotion={runtime.reducedMotion}
            onPlay={runtime.play} onPause={runtime.pause} onReset={() => { runtime.reset(); setRecordedEndMs(null); }} onAcknowledge={runtime.acknowledge}
            onRecordStrip={endMs => setRecordedEndMs(endMs)} audio={runtime.audio}
          />
          <form className="patient-panel challenge-form scenario-questions" onSubmit={submit} aria-labelledby="scenario-questions-heading">
            <h3 id="scenario-questions-heading">Checkpoint</h3>
            {!questionsOpen ? (
              <p className="challenge-note">Watch the monitor. The questions open once the monitor shows a change.</p>
            ) : (
              <>
                <p className="challenge-note" role="status">The monitor has changed. Pause when you are ready, record a strip, then answer.</p>
                <fieldset>
                  <legend>1. Which alarm did the monitor raise?</legend>
                  {choices.map(option => (
                    <label key={option.id} className={answers.alarm === option.id ? 'answer-option selected' : 'answer-option'}>
                      <input type="radio" name="scenario-alarm" value={option.id} checked={answers.alarm === option.id} onChange={() => setAnswers(current => ({ ...current, alarm: option.id }))} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>2. Which rhythm is the monitor showing now?</legend>
                  {recordedEndMs === null ? <p className="challenge-note">Use “Record 6-second strip” on the monitor to capture the current rhythm first.</p> : (
                    <>
                      <p className="challenge-note">Strip recorded from {formatSimTime(recordedEndMs - STRIP_DURATION_MS)} to {formatSimTime(recordedEndMs)}.{!recordingCoversChange && ' Part of this strip is from before the change; you can record again.'}</p>
                      <RhythmStrip recording={{ schedule: timeline.schedule, startMs: recordedEndMs - STRIP_DURATION_MS }} />
                      {options.map(option => (
                        <label key={option.id} className={answers.rhythm === option.id ? 'answer-option selected' : 'answer-option'}>
                          <input type="radio" name="scenario-rhythm" value={option.id} checked={answers.rhythm === option.id} onChange={() => setAnswers(current => ({ ...current, rhythm: option.id }))} />
                          <span>{option.label}</span>
                        </label>
                      ))}
                      <label className="challenge-rate">Rate from your strip (beats per minute, optional)
                        <input type="number" inputMode="numeric" min="1" max="400" step="1" value={answers.rate} onChange={event => setAnswers(current => ({ ...current, rate: event.target.value }))} />
                      </label>
                    </>
                  )}
                </fieldset>
                <fieldset>
                  <legend>3. On this monitor, where does the HR number come from?</legend>
                  {hrSourceOptions.map(option => (
                    <label key={option.id} className={answers.hrSource === option.id ? 'answer-option selected' : 'answer-option'}>
                      <input type="radio" name="scenario-hr-source" value={option.id} checked={answers.hrSource === option.id} onChange={() => setAnswers(current => ({ ...current, hrSource: option.id }))} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="challenge-actions">
                  <button type="submit" className="cta" disabled={!answers.alarm || !answers.rhythm || !answers.hrSource || recordedEndMs === null}>Submit answers and see the debrief</button>
                </div>
              </>
            )}
          </form>
        </>
      )}

      {step === 'debrief' && result && (
        <div className="patient-panel scenario-debrief">
          <h3 ref={headingRef} tabIndex={-1}>Debrief</h3>
          <ul className="scenario-results" aria-label="Your answers">
            <li className={result.alarmCorrect ? 'correct' : 'incorrect'}>
              <strong>{result.alarmCorrect ? '✔ Alarm: correct.' : '✖ Alarm: not quite.'}</strong>{' '}
              {(() => {
                const onset = result.log.find(entry => entry.event === 'onset' && entry.id === result.actualAlarm);
                return onset
                  ? `The simulation raised “${alarmLabels[onset.id]}” at ${formatSimTime(onset.atMs)}: ${onset.message}. The limit is this scenario's simulation setting, not a rule for real patients.`
                  : 'No physiological alarm was raised before you answered.';
              })()}
            </li>
            <li className={result.evaluation.rhythmCorrect ? 'correct' : 'incorrect'}>
              <strong>{result.evaluation.rhythmCorrect ? '✔ Rhythm: correct.' : '✖ Rhythm: not quite.'}</strong> {result.evaluation.feedback}
              <p>{explanationFor(rhythm)}</p>
              {result.answers.rate.trim() !== '' && <p><strong>Rate:</strong> {result.evaluation.rateFeedback}</p>}
            </li>
            <li className={result.hrSourceCorrect ? 'correct' : 'incorrect'}>
              <strong>{result.hrSourceCorrect ? '✔ Heart-rate source: correct.' : '✖ Heart-rate source: not quite.'}</strong>{' '}
              On this monitor HR is counted from the ECG's QRS complexes. PR, shown under SpO₂, is counted separately from the pulse-oximeter pulses. The two usually agree; when they differ, that difference is itself information to look at.
            </li>
          </ul>
          <h4>What happened on the timeline</h4>
          <ol className="scenario-timeline">
            <li>{formatSimTime(0)}: monitoring started ({fromLabel}). First cuff measurement at {formatSimTime(NIBP_FIRST_MS)}, then every {scenario.nibpIntervalMs / 1000} s.</li>
            <li>{formatSimTime(assessedPhase.startMs)}: the rhythm changed to {toLabel}.</li>
            {result.log.filter(entry => entry.event !== 'cleared' || entry.atMs <= result.answeredAtMs).map((entry, index) => (
              <li key={`${entry.id}-${entry.event}-${index}`}>{formatSimTime(entry.atMs)}: alarm {entry.event === 'onset' ? 'raised' : entry.event}: {alarmLabels[entry.id]}</li>
            ))}
            <li>{formatSimTime(result.recordedEndMs)}: you recorded a strip.</li>
            <li>{formatSimTime(result.answeredAtMs)}: you answered.</li>
          </ol>
          <details>
            <summary>Why the other rhythm options do not fit</summary>
            <ul>{options.filter(option => option.id !== rhythm.categoryId).map(option => <li key={option.id}><strong>{option.label}:</strong> {distractorRationale(rhythm, option.id)}</li>)}</ul>
          </details>
          <h4>What this scenario practised</h4>
          <ul>{scenario.learningObjectives.map(item => <li key={item}>{item}</li>)}</ul>
          <h4>Keep in mind</h4>
          <ul>{scenario.caveats.map(item => <li key={item}>{item}</li>)}</ul>
          <p className="challenge-note"><strong>Next steps in a real situation</strong> are deliberately not given: that guidance has not been written or reviewed. This simulator does not advise on real patients.</p>
          {rewards ? (
            <>
              <p className="challenge-banner" role="status">+{rewards.xpGained} XP for this scenario.</p>
              {rewards.achievements.length > 0 && (
                <ul className="challenge-unlocks" aria-label="Achievements unlocked">
                  {rewards.achievements.map(id => <li key={id}>Unlocked: {achievementDefinitions.find(item => item.id === id)?.title ?? id}</li>)}
                </ul>
              )}
            </>
          ) : <p className="challenge-note">{done ? 'No additional XP: this scenario was already completed.' : 'No XP was recorded for this attempt.'}</p>}
          <div className="challenge-actions">
            <button type="button" className="cta" onClick={replay}>Replay the scenario</button>
            <button type="button" className="cta secondary" onClick={onBack}>Back to scenarios</button>
            <button type="button" className="cta secondary" onClick={onOpenChallenge}>Practise rhythms in the Rhythm Challenge</button>
            <button type="button" className="cta secondary" onClick={onOpenAcademy}>View Academy</button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Scenario list plus the selected scenario run. */
export function MonitorScenarios({ completed, onCompleted, onOpenAcademy, onOpenChallenge, registry = monitorScenarios, runtimeOptions }: MonitorScenarioProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = registry.find(item => item.id === selectedId) ?? null;

  if (selected) {
    return <ScenarioRun key={selected.id} scenario={selected} completed={completed} onCompleted={onCompleted} onOpenAcademy={onOpenAcademy} onOpenChallenge={onOpenChallenge} onBack={() => setSelectedId(null)} runtimeOptions={runtimeOptions} />;
  }
  return (
    <section className="patients" aria-labelledby="scenarios-heading">
      <p className="eyebrow">BEDSIDE MONITOR</p>
      <h2 id="scenarios-heading">Monitored scenarios</h2>
      <p className="lede">A fictional patient on a simulated bedside monitor. The ECG, pulse oximeter, blood-pressure cuff, respiration and temperature are separate simulated channels on one shared timeline, with optional monitor sound. Watch for a change, record a strip and explain what you see. Generated teaching data, draft and awaiting review; not a clinical tool.</p>
      <ul className="patient-list" aria-label="Monitored scenarios">
        {registry.map(item => {
          const isDone = completed[item.id] === item.version;
          return (
            <li key={item.id} className="patient-card">
              <div>
                <strong>{item.title}</strong>
                <span>{item.ageRange} · {formatSimTime(item.durationMs)} simulated</span>
                <small>{isDone ? 'Completed' : 'Not started'}</small>
              </div>
              <button type="button" className="cta secondary" onClick={() => setSelectedId(item.id)} aria-label={`${isDone ? 'Replay' : 'Start'} scenario: ${item.title}`}>{isDone ? 'Replay scenario' : 'Start scenario'}</button>
            </li>
          );
        })}
      </ul>
      {registry.length === 0 && <p className="challenge-note">No scenarios are available.</p>}
    </section>
  );
}
