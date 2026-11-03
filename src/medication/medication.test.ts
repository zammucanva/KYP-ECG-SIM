import { describe, expect, it } from 'vitest';
import { loadContentRegistry } from '../content/registry';
import { contentRecordSchema, looksLikeDosingOrPrescribing } from '../content/schema';
import type { MedicationRecord } from '../content/types';
import { getPublicationReadiness, transitionPublicationStatus, validateContentRecord } from '../content/validation';
import { fullyReviewedFixture } from './fixtures';
import { medicationDrafts } from './records';
import { allValidMedications, isPreviewRequested, medicationRegistry, publishedMedications, visibleMedications } from './registry';
import { MAX_QUERY_LENGTH, missingSectionKinds, resolveRelated, reviewStatusLabel, searchMedications, sectionEvidence, type MedicationGroup } from './search';

const clone = <T,>(value: T): T => structuredClone(value);
const metoprolol = () => clone(medicationDrafts[0]);
const mutate = (change: (record: MedicationRecord) => void) => { const record = metoprolol(); change(record); return record; };
const parses = (record: unknown) => contentRecordSchema.safeParse(record).success;

describe('draft medication records and publication gating', () => {
  it('loads every draft through the content registry with nothing rejected and nothing published', () => {
    expect(medicationRegistry.rejected).toEqual([]);
    expect(medicationRegistry.issues).toEqual([]);
    expect(allValidMedications()).toHaveLength(medicationDrafts.length);
    expect(publishedMedications()).toEqual([]);
    expect(visibleMedications(medicationRegistry, false)).toEqual([]);
    expect(visibleMedications(medicationRegistry, true)).toHaveLength(medicationDrafts.length);
  });

  it('keeps every draft clinical, unreviewed, unsourced and free of doses, safety and interaction text', () => {
    for (const record of medicationDrafts) {
      expect(record.contentDomain).toBe('clinical-education');
      expect(record.publicationStatus).toBe('draft');
      expect(record.reviewRecords).toEqual([]);
      expect(record.sourceReferences).toEqual([]);
      expect(record.lastReviewedAt).toBeUndefined();
      expect(record.claims?.every(claim => claim.basis === 'external-source')).toBe(true);
      expect(missingSectionKinds(record)).toEqual(expect.arrayContaining(['safety', 'interaction']));
      expect(record.medication.relatedContentIds).toEqual([]);
      const visible = [record.title, record.summary, ...(record.claims ?? []).map(claim => claim.statement), ...record.medication.sections.map(section => section.body)];
      expect(visible.filter(looksLikeDosingOrPrescribing)).toEqual([]);
      expect(record.knownLimitations.join(' ')).toMatch(/no doses/i);
    }
  });

  it('shows why a draft is not eligible, and refuses to publish it by changing its status', () => {
    for (const record of medicationDrafts) {
      const readiness = getPublicationReadiness(record);
      expect(readiness.eligible).toBe(false);
      expect(readiness.checks).toMatchObject({ claimSourceMapping: false, sourceAndLicensing: false, educationalReview: false, medicalContentReview: false, publicationApproval: false });
      const forced = validateContentRecord({ ...record, publicationStatus: 'published' });
      expect(forced.success).toBe(false);
      const registry = loadContentRegistry([{ ...clone(record), publicationStatus: 'published' }]);
      expect(registry.published).toEqual([]);
      expect(registry.rejected).toHaveLength(1);
      expect(transitionPublicationStatus(record, 'published', '2026-10-21T10:00:00Z').success).toBe(false);
    }
  });

  it('publishes only when source, educational, medical and publication reviews all exist for the current version (test fixture)', () => {
    const fixture = fullyReviewedFixture();
    expect(getPublicationReadiness(fixture).eligible).toBe(true);
    const registry = loadContentRegistry([fixture]);
    expect(registry.rejected).toEqual([]);
    expect(publishedMedications(registry)).toHaveLength(1);
    expect(visibleMedications(registry, false)).toHaveLength(1);

    const gates: [string, (record: MedicationRecord) => void][] = [
      ['no medical review', record => { record.reviewRecords = record.reviewRecords.filter(review => review.reviewType !== 'medical-content'); }],
      ['no publication approval', record => { record.reviewRecords = record.reviewRecords.filter(review => review.reviewType !== 'publication-approval'); }],
      ['no source review', record => { record.reviewRecords = record.reviewRecords.filter(review => review.reviewType !== 'source-and-licensing'); }],
      ['reviewer without qualifications', record => { record.reviewRecords.forEach(review => { if (review.reviewType === 'medical-content' && review.status === 'approved') review.reviewer = { displayName: 'Test Reviewer (fixture)' }; }); }],
      ['reference left unverified', record => { record.sourceReferences[0].verificationStatus = 'unverified'; }],
      ['a claim without a source mapping', record => { record.sourceReferences[0].supports = record.sourceReferences[0].supports.slice(1); }],
      ['review of an older version', record => { record.reviewRecords.forEach(review => { review.versionReviewed = '0.0.9'; }); }],
      ['review that skips a claim', record => { record.reviewRecords.forEach(review => { review.scope.claimIds = review.scope.claimIds.slice(1); }); }],
    ];
    for (const [label, change] of gates) {
      const broken = fullyReviewedFixture();
      change(broken);
      const outcome = loadContentRegistry([broken]);
      expect(publishedMedications(outcome), label).toEqual([]);
      expect(outcome.rejected.length, label).toBe(1);
    }
  });

  it('flags a medication that has been edited after review, since the review no longer matches its version', () => {
    const fixture = fullyReviewedFixture();
    fixture.version = '0.2.0';
    expect(loadContentRegistry([fixture]).published).toEqual([]);
  });
});

