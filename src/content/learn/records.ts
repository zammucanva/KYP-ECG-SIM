import type { ContentProvenance, ContentRecord, KnowledgeCheckRecord, LessonRecord, SourceReference } from '../types';

const createdAt = '2026-10-19T19:44:52Z';
const updatedAt = '2026-10-19T20:44:56Z';
const version = '0.3.0';
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

function beckerReference(objectiveId: string, claimIds: string[]): SourceReference {
  return {
    id: 'ref.becker-fundamentals-ecg',
    title: 'Fundamentals of electrocardiography interpretation',
    kind: 'review-article',
    authors: ['Daniel E Becker'],
    editionOrVersion: 'Anesthesia Progress. 2006 Summer;53(2):53–63; quiz 64.',
    doi: '10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16863387/',
    accessedDate: '2026-10-20',
    supports: [{ kind: 'objective', objectiveId }, ...claimIds.map(claimId => ({ kind: 'claim' as const, claimId }))],
    verificationStatus: 'unverified',
    metadataOmissions: [
      { field: 'publicationDate', reason: 'PubMed identifies Summer 2006, not an exact calendar date.' },
      { field: 'licence', reason: 'Reuse, redistribution, and modification terms were not verified; citation access is not permission.' },
    ],
  };
}

function kligfieldReference(objectiveId: string, claimIds: string[]): SourceReference {
  return {
    id: 'ref.kligfield-ecg-technology',
    title: 'Recommendations for the standardization and interpretation of the electrocardiogram. Part I: The electrocardiogram and its technology: a scientific statement from the American Heart Association, American College of Cardiology Foundation, and the Heart Rhythm Society, endorsed by the International Society for Computerized Electrocardiology',
    kind: 'professional-society-statement',
    authors: [
      'Paul Kligfield', 'Leonard S Gettes', 'James J Bailey', 'Rory Childers', 'Barbara J Deal', 'E William Hancock',
      'Gerard van Herpen', 'Jan A Kors', 'Peter Macfarlane', 'David M Mirvis', 'Olle Pahlm', 'Pentti Rautaharju',
      'Galen S Wagner', 'Mark Josephson', 'Jay W Mason', 'Peter Okin', 'Borys Surawicz', 'Hein Wellens',
    ],
    issuingOrganization: 'American Heart Association; American College of Cardiology Foundation; Heart Rhythm Society',
    publicationDate: '2007-03-13',
    jurisdiction: 'International; United States professional societies',
    editionOrVersion: 'Circulation. 2007 Mar 13;115(10):1306–1324; e-published 2007 Feb 23.',
    doi: '10.1161/CIRCULATIONAHA.106.180200',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17322457/',
    accessedDate: '2026-10-20',
    supports: [{ kind: 'objective', objectiveId }, ...claimIds.map(claimId => ({ kind: 'claim' as const, claimId }))],
    verificationStatus: 'unverified',
    metadataOmissions: [{ field: 'licence', reason: 'Publisher rights and permissions for reuse, redistribution, or modification were not verified.' }],
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
  claims?: Array<{ id: string; statement: string; locations: string[]; basis: 'external-source' | 'project-behavior' }>;
  parentLessonId?: string;
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
  ...(input.claims ? { claims: input.claims } : {}),
  ...(input.parentLessonId ? { parentLessonId: input.parentLessonId } : {}),
  reviewRecords: [],
  createdAt,
  updatedAt,
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
      claims: [
        { id: 'potential-difference-is-voltage-difference', statement: 'Potential difference describes a voltage difference between two points or between a point and a derived reference.', locations: ['keyTerms.Potential difference'], basis: 'external-source' },
        { id: 'ecg-surface-potential-over-time', statement: 'An ECG displays changes in electrical potentials detected at the body surface over time.', locations: ['sections.signal-over-time.body', 'keyTakeaways[0]', 'learningObjectives.what-ecg-measures'], basis: 'external-source' },
        { id: 'ecg-not-mechanical-measurement', statement: 'An ECG trace is not a direct measurement of cardiac mechanical contraction.', locations: ['sections.signal-over-time.body', 'keyTakeaways[1]'], basis: 'external-source' },
        { id: 'ecg-not-blood-flow-measurement', statement: 'An ECG trace is not a direct measurement of blood flow.', locations: ['sections.signal-over-time.body'], basis: 'external-source' },
        { id: 'ecg-not-palpable-pulse', statement: 'An ECG trace is not itself a palpable pulse.', locations: ['sections.signal-over-time.body'], basis: 'external-source' },
        { id: 'lead-is-derived-view', statement: 'A lead is an electrical view derived from electrode measurements, not a synonym for an electrode.', locations: ['sections.read-the-representation.body', 'keyTerms.Lead', 'keyTakeaways[1]'], basis: 'external-source' },
        { id: 'lead-view-changes-trace-appearance', statement: 'A change in lead view can change the appearance of recorded electrical activity.', locations: ['sections.read-the-representation.body'], basis: 'external-source' },
        { id: 'template-is-synthetic', statement: 'The displayed trace is produced by the simulator synthetic template and is not validated patient physiology.', locations: ['sections.read-the-representation.body', 'visualDemonstrations.template-waveform.description', 'keyTakeaways[2]'], basis: 'project-behavior' },
        { id: 'annotations-are-authored-regions', statement: 'P-like, QRS-like, and T-like annotations are authored regions and not automated boundary detections.', locations: ['visualDemonstrations.template-waveform.description', 'visualDemonstrations.template-waveform.annotations'], basis: 'project-behavior' },
      ],
      sourceReferences: [
        beckerReference('what-ecg-measures', ['potential-difference-is-voltage-difference', 'ecg-surface-potential-over-time', 'ecg-not-mechanical-measurement', 'ecg-not-palpable-pulse', 'lead-is-derived-view', 'lead-view-changes-trace-appearance']),
        kligfieldReference('what-ecg-measures', ['potential-difference-is-voltage-difference', 'ecg-surface-potential-over-time', 'lead-is-derived-view', 'lead-view-changes-trace-appearance']),
      ],
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
      claims: [
        { id: 'electrode-is-physical-contact', statement: 'An electrode is a physical contact used to acquire surface electrical potentials.', locations: ['sections.physical-electrodes.body', 'keyTerms.Electrode'], basis: 'external-source' },
        { id: 'lead-is-derived-view', statement: 'A lead is an electrical view formed or calculated from electrode measurements.', locations: ['sections.physical-electrodes.body', 'keyTerms.Lead view', 'keyTakeaways[0]'], basis: 'external-source' },
        { id: 'views-can-exceed-electrodes', statement: 'An ECG can display more lead views than there are physical electrode contacts.', locations: ['sections.physical-electrodes.body'], basis: 'external-source' },
        { id: 'limb-leads-share-timeline', statement: 'The simulator limb-lead traces use time-aligned source signals on one shared timeline.', locations: ['sections.derived-lead-views.body', 'keyTerms.Time alignment', 'visualDemonstrations.limb-lead-views.description'], basis: 'project-behavior' },
        { id: 'limb-lead-demo-is-not-patient-placement', statement: 'The simulator limb-lead demonstration does not represent electrode placement on a patient or validate synthetic morphology.', locations: ['sections.derived-lead-views.body', 'keyTakeaways[2]'], basis: 'project-behavior' },
      ],
      sourceReferences: [
        beckerReference('electrodes-versus-leads', ['electrode-is-physical-contact', 'lead-is-derived-view', 'views-can-exceed-electrodes']),
        kligfieldReference('electrodes-versus-leads', ['electrode-is-physical-contact', 'lead-is-derived-view', 'views-can-exceed-electrodes']),
      ],
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
      claims: [
        { id: 'paper-speed-time-scale', statement: 'Paper speed defines the horizontal distance corresponding to elapsed time; at 25 mm/s, 5 mm represents 200 ms.', locations: ['sections.horizontal-time-scale.body', 'keyTerms.Paper speed', 'keyTakeaways[0]', 'knowledge-check prompt and explanation'], basis: 'external-source' },
        { id: 'gain-voltage-scale', statement: 'ECG display gain defines vertical distance per unit voltage.', locations: ['sections.vertical-voltage-scale.body', 'keyTerms.Gain', 'keyTakeaways[1]'], basis: 'external-source' },
        { id: 'standard-grid-units', statement: 'Standard ECG paper uses 1 mm minor divisions and 5 mm major divisions.', locations: ['sections.read-the-grid.body'], basis: 'external-source' },
        { id: 'simulator-time-voltage-transform', statement: 'Changing simulator speed or gain changes rendered coordinates but does not change stored timestamps or source voltages.', locations: ['sections.horizontal-time-scale.body', 'sections.vertical-voltage-scale.body', 'keyTakeaways[0..1]'], basis: 'project-behavior' },
        { id: 'calibration-pulse-shares-transform', statement: 'The simulator calibration pulse uses the same voltage transformation as the waveform.', locations: ['sections.vertical-voltage-scale.body', 'visualDemonstrations.calibration-grid.description'], basis: 'project-behavior' },
        { id: 'logical-grid-is-not-screen-mm', statement: 'Simulator logical millimetres and SVG units do not guarantee physical millimetres on a browser screen.', locations: ['sections.vertical-voltage-scale.body', 'keyTakeaways[2]'], basis: 'project-behavior' },
        { id: 'simulator-grid-coordinate-units', statement: 'The simulator grid uses logical 1-unit minor spacing and 5-unit major spacing.', locations: ['sections.read-the-grid.body'], basis: 'project-behavior' },
      ],
      sourceReferences: [
        beckerReference('paper-speed-and-gain', ['paper-speed-time-scale', 'gain-voltage-scale', 'standard-grid-units']),
        kligfieldReference('paper-speed-and-gain', ['paper-speed-time-scale', 'gain-voltage-scale']),
      ],
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
      parentLessonId: 'learn.what-an-ecg-measures',
      claims: [
        { id: 'ecg-surface-potential-over-time', statement: 'An ECG displays changes in electrical potentials detected at the body surface over time.', locations: ['prompt', 'choices.electrical-over-time', 'correctAnswerIds', 'explanation'], basis: 'external-source' },
        { id: 'ecg-not-mechanical-measurement', statement: 'An ECG is not a direct measurement of mechanical contraction.', locations: ['choices.mechanical-contraction', 'explanation'], basis: 'external-source' },
        { id: 'ecg-not-blood-flow-measurement', statement: 'An ECG is not a direct measurement of blood flow.', locations: ['choices.blood-flow', 'explanation'], basis: 'external-source' },
      ],
      sourceReferences: [
        beckerReference('what-ecg-measures', ['ecg-surface-potential-over-time', 'ecg-not-mechanical-measurement']),
        kligfieldReference('what-ecg-measures', ['ecg-surface-potential-over-time']),
      ],
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
      parentLessonId: 'learn.electrodes-versus-leads',
      claims: [
        { id: 'electrode-is-physical-contact', statement: 'An electrode is a physical recording contact; a lead is a view derived from electrode measurements.', locations: ['prompt', 'choices.contact-and-view', 'explanation'], basis: 'external-source' },
        { id: 'views-can-exceed-electrodes', statement: 'Lead views are not in one-to-one correspondence with physical electrode contacts.', locations: ['choices.one-trace-per-electrode', 'explanation'], basis: 'external-source' },
      ],
      sourceReferences: [
        beckerReference('electrodes-versus-leads', ['electrode-is-physical-contact', 'views-can-exceed-electrodes']),
        kligfieldReference('electrodes-versus-leads', ['electrode-is-physical-contact', 'views-can-exceed-electrodes']),
      ],
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
      parentLessonId: 'learn.paper-speed-and-gain',
      claims: [
        { id: 'paper-speed-time-scale', statement: 'At 25 mm/s, 5 mm of horizontal paper distance represents 200 ms.', locations: ['prompt', 'choices.200-ms', 'correctAnswerIds', 'explanation'], basis: 'external-source' },
      ],
      sourceReferences: [
        beckerReference('paper-speed-and-gain', ['paper-speed-time-scale']),
        kligfieldReference('paper-speed-and-gain', ['paper-speed-time-scale']),
      ],
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

