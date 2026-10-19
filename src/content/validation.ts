import { contentRecordSchema } from './schema';
import type { ContentRecord, ContentReviewRecord } from './types';

export type ContentIssue = { path: string; message: string };
export type ContentValidationResult =
  | { success: true; data: ContentRecord; issues: [] }
  | { success: false; issues: ContentIssue[] };

export type PublicationReadiness = {
  eligible: boolean;
  checks: {
    technicalSchema: boolean;
    sourceAndLicensing: boolean;
    educationalReview: boolean;
    medicalContentReview: boolean;
    publicationApproval: boolean;
    limitationsAndExplanation: boolean;
  };
  issues: ContentIssue[];
};

const parseStructure = (input: unknown) => contentRecordSchema.safeParse(input);

function reviewForCurrentVersion(record: ContentRecord, type: ContentReviewRecord['reviewType']): ContentReviewRecord | undefined {
  return record.reviewRecords.find(review =>
    review.reviewType === type && review.status === 'approved' && review.versionReviewed === record.version,
  );
}

function hasNamedDatedReview(record: ContentRecord, type: ContentReviewRecord['reviewType'], needsQualifications = false): boolean {
  const review = reviewForCurrentVersion(record, type);
  return Boolean(review && review.status === 'approved' && review.reviewer.displayName.trim() && review.reviewedAt &&
    (!needsQualifications || review.reviewer.qualifications?.trim()));
}

function provenanceRightsAreExplicitAndPermitted(record: ContentRecord): boolean {
  const provenance = record.provenance;
  if (provenance.kind === 'text-only-explanation') return true;
  const rights = provenance.usageRights;
  const canRedistribute = rights.reuse === 'permitted' && rights.redistribution === 'permitted';
  const isTransformed = 'signal' in provenance && provenance.signal?.signalStatus === 'transformed';
  const illustrationIsTransformed = provenance.kind === 'external-educational-illustration' &&
    provenance.signal?.signalStatus === 'transformed';
  return canRedistribute && (!(isTransformed || illustrationIsTransformed) || rights.modification === 'permitted');
}

export function getPublicationReadiness(input: unknown, relatedRecords: ContentRecord[] = []): PublicationReadiness {
  const parsed = parseStructure(input);
  if (!parsed.success) {
    return {
      eligible: false,
      checks: {
        technicalSchema: false,
        sourceAndLicensing: false,
        educationalReview: false,
        medicalContentReview: false,
        publicationApproval: false,
        limitationsAndExplanation: false,
      },
      issues: parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
    };
  }

  const record = parsed.data;
  const clinical = record.contentDomain === 'clinical-education';
  const referencesVerified = record.sourceReferences.every(reference => reference.verificationStatus !== 'unverified');
  const sourceReviewComplete = !clinical || hasNamedDatedReview(record, 'source-and-licensing');
  const sourceAndLicensing = provenanceRightsAreExplicitAndPermitted(record) && referencesVerified &&
    (!clinical || (record.sourceReferences.length > 0 && sourceReviewComplete));
  const educationalReview = hasNamedDatedReview(record, 'educational-content');
  const medicalContentReview = !clinical || hasNamedDatedReview(record, 'medical-content', true);
  const publicationApproval = hasNamedDatedReview(record, 'publication-approval');
  const limitationsAndExplanation = !clinical || (
    record.knownLimitations.length > 0 &&
    (record.type !== 'case' || Boolean(record.caseMaterial.explanation.trim()))
  );

  let waveformLinkIsReady = true;
  if (record.type === 'case' && record.caseMaterial.waveformContentId) {
    const waveform = relatedRecords.find(item => item.id === record.caseMaterial.waveformContentId);
    waveformLinkIsReady = Boolean(waveform && waveform.type === 'waveform' && waveform.publicationStatus === 'published' &&
      getPublicationReadiness(waveform, relatedRecords).eligible);
  }

  const checks = {
    technicalSchema: true,
    sourceAndLicensing: sourceAndLicensing && waveformLinkIsReady,
    educationalReview,
    medicalContentReview,
    publicationApproval,
    limitationsAndExplanation,
  };
  const issues: ContentIssue[] = [];
  const descriptions: Record<keyof typeof checks, string> = {
    technicalSchema: 'Content must pass runtime schema validation.',
    sourceAndLicensing: 'Provenance rights and applicable source/licensing checks must be explicit and approved.',
    educationalReview: 'An identified reviewer must approve the current content version for educational use.',
    medicalContentReview: 'Clinical education requires an identified, qualified reviewer for the current version.',
    publicationApproval: 'An identified reviewer must separately approve publication of the current version.',
    limitationsAndExplanation: 'Clinical content requires a clear explanation and stated limitations.',
  };
  for (const [check, passed] of Object.entries(checks) as [keyof typeof checks, boolean][]) {
    if (!passed) issues.push({ path: check, message: descriptions[check] });
  }
  return { eligible: issues.length === 0, checks, issues };
}

export function validateContentRecord(input: unknown, relatedRecords: ContentRecord[] = []): ContentValidationResult {
  const parsed = parseStructure(input);
  if (!parsed.success) {
    return { success: false, issues: parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) };
  }
  if (parsed.data.publicationStatus === 'published') {
    const readiness = getPublicationReadiness(parsed.data, relatedRecords);
    if (!readiness.eligible) {
      return { success: false, issues: readiness.issues.map(issue => ({ path: `publicationStatus.${issue.path}`, message: issue.message })) };
    }
  }
  return { success: true, data: parsed.data, issues: [] };
}

const allowedTransitions: Record<ContentRecord['publicationStatus'], readonly ContentRecord['publicationStatus'][]> = {
  draft: ['awaiting-review'],
  'awaiting-review': ['draft', 'reviewed-for-educational-use'],
  'reviewed-for-educational-use': ['awaiting-review', 'published', 'retired'],
  published: ['retired'],
  retired: [],
};

export type TransitionResult =
  | { success: true; record: ContentRecord }
  | { success: false; issues: ContentIssue[] };

export function transitionPublicationStatus(
  input: unknown,
  nextStatus: ContentRecord['publicationStatus'],
  at: string,
  relatedRecords: ContentRecord[] = [],
): TransitionResult {
  const validated = validateContentRecord(input, relatedRecords);
  if (!validated.success) return validated;
  if (typeof at !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(at)) {
    return { success: false, issues: [{ path: 'updatedAt', message: 'Transition time must be an ISO 8601 timestamp with an explicit timezone.' }] };
  }
  const timestamp = new Date(at);
  if (!Number.isFinite(timestamp.getTime()) || !/(Z|[+-]\d{2}:\d{2})$/.test(at)) {
    return { success: false, issues: [{ path: 'updatedAt', message: 'Transition time must be a valid ISO 8601 timestamp with an explicit timezone.' }] };
  }
  if (!allowedTransitions[validated.data.publicationStatus].includes(nextStatus)) {
    return { success: false, issues: [{ path: 'publicationStatus', message: `Transition from ${validated.data.publicationStatus} to ${nextStatus} is not allowed.` }] };
  }
  const candidate = { ...validated.data, publicationStatus: nextStatus, updatedAt: timestamp.toISOString() };
  const result = validateContentRecord(candidate, relatedRecords);
  if (!result.success) return result;
  if (nextStatus === 'published' && !getPublicationReadiness(candidate, relatedRecords).eligible) {
    return { success: false, issues: getPublicationReadiness(candidate, relatedRecords).issues };
  }
  return { success: true, record: result.data };
}
