import type { MedicationRecord } from '../content/types';

/**
 * Draft medication education records. They are authored through the same content schema and gates as
 * lessons: every statement is a claim that needs a verified source, qualified medical review and
 * publication approval before a learner can see it. None has any of these, so none is published.
 * Only class-level statements are drafted. Safety considerations and interactions are deliberately
 * not written yet because they need specific sourced evidence, and no doses or advice appear anywhere.
 */
const createdAt = '2026-10-21T08:00:00Z';

const knownLimitations = [
  'Draft teaching text: every claim awaits source verification and qualified medical review.',
  'Educational information only. It gives no doses and is not prescribing or patient-specific advice.',
  'Safety considerations and interactions have not been written, because they need specific sourced evidence.',
];

type Seed = {
  id: string;
  genericName: string;
  drugGroup: MedicationRecord['medication']['drugGroup'];
  drugClass: string;
  summary: string;
  searchTerms: string[];
  objective: string;
  claims: { id: string; statement: string }[];
  sections: { id: string; kind: MedicationRecord['medication']['sections'][number]['kind']; title: string; body: string; claimIds: string[] }[];
};

function medication(seed: Seed): MedicationRecord {
  return {
    id: seed.id,
    type: 'medication',
    title: seed.genericName,
    summary: seed.summary,
    learningObjectives: [{ id: 'ecg-effects', statement: seed.objective }],
    difficulty: 'intermediate',
    tags: [seed.drugGroup, 'ecg-relevant'],
    contentDomain: 'clinical-education',
    publicationStatus: 'draft',
    provenance: { kind: 'text-only-explanation', signalMetadataOmissionReason: 'Medication education text only; no ECG signal is embedded.' },
    sourceReferences: [],
    claims: seed.claims.map(claim => ({ id: claim.id, statement: claim.statement, locations: ['sections'], basis: 'external-source' as const })),
    reviewRecords: [],
    createdAt,
    updatedAt: createdAt,
    version: '0.1.0',
    knownLimitations,
    medication: {
      genericName: seed.genericName,
      drugGroup: seed.drugGroup,
      drugClass: seed.drugClass,
      searchTerms: seed.searchTerms,
      sections: seed.sections,
      relatedContentIds: [],
    },
  };
}

