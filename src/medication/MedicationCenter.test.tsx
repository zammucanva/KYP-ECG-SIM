import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MedicationRecord } from '../content/types';
import { fullyReviewedFixture } from './fixtures';
import { MedicationCenter } from './MedicationCenter';
import { medicationDrafts } from './records';
import { medicationRegistry, publishedMedications, visibleMedications } from './registry';

afterEach(cleanup);

const published = fullyReviewedFixture();
const second: MedicationRecord = { ...structuredClone(medicationDrafts[3]), publicationStatus: 'published' };

function setup(props: Partial<Parameters<typeof MedicationCenter>[0]> = {}) {
  const onOpenLearn = vi.fn();
  render(<MedicationCenter records={[]} preview={false} publishedLessons={[]} onOpenLearn={onOpenLearn} {...props} />);
  return { onOpenLearn };
}

describe('Medication Center as a learner sees it', () => {
  it('shows an honest empty state and no drug content while nothing is published', () => {
    const records = visibleMedications(medicationRegistry, false);
    expect(records).toEqual([]);
    setup({ records });
    expect(screen.getByText('No medication profiles have been published yet.')).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/not a prescribing tool: it gives no doses and no advice about any patient/);
    expect(screen.queryByLabelText('Search medicines')).toBeNull();
    for (const draft of medicationDrafts) expect(document.body.textContent).not.toContain(draft.medication.genericName);
    expect(document.body.textContent).not.toMatch(/Authoring preview/);
  });

  it('lists published profiles, searches them, filters by group and explains an empty result', async () => {
    const user = userEvent.setup();
    setup({ records: [published, second] });
    expect(screen.getByRole('status').textContent).toBe('2 medicines shown.');
    expect(screen.queryByText(/Draft: unreviewed/)).toBeNull();
    expect(screen.queryByText(/Authoring preview/)).toBeNull();

    await user.type(screen.getByLabelText('Search medicines'), 'amio');
    expect(screen.getByRole('status').textContent).toBe('1 medicine shown.');
    expect(within(screen.getByRole('list', { name: 'Medicines' })).getAllByRole('listitem')).toHaveLength(1);
    await user.clear(screen.getByLabelText('Search medicines'));
    await user.selectOptions(screen.getByLabelText('Drug group'), 'beta-blocker');
    expect(screen.getByRole('button', { name: 'Open profile: Metoprolol' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open profile: Amiodarone' })).toBeNull();

    await user.type(screen.getByLabelText('Search medicines'), 'amiodarone');
    expect(screen.getByText('No medicine matches this search.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear search and filter' }));
    expect(screen.getByRole('status').textContent).toBe('2 medicines shown.');
    expect((screen.getByLabelText('Search medicines') as HTMLInputElement).value).toBe('');
  });

  it('opens a published profile with verified evidence, unwritten sections and no draft labelling', async () => {
    const user = userEvent.setup();
    setup({ records: [published] });
    await user.click(screen.getByRole('button', { name: 'Open profile: Metoprolol' }));
    expect(document.activeElement?.textContent).toBe('Metoprolol');
    expect(screen.getByText(/Status:/).parentElement?.textContent).toMatch(/Published: all source, review and approval checks passed/);
    expect(screen.getAllByText(/source and rights verified/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Test fixture reference \(not a real source\)/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Safety considerations' }).parentElement?.textContent).toMatch(/Not yet written/);
    expect(screen.getByRole('heading', { name: 'Interactions' }).parentElement?.textContent).toMatch(/Not yet written/);
    expect(screen.getByText('Sections not yet written: relevant pharmacology, safety considerations, interactions.')).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/gives no doses/);
    await user.click(screen.getByRole('button', { name: 'Back to medicines' }));
    expect(screen.getByRole('heading', { name: 'Medicines and the ECG' })).toBeTruthy();
  });

  it('links related lessons only when they are published', async () => {
    const user = userEvent.setup();
    const linked: MedicationRecord = { ...structuredClone(published), medication: { ...published.medication, relatedContentIds: ['learn.a', 'learn.hidden'] } };
    const { onOpenLearn } = setup({ records: [linked], publishedLessons: [{ id: 'learn.a', title: 'An ECG lesson' }] });
    await user.click(screen.getByRole('button', { name: 'Open profile: Metoprolol' }));
    expect(screen.getByText(/An ECG lesson/)).toBeTruthy();
    expect(screen.queryByText(/learn\.hidden/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open in Learn' }));
    expect(onOpenLearn).toHaveBeenCalledTimes(1);
  });

  it('says so when a profile is no longer available', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MedicationCenter records={[published]} preview={false} publishedLessons={[]} onOpenLearn={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Open profile: Metoprolol' }));
    rerender(<MedicationCenter records={[]} preview={false} publishedLessons={[]} onOpenLearn={() => undefined} />);
    expect(screen.getByRole('alert').textContent).toBe('This profile is not available.');
    await user.click(screen.getByRole('button', { name: 'Back to medicines' }));
    expect(screen.getByText('No medication profiles have been published yet.')).toBeTruthy();
  });
});

describe('authoring preview', () => {
  it('labels every draft loudly in the list and in each profile, with evidence stated honestly', async () => {
    const user = userEvent.setup();
    setup({ records: visibleMedications(medicationRegistry, true), preview: true });
    expect(screen.getAllByRole('note').some(note => /Authoring preview: these are draft, unreviewed records/.test(note.textContent ?? ''))).toBe(true);
    expect(screen.getAllByText('Draft: unreviewed')).toHaveLength(medicationDrafts.length);

    await user.click(screen.getByRole('button', { name: 'Open profile: Amiodarone' }));
    expect(screen.getAllByRole('note').some(note => /Authoring preview/.test(note.textContent ?? ''))).toBe(true);
    expect(screen.getByText(/Status:/).parentElement?.textContent).toMatch(/Draft: unreviewed · version 0\.1\.0/);
    expect(screen.getAllByText(/Evidence: no source attached/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/Amiodarone can prolong the QT interval/)).toBeTruthy();
    expect(screen.queryByText(/source verified/)).toBeNull();
    expect(screen.getByText(/gives no doses and is not prescribing or patient-specific advice/)).toBeTruthy();
  });

  it('is empty again for learners even though the same drafts exist', () => {
    expect(publishedMedications()).toEqual([]);
    expect(visibleMedications(medicationRegistry, true).length).toBeGreaterThan(0);
    expect(visibleMedications(medicationRegistry, false)).toEqual([]);
  });
});

describe('test fixtures stay out of the application', () => {
  it('is imported only by tests', () => {
    const sources = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const offenders = Object.entries(sources)
      .filter(([path]) => !/\.test\.(ts|tsx)$/.test(path) && !path.endsWith('/medication/fixtures.ts'))
      .filter(([, source]) => /medication\/fixtures|from '\.\/fixtures'/.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
