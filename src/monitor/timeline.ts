import type { QrsEvent, RhythmEvent, RhythmSchedule } from '../engine/rhythm-signal';
import { buildCase, getRhythmCase } from '../rhythm/cases';
import { buildRhythmSchedule } from '../rhythm/rhythms';
import { monitorScenarioSchema, type MonitorScenario, type ScenarioPhase } from './scenario';

/**
 * One scenario timeline: every phase's beat schedule joined on a single simulated clock, plus the
 * event lists the monitor, the audio and the vital-sign channels read. Nothing here is estimated
 * from the rendered picture; the beat times come from the same schedule that draws the ECG.
 */
export type PhaseSpan = { phase: ScenarioPhase; index: number; startMs: number; endMs: number; pulsatile: boolean };

export type ScenarioTimeline = {
  scenario: MonitorScenario;
  /** Composite ECG schedule for the whole scenario; drawn with the existing rhythm generator. */
  schedule: RhythmSchedule;
  phases: PhaseSpan[];
  /** Sorted R-peak times (ms). The heart-rate number and the QRS tone both read this list. */
  qrsTimesMs: number[];
  /**
   * Sorted pulse-oximetry pulse peaks (ms). A simulated mechanical pulse follows each ventricular
   * beat after a fixed transit delay, only while the SpO2 sensor is on and the rhythm is pulsatile.
   */
  plethPulseTimesMs: number[];
};

/** Fixed delay from R peak to the simulated finger pulse peak. A teaching constant, not a measurement. */
export const PLETH_PULSE_DELAY_MS = 280;
/** Margin built on each side of a phase so waves near its edges are complete. */
const PHASE_MARGIN_MS = 2_500;
/** The first beat of a new phase never falls closer than this to the previous beat. */
const MIN_COUPLING_MS = 300;
/** Longest P-to-QRS gap in the rhythm library (Mobitz I), used to keep a new phase's leading P wave. */
const MAX_PR_MS = 400;

const isQrs = (event: RhythmEvent): event is QrsEvent => event.kind === 'qrs';

export function phaseSpans(scenario: MonitorScenario): PhaseSpan[] {
  return scenario.phases.map((phase, index) => {
    const rhythm = getRhythmCase(phase.rhythmCaseId);
    if (!rhythm) throw new Error(`Unknown rhythm case ${phase.rhythmCaseId}`);
    const endMs = scenario.phases[index + 1]?.startMs ?? scenario.durationMs;
    // VF in this library has no discrete QRS complexes and therefore produces no simulated pulse.
    const pulsatile = buildCase(rhythm).analysis.qrs !== 'none';
    return { phase, index, startMs: phase.startMs, endMs, pulsatile };
  });
}

export function phaseAt(timeline: Pick<ScenarioTimeline, 'phases'>, timeMs: number): PhaseSpan {
  const { phases } = timeline;
  for (let index = phases.length - 1; index >= 0; index -= 1) if (timeMs >= phases[index].startMs) return phases[index];
  return phases[0];
}

function shiftSchedule(schedule: RhythmSchedule, shiftMs: number): RhythmSchedule {
  return {
    events: schedule.events.map(event => ({ ...event, timeMs: event.timeMs + shiftMs })),
    ...(schedule.flutter ? { flutter: { ...schedule.flutter, offsetMs: (schedule.flutter.offsetMs ?? 0) - shiftMs } } : {}),
    ...(schedule.fibrillation ? { fibrillation: { ...schedule.fibrillation } } : {}),
    ...(schedule.chaos ? { chaos: { ...schedule.chaos } } : {}),
  };
}

