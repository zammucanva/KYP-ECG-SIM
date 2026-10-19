import { z } from 'zod';
import { sourceReferenceSchema } from './references';

export const contentIdSchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
export const contentVersionSchema = z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);

const text = z.string().trim().min(1).max(20_000);
const shortText = z.string().trim().min(1).max(500);
const paperSpeedSchema = z.union([z.literal(12.5), z.literal(25), z.literal(50)]);
const gainSchema = z.union([z.literal(5), z.literal(10), z.literal(20)]);
const leadSchema = z.enum(['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']);
const permissionSchema = z.enum(['permitted', 'not-permitted', 'unknown']);

export const publicationStatuses = [
  'draft',
  'awaiting-review',
  'reviewed-for-educational-use',
  'published',
  'retired',
] as const;

const reviewerSchema = z.strictObject({
  displayName: shortText,
  qualifications: shortText.optional(),
});

const reviewFields = {
  reviewType: z.enum(['educational-content', 'source-and-licensing', 'medical-content', 'publication-approval']),
  versionReviewed: contentVersionSchema,
  notes: text.optional(),
  requiredFollowUp: z.array(shortText).max(50),
};

export const reviewRecordSchema = z.discriminatedUnion('status', [
  z.strictObject({
    ...reviewFields,
    status: z.literal('approved'),
    reviewer: reviewerSchema,
    reviewedAt: z.iso.date(),
  }),
  z.strictObject({
    ...reviewFields,
    status: z.enum(['pending', 'rejected', 'changes-requested']),
    reviewer: reviewerSchema.optional(),
    reviewedAt: z.iso.date().optional(),
  }),
]);

const usageRightsSchema = z.strictObject({
  licenceName: shortText.optional(),
  reuse: permissionSchema,
  redistribution: permissionSchema,
  modification: permissionSchema,
  termsUrl: z.httpUrl().optional(),
});

export const waveformCalibrationSchema = z.strictObject({
  paperSpeedMmPerSecond: paperSpeedSchema,
  gainMmPerMv: gainSchema,
});

export const signalMetadataSchema = z.strictObject({
  sampleRateHz: z.number().finite().min(1).max(100_000),
  recordingDurationMs: z.number().finite().min(1).max(86_400_000),
  leadOrder: z.array(leadSchema).min(1).max(12),
  voltageUnit: z.enum(['mV', 'µV']),
  timestampUnit: z.literal('ms'),
  calibration: waveformCalibrationSchema,
  preprocessing: z.array(shortText).max(50),
  signalStatus: z.enum(['original', 'transformed']),
}).superRefine((metadata, context) => {
  if (new Set(metadata.leadOrder).size !== metadata.leadOrder.length) {
    context.addIssue({ code: 'custom', path: ['leadOrder'], message: 'Lead names must be unique and preserve their recording order.' });
  }
  if (metadata.signalStatus === 'transformed' && metadata.preprocessing.length === 0) {
    context.addIssue({ code: 'custom', path: ['preprocessing'], message: 'Transformed signals must describe their preprocessing steps.' });
  }
  if (metadata.signalStatus === 'original' && metadata.preprocessing.length > 0) {
    context.addIssue({ code: 'custom', path: ['signalStatus'], message: 'A signal with preprocessing steps must be marked transformed.' });
  }
});

const syntheticEcgProvenance = z.strictObject({
  kind: z.literal('synthetic-ecg'),
  generatorId: shortText,
  signal: signalMetadataSchema,
  usageRights: usageRightsSchema,
  sourceUrl: z.httpUrl().optional(),
  datasetId: shortText.optional(),
});

const licensedEcgProvenance = z.strictObject({
  kind: z.literal('licensed-real-ecg'),
  sourceIdentifier: shortText,
  sourceUrl: z.httpUrl().optional(),
  datasetId: shortText.optional(),
  signal: signalMetadataSchema,
  usageRights: usageRightsSchema,
}).refine(item => Boolean(item.sourceUrl || item.datasetId), {
  path: ['sourceUrl'],
  message: 'A real ECG recording must identify its source URL or dataset ID.',
});

