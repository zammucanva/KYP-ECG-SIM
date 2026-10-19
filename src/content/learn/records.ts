import type { ContentProvenance, ContentRecord, KnowledgeCheckRecord, LessonRecord, SourceReference } from '../types';

const createdAt = '2026-10-19T19:44:52Z';
const version = '0.2.0';
const signalProvenance: ContentProvenance = {
  kind: 'synthetic-ecg',
  generatorId: 'ecg-lab.signal.generateLeadSignals',
  signal: {
    sampleRateHz: 250,
    recordingDurationMs: 10_000,
    leadOrder: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'],
    voltageUnit: 'mV',
    timestampUnit: 'ms',
    calibration: { paperSpeedMmPerSecond: 25, gainMmPerMv: 20 },
    preprocessing: [],
    signalStatus: 'original',
  },
  usageRights: { reuse: 'unknown', redistribution: 'unknown', modification: 'unknown' },
};
const textOnlyProvenance: ContentProvenance = {
  kind: 'text-only-explanation',
  signalMetadataOmissionReason: 'This knowledge-check record contains text and answer options only; no signal is embedded.',
};

function beckerReference(objectiveId: string): SourceReference {
  return {
    id: 'ref.becker-fundamentals-ecg',
    title: 'Fundamentals of electrocardiography interpretation',
    kind: 'peer-reviewed-study',
    authors: ['Daniel E Becker'],
    editionOrVersion: 'Anesthesia Progress, 2006, 53(2), 53–64',
    doi: '10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16863387/',
    accessedDate: '2026-10-20',
    supports: [{ kind: 'objective', objectiveId }],
    verificationStatus: 'unverified',
    metadataOmissions: [{ field: 'publicationDate', reason: 'The indexed record identifies a season and year, not a calendar publication date.' }],
  };
}

function kligfieldReference(objectiveId: string): SourceReference {
  return {
    id: 'ref.kligfield-ecg-technology',
    title: 'Recommendations for the standardization and interpretation of the electrocardiogram: part I: The electrocardiogram and its technology',
    kind: 'peer-reviewed-study',
    issuingOrganization: 'American Heart Association; American College of Cardiology Foundation; Heart Rhythm Society',
    publicationDate: '2007-03-13',
    editionOrVersion: 'Part I scientific statement',
    doi: '10.1161/CIRCULATIONAHA.106.180200',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17322457/',
    accessedDate: '2026-10-20',
    supports: [{ kind: 'objective', objectiveId }],
    verificationStatus: 'unverified',
  };
}

const makeCommon = <TType extends 'lesson' | 'question'>(input: {
  id: string;
  type: TType;
  title: string;
  summary: string;
  objectiveId: string;
  objective: string;
  tags: string[];
  sourceReferences: SourceReference[];
  provenance?: ContentProvenance;
}) => ({
  id: input.id,
  type: input.type,
  title: input.title,
  summary: input.summary,
  learningObjectives: [{ id: input.objectiveId, statement: input.objective }],
  difficulty: 'introductory' as const,
  tags: input.tags,
  contentDomain: 'clinical-education' as const,
  publicationStatus: 'draft' as const,
  provenance: input.provenance ?? signalProvenance,
  sourceReferences: input.sourceReferences,
  reviewRecords: [],
  createdAt,
  updatedAt: createdAt,
  version,
  knownLimitations: [
    'Draft content; source-claim mapping, educational review, qualified medical review, and publication approval are still required.',
    'Any displayed trace is a synthetic educational template, not a patient recording or validated physiology.',
  ],
});