/** Builds and validates the whole scenario timeline. Throws on an invalid scenario. */
export function buildScenarioTimeline(input: MonitorScenario): ScenarioTimeline {
  const scenario = monitorScenarioSchema.parse(input);
  const spans = phaseSpans(scenario);
  const events: RhythmEvent[] = [];
  const composite: RhythmSchedule = { events };
  let lastQrsMs: number | null = null;

  for (const span of spans) {
    const rhythm = getRhythmCase(span.phase.rhythmCaseId)!;
    const rrMs = 60_000 / rhythm.rateBpm;
    let schedule = buildRhythmSchedule(rhythm.categoryId, { rateBpm: rhythm.rateBpm, seed: rhythm.seed }, {
      startMs: span.startMs - PHASE_MARGIN_MS,
      endMs: span.endMs + PHASE_MARGIN_MS,
    });
    // The first phase keeps its lead-in history; a later phase starts at its aligned first beat.
    let firstBeatMs = span.startMs - PHASE_MARGIN_MS;
    if (lastQrsMs !== null) {
      // Align the new rhythm so its first beat after the boundary keeps a plausible coupling interval.
      const firstQrs = schedule.events.filter(isQrs).map(event => event.timeMs).filter(time => time >= span.startMs).sort((a, b) => a - b)[0];
      const desired = Math.max(span.startMs, lastQrsMs + Math.max(MIN_COUPLING_MS, Math.min(rrMs, 1_000)));
      if (firstQrs !== undefined) schedule = shiftSchedule(schedule, desired - firstQrs);
      firstBeatMs = desired;
    }
    // Atrial events may precede the first beat by up to a long PR interval, never before the last beat.
    const atrialLowerBound: number = lastQrsMs === null ? firstBeatMs : Math.max(lastQrsMs + 150, firstBeatMs - MAX_PR_MS);
    const upperBound = span.index === spans.length - 1 ? span.endMs + PHASE_MARGIN_MS : span.endMs;
    const kept: RhythmEvent[] = schedule.events
      .filter(event => event.timeMs < upperBound && (isQrs(event) ? event.timeMs >= firstBeatMs : event.timeMs >= atrialLowerBound))
      .sort((a, b) => a.timeMs - b.timeMs);
    // A phase that ends mid-cycle must not leave a P wave or pacing spike without its QRS.
    const lastQrsIndex = kept.map(isQrs).lastIndexOf(true);
    const trimmed = span.index === spans.length - 1 || lastQrsIndex < 0 ? kept : kept.slice(0, lastQrsIndex + 1);
    events.push(...trimmed);
    const range = { fromMs: span.startMs, toMs: span.index === spans.length - 1 ? undefined : span.endMs };
    for (const key of ['flutter', 'fibrillation', 'chaos'] as const) {
      const part = schedule[key];
      if (!part) continue;
      if (composite[key]) throw new Error(`Only one phase per scenario can use continuous ${key} activity.`);
      Object.assign(composite, { [key]: { ...part, ...range } });
    }
    const qrsInPhase: number[] = trimmed.filter(isQrs).map(event => event.timeMs);
    if (qrsInPhase.length > 0) lastQrsMs = qrsInPhase[qrsInPhase.length - 1];
  }

  events.sort((a, b) => a.timeMs - b.timeMs);
  const qrsTimesMs = events.filter(isQrs).map(event => event.timeMs);
  const plethPulseTimesMs = qrsTimesMs
    .map(time => ({ beat: time, pulse: time + PLETH_PULSE_DELAY_MS }))
    .filter(({ beat }) => {
      const span = phaseAt({ phases: spans }, beat);
      return span.pulsatile && span.phase.spo2 !== null && span.phase.spo2.quality !== 'off';
    })
    .map(({ pulse }) => pulse);
  return { scenario, schedule: composite, phases: spans, qrsTimesMs, plethPulseTimesMs };
}

/** Index of the first value strictly greater than `timeMs` in a sorted list. */
export function upperBound(sorted: readonly number[], timeMs: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (sorted[middle] <= timeMs) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** Event times in the half-open interval (fromMs, toMs]. Used by the audio scheduler. */
export function eventsBetween(sorted: readonly number[], fromMs: number, toMs: number): number[] {
  if (!(toMs > fromMs)) return [];
  return sorted.slice(upperBound(sorted, fromMs), upperBound(sorted, toMs));
}
