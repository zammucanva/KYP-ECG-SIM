# ECG Lab — lesson review packets

**Purpose:** reviewer intake for the three current draft lessons and their linked formative checks. These packets expose answer keys to reviewers and are not learner-facing content. They do not assert that any medical, source, licensing, or publication review has occurred.

**Current release state:** all three lessons and all three questions are version `0.3.0`, remain `draft`, have zero review records, and are excluded from the Learn catalog. `lastReviewedAt` is absent. All candidate reference records still have `verificationStatus: unverified`. No clinical-content approval, reviewer identity/qualification, source-and-licensing approval, or publication approval exists.

**Claim-level crosswalk:** see [CLAIM_SOURCE_MATRIX.md](CLAIM_SOURCE_MATRIX.md). It specifies every claim location, candidate source location, unresolved evidence, and reviewer action. A reference attached here is a candidate only, not blanket support for the lesson.

## Review instructions

For each record, review the exact version below. Check every claim and every linked question answer/explanation against its source, including page/section/recommendation and source currentness. Where the evidence does not support the text, record the correction or request removal. Record licensing separately: access to a source does not grant permission to reproduce its text, diagrams, ECGs, or figures. Medical review and publication approval are separate from source verification and schema validation.

After review, provide genuine structured records matching the fields in [CONTENT_REVIEW_WORKFLOW.md](CONTENT_REVIEW_WORKFLOW.md). Use the exact content ID and version; include reviewed claim/reference IDs and actual reviewer details only when supplied by that reviewer. Do not send credentials, private patient data, or confidential reviewer information into public documentation.

## Candidate reference register

Both source records are associated with the lessons and checks below. Bibliographic metadata was checked against PubMed, but neither source record is currently marked verified. Exact support for each mapped claim, source currentness, and reuse rights remain outstanding.

### Becker — `ref.becker-fundamentals-ecg`

Daniel E. Becker. “Fundamentals of electrocardiography interpretation.” *Anesthesia Progress*. 2006 Summer;53(2):53–63; quiz 64. DOI: `10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2`. PMID 16863387; PMCID PMC1614214. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16863387/) · [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC1614214/).

The record now carries the article page range separately from the quiz page. PubMed lists a seasonal date, not a day/month; no calendar date is inferred. This continuing-education review is framed in dental/anesthesia monitoring, so its suitability for a general Indian MBBS fundamentals lesson needs an explicit reviewer decision. Exact page/paragraph locations are not recorded in the content records. Rights to reproduce text or figures are unknown.

### Kligfield et al. — `ref.kligfield-ecg-technology`