export const introductoryLessons = [
  {
    ...makeCommon({
      id: 'learn.what-an-ecg-measures',
      type: 'lesson',
      title: 'What an ECG measures',
      summary: 'A first look at the ECG as an electrical signal displayed over time—not a picture of mechanical contraction.',
      objectiveId: 'what-ecg-measures',
      objective: 'Describe the ECG as a time-varying recording of cardiac electrical potential differences.',
      tags: ['fundamentals', 'signal', 'introductory'],
      sourceReferences: [beckerReference('what-ecg-measures'), kligfieldReference('what-ecg-measures')],
    }),
    lessonContent: {
      sequence: 1,
      prerequisiteIds: [],
      sections: [
        {
          id: 'signal-over-time',
          title: 'A signal plotted over time',
          body: 'An electrocardiogram (ECG) records electrical potential differences detected at the body surface and displays their change over time. The horizontal direction represents time; the vertical direction represents voltage. A trace is therefore an electrical recording—not a direct measurement of contraction, blood flow, or a palpable pulse.',
          demonstrationId: 'template-waveform',
        },
        {
          id: 'read-the-representation',
          title: 'Read the representation, not more than it shows',
          body: 'Each displayed lead is a particular electrical view derived from electrode measurements. The same underlying cardiac activity can look different across leads. The simulator uses a deterministic synthetic template to make this representation visible; its morphology is simplified and has not been validated against patient recordings.',
        },
      ],
      keyTerms: [
        { term: 'Potential difference', definition: 'A voltage difference between two points or between a point and a derived reference.' },
        { term: 'Electrode', definition: 'A physical conductive contact used to acquire an electrical signal at the body surface.' },
        { term: 'Lead', definition: 'A defined electrical view formed from electrode measurements; it is not synonymous with one electrode.' },
      ],
      keyTakeaways: [
        'An ECG is an electrical signal represented against time.',
        'An ECG trace does not directly measure mechanical contraction or blood flow.',
        'Synthetic traces in this simulator are learning illustrations, not patient data.',
      ],
      visualDemonstrations: [{
        id: 'template-waveform',
        kind: 'waveform-components',
        title: 'Explore one synthetic cycle',
        description: 'The labels identify approximate authored regions in the simulator template; they are not automated boundary detections or validated patient morphology.',
        lead: 'II',
        annotations: [
          { label: 'P-like template region', startMs: 120, endMs: 176 },
          { label: 'QRS-like template region', startMs: 224, endMs: 272 },
          { label: 'T-like template region', startMs: 400, endMs: 488 },
        ],
      }],
      knowledgeCheckIds: ['learn.check.what-an-ecg-measures'],
    },
  },
  {
    ...makeCommon({
      id: 'learn.electrodes-versus-leads',
      type: 'lesson',
      title: 'Electrodes versus leads',
      summary: 'Separate the physical recording contacts from the electrical views shown on the ECG.',
      objectiveId: 'electrodes-versus-leads',
      objective: 'Differentiate physical electrodes from lead views derived from electrode measurements.',
      tags: ['fundamentals', 'leads', '12-lead'],
      sourceReferences: [beckerReference('electrodes-versus-leads'), kligfieldReference('electrodes-versus-leads')],
    }),
    lessonContent: {
      sequence: 2,
      prerequisiteIds: ['learn.what-an-ecg-measures'],
      sections: [
        {
          id: 'physical-electrodes',
          title: 'Electrodes are recording contacts',
          body: 'Electrodes are the physical contacts that acquire surface potentials. A lead is a defined electrical view calculated from those measurements. Confusing the terms makes it harder to understand why an ECG can display more lead views than there are electrodes.',
          demonstrationId: 'limb-lead-views',
        },
        {
          id: 'derived-lead-views',
          title: 'Several views share one recording',
          body: 'The limb-lead demonstration uses the same time-aligned I and II source signals and derives III, aVR, aVL, and aVF using the simulator’s existing lead engine. It demonstrates the software relationships only; it does not validate the synthetic morphology or represent electrode placement on a patient.',
        },
      ],
      keyTerms: [
        { term: 'Electrode', definition: 'A physical contact used to record electrical potentials.' },
        { term: 'Lead view', definition: 'A voltage difference or derived view computed from electrode measurements.' },
        { term: 'Time alignment', definition: 'Samples in different lead series share the same timestamps.' },
      ],
      keyTakeaways: [
        'An electrode is hardware contact; a lead is a recording view.',
        'The simulator’s limb-lead traces share a recording timeline.',
        'Correct lead equations do not establish clinical validity of a synthetic trace.',
      ],
      visualDemonstrations: [{
        id: 'limb-lead-views',
        kind: 'limb-lead-relationships',
        title: 'Compare the six limb-lead views',
        description: 'All traces use one synthetic recording and the engine’s shared timestamps.',
        leads: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF'],
      }],
      knowledgeCheckIds: ['learn.check.electrodes-versus-leads'],
    },
  },
  {
    ...makeCommon({
      id: 'learn.paper-speed-and-gain',
      type: 'lesson',
      title: 'ECG paper, speed and gain',
      summary: 'Use the grid and calibration pulse to understand the shared time and voltage scales.',
      objectiveId: 'paper-speed-and-gain',
      objective: 'Explain how paper speed sets horizontal time scale and gain sets vertical voltage scale.',
      tags: ['fundamentals', 'calibration', 'grid'],
      sourceReferences: [kligfieldReference('paper-speed-and-gain')],
    }),
    lessonContent: {
      sequence: 3,
      prerequisiteIds: ['learn.what-an-ecg-measures'],
      sections: [
        {
          id: 'horizontal-time-scale',
          title: 'Paper speed sets horizontal scale',
          body: 'Paper speed determines how much horizontal distance corresponds to a given time interval. When the speed changes, the signal’s timestamps stay the same while its rendered horizontal coordinates change through the shared calibration engine.',
          demonstrationId: 'calibration-grid',
        },
        {
          id: 'vertical-voltage-scale',
          title: 'Gain sets vertical scale',
          body: 'Gain determines how much vertical distance corresponds to one millivolt. The calibration pulse is drawn through the same voltage transform as the waveform. The browser preview uses logical millimetres and SVG units; CSS pixels are not physical paper millimetres.',
        },
        {
          id: 'read-the-grid',
          title: 'Use the grid as a ruler',
          body: 'The minor grid represents 1 logical millimetre and the heavier grid represents 5 logical millimetres. The interactive controls let you compare speed, gain, pulse size, and a shared synthetic trace without changing the source samples.',
        },
      ],
      keyTerms: [
        { term: 'Paper speed', definition: 'The horizontal calibration in millimetres per second.' },
        { term: 'Gain', definition: 'The vertical calibration in millimetres per millivolt.' },
        { term: 'Calibration pulse', definition: 'A known voltage and duration rendered as a scale reference.' },
      ],
      keyTakeaways: [
        'Paper speed changes horizontal display distance, not the stored timestamps.',
        'Gain changes vertical display distance, not the stored voltages.',
        'Screen pixels are not physical print dimensions.',
      ],
      visualDemonstrations: [{
        id: 'calibration-grid',
        kind: 'calibration-explorer',
        title: 'Adjust speed, gain and grid',
        description: 'The trace and calibration pulse use the simulator’s shared calibration functions; settings only change the display transform.',
      }],
      knowledgeCheckIds: ['learn.check.paper-speed-and-gain'],
    },
  },
] satisfies LessonRecord[];