const authorizedPatientEcgProvenance = z.strictObject({
  kind: z.literal('authorized-deidentified-patient-ecg'),
  sourceIdentifier: shortText,
  sourceUrl: z.httpUrl().optional(),
  datasetId: shortText.optional(),
  authorizationReference: shortText,
  deidentificationMethod: shortText,
  signal: signalMetadataSchema,
  usageRights: usageRightsSchema,
}).refine(item => Boolean(item.sourceUrl || item.datasetId), {
  path: ['sourceUrl'],
  message: 'A patient-derived recording must identify its authorized source or dataset.',
});

export const provenanceSchema = z.discriminatedUnion('kind', [
  syntheticEcgProvenance,
  licensedEcgProvenance,
  authorizedPatientEcgProvenance,
  z.strictObject({
    kind: z.literal('synthetic-illustration'),
    generatorId: shortText,
    usageRights: usageRightsSchema,
    signalMetadataOmissionReason: shortText,
  }),
  z.strictObject({
    kind: z.literal('external-educational-illustration'),
    sourceIdentifier: shortText,
    sourceUrl: z.httpUrl().optional(),
    usageRights: usageRightsSchema,
    signal: signalMetadataSchema.optional(),
    signalMetadataOmissionReason: shortText.optional(),
  }).refine(item => Boolean(item.signal || item.signalMetadataOmissionReason), {
    path: ['signalMetadataOmissionReason'],
    message: 'If signal metadata is unavailable, explain why it is absent.',
  }),
  z.strictObject({
    kind: z.literal('text-only-explanation'),
    signalMetadataOmissionReason: shortText,
  }),
]);

const objectiveSchema = z.strictObject({ id: contentIdSchema, statement: shortText });
const lessonSectionSchema = z.strictObject({
  id: contentIdSchema,
  title: shortText,
  body: text,
  demonstrationId: contentIdSchema.optional(),
});
const lessonKeyTermSchema = z.strictObject({ term: shortText, definition: text });
const demonstrationBase = {
  id: contentIdSchema,
  title: shortText,
  description: shortText,
};
const annotationSchema = z.strictObject({
  label: shortText,
  startMs: z.number().finite().min(0).max(10_000),
  endMs: z.number().finite().min(0).max(10_000),
}).refine(annotation => annotation.startMs < annotation.endMs, {
  path: ['endMs'],
  message: 'An annotation must end after it starts.',
});

export const visualDemonstrationSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...demonstrationBase, kind: z.literal('calibration-explorer') }),
  z.strictObject({
    ...demonstrationBase,
    kind: z.literal('limb-lead-relationships'),
    leads: z.array(leadSchema).min(2).max(6),
  }),
  z.strictObject({
    ...demonstrationBase,
    kind: z.literal('waveform-components'),
    lead: leadSchema,
    annotations: z.array(annotationSchema).min(1).max(20),
  }),
  z.strictObject({
    ...demonstrationBase,
    kind: z.literal('rr-rate'),
    initialRrMs: z.number().finite().int().min(300).max(3000),
  }),
]);