export const medicationDrafts: MedicationRecord[] = [
  medication({
    id: 'med.metoprolol',
    genericName: 'Metoprolol',
    drugGroup: 'beta-blocker',
    drugClass: 'Beta-adrenergic blocker (relatively beta-1 selective)',
    summary: 'A beta-adrenergic blocker. This profile covers only how the class can change rate and conduction on an ECG.',
    searchTerms: ['beta blocker', 'beta-blocker', 'adrenergic'],
    objective: 'Describe how a beta-adrenergic blocker can change the heart rate and AV conduction seen on an ECG.',
    claims: [
      { id: 'metoprolol-mechanism', statement: 'Metoprolol blocks beta-adrenergic receptors, with relative selectivity for beta-1 receptors.' },
      { id: 'metoprolol-use', statement: 'Beta-blockers such as metoprolol are used to control the heart rate in some atrial tachyarrhythmias.' },
      { id: 'beta-blocker-sinus-rate', statement: 'Beta-adrenergic blockers can slow the sinus rate.' },
      { id: 'beta-blocker-av-conduction', statement: 'Beta-adrenergic blockers can slow conduction through the atrioventricular node, which can lengthen the PR interval.' },
    ],
    sections: [
      { id: 'mechanism', kind: 'mechanism', title: 'How it works', body: 'Metoprolol blocks beta-adrenergic receptors, with relative selectivity for beta-1 receptors.', claimIds: ['metoprolol-mechanism'] },
      { id: 'use', kind: 'educational-use', title: 'Where it is used', body: 'Beta-blockers such as metoprolol are used to control the heart rate in some atrial tachyarrhythmias.', claimIds: ['metoprolol-use'] },
      { id: 'ecg', kind: 'ecg-effect', title: 'What can change on the ECG', body: 'Beta-adrenergic blockers can slow the sinus rate. They can also slow conduction through the atrioventricular node, which can lengthen the PR interval.', claimIds: ['beta-blocker-sinus-rate', 'beta-blocker-av-conduction'] },
    ],
  }),
  medication({
    id: 'med.diltiazem',
    genericName: 'Diltiazem',
    drugGroup: 'calcium-channel-blocker',
    drugClass: 'Non-dihydropyridine calcium channel blocker',
    summary: 'A calcium channel blocker with effects on the cardiac nodes. This profile covers only rate and conduction effects relevant to the ECG.',
    searchTerms: ['calcium channel blocker', 'CCB', 'non-dihydropyridine'],
    objective: 'Describe how a non-dihydropyridine calcium channel blocker can change the heart rate and AV conduction seen on an ECG.',
    claims: [
      { id: 'diltiazem-mechanism', statement: 'Diltiazem blocks L-type calcium channels, with effects on the sinoatrial and atrioventricular nodes.' },
      { id: 'diltiazem-use', statement: 'Diltiazem is used to control the ventricular rate in some atrial tachyarrhythmias.' },
      { id: 'diltiazem-sinus-rate', statement: 'Diltiazem can slow the sinus rate.' },
      { id: 'diltiazem-av-conduction', statement: 'Diltiazem can slow conduction through the atrioventricular node, which can lengthen the PR interval.' },
    ],
    sections: [
      { id: 'mechanism', kind: 'mechanism', title: 'How it works', body: 'Diltiazem blocks L-type calcium channels, with effects on the sinoatrial and atrioventricular nodes.', claimIds: ['diltiazem-mechanism'] },
      { id: 'use', kind: 'educational-use', title: 'Where it is used', body: 'Diltiazem is used to control the ventricular rate in some atrial tachyarrhythmias.', claimIds: ['diltiazem-use'] },
      { id: 'ecg', kind: 'ecg-effect', title: 'What can change on the ECG', body: 'Diltiazem can slow the sinus rate. It can also slow conduction through the atrioventricular node, which can lengthen the PR interval.', claimIds: ['diltiazem-sinus-rate', 'diltiazem-av-conduction'] },
    ],
  }),
  medication({
    id: 'med.digoxin',
    genericName: 'Digoxin',
    drugGroup: 'cardiac-glycoside',
    drugClass: 'Cardiac glycoside',
    summary: 'A cardiac glycoside. This profile covers only the AV-node and ST-segment effects relevant to reading an ECG.',
    searchTerms: ['digitalis', 'cardiac glycoside'],
    objective: 'Describe how a cardiac glycoside can change AV conduction and the ST segment on an ECG.',
    claims: [
      { id: 'digoxin-mechanism', statement: 'Digoxin inhibits the sodium–potassium ATPase pump in cardiac cells.' },
      { id: 'digoxin-vagal', statement: 'Digoxin increases vagal tone at the atrioventricular node.' },
      { id: 'digoxin-use', statement: 'Digoxin is used to control the ventricular rate in some atrial tachyarrhythmias.' },
      { id: 'digoxin-av-conduction', statement: 'Digoxin can slow conduction through the atrioventricular node, which can lengthen the PR interval.' },
      { id: 'digoxin-st-changes', statement: 'Digoxin can cause characteristic ST-segment changes on the ECG.' },
    ],
    sections: [
      { id: 'mechanism', kind: 'mechanism', title: 'How it works', body: 'Digoxin inhibits the sodium–potassium ATPase pump in cardiac cells.', claimIds: ['digoxin-mechanism'] },
      { id: 'pharmacology', kind: 'pharmacology', title: 'Effect at the AV node', body: 'Digoxin increases vagal tone at the atrioventricular node.', claimIds: ['digoxin-vagal'] },
      { id: 'use', kind: 'educational-use', title: 'Where it is used', body: 'Digoxin is used to control the ventricular rate in some atrial tachyarrhythmias.', claimIds: ['digoxin-use'] },
      { id: 'ecg', kind: 'ecg-effect', title: 'What can change on the ECG', body: 'Digoxin can slow conduction through the atrioventricular node, which can lengthen the PR interval. It can also cause characteristic ST-segment changes on the ECG.', claimIds: ['digoxin-av-conduction', 'digoxin-st-changes'] },
    ],
  }),
  medication({
    id: 'med.amiodarone',
    genericName: 'Amiodarone',
    drugGroup: 'antiarrhythmic',
    drugClass: 'Class III antiarrhythmic with effects on several ion channels',
    summary: 'An antiarrhythmic. This profile covers only the repolarisation and rate effects relevant to reading an ECG.',
    searchTerms: ['antiarrhythmic', 'class III'],
    objective: 'Describe how a class III antiarrhythmic can change the QT interval and heart rate on an ECG.',
    claims: [
      { id: 'amiodarone-mechanism', statement: 'Amiodarone blocks potassium channels and prolongs cardiac repolarisation, and also affects sodium and calcium channels and adrenergic receptors.' },
      { id: 'amiodarone-use', statement: 'Amiodarone is used to treat and prevent some atrial and ventricular arrhythmias.' },
      { id: 'amiodarone-qt', statement: 'Amiodarone can prolong the QT interval.' },
      { id: 'amiodarone-rate', statement: 'Amiodarone can slow the heart rate.' },
    ],
    sections: [
      { id: 'mechanism', kind: 'mechanism', title: 'How it works', body: 'Amiodarone blocks potassium channels and prolongs cardiac repolarisation, and also affects sodium and calcium channels and adrenergic receptors.', claimIds: ['amiodarone-mechanism'] },
      { id: 'use', kind: 'educational-use', title: 'Where it is used', body: 'Amiodarone is used to treat and prevent some atrial and ventricular arrhythmias.', claimIds: ['amiodarone-use'] },
      { id: 'ecg', kind: 'ecg-effect', title: 'What can change on the ECG', body: 'Amiodarone can prolong the QT interval. It can also slow the heart rate.', claimIds: ['amiodarone-qt', 'amiodarone-rate'] },
    ],
  }),
  medication({
    id: 'med.adenosine',
    genericName: 'Adenosine',
    drugGroup: 'other',
    drugClass: 'Purine nucleoside used as an antiarrhythmic',
    summary: 'A short-acting agent that acts at the AV node. This profile covers only its mechanism, use and the pause it can cause on an ECG.',
    searchTerms: ['antiarrhythmic', 'SVT', 'nucleoside'],
    objective: 'Recognise that adenosine acts at the AV node and can cause a brief pause or block on an ECG.',
    claims: [
      { id: 'adenosine-mechanism', statement: 'Adenosine acts on adenosine receptors in the atrioventricular node, causing transient slowing of conduction.' },
      { id: 'adenosine-duration', statement: 'Adenosine has a very short duration of action.' },
      { id: 'adenosine-use', statement: 'Adenosine is used to terminate some supraventricular tachycardias that depend on the atrioventricular node.' },
      { id: 'adenosine-pause', statement: 'Adenosine can cause a brief period of atrioventricular block or a pause on the ECG.' },
    ],
    sections: [
      { id: 'mechanism', kind: 'mechanism', title: 'How it works', body: 'Adenosine acts on adenosine receptors in the atrioventricular node, causing transient slowing of conduction.', claimIds: ['adenosine-mechanism'] },
      { id: 'pharmacology', kind: 'pharmacology', title: 'Duration of action', body: 'Adenosine has a very short duration of action.', claimIds: ['adenosine-duration'] },
      { id: 'use', kind: 'educational-use', title: 'Where it is used', body: 'Adenosine is used to terminate some supraventricular tachycardias that depend on the atrioventricular node.', claimIds: ['adenosine-use'] },
      { id: 'ecg', kind: 'ecg-effect', title: 'What can change on the ECG', body: 'Adenosine can cause a brief period of atrioventricular block or a pause on the ECG.', claimIds: ['adenosine-pause'] },
    ],
  }),
];
