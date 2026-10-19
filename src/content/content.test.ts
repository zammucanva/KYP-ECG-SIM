import { describe, expect, it, vi } from 'vitest';
import { contentRecordSchema } from './schema';
import { loadContentRegistry } from './registry';
import { draftClinicalCaseShell, draftWaveformFixture, invalidContentFixture, starterContentFixtures, validEducationalFixture } from './fixtures';
import { getPublicationReadiness, transitionPublicationStatus, validateContentRecord } from './validation';
import type { ContentRecord } from './types';

describe('educational content schema and governance', () => {
  it('accepts the clearly labelled non-clinical lesson, waveform metadata and unpublished case shell', () => {
    for (const fixture of starterContentFixtures) {
      expect(contentRecordSchema.safeParse(fixture).success).toBe(true);
    }
    expect(draftClinicalCaseShell.publicationStatus).toBe('draft');
    expect(draftClinicalCaseShell.reviewRecords).toEqual([]);
    expect(draftWaveformFixture.provenance.kind).toBe('synthetic-ecg');
    expect(draftWaveformFixture.knownLimitations[0]).toContain('not clinically validated');
  });

  it('rejects missing IDs, unknown content kinds, and malformed provenance', () => {
    expect(validateContentRecord(invalidContentFixture).success).toBe(false);
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, type: 'article' }).success).toBe(false);
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, provenance: { kind: 'patient-data' } }).success).toBe(false);
  });

  it('requires actual reviewer identity and a date for an approved review', () => {
    const withUnsubstantiatedApproval: unknown = {
      ...validEducationalFixture,
      reviewRecords: [{ reviewType: 'medical-content', status: 'approved', versionReviewed: '0.1.0', requiredFollowUp: [] }],
    };
    expect(validateContentRecord(withUnsubstantiatedApproval).success).toBe(false);
  });

  it('accepts timezone-qualified ISO timestamps and rejects invalid or contradictory dates', () => {
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, createdAt: '19/10/2026' }).success).toBe(false);
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, updatedAt: '2026-10-18T12:00:00Z' }).success).toBe(false);
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, lastReviewedAt: '2026-10-20' }).success).toBe(false);
  });

  it('validates source reference URLs, provenance-supported units, and reasonable waveform bounds', () => {
    const reference = {
      id: 'ref.interface-guide',
      title: 'Example reference record for schema testing',
      kind: 'textbook',
      supports: [{ kind: 'objective', objectiveId: 'coordinate-units' }],
      verificationStatus: 'unverified',
      url: 'not a URL',
    };
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, sourceReferences: [reference] }).success).toBe(false);
    expect(contentRecordSchema.safeParse({
      ...validEducationalFixture,
      sourceReferences: [{ ...reference, kind: 'primary-guideline', url: undefined }],
    }).success).toBe(false);
    expect(contentRecordSchema.safeParse({
      ...validEducationalFixture,
      sourceReferences: [{ ...reference, kind: 'licensed-dataset', url: undefined }],
    }).success).toBe(false);
    expect(contentRecordSchema.safeParse({
      ...validEducationalFixture,
      sourceReferences: [{
        ...reference,
        url: undefined,
        verificationStatus: 'source-and-rights-verified',
        licence: { reuse: 'unknown', redistribution: 'unknown', modification: 'unknown' },
      }],
    }).success).toBe(false);
    const unsupportedObjective = {
      ...reference,
      url: undefined,
      supports: [{ kind: 'objective', objectiveId: 'missing-objective' }],
    };
    expect(contentRecordSchema.safeParse({ ...validEducationalFixture, sourceReferences: [unsupportedObjective] }).success).toBe(false);

    const waveform = draftWaveformFixture;
    const invalidUnit = { ...waveform, provenance: { ...waveform.provenance, signal: { ...waveform.provenance.signal, voltageUnit: 'volts' } } };
    expect(contentRecordSchema.safeParse(invalidUnit).success).toBe(false);
    const invalidCalibration = { ...waveform, provenance: { ...waveform.provenance, signal: { ...waveform.provenance.signal, calibration: { paperSpeedMmPerSecond: 25, gainMmPerMv: 17 } } } };
    expect(contentRecordSchema.safeParse(invalidCalibration).success).toBe(false);
    const invalidRate = { ...waveform, provenance: { ...waveform.provenance, signal: { ...waveform.provenance.signal, sampleRateHz: 0 } } };
    expect(contentRecordSchema.safeParse(invalidRate).success).toBe(false);
  });

  it('requires a waveform technical record and preprocessing disclosure when transformed', () => {
    const waveform = draftWaveformFixture;
    const { calibration: _calibration, ...withoutCalibration } = waveform.provenance.signal;
    const missingCalibration: unknown = {
      ...waveform,
      provenance: { ...waveform.provenance, signal: withoutCalibration },
    };
    expect(validateContentRecord(missingCalibration).success).toBe(false);
    const transformedWithoutSteps: unknown = {
      ...waveform,
      provenance: { ...waveform.provenance, signal: { ...waveform.provenance.signal, signalStatus: 'transformed' } },
    };
    expect(validateContentRecord(transformedWithoutSteps).success).toBe(false);
  });

  it('rejects question answer keys that do not reference unique listed choices', () => {
    const { lessonContent: _lessonContent, ...common } = validEducationalFixture;
    const malformedQuestion: unknown = {
      ...common,
      type: 'question',
      questionType: 'single-best-answer',
      prompt: 'Schema fixture prompt; not a clinical question.',
      choices: [{ id: 'answer-a', text: 'Option A' }, { id: 'answer-b', text: 'Option B' }],
      correctAnswerIds: ['not-a-choice'],
      explanation: 'Fixture explanation only.',
    };
    expect(validateContentRecord(malformedQuestion).success).toBe(false);
  });

  it('blocks clinical publication until source, medical and publication reviews are independently documented', () => {
    const attemptedPublication: ContentRecord = { ...draftClinicalCaseShell, publicationStatus: 'published' };
    const readiness = getPublicationReadiness(attemptedPublication);
    expect(readiness.eligible).toBe(false);
    expect(readiness.checks.technicalSchema).toBe(true);
    expect(readiness.checks.sourceAndLicensing).toBe(false);
    expect(readiness.checks.medicalContentReview).toBe(false);
    expect(readiness.checks.publicationApproval).toBe(false);
    expect(validateContentRecord(attemptedPublication).success).toBe(false);
    const nonClinicalPublication: ContentRecord = { ...validEducationalFixture, publicationStatus: 'published' };
    expect(getPublicationReadiness(nonClinicalPublication).checks.technicalSchema).toBe(true);
    expect(getPublicationReadiness(nonClinicalPublication).checks.educationalReview).toBe(false);
    expect(getPublicationReadiness(nonClinicalPublication).checks.publicationApproval).toBe(false);
    expect(validateContentRecord(nonClinicalPublication).success).toBe(false);
    expect(transitionPublicationStatus(validEducationalFixture, 'published', '2026-10-19T13:00:00Z').success).toBe(false);
  });

  it('enforces workflow transitions and a pending review record before entering review', () => {
    const pending: ContentRecord = {
      ...validEducationalFixture,
      publicationStatus: 'awaiting-review',
      reviewRecords: [{ reviewType: 'educational-content', status: 'pending', versionReviewed: '0.1.0', requiredFollowUp: [] }],
    };
    expect(validateContentRecord(pending).success).toBe(true);
    const draftWithPendingRecord: ContentRecord = { ...validEducationalFixture, reviewRecords: pending.reviewRecords };
    const transition = transitionPublicationStatus(draftWithPendingRecord, 'awaiting-review', '2026-10-19T13:00:00Z');
    expect(transition.success).toBe(true);
    expect(transition.success && transition.record.publicationStatus).toBe('awaiting-review');
    expect(transitionPublicationStatus(pending, 'draft', '2026-10-19T13:00:00Z').success).toBe(true);
    expect(transitionPublicationStatus(pending, 'retired', '2026-10-19T13:00:00Z').success).toBe(false);
  });

  it('withholds invalid, duplicate and unresolved cross-linked content while returning developer issues', () => {
    const logger = vi.fn();
    const wrongContainer = loadContentRegistry(null, logger);
    expect(wrongContainer.published).toEqual([]);
    expect(wrongContainer.rejected[0].issues[0].message).toContain('must be an array');
    const duplicate = loadContentRegistry([validEducationalFixture, validEducationalFixture], logger);
    expect(duplicate.records).toEqual([]);
    expect(duplicate.published).toEqual([]);
    expect(duplicate.rejected).toHaveLength(2);
    expect(logger).toHaveBeenCalled();

    const unresolvedCase: ContentRecord = {
      ...draftClinicalCaseShell,
      id: 'fixture.unresolved-waveform-case',
      caseMaterial: { ...draftClinicalCaseShell.caseMaterial, waveformContentId: 'missing.waveform' },
    };
    const registry = loadContentRegistry([...starterContentFixtures, invalidContentFixture, unresolvedCase]);
    expect(registry.records).toHaveLength(3);
    expect(registry.published).toEqual([]);
    expect(registry.rejected).toHaveLength(2);
    expect(registry.issues.some(issue => issue.message.includes('Referenced waveform'))).toBe(true);
  });
});
