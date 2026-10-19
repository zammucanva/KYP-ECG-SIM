# ECG Lab — lesson review packets

**Purpose:** reviewer intake for the three current draft lessons and their linked formative checks. These packets expose answer keys to reviewers and are not learner-facing content. They do not assert that any medical, source, licensing, or publication review has occurred.

**Current release state (2026-10-20):** lessons/questions 1 and 2 remain at version `0.3.0`; lesson 3 and its linked question are version `0.4.0` after a scope correction. All six records remain `draft`, have zero review records, and are excluded from the Learn catalog. `lastReviewedAt` is absent. Candidate Becker and Kligfield reference records remain `verificationStatus: unverified`; the revised lesson 3 and question have no attached external references because their remaining claims describe simulator behavior only. No genuine educational review, qualified medical review, source/licensing approval, or publication approval exists.

**Claim-level crosswalk:** see [CLAIM_SOURCE_MATRIX.md](CLAIM_SOURCE_MATRIX.md). It specifies every claim location, candidate source location, unresolved evidence, and reviewer action. A reference attached here is a candidate only, not blanket support for the lesson.

## Review instructions

For each record, review the exact version below. Check every claim and every linked question answer/explanation against its source, including page/section/recommendation and source currentness. Where the evidence does not support the text, record the correction or request removal. Record licensing separately: access to a source does not grant permission to reproduce its text, diagrams, ECGs, or figures. Medical review and publication approval are separate from source verification and schema validation.

After review, provide genuine structured records matching the fields in [CONTENT_REVIEW_WORKFLOW.md](CONTENT_REVIEW_WORKFLOW.md). Use the exact content ID and version; include reviewed claim/reference IDs and actual reviewer details only when supplied by that reviewer. Do not send credentials, private patient data, or confidential reviewer information into public documentation.

## Candidate reference register

These candidate sources remain associated with the first two lesson/check pairs. Bibliographic metadata was checked against PubMed, but neither source record is currently marked verified. For this pass, the Becker PMC full-text page did not yield reviewable full text in the available browser tool; search snippets were not accepted as exact claim evidence. The Kligfield AHA-hosted PDF exposed bibliographic front matter, abstract and permissions language, but no exact paper-speed or gain passage was located. Neither source's currentness for Indian MBBS teaching was established. Access does not grant reuse rights.

### Becker — `ref.becker-fundamentals-ecg`