describe('schema rules that stop invented or unsafe content', () => {
  it('accepts a well-formed record and refuses unknown fields and non-clinical domains', () => {
    expect(parses(metoprolol())).toBe(true);
    expect(parses({ ...metoprolol(), extra: true })).toBe(false);
    expect(parses({ ...metoprolol(), contentDomain: 'non-clinical-education' })).toBe(false);
    expect(parses(mutate(record => { (record.medication as unknown as Record<string, unknown>).dose = 'x'; }))).toBe(false);
    expect(parses(mutate(record => { record.medication.drugGroup = 'sedative' as MedicationRecord['medication']['drugGroup']; }))).toBe(false);
    expect(parses(mutate(record => { record.claims = []; }))).toBe(false);
  });

  it.each([
    'Take 5 mg once a day.',
    'The usual dose is small.',
    'Doctors prescribe it often.',
    'A loading regimen is common.',
    'Give 2.5 mL slowly.',
    'It is taken twice daily.',
    'Repeat every 6 hours.',
    'Patients should take it with food.',
    'Titrate to effect.',
    'Given at 10 mcg per kg',
  ])('refuses dosing or prescribing language: %s', sentence => {
    expect(looksLikeDosingOrPrescribing(sentence)).toBe(true);
    expect(parses(mutate(record => { record.medication.sections[0].body = sentence; }))).toBe(false);
    expect(parses(mutate(record => { record.summary = sentence; }))).toBe(false);
  });

  it('allows ordinary educational wording, including numbers that are not quantities', () => {
    for (const sentence of ['Beta-blockers can slow the sinus rate.', 'The class III group prolongs repolarisation.', 'It acts on beta-1 receptors.', 'A pause of a few seconds can appear.']) {
      expect(looksLikeDosingOrPrescribing(sentence), sentence).toBe(false);
    }
  });

  it('requires safety, interaction and ECG-effect sections to have their own claim, not mechanism claims alone', () => {
    for (const kind of ['safety', 'interaction', 'ecg-effect'] as const) {
      const record = mutate(item => {
        item.medication.sections[2].kind = kind;
        item.medication.sections[2].claimIds = ['metoprolol-mechanism'];
        item.claims = item.claims?.filter(claim => claim.id !== 'beta-blocker-sinus-rate' && claim.id !== 'beta-blocker-av-conduction');
      });
      expect(parses(record), kind).toBe(false);
    }
    const withOwnClaim = mutate(item => {
      item.claims = [...(item.claims ?? []), { id: 'metoprolol-safety-claim', statement: 'A placeholder safety statement for the test.', locations: ['sections'], basis: 'external-source' }];
      item.medication.sections.push({ id: 'safety', kind: 'safety', title: 'Safety', body: 'A placeholder safety statement for the test.', claimIds: ['metoprolol-safety-claim'] });
    });
    expect(parses(withOwnClaim)).toBe(true);
  });

  it('keeps the claim inventory identical to what learners read', () => {
    expect(parses(mutate(record => { record.claims = [...(record.claims ?? []), { id: 'orphan', statement: 'Never shown.', locations: ['sections'], basis: 'external-source' }]; }))).toBe(false);
    expect(parses(mutate(record => { record.medication.sections[0].claimIds = ['no-such-claim']; }))).toBe(false);
    expect(parses(mutate(record => { record.claims![0].basis = 'project-behavior'; }))).toBe(false);
    expect(parses(mutate(record => { record.medication.sections[1].id = 'mechanism'; }))).toBe(false);
    expect(parses(mutate(record => { record.medication.sections[0].claimIds = ['metoprolol-mechanism', 'metoprolol-mechanism']; }))).toBe(false);
  });

  it('refuses a self-referencing or duplicated related-content list', () => {
    expect(parses(mutate(record => { record.medication.relatedContentIds = [record.id]; }))).toBe(false);
    expect(parses(mutate(record => { record.medication.relatedContentIds = ['learn.a', 'learn.a']; }))).toBe(false);
    expect(parses(mutate(record => { record.medication.relatedContentIds = ['learn.a']; }))).toBe(true);
  });
});

