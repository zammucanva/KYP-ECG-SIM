import { z } from 'zod';
import { patientAgeRanges } from '../patients/cases';
import { getRhythmCase } from '../rhythm/cases';

/**
 * Monitored scenarios: a fictional patient on a simulated bedside monitor whose state changes over
 * one shared simulation timeline. Each phase points at an existing rhythm case, so the waveform,
 * rate and answer scoring are the same definitions the Rhythm Challenge uses. Every other channel
 * (SpO2, blood pressure, respiration, temperature) is configured separately here and never derived
 * from the ECG. Values are invented teaching data, draft and unreviewed.
 */
export const channelQualities = ['good', 'poor', 'off'] as const;
export type ChannelQuality = (typeof channelQualities)[number];

const shortText = (min: number, max: number) => z.string().trim().min(min).max(max);
const oneDecimal = (value: number) => Math.abs(Math.round(value * 10) - value * 10) < 1e-9;

export const scenarioPhaseSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
  /** Simulated time at which this phase begins. The first phase begins at 0. */
  startMs: z.number().int().min(0),
  rhythmCaseId: z.string().regex(/^rhythm\.[a-z0-9-]+\.\d{2}$/),
  /** ECG electrode status for the simulated leads. */
  ecg: z.enum(['connected', 'lead-off']),
  /** Pulse oximetry: its own sensor, value and signal quality. Null when no sensor is attached. */
  spo2: z.strictObject({
    percent: z.number().int().min(50).max(100),
    quality: z.enum(channelQualities),
    perfusion: z.enum(['normal', 'low']),
  }).nullable(),
  respiratoryRatePerMin: z.number().int().min(4).max(60).nullable(),
  /** The value a non-invasive cuff measurement would return if one is taken during this phase. */
  nibp: z.strictObject({ systolic: z.number().int().min(50).max(250), diastolic: z.number().int().min(20).max(150) })
    .refine(value => value.systolic > value.diastolic, { message: 'Systolic must be greater than diastolic.' })
    .nullable(),
  temperatureC: z.number().min(32).max(42).refine(oneDecimal, { message: 'Temperature uses one decimal place.' }).nullable(),
});
export type ScenarioPhase = z.infer<typeof scenarioPhaseSchema>;

const limit = (min: number, max: number) => z.number().int().min(min).max(max);

/** Educational simulation defaults. They are not clinical alarm settings for any patient or device. */
export const alarmLimitsSchema = z.strictObject({
  heartRate: z.strictObject({ low: limit(20, 100), high: limit(80, 250) }),
  spo2: z.strictObject({ low: limit(70, 99) }),
  respiratoryRate: z.strictObject({ low: limit(4, 20), high: limit(15, 60) }),
  systolic: z.strictObject({ low: limit(50, 120), high: limit(100, 250) }),
}).refine(value => value.heartRate.low < value.heartRate.high && value.respiratoryRate.low < value.respiratoryRate.high && value.systolic.low < value.systolic.high, {
  message: 'Each low limit must be below its high limit.',
});
export type AlarmLimits = z.infer<typeof alarmLimitsSchema>;

export const SIMULATION_DEFAULT_ALARM_LIMITS: AlarmLimits = Object.freeze({
  heartRate: Object.freeze({ low: 50, high: 120 }),
  spo2: Object.freeze({ low: 90 }),
  respiratoryRate: Object.freeze({ low: 8, high: 25 }),
  systolic: Object.freeze({ low: 90, high: 160 }),
}) as AlarmLimits;

export const MAX_SCENARIO_DURATION_MS = 300_000;

