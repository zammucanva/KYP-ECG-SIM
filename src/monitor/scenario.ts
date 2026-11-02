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

const spo2ConfigSchema = z.strictObject({
  /** The number the monitor displays. With poor signal quality this is the unreliable displayed value. */
  percent: z.number().int().min(50).max(100),
  quality: z.enum(channelQualities),
  perfusion: z.enum(['normal', 'low']),
});

export const scenarioPhaseSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
  /** Simulated time at which this phase begins. The first phase begins at 0. */
  startMs: z.number().int().min(0),
  rhythmCaseId: z.string().regex(/^rhythm\.[a-z0-9-]+\.\d{2}$/),
  /** ECG electrode status for the simulated leads. */
  ecg: z.enum(['connected', 'lead-off']),
  /** Pulse oximetry: its own sensor, value and signal quality. Null when no sensor is attached. */
  spo2: spo2ConfigSchema.nullable(),
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

/**
 * Something the learner can do at the bedside during the scenario. Its effect changes equipment
 * channels only (never the rhythm), from a set delay after the learner acts, for the rest of the run.
 */
export const scenarioActionSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
  label: shortText(5, 120),
  description: shortText(10, 300),
  delayMs: z.number().int().min(0).max(60_000),
  effect: z.strictObject({ spo2: spo2ConfigSchema.nullable().optional(), ecg: z.enum(['connected', 'lead-off']).optional() })
    .refine(effect => effect.spo2 !== undefined || effect.ecg !== undefined, { message: 'An action must change at least one channel.' }),
});
export type ScenarioAction = z.infer<typeof scenarioActionSchema>;

/** What the checkpoint asks besides the alarm and heart-rate source questions. */
export const scenarioAssessmentSchema = z.discriminatedUnion('kind', [
  /** Identify the assessed phase's rhythm on a strip recorded from the monitor. */
  z.strictObject({ kind: z.literal('rhythm') }),
  /** Choose what the monitor evidence best supports. Authored draft text, reviewed before publication. */
  z.strictObject({
    kind: z.literal('decision'),
    question: shortText(10, 200),
    options: z.array(z.strictObject({
      id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
      label: shortText(5, 200),
      correct: z.boolean(),
      rationale: shortText(10, 400),
    })).min(2).max(5),
    /** The bedside action the scenario expects the learner to take, if any. */
    expectedActionId: z.string().nullable(),
  }),
]);
export type ScenarioAssessment = z.infer<typeof scenarioAssessmentSchema>;