Daniel E. Becker. “Fundamentals of electrocardiography interpretation.” *Anesthesia Progress*. 2006 Summer;53(2):53–63; quiz 64. DOI: `10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2`. PMID 16863387; PMCID PMC1614214. [PubMed](https://pubmed.ncbi.nlm.nih.gov/16863387/) · [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC1614214/).

The record now carries the article page range separately from the quiz page. PubMed lists a seasonal date, not a day/month; no calendar date is inferred. This continuing-education review is framed in dental/anesthesia monitoring, so its suitability for a general Indian MBBS fundamentals lesson needs an explicit reviewer decision. Exact page/paragraph locations are not recorded in the content records. Rights to reproduce text or figures are unknown.

### Kligfield et al. — `ref.kligfield-ecg-technology`

Paul Kligfield et al. “Recommendations for the standardization and interpretation of the electrocardiogram. Part I: The electrocardiogram and its technology: a scientific statement from the American Heart Association, American College of Cardiology Foundation, and the Heart Rhythm Society, endorsed by the International Society for Computerized Electrocardiology.” *Circulation*. 2007 Mar 13;115(10):1306–1324; e-published Feb 23. DOI: `10.1161/CIRCULATIONAHA.106.180200`. PMID 17322457. [PubMed](https://pubmed.ncbi.nlm.nih.gov/17322457/) · [AHA full-text PDF](https://www.ahajournals.org/doi/pdf/10.1161/CIRCULATIONAHA.106.180200?download=true).

This is a professional-society scientific statement, not an ordinary research study. The accessible PDF front matter and abstract identify the scope as ECG technology, including derivation/display, lead placement and recording methods. No exact paper-speed or gain passage was verified in this source pass. The PDF states that multiple copies, modification, alteration, enhancement and distribution require express permission. This is international/US-society material, not Indian guidance. Its 2007 currentness and any intended reuse still require review.

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

## Packet 3 — Simulator scale: time and voltage (revised v0.4.0)

### Lesson record

| Field | Current record |
|---|---|
| ID / version | `learn.paper-speed-and-gain` / `0.4.0` |
| Status | Draft; no reviews; not published |
| Title | Simulator scale: time and voltage |
| Summary | Explore how this simulator maps elapsed time and source voltage onto logical display coordinates. |
| Objective | `paper-speed-and-gain`: Describe the simulator’s horizontal time and vertical voltage coordinate mappings, and distinguish logical preview units from physical paper. |
| Difficulty / prerequisites | Introductory / `learn.what-an-ecg-measures` |
| Ordered sections | `horizontal-time-scale`; `vertical-voltage-scale`; `read-the-grid` |
| Visual | Interactive calibration explorer using existing simulator transforms |
| Linked question | `learn.check.paper-speed-and-gain` |
| Provenance / limitations | Synthetic simulator signal (same metadata as Packet 1); SVG/logical millimetres are not physical browser millimetres; no print/export; signal rights unknown. |
| References | None attached in v0.4.0. Becker and Kligfield were considered, but no exact support was verified for this narrowed software-behavior lesson. Their source records remain unverified for other drafts. |

**Factual/project claim inventory:**

1. `simulator-paper-speed-time-scale` — The simulator maps time to horizontal logical SVG coordinates; at its setting labelled 25 mm/s, 200 ms maps to 5 logical units. Locations: `horizontal-time-scale` body, “Paper speed” term, takeaway 1, linked question. Project evidence: `timeMsToSvgUnits` / `svgUnitsToTimeMs` in `src/engine/calibration.ts`; conversion and display-invariance tests in `src/engine/calibration.test.ts`. This does not claim that the browser physically renders 5 mm.
2. `simulator-gain-voltage-scale` — The simulator maps source millivolts to vertical logical SVG coordinates; this describes software behavior, not a universal ECG-device standard. Locations: vertical section, “Gain” term, takeaway 2. Project evidence: `voltageMvToSvgUnits` / `svgUnitsToVoltageMv` in `src/engine/calibration.ts` and gain tests in `src/engine/calibration.test.ts`.
3. `simulator-time-voltage-transform` — Changing speed or gain changes rendered coordinates but not stored timestamps/source voltages. Locations: horizontal/vertical sections and takeaways. Project evidence: shared conversion functions and calibration invariance tests.
4. `calibration-pulse-shares-transform` — The calibration pulse uses the waveform’s voltage transform. Locations: vertical section and demonstration description. Project evidence: `calibrationPulseHeightUnits` in `src/engine/calibration.ts`, `CalibrationPulse` in `src/main.tsx`, and calibration tests.
5. `logical-grid-is-not-screen-mm` — Logical SVG units do not guarantee physical screen/print millimetres. Locations: vertical and grid sections; takeaway 3. Project evidence: `SVG_UNITS_PER_MM` and `PREVIEW_CSS_PIXELS_PER_SVG_UNIT` comments in `src/engine/calibration.ts`; no physical-size export is implemented.
6. `simulator-grid-coordinate-units` — The simulator grid uses logical 1-unit minor and 5-unit major spacing. Location: `read-the-grid` body. Project evidence: `EcgGrid` in `src/components/EcgGrid.tsx` and grid/calibration tests.
7. `synthetic-example-is-not-patient-data` — The calibration demonstration uses a generated synthetic educational trace, not a patient recording or validated morphology. Locations: provenance, known limitation, demonstration description. Project evidence: `signalProvenance` and `generateLeadSignals` in `src/content/learn/records.ts` / `src/engine/signal.ts`; the rendered waveform is explicitly labelled synthetic.

**Version 0.4.0 correction:** removed unsupported claims about general medical-device gain and physical ECG paper divisions. The remaining lesson is explicitly about simulator behavior and logical SVG coordinates; it has no external medical references. Do not extend it to real ECG equipment standards without a suitable current source, exact claim location and human review.

**Known limitations:** browser preview is not physical-size output. No print/export guarantee, no source rights for the synthetic waveform beyond what its current provenance records say, and no clinical interpretation is taught.

### Linked knowledge check

| Field | Current record |
|---|---|
| ID / version | `learn.check.paper-speed-and-gain` / `0.4.0` |
| Parent | `learn.paper-speed-and-gain` |
| Status | Draft; no reviews; not published |
| Prompt | In this simulator, at the setting labelled 25 mm/s, how much time maps to 5 logical horizontal units? |
| Choices | **Correct:** 200 ms; 40 ms; 1 second |
| Correct answer | `200-ms` |
| Explanation | The simulator’s shared calibration transform maps 200 ms to 5 logical units at this setting. Logical SVG units are not a physical screen measurement. This formative question remains draft until the content and explanation receive required review. |
| Provenance / references | Text-only formative item; no external sources attached because the question is scoped to simulator behavior. |

Reviewer should confirm the answer against current code/tests and ensure the prompt cannot be mistaken for a physical paper/device standard. A future lesson making claims about clinical ECG paper must supply exact source locations independently.

## Shared publication blockers

- No current-version source/licensing, educational, qualified medical, or publication review records exist.
- No claim reference has been set to `source-verified` or `source-and-rights-verified`; source metadata presence is not support verification.
- Claim-to-source rows with unresolved or absent evidence remain blockers. In particular, both blood-flow claims are unmapped.
- Kligfield is 2007 and Becker is 2006; currentness and suitability require human judgment. Indian NMC/CBME mapping is absent.
- Lesson waveforms are synthetic educational templates; morphology is not validated and usage rights remain unknown.
- Each clinical question is gated by a current approved parent lesson; each lesson is gated by published eligible prerequisites and linked questions.