export const monitorScenarioSchema = z.strictObject({
  id: z.string().regex(/^scenario\.[a-z0-9-]+\.\d{2}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: shortText(3, 120),
  /** Fictional bed label shown on the monitor; never a real identifier. */
  bedLabel: z.string().regex(/^SIM-[A-Z0-9-]{1,12}$/),
  ageRange: z.enum(patientAgeRanges),
  presentation: shortText(20, 600),
  symptoms: z.array(shortText(3, 160)).min(1).max(6),
  history: z.array(shortText(3, 160)).max(6),
  learningObjectives: z.array(shortText(10, 200)).min(1).max(4),
  caveats: z.array(shortText(10, 240)).min(1).max(4),
  durationMs: z.number().int().min(30_000).max(MAX_SCENARIO_DURATION_MS),
  /** Simulated time between automatic cuff measurements. Compressed for teaching; labelled as such. */
  nibpIntervalMs: z.number().int().min(15_000).max(MAX_SCENARIO_DURATION_MS),
  alarmLimits: alarmLimitsSchema,
  phases: z.array(scenarioPhaseSchema).min(1).max(6),
  /** The phase whose rhythm the learner is asked to identify at the checkpoint. */
  assessedPhaseId: z.string(),
  publicationStatus: z.literal('draft'),
  reviewStatus: z.literal('unreviewed'),
}).superRefine((value, context) => {
  if (value.phases[0].startMs !== 0) context.addIssue({ code: 'custom', path: ['phases', 0, 'startMs'], message: 'The first phase starts at 0.' });
  value.phases.forEach((phase, index) => {
    if (index > 0 && phase.startMs <= value.phases[index - 1].startMs) context.addIssue({ code: 'custom', path: ['phases', index, 'startMs'], message: 'Phases must start in increasing order.' });
    if (phase.startMs >= value.durationMs) context.addIssue({ code: 'custom', path: ['phases', index, 'startMs'], message: 'Every phase must start before the scenario ends.' });
    if (!getRhythmCase(phase.rhythmCaseId)) context.addIssue({ code: 'custom', path: ['phases', index, 'rhythmCaseId'], message: 'Unknown rhythm case.' });
  });
  if (new Set(value.phases.map(phase => phase.id)).size !== value.phases.length) context.addIssue({ code: 'custom', path: ['phases'], message: 'Phase ids must be unique.' });
  if (!value.phases.some(phase => phase.id === value.assessedPhaseId)) context.addIssue({ code: 'custom', path: ['assessedPhaseId'], message: 'The assessed phase must exist.' });
});
export type MonitorScenario = z.infer<typeof monitorScenarioSchema>;

const rawScenarios: unknown[] = [
  {
    id: 'scenario.monitored-fast-heartbeat.01',
    version: '0.1.0',
    title: 'A change on the monitor while resting',
    bedLabel: 'SIM-BED-04',
    ageRange: '31–45 years',
    presentation: 'A fictional patient is resting on a monitored bed while waiting for a routine review. They feel well at first. Part way through the observation period they say their heart has suddenly started racing.',
    symptoms: ['Sudden awareness of a fast heartbeat', 'Mild lightheadedness', 'No chest pain reported (fictional)'],
    history: ['No known heart condition (fictional)', 'Similar brief episodes in the past (fictional)'],
    learningObjectives: [
      'Notice when the monitored rhythm changes and which alarm the change produces.',
      'Identify the new rhythm from its regularity, QRS width and P waves.',
      'Recognise which monitor channel each number on the screen comes from.',
    ],
    caveats: [
      'All values are generated teaching data from a simplified simulation, not measurements from a patient.',
      'Alarm limits here are simulation defaults for this exercise, not settings for any real patient or device.',
      'The cuff measures at a compressed interval so that a change is visible within the exercise.',
    ],
    durationMs: 120_000,
    nibpIntervalMs: 30_000,
    alarmLimits: SIMULATION_DEFAULT_ALARM_LIMITS,
    phases: [
      {
        id: 'baseline',
        startMs: 0,
        rhythmCaseId: 'rhythm.nsr.01',
        ecg: 'connected',
        spo2: { percent: 98, quality: 'good', perfusion: 'normal' },
        respiratoryRatePerMin: 14,
        nibp: { systolic: 122, diastolic: 76 },
        temperatureC: 36.8,
      },
      {
        id: 'fast-regular',
        startMs: 40_000,
        rhythmCaseId: 'rhythm.svt.01',
        ecg: 'connected',
        spo2: { percent: 97, quality: 'good', perfusion: 'low' },
        respiratoryRatePerMin: 20,
        nibp: { systolic: 108, diastolic: 70 },
        temperatureC: 36.8,
      },
    ],
    assessedPhaseId: 'fast-regular',
    publicationStatus: 'draft',
    reviewStatus: 'unreviewed',
  },
];

export const monitorScenarios: readonly MonitorScenario[] = Object.freeze(rawScenarios.map(item => monitorScenarioSchema.parse(item)));

if (new Set(monitorScenarios.map(item => item.id)).size !== monitorScenarios.length) throw new Error('Scenario IDs must be unique');

export const getMonitorScenario = (id: string): MonitorScenario | undefined => monitorScenarios.find(item => item.id === id);