export const introductoryKnowledgeChecks = [
  {
    ...makeCommon({
      id: 'learn.check.what-an-ecg-measures',
      type: 'question',
      title: 'What does the display encode?',
      summary: 'A formative lesson check about ECG signal representation.',
      objectiveId: 'what-ecg-measures',
      objective: 'Describe the ECG as a time-varying recording of cardiac electrical potential differences.',
      tags: ['formative-check', 'fundamentals'],
      sourceReferences: [beckerReference('what-ecg-measures'), kligfieldReference('what-ecg-measures')],
      provenance: textOnlyProvenance,
    }),
    questionType: 'single-best-answer',
    prompt: 'Which statement best describes the information represented by an ECG trace?',
    choices: [
      { id: 'electrical-over-time', text: 'Electrical potential differences displayed over time' },
      { id: 'mechanical-contraction', text: 'A direct measurement of mechanical contraction' },
      { id: 'blood-flow', text: 'A direct measurement of blood flow through the chambers' },
    ],
    correctAnswerIds: ['electrical-over-time'],
    explanation: 'An ECG records electrical potential differences over time. It is not a direct measurement of mechanical contraction or blood flow.',
  },
  {
    ...makeCommon({
      id: 'learn.check.electrodes-versus-leads',
      type: 'question',
      title: 'Electrode or lead?',
      summary: 'A formative lesson check about recording contacts and electrical views.',
      objectiveId: 'electrodes-versus-leads',
      objective: 'Differentiate physical electrodes from lead views derived from electrode measurements.',
      tags: ['formative-check', 'leads'],
      sourceReferences: [beckerReference('electrodes-versus-leads'), kligfieldReference('electrodes-versus-leads')],
      provenance: textOnlyProvenance,
    }),
    questionType: 'single-best-answer',
    prompt: 'Which description distinguishes an electrode from a lead?',
    choices: [
      { id: 'contact-and-view', text: 'An electrode is a physical recording contact; a lead is an electrical view derived from measurements.' },
      { id: 'same-object', text: 'An electrode and a lead are two names for the same physical contact.' },
      { id: 'one-trace-per-electrode', text: 'Each electrode always corresponds to exactly one displayed lead.' },
    ],
    correctAnswerIds: ['contact-and-view'],
    explanation: 'Electrodes are physical contacts. Leads are defined voltage views calculated from electrode measurements.',
  },
  {
    ...makeCommon({
      id: 'learn.check.paper-speed-and-gain',
      type: 'question',
      title: 'Read the ECG scale',
      summary: 'A formative lesson check about horizontal paper speed.',
      objectiveId: 'paper-speed-and-gain',
      objective: 'Explain how paper speed sets horizontal time scale and gain sets vertical voltage scale.',
      tags: ['formative-check', 'calibration'],
      sourceReferences: [kligfieldReference('paper-speed-and-gain')],
      provenance: textOnlyProvenance,
    }),
    questionType: 'single-best-answer',
    prompt: 'At a paper speed of 25 mm/s, what elapsed time is represented by 5 logical millimetres horizontally?',
    choices: [
      { id: '200-ms', text: '200 ms' },
      { id: '40-ms', text: '40 ms' },
      { id: '1-second', text: '1 second' },
    ],
    correctAnswerIds: ['200-ms'],
    explanation: 'At 25 mm/s, 5 mm corresponds to 5 ÷ 25 seconds, or 0.2 seconds (200 ms). This lesson’s question is draft and must be reviewed before learner publication.',
  },
] satisfies KnowledgeCheckRecord[];

export const introductoryLearnDrafts: ContentRecord[] = [
  ...introductoryLessons,
  ...introductoryKnowledgeChecks,
];