Paul Kligfield et al. “Recommendations for the standardization and interpretation of the electrocardiogram. Part I: The electrocardiogram and its technology: a scientific statement from the American Heart Association, American College of Cardiology Foundation, and the Heart Rhythm Society, endorsed by the International Society for Computerized Electrocardiology.” *Circulation*. 2007 Mar 13;115(10):1306–1324; e-published Feb 23. DOI: `10.1161/CIRCULATIONAHA.106.180200`. PMID 17322457. [PubMed](https://pubmed.ncbi.nlm.nih.gov/17322457/) · [AHA full-text PDF](https://www.ahajournals.org/doi/pdf/10.1161/CIRCULATIONAHA.106.180200?download=true).

This is a professional-society scientific statement, not an ordinary research study. The indexed abstract covers ECG derivation/display, lead placement, recording methods, waveform presentation, and global measurements. An indexed full-text excerpt identifies “Simultaneous Lead Presentation” at p. 1315, but other exact locations are unresolved. It is international/US-society material, not Indian guidance. Its 2007 currentness and publisher reuse terms require review.

## Packet 1 — What an ECG measures

### Lesson record

| Field | Current record |
|---|---|
| ID / version | `learn.what-an-ecg-measures` / `0.3.0` |
| Status | Draft; no reviews; not published |
| Title | What an ECG measures |
| Summary | A first look at the ECG as an electrical signal displayed over time—not a picture of mechanical contraction. |
| Objective | `what-ecg-measures`: Describe the ECG as a time-varying recording of cardiac electrical potential differences. |
| Difficulty / prerequisites | Introductory / none |
| Ordered sections | `signal-over-time`: A signal plotted over time; `read-the-representation`: Read the representation, not more than it shows |
| Visual | `template-waveform`: synthetic trace with authored P-like/QRS-like/T-like regions |
| Linked question | `learn.check.what-an-ecg-measures` |
| Provenance / limitations | Simulator-generated synthetic ECG (`ecg-lab.signal.generateLeadSignals`), 250 Hz, 10 s, 12 leads, mV, 25 mm/s, 20 mm/mV; signal reuse/redistribution/modification rights unknown. Not a patient recording; morphology unvalidated. |
| References | `ref.becker-fundamentals-ecg`; `ref.kligfield-ecg-technology`; both unverified in runtime metadata. |

**Factual/project claim inventory** (source mapping detail in the matrix):

1. `potential-difference-is-voltage-difference` — Potential difference describes voltage difference between two points or a point and derived reference. Location: key term “Potential difference”. Candidate Becker/Kligfield; precise source passage unresolved.
2. `ecg-surface-potential-over-time` — ECG displays changes in electrical potentials detected at body surface over time. Locations: `signal-over-time` body, objective, takeaway 1. Candidate Becker “Technical Considerations”/“The ECG Tracing” and Kligfield abstract; exact page unresolved.
3. `ecg-not-mechanical-measurement` — ECG trace is not a direct measurement of cardiac mechanical contraction. Locations: `signal-over-time` body and takeaway 2. Candidate Becker “The ECG Tracing”; exact paragraph/page unresolved.
4. `ecg-not-blood-flow-measurement` — ECG trace is not a direct measurement of blood flow. Location: `signal-over-time` body. **No source linked or specific passage located; must be sourced, narrowed, or removed.**
5. `ecg-not-palpable-pulse` — ECG trace is not itself a palpable pulse. Location: `signal-over-time` body. Becker is a candidate via “The ECG Tracing”; exact distinction must be checked.
6. `lead-is-derived-view` — A lead is an electrical view derived from electrode measurements, not an electrode synonym. Locations: `read-the-representation` body, “Lead” key term, takeaway. Candidate Becker “Technical Considerations” and Kligfield lead/technology discussion; exact locations unresolved.
7. `lead-view-changes-trace-appearance` — A change in lead view can change the appearance of recorded electrical activity. Location: `read-the-representation` body. Candidate Becker “Technical Considerations” and Kligfield; exact passage unresolved.
8. `template-is-synthetic` — Displayed trace is the simulator synthetic template and is not validated patient physiology. Locations: `read-the-representation` body, demonstration description, takeaway 3. Project/provenance check; not an external clinical claim.
9. `annotations-are-authored-regions` — P-like/QRS-like/T-like annotations are authored regions, not automated boundary detections. Locations: demonstration description and annotation records. Project behavior check; no automated detector exists.

**Required corrections/questions:** resolve or remove the blood-flow assertion; verify the full meaning of the potential-difference and lead-view definitions; decide whether Becker’s dental/anesthesia context is acceptable or replace it with a more suitable source; add exact page/section locations; assess whether “body-surface” and “over time” language is accurately supported.

**Known limitations:** no Indian source/CBME mapping; synthetic illustration is not clinically validated; no patient example; no source text or figure may be reused without rights confirmation.

### Linked knowledge check

| Field | Current record |
|---|---|
| ID / version | `learn.check.what-an-ecg-measures` / `0.3.0` |
| Parent | `learn.what-an-ecg-measures` |
| Status | Draft; no reviews; not published |
| Prompt | Which statement best describes the information represented by an ECG trace? |
| Choices | **Correct:** “Electrical potential differences displayed over time”; “A direct measurement of mechanical contraction”; “A direct measurement of blood flow through the chambers” |
| Correct answer | `electrical-over-time` |
| Explanation | “An ECG records electrical potential differences over time. It is not a direct measurement of mechanical contraction or blood flow.” |
| Provenance / references | Text-only formative item; candidate Becker and Kligfield references; both unverified. |

The correct answer and explanation require educational and qualified medical review. The blood-flow distractor/explanation claim is currently unmapped to a source and blocks release. Confirm that the phrase “through the chambers” is not introducing an inaccurate or unnecessary specificity.

## Packet 2 — Electrodes versus leads

### Lesson record

| Field | Current record |
|---|---|
| ID / version | `learn.electrodes-versus-leads` / `0.3.0` |
| Status | Draft; no reviews; not published |
| Title | Electrodes versus leads |
| Summary | Separate the physical recording contacts from the electrical views shown on the ECG. |
| Objective | `electrodes-versus-leads`: Differentiate physical electrodes from lead views derived from electrode measurements. |
| Difficulty / prerequisites | Introductory / `learn.what-an-ecg-measures` |
| Ordered sections | `physical-electrodes`: Electrodes are recording contacts; `derived-lead-views`: Several views share one recording |
| Visual | `limb-lead-views`: compare six limb leads from one synthetic recording |
| Linked question | `learn.check.electrodes-versus-leads` |
| Provenance / limitations | Same simulator-generated synthetic signal metadata as Packet 1; rights unknown; no patient placement or validated morphology. |
| References | Becker and Kligfield; runtime status unverified. |

**Factual/project claim inventory:**

1. `electrode-is-physical-contact` — An electrode is a physical contact used to acquire surface electrical potentials. Locations: `physical-electrodes` body; “Electrode” key term. Candidate Becker “Technical Considerations” and Kligfield lead-placement discussion; exact source location unresolved.
2. `lead-is-derived-view` — A lead is an electrical view formed/calculated from electrode measurements. Locations: `physical-electrodes` body, “Lead view” term, takeaway 1. Candidate Becker “Technical Considerations” and Kligfield “Simultaneous Lead Presentation” (indexed excerpt p. 1315); reviewer to check full context.
3. `views-can-exceed-electrodes` — An ECG can display more lead views than physical electrode contacts. Location: `physical-electrodes` body. Candidate Becker 12-lead/lead-arrangement discussion and Kligfield derived/redundant lead discussion; exact source context unresolved. No numeric electrode count is asserted.
4. `limb-leads-share-timeline` — Simulator limb traces use time-aligned source signals on one shared timeline. Locations: `derived-lead-views` body, “Time alignment” term, demonstration description. Verify against engine/tests; not a medical claim.
5. `limb-lead-demo-is-not-patient-placement` — Software limb-lead demonstration does not represent patient electrode placement or validate morphology. Locations: `derived-lead-views` body and takeaway 3. Verify provenance/UI labeling; project limitation.

**Required corrections/questions:** check each electrode/lead definition and ensure the phrase “more lead views than electrode contacts” is adequately supported for the intended context; maintain no numeric claim unless a precise source is supplied; review whether this content needs a current source better suited to Indian undergraduate education.

**Known limitations:** the demo shows software-derived limb-lead relationships only. It does not teach electrode placement, acquisition procedure, or clinical interpretation. No India-specific curriculum competency is claimed.

### Linked knowledge check

| Field | Current record |
|---|---|
| ID / version | `learn.check.electrodes-versus-leads` / `0.3.0` |
| Parent | `learn.electrodes-versus-leads` |
| Status | Draft; no reviews; not published |
| Prompt | Which description distinguishes an electrode from a lead? |
| Choices | **Correct:** “An electrode is a physical recording contact; a lead is an electrical view derived from measurements.”; “An electrode and a lead are two names for the same physical contact.”; “Each electrode always corresponds to exactly one displayed lead.” |
| Correct answer | `contact-and-view` |
| Explanation | “Electrodes are physical contacts. Leads are defined voltage views calculated from electrode measurements.” |
| Provenance / references | Text-only formative item; candidate Becker and Kligfield sources, unverified. |

Check the key, both distractors, and explanation against the sources. Specifically verify that “always exactly one” is a defensible distractor across the display/acquisition arrangements being taught.

## Packet 3 — ECG paper, speed and gain

### Lesson record

| Field | Current record |
|---|---|
| ID / version | `learn.paper-speed-and-gain` / `0.3.0` |
| Status | Draft; no reviews; not published |
| Title | ECG paper, speed and gain |
| Summary | Use the grid and calibration pulse to understand the shared time and voltage scales. |
| Objective | `paper-speed-and-gain`: Explain how paper speed sets horizontal time scale and gain sets vertical voltage scale. |
| Difficulty / prerequisites | Introductory / `learn.what-an-ecg-measures` |
| Ordered sections | `horizontal-time-scale`; `vertical-voltage-scale`; `read-the-grid` |
| Visual | Interactive calibration explorer using existing simulator transforms |
| Linked question | `learn.check.paper-speed-and-gain` |
| Provenance / limitations | Synthetic simulator signal (same metadata as Packet 1); SVG/logical millimetres are not physical browser millimetres; no print/export; signal rights unknown. |
| References | Becker and Kligfield; runtime status unverified. |

**Factual/project claim inventory:**

1. `paper-speed-time-scale` — Paper speed defines horizontal distance per elapsed time; at 25 mm/s, 5 mm represents 200 ms. Locations: `horizontal-time-scale` body, “Paper speed” term, takeaway 1, question prompt/explanation. Candidate Becker “ECG Paper” and Kligfield recording standards; exact page for Becker and exact Kligfield passage need confirmation.
2. `gain-voltage-scale` — ECG display gain defines vertical distance per voltage unit. Locations: `vertical-voltage-scale` body, “Gain” term, takeaway 2. Becker’s “ECG Paper” supports that vertical axis denotes voltage, but exact gain calibration support was not located. Kligfield is a candidate; exact section/page unresolved. Find a precise source or narrow the claim.
3. `standard-grid-units` — Standard ECG paper has 1 mm minor and 5 mm major divisions. Location: `read-the-grid` body. Candidate Becker “ECG Paper”/Figure 5; exact print page unresolved.
4. `simulator-time-voltage-transform` — Simulator speed/gain changes rendered coordinates without modifying stored timestamps/source voltages. Locations: horizontal/vertical sections and takeaways. Project behavior; verify calibration engine and regression tests.
5. `calibration-pulse-shares-transform` — Simulator calibration pulse uses the waveform’s shared voltage transform. Locations: vertical section and explorer description. Project behavior; verify `src/engine/calibration.ts`, `src/main.tsx`, and calibration tests.
6. `logical-grid-is-not-screen-mm` — Logical millimetres/SVG units do not guarantee physical screen millimetres. Locations: vertical section and takeaway 3. Project behavior; verify preview scale and absence of a physical-size claim.
7. `simulator-grid-coordinate-units` — Simulator grid uses logical 1-unit minor and 5-unit major spacing. Location: `read-the-grid` body. Project behavior; verify renderer/tests.

**Required corrections/questions:** obtain an exact source location for the gain-to-voltage calibration statement; verify the 25 mm/s example and physical grid dimensions; distinguish standard ECG paper from the browser’s logical SVG grid; retain explicit screen-versus-print limitations.

**Known limitations:** browser preview is not physical-size output. No print/export guarantee, no source rights for the synthetic waveform beyond what its current provenance records say, and no clinical interpretation is taught.

### Linked knowledge check

| Field | Current record |
|---|---|
| ID / version | `learn.check.paper-speed-and-gain` / `0.3.0` |
| Parent | `learn.paper-speed-and-gain` |
| Status | Draft; no reviews; not published |
| Prompt | At a paper speed of 25 mm/s, what elapsed time is represented by 5 logical millimetres horizontally? |
| Choices | **Correct:** 200 ms; 40 ms; 1 second |
| Correct answer | `200-ms` |
| Explanation | “At 25 mm/s, 5 mm corresponds to 5 ÷ 25 seconds, or 0.2 seconds (200 ms). This lesson’s question is draft and must be reviewed before learner publication.” |
| Provenance / references | Text-only formative item; Becker and Kligfield candidates remain unverified. |

Reviewer should confirm the standard-paper interpretation and arithmetic; the use of “logical millimetres” in the prompt describes the simulator UI and must not imply the browser screen is physically scaled.

## Shared publication blockers

- No current-version source/licensing, educational, qualified medical, or publication review records exist.
- No claim reference has been set to `source-verified` or `source-and-rights-verified`; source metadata presence is not support verification.
- Claim-to-source rows with unresolved or absent evidence remain blockers. In particular, both blood-flow claims are unmapped.
- Kligfield is 2007 and Becker is 2006; currentness and suitability require human judgment. Indian NMC/CBME mapping is absent.
- Lesson waveforms are synthetic educational templates; morphology is not validated and usage rights remain unknown.
- Each clinical question is gated by a current approved parent lesson; each lesson is gated by published eligible prerequisites and linked questions.