describe('search and filters', () => {
  const records = allValidMedications();
  const names = (outcome: ReturnType<typeof searchMedications>) => outcome.results.map(record => record.medication.genericName);

  it('lists everything alphabetically for an empty query', () => {
    const outcome = searchMedications(records, { text: '', group: 'all' });
    expect(names(outcome)).toEqual(['Adenosine', 'Amiodarone', 'Digoxin', 'Diltiazem', 'Metoprolol']);
    expect(outcome.emptyReason).toBeNull();
  });

  it('ranks name matches first and matches prefixes, class names and search terms', () => {
    expect(names(searchMedications(records, { text: 'amio', group: 'all' }))[0]).toBe('Amiodarone');
    expect(names(searchMedications(records, { text: 'SVT', group: 'all' }))).toEqual(['Adenosine']);
    expect(names(searchMedications(records, { text: 'beta blocker', group: 'all' }))).toEqual(['Metoprolol']);
    expect(names(searchMedications(records, { text: 'Beta-Blocker', group: 'all' }))).toEqual(['Metoprolol']);
    expect(names(searchMedications(records, { text: 'digitalis', group: 'all' }))).toEqual(['Digoxin']);
    expect(names(searchMedications(records, { text: 'antiarrhythmic', group: 'all' })).sort()).toEqual(['Adenosine', 'Amiodarone']);
  });

  it('requires every word to match, and is insensitive to case, accents and punctuation', () => {
    expect(names(searchMedications(records, { text: 'class iii amiodarone', group: 'all' }))).toEqual(['Amiodarone']);
    expect(searchMedications(records, { text: 'amiodarone metoprolol', group: 'all' }).results).toEqual([]);
    expect(names(searchMedications(records, { text: '  DILTIAZEM!!  ', group: 'all' }))).toEqual(['Diltiazem']);
    expect(names(searchMedications(records, { text: 'diltiàzem', group: 'all' }))).toEqual(['Diltiazem']);
  });

  it('filters by drug group, alone and with text', () => {
    const group: MedicationGroup = 'antiarrhythmic';
    expect(names(searchMedications(records, { text: '', group }))).toEqual(['Amiodarone']);
    expect(searchMedications(records, { text: 'adenosine', group }).results).toEqual([]);
    expect(names(searchMedications(records, { text: 'adenosine', group: 'other' }))).toEqual(['Adenosine']);
  });

  it('explains an empty result and tells nothing-available from no-match', () => {
    expect(searchMedications(records, { text: 'zzzz', group: 'all' })).toEqual({ results: [], emptyReason: 'no-match' });
    expect(searchMedications([], { text: '', group: 'all' })).toEqual({ results: [], emptyReason: 'nothing-available' });
    expect(searchMedications([], { text: 'anything', group: 'beta-blocker' }).emptyReason).toBe('nothing-available');
  });

  it('copes with hostile or oversized input without throwing', () => {
    for (const text of ['.*', '(', '[a-z]+', '\\', '<script>alert(1)</script>', '%%%', 'a'.repeat(5000), '\u0000', '😀']) {
      expect(() => searchMedications(records, { text, group: 'all' })).not.toThrow();
    }
    expect(searchMedications(records, { text: `${'x'.repeat(MAX_QUERY_LENGTH)} amiodarone`, group: 'all' }).results).toEqual([]);
    expect(names(searchMedications(records, { text: `amiodarone${' '.repeat(MAX_QUERY_LENGTH)}zzz`, group: 'all' }))).toEqual(['Amiodarone']);
  });
});