export const lessonContentSchema = z.strictObject({
  sequence: z.number().int().min(1).max(10_000),
  prerequisiteIds: z.array(contentIdSchema).max(30),
  sections: z.array(lessonSectionSchema).min(1).max(50),
  keyTerms: z.array(lessonKeyTermSchema).max(50),
  keyTakeaways: z.array(shortText).min(1).max(30),
  visualDemonstrations: z.array(visualDemonstrationSchema).min(1).max(10),
  knowledgeCheckIds: z.array(contentIdSchema).min(1).max(20),
}).superRefine((lesson, context) => {
  const sectionIds = lesson.sections.map(section => section.id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Lesson section IDs must be unique.' });
  }
  const demonstrationIds = lesson.visualDemonstrations.map(demonstration => demonstration.id);
  if (new Set(demonstrationIds).size !== demonstrationIds.length) {
    context.addIssue({ code: 'custom', path: ['visualDemonstrations'], message: 'Demonstration IDs must be unique within a lesson.' });
  }
  if (lesson.sections.some(section => section.demonstrationId && !demonstrationIds.includes(section.demonstrationId))) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Every section demonstration link must resolve within this lesson.' });
  }
  if (new Set(lesson.prerequisiteIds).size !== lesson.prerequisiteIds.length) {
    context.addIssue({ code: 'custom', path: ['prerequisiteIds'], message: 'Prerequisite lesson IDs must be unique.' });
  }
  if (new Set(lesson.knowledgeCheckIds).size !== lesson.knowledgeCheckIds.length) {
    context.addIssue({ code: 'custom', path: ['knowledgeCheckIds'], message: 'Knowledge-check question IDs must be unique.' });
  }
});

const commonFields = {
  id: contentIdSchema,
  title: shortText,
  summary: shortText,
  learningObjectives: z.array(objectiveSchema).min(1).max(20),
  difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
  tags: z.array(z.string().trim().min(1).max(50)).max(30),
  contentDomain: z.enum(['non-clinical-education', 'clinical-education']),
  publicationStatus: z.enum(publicationStatuses),
  provenance: provenanceSchema,
  sourceReferences: z.array(sourceReferenceSchema).max(100),
  reviewRecords: z.array(reviewRecordSchema).max(100),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  lastReviewedAt: z.iso.date().optional(),
  version: contentVersionSchema,
  knownLimitations: z.array(shortText).max(50),
  deprecation: z.strictObject({
    deprecatedAt: z.iso.date(),
    replacedBy: contentIdSchema.optional(),
    reason: shortText,
  }).optional(),
};

const commonContentSchema = {
  ...commonFields,
  type: z.literal('lesson'),
  lessonContent: lessonContentSchema,
};

const questionChoiceSchema = z.strictObject({ id: contentIdSchema, text: shortText });
const questionContentSchema = z.strictObject({
  ...commonFields,
  type: z.literal('question'),
  questionType: z.enum(['single-best-answer', 'multiple-select']),
  prompt: text,
  choices: z.array(questionChoiceSchema).min(2).max(12),
  correctAnswerIds: z.array(contentIdSchema).min(1).max(12),
  explanation: text,
}).superRefine((question, context) => {
  const choiceIds = question.choices.map(choice => choice.id);
  if (new Set(choiceIds).size !== choiceIds.length) {
    context.addIssue({ code: 'custom', path: ['choices'], message: 'Question choice IDs must be unique.' });
  }
  if (new Set(question.correctAnswerIds).size !== question.correctAnswerIds.length || question.correctAnswerIds.some(id => !choiceIds.includes(id))) {
    context.addIssue({ code: 'custom', path: ['correctAnswerIds'], message: 'Every answer key must be a unique ID belonging to a listed choice.' });
  }
  if (question.questionType === 'single-best-answer' && question.correctAnswerIds.length !== 1) {
    context.addIssue({ code: 'custom', path: ['correctAnswerIds'], message: 'A single-best-answer question must have exactly one correct answer.' });
  }
});

const caseContentSchema = z.strictObject({
  ...commonFields,
  type: z.literal('case'),
  contentDomain: z.literal('clinical-education'),
  caseMaterial: z.strictObject({
    context: text,
    findings: z.array(shortText).min(1).max(100),
    prompt: text,
    answer: z.strictObject({ text: text, rationale: text }),
    explanation: text,
    waveformContentId: contentIdSchema.optional(),
  }),
});

const waveformContentSchema = z.strictObject({
  ...commonFields,
  type: z.literal('waveform'),
  contentDomain: z.enum(['non-clinical-education', 'clinical-education']),
}).refine(item => ['synthetic-ecg', 'licensed-real-ecg', 'authorized-deidentified-patient-ecg'].includes(item.provenance.kind), {
  path: ['provenance'],
  message: 'Waveform examples require an explicit ECG signal provenance and technical metadata record.',
});

