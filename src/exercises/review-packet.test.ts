import { describe, expect, it } from 'vitest';
import packetsRaw from '../../docs/LESSON_REVIEW_PACKETS.md?raw';
import matrixRaw from '../../docs/CLAIM_SOURCE_MATRIX.md?raw';
import workflowRaw from '../../docs/CONTENT_REVIEW_WORKFLOW.md?raw';
import { introductoryLearnDrafts } from '../content/learn/records';
import { learnRegistry, publishedLearnLessons } from '../content/learn/registry';
import { rhythmCases } from '../rhythm/cases';
import { rhythmCategories } from '../rhythm/rhythms';
import { exerciseRegistry } from './definitions';

/**
 * Keeps the reviewer-facing documents in step with the code. This guards documentation drift only:
 * it is not evidence that any claim is true, sourced, licensed or approved.
 */
const normalize = (text: string) => text.replace(/\r\n/g, '\n');
const packets = normalize(packetsRaw);
const matrix = normalize(matrixRaw);
const workflow = normalize(workflowRaw);
/** Markdown tables escape pipes; compare exact text after undoing that. */
const unescaped = (text: string) => text.replace(/\\\|/g, '|');
const packetText = unescaped(packets);

describe('review packet stays in step with the code', () => {
  it('quotes every exercise\'s exact current text, id, version and tolerances', () => {
    for (const exercise of exerciseRegistry) {
      expect(packetText, `${exercise.id} id/version`).toContain(`\`${exercise.id}\` / \`${exercise.version}\``);
      for (const text of [exercise.title, exercise.objective, exercise.principle, ...exercise.hints, ...exercise.steps.map(step => step.instruction)]) {
        expect(packetText, `${exercise.id}: "${text.slice(0, 40)}…"`).toContain(text);
      }
      expect(packetText).toContain(`marker ${exercise.tolerance.timeMs} ms; repeat-measurement ${exercise.tolerance.invarianceMs} ms; width ${exercise.tolerance.widthMm} mm`);
      expect(matrix, `${exercise.id} in matrix`).toContain(`\`${exercise.id}\` — version \`${exercise.version}\``);
    }
  });

  it('documents every Rhythm Challenge category with its exact explanation, and the real case and category counts', () => {
    expect(packetText).toContain(`${rhythmCases.length} cases across ${rhythmCategories.length} categories`);
    for (const category of rhythmCategories) {
      expect(packetText, `${category.id} explanation`).toContain(category.explanation);
      expect(packetText, `${category.id} label`).toContain(category.label);
      expect(matrix, `${category.id} in matrix`).toContain(`\`${category.id}\``);
    }
    expect(rhythmCases.every(item => item.publicationStatus === 'draft' && item.reviewStatus === 'unreviewed')).toBe(true);
  });

  it('lists every lesson and question with its current id and version, and every recorded claim in the matrix', () => {
    for (const record of introductoryLearnDrafts) {
      expect(packetText, `${record.id} in packets`).toContain(`\`${record.id}\` / \`${record.version}\``);
      for (const claim of record.claims ?? []) {
        expect(matrix, `${record.id} claim ${claim.id}`).toContain(`\`${claim.id}\``);
      }
    }
  });

  it('keeps every item draft, unreviewed and unpublished, and documents the missing release path', () => {
    expect(introductoryLearnDrafts.every(record => record.publicationStatus === 'draft' && record.reviewRecords.length === 0)).toBe(true);
    expect(introductoryLearnDrafts.flatMap(record => record.sourceReferences).every(reference => reference.verificationStatus === 'unverified')).toBe(true);
    expect(publishedLearnLessons).toHaveLength(0);
    expect(learnRegistry.records.some(record => record.id.startsWith('rr-') || record.id.includes('exercise'))).toBe(false);
    expect(exerciseRegistry.every(exercise => exercise.publicationStatus === 'draft' && exercise.reviewStatus === 'unreviewed')).toBe(true);
    expect(workflow).toContain('cannot be published through any current path');
    expect(packets).toContain('Reviewer checklist (blank; to be completed only by a real reviewer)');
  });

  it('leaves the reviewer checklist unticked so no review is simulated', () => {
    const checklist = packets.slice(packets.indexOf('## Reviewer checklist'));
    expect(checklist).toContain('- [ ]');
    expect(checklist).not.toMatch(/- \[[xX]\]/);
  });
});