describe('evidence, related content and status labels', () => {
  it('reports exactly the evidence attached to each claim', () => {
    const draft = metoprolol();
    expect(sectionEvidence(draft, 'ecg').map(item => item.status)).toEqual(['no-source', 'no-source']);
    expect(sectionEvidence(draft, 'missing')).toEqual([]);
    const unverified = mutate(record => {
      record.sourceReferences = [{ id: 'ref.x', title: 'Placeholder', kind: 'other', supports: [{ kind: 'claim', claimId: 'beta-blocker-sinus-rate' }], verificationStatus: 'unverified' }];
    });
    expect(sectionEvidence(unverified, 'ecg').map(item => item.status)).toEqual(['unverified', 'no-source']);
    expect(sectionEvidence(fullyReviewedFixture(), 'ecg').map(item => item.status)).toEqual(['source-and-rights-verified', 'source-and-rights-verified']);
  });

  it('shows related content only when it is in the published list', () => {
    const record = mutate(item => { item.medication.relatedContentIds = ['learn.a', 'learn.b', 'learn.c']; });
    expect(resolveRelated(record, [])).toEqual([]);
    expect(resolveRelated(record, [{ id: 'learn.b', title: 'B' }, { id: 'learn.z', title: 'Z' }])).toEqual([{ id: 'learn.b', title: 'B' }]);
    expect(resolveRelated(metoprolol(), [{ id: 'learn.b', title: 'B' }])).toEqual([]);
  });

  it('labels review status honestly for every state', () => {
    expect(reviewStatusLabel(metoprolol())).toBe('Draft: unreviewed');
    expect(reviewStatusLabel(fullyReviewedFixture())).toMatch(/^Published: all source, review and approval checks passed/);
    for (const status of ['awaiting-review', 'reviewed-for-educational-use', 'retired'] as const) {
      expect(reviewStatusLabel({ ...metoprolol(), publicationStatus: status })).not.toMatch(/^Published/);
    }
  });

  it('turns on the draft preview only for the documented flag', () => {
    expect(isPreviewRequested('?medication-preview=drafts')).toBe(true);
    expect(isPreviewRequested('?x=1&medication-preview=drafts')).toBe(true);
    for (const search of ['', '?medication-preview=1', '?medication-preview=true', '?medication-preview=', '?preview=drafts', '?medication-preview=DRAFTS']) {
      expect(isPreviewRequested(search), search).toBe(false);
    }
  });
});