export const monitorScenarioSchema = z.strictObject({
  id: z.string().regex(/^scenario\.[a-z0-9-]+\.\d{2}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: shortText(3, 120),
  /** The Virtual Patient case this scenario puts on a monitor, if any. */
  patientCaseId: z.string().regex(/^patient\.[a-z0-9-]+\.\d{2}$/).optional(),
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
  /** The phase the checkpoint is about: the questions open after it begins. */
  assessedPhaseId: z.string(),
  assessment: scenarioAssessmentSchema.default({ kind: 'rhythm' }),
  actions: z.array(scenarioActionSchema).max(4).default([]),
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
  if (new Set(value.actions.map(action => action.id)).size !== value.actions.length) context.addIssue({ code: 'custom', path: ['actions'], message: 'Action ids must be unique.' });
  if (value.assessment.kind === 'decision') {
    const { options, expectedActionId } = value.assessment;
    if (options.filter(option => option.correct).length !== 1) context.addIssue({ code: 'custom', path: ['assessment', 'options'], message: 'A decision has exactly one best option.' });
    if (new Set(options.map(option => option.id)).size !== options.length) context.addIssue({ code: 'custom', path: ['assessment', 'options'], message: 'Option ids must be unique.' });
    if (expectedActionId !== null && !value.actions.some(action => action.id === expectedActionId)) context.addIssue({ code: 'custom', path: ['assessment', 'expectedActionId'], message: 'The expected action must exist.' });
  }
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

rawScenarios.push({
  id: 'scenario.pulse-oximeter-signal.01',
  version: '0.1.0',
  title: 'A falling SpO₂ number with a steady ECG',
  bedLabel: 'SIM-BED-07',
  ageRange: '46–60 years',
  presentation: 'A fictional patient is resting on a monitored bed and talking on the phone. They feel well. Part way through, they become restless and keep moving the hand that has the finger sensor on it.',
  symptoms: ['Feels well (fictional)', 'Moving the monitored hand a lot', 'No breathlessness reported (fictional)'],
  history: ['No known lung or heart condition (fictional)'],
  learningObjectives: [
    'Recognise when a pulse-oximeter number comes from a signal flagged as unreliable.',
    'Compare the ECG heart rate, the pleth waveform and the SpO₂ number before interpreting one of them.',
    'Check the sensor at the bedside and see whether the signal recovers.',
  ],
  caveats: [
    'All values are generated teaching data from a simplified simulation, not measurements from a patient.',
    'This exercise is about recognising signal quality. A low reading in practice is checked promptly, not dismissed as artefact without looking.',
    'Alarm limits here are simulation defaults for this exercise, not settings for any real patient or device.',
  ],
  durationMs: 90_000,
  nibpIntervalMs: 30_000,
  alarmLimits: SIMULATION_DEFAULT_ALARM_LIMITS,
  phases: [
    {
      id: 'resting',
      startMs: 0,
      rhythmCaseId: 'rhythm.nsr.02',
      ecg: 'connected',
      spo2: { percent: 98, quality: 'good', perfusion: 'normal' },
      respiratoryRatePerMin: 15,
      nibp: { systolic: 126, diastolic: 80 },
      temperatureC: 36.7,
    },
    {
      id: 'hand-movement',
      startMs: 30_000,
      rhythmCaseId: 'rhythm.nsr.02',
      ecg: 'connected',
      spo2: { percent: 84, quality: 'poor', perfusion: 'normal' },
      respiratoryRatePerMin: 15,
      nibp: { systolic: 126, diastolic: 80 },
      temperatureC: 36.7,
    },
  ],
  assessedPhaseId: 'hand-movement',
  assessment: {
    kind: 'decision',
    question: 'What does the monitor evidence best support at this point?',
    options: [
      { id: 'signal-unreliable', label: 'The pulse-oximeter signal is unreliable: check the sensor and the signal before interpreting the SpO₂ number.', correct: true,
        rationale: 'The monitor flags the SpO₂ signal as poor, the pleth trace is irregular, and the ECG heart rate has not changed. A number from a signal flagged as poor cannot be read at face value until the sensor and signal are checked.' },
      { id: 'true-desaturation', label: 'Oxygen saturation has truly fallen, and the number can be taken at face value.', correct: false,
        rationale: 'The number is shown with a poor-signal flag and an irregular pleth. That does not prove the reading is wrong, but it means it cannot be taken at face value before the sensor is checked.' },
      { id: 'new-rhythm', label: 'The ECG shows a new rhythm that explains the change.', correct: false,
        rationale: 'The ECG rhythm and the heart rate are unchanged throughout this scenario.' },
      { id: 'silence-resolves', label: 'Silencing the alarm resolves the problem.', correct: false,
        rationale: 'Silencing only stops the sound for a while. The alarm and its cause remain until the condition itself changes.' },
    ],
    expectedActionId: 'reposition-sensor',
  },
  actions: [
    {
      id: 'reposition-sensor',
      label: 'Ask the patient to rest the hand, and reposition the finger sensor',
      description: 'A bedside check of the pulse-oximeter sensor. In this simulation the signal recovers a few seconds later.',
      delayMs: 4_000,
      effect: { spo2: { percent: 98, quality: 'good', perfusion: 'normal' } },
    },
  ],
  publicationStatus: 'draft',
  reviewStatus: 'unreviewed',
});

export const monitorScenarios: readonly MonitorScenario[] = Object.freeze(rawScenarios.map(item => monitorScenarioSchema.parse(item)));

if (new Set(monitorScenarios.map(item => item.id)).size !== monitorScenarios.length) throw new Error('Scenario IDs must be unique');

export const getMonitorScenario = (id: string): MonitorScenario | undefined => monitorScenarios.find(item => item.id === id);
