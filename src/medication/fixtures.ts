import type { MedicationRecord } from '../content/types';
import { medicationDrafts } from './records';

/**
 * TEST FIXTURE ONLY. A copy of a draft record dressed with an invented reviewer and a placeholder
 * reference, to prove that a record that passes every gate is published and shown. Nothing here is a
 * real review, source or approval, and this module must never be imported by application code.
 */
export function fullyReviewedFixture(): MedicationRecord {
  const record = structuredClone(medicationDrafts[0]);
  const claimIds = (record.claims ?? []).map(claim => claim.id);
  record.sourceReferences = [{
    id: 'ref.test-fixture',
    title: 'Test fixture reference (not a real source)',
    kind: 'other',
    licence: { reuse: 'permitted', redistribution: 'permitted', modification: 'permitted' },
    supports: claimIds.map(claimId => ({ kind: 'claim' as const, claimId })),
    verificationStatus: 'source-and-rights-verified',
  }];
  const review = (reviewType: 'educational-content' | 'source-and-licensing' | 'medical-content' | 'publication-approval') => ({
    contentId: record.id,
    reviewType,
    status: 'approved' as const,
    versionReviewed: record.version,
    scope: { completeRecord: true, claimIds, referenceIds: ['ref.test-fixture'] },
    reviewer: { displayName: 'Test Reviewer (fixture)', qualifications: 'Test fixture qualification' },
    reviewedAt: '2026-10-21',
    requiredFollowUp: [],
  });
  record.reviewRecords = [review('educational-content'), review('source-and-licensing'), review('medical-content'), review('publication-approval')];
  record.publicationStatus = 'published';
  return record;
}