const lessonRecordSchema = z.strictObject(commonContentSchema);

export const contentRecordSchema = z.discriminatedUnion('type', [
  lessonRecordSchema,
  questionContentSchema,
  caseContentSchema,
  waveformContentSchema,
]).superRefine((record, context) => {
  const created = Date.parse(record.createdAt);
  const updated = Date.parse(record.updatedAt);
  if (updated < created) {
    context.addIssue({ code: 'custom', path: ['updatedAt'], message: 'updatedAt must not be earlier than createdAt.' });
  }
  if (record.lastReviewedAt && Date.parse(`${record.lastReviewedAt}T00:00:00Z`) > updated) {
    context.addIssue({ code: 'custom', path: ['lastReviewedAt'], message: 'lastReviewedAt must not be later than updatedAt.' });
  }
  record.reviewRecords.forEach((review, reviewIndex) => {
    if (review.reviewedAt && Date.parse(`${review.reviewedAt}T00:00:00Z`) > updated) {
      context.addIssue({ code: 'custom', path: ['reviewRecords', reviewIndex, 'reviewedAt'], message: 'A review date must not be later than updatedAt.' });
    }
  });
  if (record.deprecation && Date.parse(`${record.deprecation.deprecatedAt}T00:00:00Z`) > updated) {
    context.addIssue({ code: 'custom', path: ['deprecation', 'deprecatedAt'], message: 'A deprecation date must not be later than updatedAt.' });
  }

  const objectiveIds = new Set(record.learningObjectives.map(objective => objective.id));
  if (objectiveIds.size !== record.learningObjectives.length) {
    context.addIssue({ code: 'custom', path: ['learningObjectives'], message: 'Learning objective IDs must be unique within a record.' });
  }
  if (new Set(record.tags).size !== record.tags.length) {
    context.addIssue({ code: 'custom', path: ['tags'], message: 'Tags must be unique within a record.' });
  }
  const referenceIds = record.sourceReferences.map(reference => reference.id);
  if (new Set(referenceIds).size !== referenceIds.length) {
    context.addIssue({ code: 'custom', path: ['sourceReferences'], message: 'Source reference IDs must be unique within a record.' });
  }
  record.sourceReferences.forEach((reference, referenceIndex) => {
    reference.supports.forEach((link, linkIndex) => {
      if (link.kind === 'objective' && !objectiveIds.has(link.objectiveId)) {
        context.addIssue({
          code: 'custom',
          path: ['sourceReferences', referenceIndex, 'supports', linkIndex],
          message: `Source support points to unknown learning objective "${link.objectiveId}".`,
        });
      }
    });
  });
  if (record.publicationStatus === 'reviewed-for-educational-use' && !record.reviewRecords.some(review =>
    review.reviewType === 'educational-content' && review.status === 'approved' && review.versionReviewed === record.version,
  )) {
    context.addIssue({ code: 'custom', path: ['reviewRecords'], message: 'The reviewed-for-educational-use state requires an approved educational-content review for the current version.' });
  }
  if (record.publicationStatus === 'awaiting-review' && !record.reviewRecords.some(review =>
    review.reviewType === 'educational-content' && review.status === 'pending' && review.versionReviewed === record.version,
  )) {
    context.addIssue({ code: 'custom', path: ['reviewRecords'], message: 'The awaiting-review state requires a pending educational-content review for the current version.' });
  }
  if (record.contentDomain === 'clinical-education' && record.knownLimitations.length === 0) {
    context.addIssue({ code: 'custom', path: ['knownLimitations'], message: 'Clinical education content must state known limitations before it can proceed through review.' });
  }
});

export type ContentRecord = z.infer<typeof contentRecordSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;
export type VisualDemonstration = z.infer<typeof visualDemonstrationSchema>;
