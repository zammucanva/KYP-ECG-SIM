# ECG Lab — lesson review packets

**Purpose:** reviewer intake for the three current draft lessons, their linked formative checks, the five draft guided exercises (packets 4–8) the draft Rhythm Challenge categories and cases (packet 9) and the draft Virtual Patient cases (packet 10), all added 2026-10-21. These packets expose answer keys to reviewers and are not learner-facing content. They do not assert that any medical, source, licensing, or publication review has occurred.

**Current release state (2026-10-20):** lessons/questions 1 and 2 remain at version `0.3.0`; lesson 3 and its linked question are version `0.4.0` after a scope correction. All six records remain `draft`, have zero review records, and are excluded from the Learn catalog. `lastReviewedAt` is absent. Candidate Becker and Kligfield reference records remain `verificationStatus: unverified`; the revised lesson 3 and question have no attached external references because their remaining claims describe simulator behavior only. No genuine educational review, qualified medical review, source/licensing approval, or publication approval exists.

**Claim-level crosswalk:** see [CLAIM_SOURCE_MATRIX.md](CLAIM_SOURCE_MATRIX.md). It specifies every claim location, candidate source location, unresolved evidence, and reviewer action. A reference attached here is a candidate only, not blanket support for the lesson.

## Review instructions

For each record, review the exact version below. Check every claim and every linked question answer/explanation against its source, including page/section/recommendation and source currentness. Where the evidence does not support the text, record the correction or request removal. Record licensing separately: access to a source does not grant permission to reproduce its text, diagrams, ECGs, or figures. Medical review and publication approval are separate from source verification and schema validation.

After review, provide genuine structured records matching the fields in [CONTENT_REVIEW_WORKFLOW.md](CONTENT_REVIEW_WORKFLOW.md). Use the exact content ID and version; include reviewed claim/reference IDs and actual reviewer details only when supplied by that reviewer. Do not send credentials, private patient data, or confidential reviewer information into public documentation.

## Content inventory (all draft items, 2026-10-21)

One list covers every learner-facing item that needs review. Lessons and questions live in the content registry (`src/content/learn/records.ts`); the five guided exercises and the Rhythm Challenge cases live in their own read-only registries (`src/exercises/definitions.ts`, `src/rhythm/cases.ts`) and are **not** content-schema records yet (see "Exercises and the content schema" in [CONTENT_REVIEW_WORKFLOW.md](CONTENT_REVIEW_WORKFLOW.md)). No competing registry was created. Claims are counted as recorded in the code (lessons/questions) or as documentation claim IDs (exercises).

| Item | ID | Version | Status | Claims (external-source / project-behavior or software) | References | Required reviewers | Publication eligibility |
|---|---|---|---|---|---|---|---|
| Lesson 1 | `learn.what-an-ecg-measures` | 0.3.0 | draft, 0 reviews | 7 / 2 | Becker, Kligfield (unverified) | source/licensing; educational; qualified medical; publication | Not eligible |
| Check 1 | `learn.check.what-an-ecg-measures` | 0.3.0 | draft, 0 reviews | 3 / 0 | Becker, Kligfield (unverified) | same | Not eligible; blood-flow claim unmapped |
| Lesson 2 | `learn.electrodes-versus-leads` | 0.3.0 | draft, 0 reviews | 3 / 2 | Becker, Kligfield (unverified) | same | Not eligible |
| Check 2 | `learn.check.electrodes-versus-leads` | 0.3.0 | draft, 0 reviews | 2 / 0 | Becker, Kligfield (unverified) | same | Not eligible |
| Lesson 3 | `learn.paper-speed-and-gain` | 0.4.0 | draft, 0 reviews | 0 / 7 | none | source/licensing (project evidence); educational; medical (domain gate, see decision D2); publication | Not eligible |
| Check 3 | `learn.check.paper-speed-and-gain` | 0.4.0 | draft, 0 reviews | 0 / 1 | none | same | Not eligible |
| Exercise 1 | `rr-interval-measurement` | 0.1.0 | draft / unreviewed | 2 class B, 3 class A | none | educational; source; qualified medical | No release path exists yet (D1) |
| Exercise 2 | `gain-measurement-invariance` | 0.1.0 | draft / unreviewed | 2 class B, 2 class A | none | same | No release path exists yet (D1) |
| Exercise 3 | `cross-lead-beat-matching` | 0.1.0 | draft / unreviewed | 2 class B, 2 class A | none | same | No release path exists yet (D1) |
| Exercise 4 | `paper-speed-and-grid` | 0.1.0 | draft / unreviewed | 2 class B, 1 class A, 1 class D | none | same | No release path exists yet (D1) |
| Exercise 5 | `grid-and-calibration` | 0.1.0 | draft / unreviewed | 2 class A (+B), 1 class A, 1 class D | none | same | No release path exists yet (D1) |
| Rhythm Challenge | 36 cases, 18 categories (`rhythm.<category>.NN`) | 0.1.0 | draft / unreviewed | 18 category explanations, class C | none | educational; source; qualified medical (R1–R6) | No release path exists yet (D1, D5) |
| Virtual Patients | 6 fictional cases (`patient.<slug>.NN`) | 0.1.0 | draft / unreviewed | story and observation text, class C; ECG mapping, class A | none | educational; qualified medical (P1–P4) | No release path exists yet (D1, D6) |

The published Learn catalog is empty and stays empty. Every lesson and question still has `reviewRecords: []` and no `lastReviewedAt`; every external reference still has `verificationStatus: unverified`.

**Claim classes used for exercises:** A = software behavior verifiable by automated tests (tests are evidence of behavior only, never of medical correctness); B = basic ECG measurement principle needing an authoritative educational source; C = medical or physiological claim needing qualified review; D = wording, licensing or reuse note. Claims needing explicit permission before reproducing figures or protected material are tracked as licensing gaps below; no third-party figure, ECG image or quotation was identified in the lesson or exercise records.
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

## Packet 4 — Guided exercise: Measure an R–R interval

### Exercise record (exact current text from `src/exercises/definitions.ts`)

| Field | Current record |
|---|---|
| ID / version | `rr-interval-measurement` / `0.1.0` |
| Kind | `rr-interval` |
| Status | `draft` / `unreviewed`; no review records exist; not in the content registry; not published |
| Title | Measure an R–R interval |
| Objective | Place Start and End on two consecutive R-wave peaks of the synthetic trace and read the beat-to-beat interval. |
| Principle | An interval is the difference between two absolute times. The R–R interval is the time from one R peak to the next consecutive R peak; heart rate in beats per minute is 60 000 ms divided by that interval. |
| Step 1 (`select-rr`) | Select a measurement set (use the R–R interval set) and choose Start. |
| Step 2 (`place-markers`) | Pause playback, then click the peak of one R wave for Start and the peak of the next R wave for End. |
| Step 3 (`record-check`) | Choose Record reading, then Check answer. |
| Hint 1 | In most leads the R wave is the tallest, sharpest peak. Pick one and then the very next one. |
| Hint 2 | Pause playback first so the trace stands still, then fine-tune with the numeric fields. |
| Hint 3 | Start and End must sit on neighbouring peaks, not two peaks apart. |
| Required readings | 1 |
| Tolerances | marker 40 ms; repeat-measurement 8 ms; width 1 mm |
| Provenance | Synthetic signal (`ecg-lab.signal.generateLeadSignals`); signal rights not yet declared (repository has no licence file). Not a patient recording; morphology unvalidated. |
| References attached | None. Candidate references are listed in the register below; none verified. |

**Claim inventory** (documentation IDs; the exercise has no claim IDs in code because exercises are not yet content-schema records). Class: A software behavior · B basic ECG measurement principle needing an authoritative source · C medical/physiological claim needing qualified review · D wording/licensing note.

| Claim ID | Statement (as presented) | Location | Class | Evidence status and action |
|---|---|---|---|---|
| `ex-rr.interval-is-time-difference` | An interval is the difference between two absolute times. | principle | A: software/arithmetic | Verified by tests: `evaluate.ts` uses marker timestamps; `exercises.test.ts` (R–R exercise). No clinical source needed beyond wording. |
| `ex-rr.rr-is-peak-to-peak` | The R–R interval is the time from one R peak to the next consecutive R peak. | principle; steps `place-markers` | B: basic measurement principle | Needs an authoritative ECG source stating the definition and which fiducial point (R peak) is used. Candidates below; none verified. |
| `ex-rr.rate-from-rr` | Heart rate in beats per minute is 60 000 ms divided by that interval. | principle; feedback "Your interval is … ms (… beats per minute)" | B: basic measurement principle | Standard arithmetic for a regular rhythm; needs a source and a qualifier. It does not hold for irregular rhythms (see medical question M1). |
| `ex-rr.target-is-signal-model-event` | Marker correctness is judged against the simulator's own R-event time within a 40 ms tolerance. | feedback; `definitions.ts` tolerance | A: software behavior | Verified by tests (tolerance boundaries 40/41 ms, per-preset targets). The 40 ms tolerance is a pedagogical choice, not a clinical standard. |
| `ex-rr.synthetic-and-not-clinical` | The trace is synthetic and the check is a placement check, not clinical interpretation. | panel disclaimer | A: software behavior / provenance | Verified by UI test text and provenance; not a medical claim. |

**Questions for the educational reviewer**

- Is "click the peak of one R wave" clear for leads where R is small or absent (V1, aVR)? Should the exercise restrict the lead (e.g. II or V5)?
- Is a 40 ms marker tolerance (1 mm of the simulator's logical grid at 25 mm/s) pedagogically appropriate, and is the reasoning for it stated anywhere a learner sees it?
- Is the order of steps (select set, place markers, record, check) understandable without the on-screen controls described elsewhere?

**Questions requiring qualified medical review**

- M1: The simplified "Atrial fibrillation" preset has perfectly regular R–R intervals in this model. Applying "rate = 60 000 / R–R" there is not representative of irregular rhythms. Should the exercise be disabled for, or carry an explicit caveat on, that preset?
- M2: Is "R peak" an acceptable fiducial point to define the R–R interval for learners at the intended level?

**Recommended revisions before any release**

- Qualify the rate sentence ("for a regular rhythm") and add a note that irregular rhythms need a different approach, or restrict the exercise to regular presets.
- Replace "centre/peak of an R wave" guidance with a lead recommendation if the reviewer agrees.
- Keep the sentence "heart rate = 60 000 / R–R" out of any published text until a source and exact location are recorded.

## Packet 5 — Guided exercise: Gain changes height, not timing

### Exercise record (exact current text from `src/exercises/definitions.ts`)

| Field | Current record |
|---|---|
| ID / version | `gain-measurement-invariance` / `0.1.0` |
| Kind | `gain-invariance` |
| Status | `draft` / `unreviewed`; no review records exist; not in the content registry; not published |
| Title | Gain changes height, not timing |
| Objective | Measure the same R–R interval at two gain settings and compare how the display and the measurement respond. |
| Principle | Gain scales voltage to vertical paper distance (millimetres per millivolt). It does not move events in time, so a time interval measured from the same beats is unchanged when gain changes while the drawn amplitude scales in proportion. |
| Step 1 (`first-gain`) | Pause, mark two consecutive R peaks, and record a reading at the current gain. |
| Step 2 (`change-gain`) | Change the Gain control to a different value. Keep the same Start and End times. |
| Step 3 (`second-gain`) | Record a second reading, then choose Check answer. |
| Hint 1 | Change only the Gain control and watch the height of the trace, not where the beats sit in time. |
| Hint 2 | Keep Start and End exactly the same between the two readings. |
| Hint 3 | A taller trace on screen does not mean a longer interval. |
| Required readings | 2 |
| Tolerances | marker 40 ms; repeat-measurement 8 ms; width 1 mm |
| Provenance | Synthetic signal (`ecg-lab.signal.generateLeadSignals`); signal rights not yet declared (repository has no licence file). Not a patient recording; morphology unvalidated. |
| References attached | None. Candidate references are listed in the register below; none verified. |

**Claim inventory** (documentation IDs; the exercise has no claim IDs in code because exercises are not yet content-schema records). Class: A software behavior · B basic ECG measurement principle needing an authoritative source · C medical/physiological claim needing qualified review · D wording/licensing note.

| Claim ID | Statement (as presented) | Location | Class | Evidence status and action |
|---|---|---|---|---|
| `ex-gain.gain-definition` | Gain scales voltage to vertical paper distance (millimetres per millivolt). | principle | B: basic measurement principle (and conflicts with lesson 3 scope) | Lesson 3 v0.4.0 deliberately removed general gain/paper statements for lack of source and now says "in this simulator". This exercise states the general form. Narrow to "In this simulator, gain scales…" or source it. |
| `ex-gain.timing-unchanged` | Gain does not move events in time, so a time interval from the same beats is unchanged when gain changes. | principle; check `duration-invariant` | A: software behavior (+ B for the general statement) | Software behavior verified by tests (`exercises.test.ts` gain section; calibration tests). The general physical statement needs a source. |
| `ex-gain.amplitude-scales-with-gain` | The drawn amplitude scales in proportion to gain. | principle; feedback "is drawn X mm tall at A mm/mV and Y mm at B mm/mV" | A: software behavior | Verified by tests (drawn height scales exactly with gain). The mm values refer to logical mm, not physical size (see packet 3). |
| `ex-gain.largest-deflection-statement` | Lead L's largest deflection (N mV) occurs at a stated cycle time. | feedback | A: software behavior; D: wording | Computed from the synthetic signal only. "Largest deflection" is not a clinical term; reviewer to confirm it cannot be mistaken for a measured amplitude of a patient ECG. |

**Questions for the educational reviewer**

- Should the exercise state the simulator's default gain and a "standard" gain, and is that appropriate without a source?
- Is it clear that the learner must keep Start and End unchanged across gains?

**Questions requiring qualified medical review**

- M3: Does the gain definition ("millimetres per millivolt") match accepted terminology for the intended Indian MBBS audience?

**Recommended revisions before any release**

- Prefix principle sentences with "In this simulator," (consistent with lesson 3 v0.4.0), or record an exact source passage for the general statement before release.
- Replace "paper distance" with "logical grid distance" unless the source is added.

## Packet 6 — Guided exercise: Find the same beat in two leads

### Exercise record (exact current text from `src/exercises/definitions.ts`)

| Field | Current record |
|---|---|
| ID / version | `cross-lead-beat-matching` / `0.1.0` |
| Kind | `cross-lead-beat` |
| Status | `draft` / `unreviewed`; no review records exist; not in the content registry; not published |
| Title | Find the same beat in two leads |
| Objective | Locate the QRS event of the same beat in two different leads and compare the absolute times. |
| Principle | All leads in this simulator share one timeline. A single beat happens at one absolute time even though its drawn shape differs between leads, so matching the same beat means matching times, not shapes. |
| Step 1 (`first-lead`) | Pause, choose a lead, place Start on the centre of a QRS complex, and record a reading. |
| Step 2 (`second-lead`) | Choose a different lead and place Start on the QRS complex of the same beat. Record a second reading. |
| Step 3 (`check`) | Choose Check answer. |
| Hint 1 | In this simulator every lead shares one timeline, so the same beat sits at the same time in each lead. |
| Hint 2 | In some leads the QRS complex points downward; look for the sharpest deflection either way. |
| Hint 3 | Compare the time of the beat in each lead, not the shape. |
| Required readings | 2 |
| Tolerances | marker 40 ms; repeat-measurement 8 ms; width 1 mm |
| Provenance | Synthetic signal (`ecg-lab.signal.generateLeadSignals`); signal rights not yet declared (repository has no licence file). Not a patient recording; morphology unvalidated. |
| References attached | None. Candidate references are listed in the register below; none verified. |

**Claim inventory** (documentation IDs; the exercise has no claim IDs in code because exercises are not yet content-schema records). Class: A software behavior · B basic ECG measurement principle needing an authoritative source · C medical/physiological claim needing qualified review · D wording/licensing note.

| Claim ID | Statement (as presented) | Location | Class | Evidence status and action |
|---|---|---|---|---|
| `ex-lead.shared-timeline` | All leads in this simulator share one timeline. | principle | A: software behavior | Verified by tests (`signal-window.test.ts`: leads share timestamps; limb-lead equations). |
| `ex-lead.single-beat-one-time` | A single beat happens at one absolute time even though its drawn shape differs between leads. | principle | B: basic principle (simultaneous lead recording) | Needs a source on simultaneous lead presentation. Kligfield "Simultaneous Lead Presentation" (indexed excerpt p. 1315) is a candidate, not inspected. |
| `ex-lead.shapes-differ` | The drawn shape of the same beat differs between leads. | principle; tests compare lead II and V1 samples | A: software behavior (+ B) | The simulator's morphology table is invented and unvalidated (`signal.ts`). The statement about real ECGs needs a source and a medical reviewer. |
| `ex-lead.qrs-event-target` | The QRS event for matching is the simulator's R-event time, accepted within 40 ms. | feedback; steps | A: software behavior | In V1 the deepest deflection (S wave) is 15–30 ms after the model's R event (by preset); tolerance covers it. Not a clinical definition of QRS timing. |

**Questions for the educational reviewer**

- Does "centre of a QRS complex" give learners a reproducible target across leads whose QRS is mostly negative?
- Is matching by time (rather than shape) the right learning objective at this stage?

**Questions requiring qualified medical review**

- M4: Are the stated relationships between leads (same beat, same time, different shape) accurate and sufficiently qualified for learners? The synthetic lead shapes themselves are not clinically validated.

**Recommended revisions before any release**

- Keep the sentence about different shapes explicitly framed as a property of this synthetic template unless a source is supplied.
- Add a one-line statement that the simulator's lead morphologies are simplified and unvalidated.

## Packet 7 — Guided exercise: One interval, two paper speeds

### Exercise record (exact current text from `src/exercises/definitions.ts`)

| Field | Current record |
|---|---|
| ID / version | `paper-speed-and-grid` / `0.1.0` |
| Kind | `paper-speed-grid` |
| Status | `draft` / `unreviewed`; no review records exist; not in the content registry; not published |
| Title | One interval, two paper speeds |
| Objective | Measure the same R–R interval at two paper speeds and work out how wide it appears on the logical paper each time. |
| Principle | Paper speed converts time to horizontal distance: millimetres equal seconds multiplied by millimetres per second. Doubling the speed doubles the width of the same interval on paper but leaves its duration unchanged. |
| Step 1 (`first-speed`) | Pause, mark two consecutive R peaks, enter the interval width in millimetres for the current paper speed, and record a reading. |
| Step 2 (`change-speed`) | Change the Paper speed control to a different value, keeping the same Start and End times. |
| Step 3 (`second-speed`) | Enter the new width in millimetres, record the second reading, then choose Check answer. |
| Hint 1 | In this simulator, width in millimetres = interval in seconds × paper speed in millimetres per second. |
| Hint 2 | Convert the interval from milliseconds to seconds first. |
| Hint 3 | A faster paper speed stretches the same interval wider without changing its duration. |
| Required readings | 2 |
| Tolerances | marker 40 ms; repeat-measurement 8 ms; width 1 mm |
| Provenance | Synthetic signal (`ecg-lab.signal.generateLeadSignals`); signal rights not yet declared (repository has no licence file). Not a patient recording; morphology unvalidated. |
| References attached | None. Candidate references are listed in the register below; none verified. |

**Claim inventory** (documentation IDs; the exercise has no claim IDs in code because exercises are not yet content-schema records). Class: A software behavior · B basic ECG measurement principle needing an authoritative source · C medical/physiological claim needing qualified review · D wording/licensing note.

| Claim ID | Statement (as presented) | Location | Class | Evidence status and action |
|---|---|---|---|---|
| `ex-speed.mm-equals-seconds-times-speed` | Paper speed converts time to horizontal distance: millimetres equal seconds multiplied by millimetres per second. | principle; width check (expected = interval ms / 1000 × speed) | B: basic measurement principle (and conflicts with lesson 3 scope) | Arithmetic is verified by tests for the simulator's logical mm. The statement about real ECG paper needs a source. Lesson 3 removed equivalent general claims. |
| `ex-speed.doubling-doubles-width` | Doubling the speed doubles the width of the same interval on paper but leaves its duration unchanged. | principle | A: software behavior (+ B) | Verified by tests (25 vs 50 mm/s widths; durations equal). General paper statement needs a source. |
| `ex-speed.expected-width-feedback` | Feedback states an expected width such as "800 ms × 25 mm/s = 20 mm". | feedback | A: software behavior | Verified by tests. The unit is logical mm in this simulator, not a physical screen or print size (`calibration.ts` comments; lesson 3). |
| `ex-speed.grid-unit-label` | The input is labelled "Interval width on paper (mm)". | UI label | D: wording | "Paper" can be read as physical paper; consider "on the logical grid (mm)". |

**Questions for the educational reviewer**

- Should learners also be asked to count small and large grid boxes? (Not currently implemented; would need a source for box-to-time equivalence.)
- Is the mm entry field sufficient evidence that a learner understands the time-scale transformation?

**Questions requiring qualified medical review**

- M5: Should standard clinical paper speeds be named, and if so from which authoritative source? The exercise currently names only the simulator's three selectable speeds (12.5, 25, 50 mm/s) without calling any "standard".

**Recommended revisions before any release**

- Re-scope the principle text to "In this simulator" (as lesson 3 v0.4.0 did), or add an exact source passage.
- Rename the input label to avoid implying physical paper.

## Packet 8 — Guided exercise: Read the calibration pulse

### Exercise record (exact current text from `src/exercises/definitions.ts`)

| Field | Current record |
|---|---|
| ID / version | `grid-and-calibration` / `0.1.0` |
| Kind | `grid-calibration` |
| Status | `draft` / `unreviewed`; no review records exist; not in the content registry; not published |
| Title | Read the calibration pulse |
| Objective | Use the calibration pulse to work out how tall 1 mV and how wide 200 ms are on the simulator grid at two different settings. |
| Principle | In this simulator the calibration pulse is 1 mV tall and 200 ms wide. Its height in grid millimetres equals the gain setting and its width equals 0.2 s multiplied by the paper speed setting, so changing either control resizes the pulse on the grid. |
| Step 1 (`first-setting`) | Look at the calibration pulse for the current Gain and Paper speed, enter its height and width in grid millimetres, and record a reading. |
| Step 2 (`change-setting`) | Change the Gain or the Paper speed so the pulse changes size. |
| Step 3 (`second-setting`) | Enter the new height and width, record the second reading, then choose Check answer. |
| Hint 1 | The calibration pulse card at the top of the simulator shows the pulse for the current settings. |
| Hint 2 | In this simulator the pulse is 1 mV tall, so its height in millimetres equals the gain setting. |
| Hint 3 | In this simulator the pulse lasts 200 ms (0.2 s), so its width in millimetres is 0.2 times the paper speed setting. |
| Required readings | 2 |
| Tolerances | marker 40 ms; repeat-measurement 8 ms; width 1 mm |
| Provenance | Synthetic signal (`ecg-lab.signal.generateLeadSignals`); signal rights not yet declared (repository has no licence file). Not a patient recording; morphology unvalidated. |
| References attached | None. Candidate references are listed in the register below; none verified. |

**Claim inventory** (documentation IDs; the exercise has no claim IDs in code because exercises are not yet content-schema records). Class: A software behavior · B basic ECG measurement principle needing an authoritative source · C medical/physiological claim needing qualified review · D wording/licensing note.

| Claim ID | Statement (as presented) | Location | Class | Evidence status and action |
|---|---|---|---|---|
| `ex-grid.pulse-is-1mv-200ms` | In this simulator the calibration pulse is 1 mV tall and 200 ms wide. | principle; hints | A: software behavior | Verified by tests: `CALIBRATION_PULSE_*` constants and the exercise grid tests match the pulse the app draws at all nine gain/speed settings. |
| `ex-grid.height-equals-gain` | Its height in grid millimetres equals the gain setting. | principle; hint 2; height check | A: software behavior (+ B) | Verified by tests for the simulator logical mm. Any statement about real ECG paper or a clinical standard is not made here and would need a source. |
| `ex-grid.width-equals-0.2-times-speed` | Its width equals 0.2 s multiplied by the paper speed setting. | principle; hint 3; width check | A: software behavior (+ B) | Verified by tests for the simulator logical mm; same scoping as above. |
| `ex-grid.logical-mm-label` | The inputs are labelled "Calibration pulse height (mm)" and "Calibration pulse width (mm)". | UI labels | D: wording | "mm" are logical grid millimetres, not physical screen or print size (see packet 3); consider "on the logical grid (mm)". |

**Questions for the educational reviewer**

- Is comparing two settings enough to show a learner understands the scaling, or should they also read grid boxes directly?
- Is it clear that the answer is read from the calibration pulse card and the settings, not from the trace?

**Questions requiring qualified medical review**

- M6: Does the simulator-scoped wording ("In this simulator ...") avoid implying a clinical standard for calibration or paper, and is that scoping sufficient?

**Recommended revisions before any release**

- Keep the "In this simulator" scoping in every principle and hint.
- Rename the inputs to refer to the logical grid.

## Packet 9 — Rhythm Challenge categories and cases (draft, unreviewed)

The Rhythm Challenge (`src/rhythm/`) generates every strip from a validated case definition (`rhythmCaseSchema`): 36 cases across 18 categories, each `draft` / `unreviewed`. The waveform comes from a beat schedule (`src/engine/rhythm-signal.ts`, which extends the existing deterministic engine), and the facts shown to learners (regularity, QRS width, P-wave relationship, rate) are computed from that schedule, then asserted against the category description in `src/rhythm/cases.test.ts`. Those tests prove the **drawn strip matches the description**; they say nothing about whether the description or the simplified morphology is medically right. No source is attached to any category, no reviewer exists, and the templates are invented teaching shapes, not validated physiology.

**Exact category text** (class C: each explanation is a medical statement awaiting source and qualified review). "Expected" is what the synthetic generator is built to show.

| Category ID | Label | Explanation shown to learners (exact) | Expected on the strip | Rate band of the synthetic cases |
|---|---|---|---|---|
| `nsr` | Normal sinus rhythm | Regular R–R intervals, one P wave before each narrow QRS complex, and a rate within the 60–100 per minute band. | regular; QRS narrow; P: one-per-qrs | 60–100 per minute |
| `sinus-bradycardia` | Sinus bradycardia | Regular rhythm with a P wave before each narrow QRS, at a rate below 60 per minute. | regular; QRS narrow; P: one-per-qrs | 30–59 per minute |
| `sinus-tachycardia` | Sinus tachycardia | Regular rhythm with a P wave before each narrow QRS, at a rate above 100 per minute. | regular; QRS narrow; P: one-per-qrs | 101–160 per minute |
| `sinus-arrhythmia` | Sinus arrhythmia | The R–R interval gradually lengthens and shortens, while every QRS is still preceded by a P wave and remains narrow. | irregular; QRS narrow; P: one-per-qrs | 55–100 per minute |
| `pac` | Premature atrial contraction | An underlying regular rhythm interrupted by an early beat that has a differently shaped P wave and a narrow QRS. | irregular; QRS narrow; P: one-per-qrs | 60–100 per minute |
| `atrial-fibrillation` | Atrial fibrillation | Irregularly irregular R–R intervals with no organised P waves; the baseline shows fine fibrillatory activity. | irregular; QRS narrow; P: fibrillatory | 60–180 per minute |
| `atrial-flutter` | Atrial flutter | A regular sawtooth baseline of flutter waves with QRS complexes following at a fixed ratio (here every fourth flutter wave). | regular; QRS narrow; P: flutter-waves | 60–100 per minute |
| `svt` | Supraventricular tachycardia | A very regular, fast rhythm with narrow QRS complexes and no clearly visible P waves. | regular; QRS narrow; P: absent | 150–220 per minute |
| `first-degree-avb` | First-degree AV block | Every P wave is followed by a QRS, but the PR interval is prolonged and stays constant. | regular; QRS narrow; P: one-per-qrs | 55–100 per minute |
| `mobitz-1` | Second-degree AV block, Mobitz type I | The PR interval lengthens with each beat until a P wave is not followed by a QRS; the cycle then repeats. | irregular; QRS narrow; P: more-p-than-qrs | 35–70 per minute |
| `mobitz-2` | Second-degree AV block, Mobitz type II | The PR interval of conducted beats stays constant, then a P wave suddenly fails to conduct and no QRS follows. | irregular; QRS narrow; P: more-p-than-qrs | 35–70 per minute |
| `avb-2to1` | 2:1 AV block (Mobitz type cannot be determined) | Every second P wave is followed by a QRS. With only 2:1 conduction there is no PR-lengthening sequence to observe, so this strip alone cannot show whether the block is Mobitz type I or type II. | regular; QRS narrow; P: more-p-than-qrs | 30–60 per minute |
| `third-degree-avb` | Third-degree (complete) AV block | P waves and QRS complexes each occur at their own regular rate with no consistent relationship between them (AV dissociation). | regular; QRS wide; P: more-p-than-qrs | 20–50 per minute |
| `pvc` | Premature ventricular contraction | An underlying regular rhythm interrupted by an early, wide, differently shaped QRS with no preceding P wave and a discordant T wave, followed by a pause. | irregular; QRS wide; P: some-qrs-without-p | 60–100 per minute |
| `idioventricular` | Idioventricular rhythm | A slow, regular rhythm of wide QRS complexes with no visible P waves. | regular; QRS wide; P: absent | 20–49 per minute |
| `vt` | Ventricular tachycardia | A fast, regular rhythm of wide QRS complexes with no visible P waves. | regular; QRS wide; P: absent | 150–250 per minute |
| `vf` | Ventricular fibrillation | Chaotic, disorganised electrical activity with no discrete QRS complexes, so a rate cannot be measured. | irregular; QRS none; P: absent | not measurable |
| `paced` | Paced rhythm | Narrow pacing spikes, each followed by a wide QRS complex, at a regular rate. | regular; QRS wide; P: absent | 50–100 per minute |

**Other learner-facing text generated from these records:** answer options (the correct category, three chosen from its `similarTo` list, and "Cannot be determined from this strip"); distractor rationales built by comparing the expected features above; three progressive hints that state regularity, P-wave relationship and QRS width without naming the answer; and the rate method sentence ("count the QRS complexes in the 6-second strip and multiply by 10, or for a regular rhythm divide 60 000 by the R–R interval in milliseconds").

**Rate expectation policy (software, tested):** the expected ventricular rate is taken from the displayed signal: 60 000 divided by the median R–R interval for regular rhythms, and the six-second QRS count × 10 for irregular ones. The accepted range is ±10 per minute or 10% (regular) and ±15 per minute or 20% (irregular), configurable per case. These tolerances are design choices for a counting estimate, not clinical thresholds. Ventricular fibrillation shows no discrete QRS complexes, so no rate is asked for or scored.

**Handling of ambiguity (software, tested):** the 2:1 AV block category states that this strip alone cannot show Mobitz type I or II. For those cases both the category and "Cannot be determined from this strip" are accepted, and choosing Mobitz I or II is marked incorrect. On every other case the uncertainty answer scores zero and is explained.

**Questions for the educational reviewer**

- Are the answer options at each difficulty level plausible without being unfair, and is offering "Cannot be determined" on every question appropriate?
- Are the three hints useful without giving the answer away?
- Is the six-second counting method explained clearly, and is the rate tolerance reasonable for learners?
- Are 36 cases enough, and is the difficulty assignment (1–3) sensible?

**Questions requiring qualified medical review**

- R1: Is each category explanation accurate, appropriately qualified and suitable for introductory learners?
- R2: Are the synthetic rate bands acceptable design choices (for example sinus tachycardia above 100, bradycardia below 60, idioventricular 20–49, VT 150–250), given they are not offered as clinical thresholds?
- R3: Could any simplified morphology teach a wrong pattern (flutter shown as a 4:1 sawtooth, atrial fibrillation baseline, paced spikes, wide-complex shapes, the premature-beat pauses)?
- R4: Is the 2:1 AV block handling right, and should other inherently ambiguous presentations be excluded or treated the same way?
- R5: Ventricular tachycardia and ventricular fibrillation are high-risk patterns. Do they need escalation-oriented framing, or additional review, before release (decision D5)?
- R6: Are idioventricular rhythm and third-degree block with an escape rhythm distinguishable as designed, and is the distinction presented fairly?

**Recommended revisions before any release**

- Attach a source and exact location to every category explanation, or narrow the explanation to what can be sourced.
- Keep "draft teaching text, not clinical guidance" visible on every feedback panel (currently shown).
- Consider withholding VT and VF from Practice and Timed modes until R5 is answered.
- Record, with the reviewer, which morphology simplifications must be labelled to learners.

## Packet 10 — Virtual Patient cases (draft, unreviewed)

The Virtual Patient feature (`src/patients/`) has 6 fictional cases. Each is a validated record (`patientCaseSchema`) that points at an existing Rhythm Challenge case by id, so the ECG is the same waveform definition, rate expectation and scoring used elsewhere (asserted in `src/patients/cases.test.ts` and a browser test). No heart rate is stored in a case: it is withheld while the learner works and then shown as the rate measured from the strip. All records are `draft` / `unreviewed`, and `escalation` can only be `null`, so no urgency or escalation advice exists in release 1; the debrief says so. Everything is invented teaching material with simulated observations; no patient data or prescribing content is present. The stories and observation values are class C text awaiting qualified review; the waveform mapping is class A and test-verified.

### Case `patient.awareness-after-exercise.01` / `0.1.0` — Awareness of the heartbeat after exercise

| Field | Current record (exact) |
|---|---|
| Status | `draft` / `unreviewed`; escalation guidance: none; not published |
| ECG | `rhythm.nsr.01` (Normal sinus rhythm) |
| Age range | 18–30 years |
| Presentation | A fictional patient attends a routine appointment. They describe becoming aware of their heartbeat for a few minutes after climbing stairs. They feel well today. |
| Symptoms | Awareness of the heartbeat after exertion; No chest pain; No fainting |
| History | No known heart condition (fictional); Does not smoke (fictional) |
| Simulated observations | Blood pressure: 118/74 mmHg; Oxygen saturation: 99% on room air; Respiratory rate: 14 per minute; Temperature: 36.7 °C |
| Learning objectives | Estimate the heart rate from a six-second strip. / Decide whether the R–R intervals are regular. / Check for a P wave before each QRS complex. |
| Caveats | A single resting strip cannot show what happens during symptoms. |

### Case `patient.irregular-heartbeat.01` / `0.1.0` — An irregular heartbeat for several days

| Field | Current record (exact) |
|---|---|
| Status | `draft` / `unreviewed`; escalation guidance: none; not published |
| ECG | `rhythm.atrial-fibrillation.01` (Atrial fibrillation) |
| Age range | 61–75 years |
| Presentation | A fictional patient describes an irregular heartbeat, on and off for several days, with some tiredness. They have not fainted. |
| Symptoms | Irregular heartbeat; Tiredness; No fainting |
| History | No previous ECG available (fictional) |
| Simulated observations | Blood pressure: 134/82 mmHg; Oxygen saturation: 97% on room air; Respiratory rate: 16 per minute; Temperature: 36.6 °C |
| Learning objectives | Estimate the rate of an irregular rhythm by counting QRS complexes in six seconds. / Recognise irregular R–R intervals. / Look for organised P waves. |
| Caveats | For an irregular rhythm the six-second count is only an estimate of the rate. / A single strip cannot establish a cause. |

### Case `patient.sudden-fast-heartbeat.01` / `0.1.0` — A sudden, fast, regular heartbeat

| Field | Current record (exact) |
|---|---|
| Status | `draft` / `unreviewed`; escalation guidance: none; not published |
| ECG | `rhythm.svt.01` (Supraventricular tachycardia) |
| Age range | 31–45 years |
| Presentation | A fictional patient describes a very fast, regular heartbeat that began while sitting at a desk. They feel lightheaded and anxious. |
| Symptoms | Fast, regular heartbeat; Lightheadedness; Anxiety |
| History | No known heart condition (fictional) |
| Simulated observations | Blood pressure: 112/70 mmHg; Oxygen saturation: 98% on room air; Respiratory rate: 18 per minute; Temperature: 36.8 °C |
| Learning objectives | Count a fast rate from a six-second strip. / Decide whether the rhythm is regular. / Describe the QRS width and whether P waves are visible. |
| Caveats | Very fast rates are hard to count; the R–R interval method can help. / A single strip cannot establish a cause. |

### Case `patient.routine-ecg-before-sport.01` / `0.1.0` — A routine ECG before joining a sports programme

| Field | Current record (exact) |
|---|---|
| Status | `draft` / `unreviewed`; escalation guidance: none; not published |
| ECG | `rhythm.first-degree-avb.01` (First-degree AV block) |
| Age range | 18–30 years |
| Presentation | A fictional patient has a routine ECG recorded before joining a new sports programme. They have no symptoms. |
| Symptoms | No symptoms |
| History | Regular exercise (fictional) |
| Simulated observations | Blood pressure: 116/72 mmHg; Oxygen saturation: 99% on room air; Respiratory rate: 12 per minute |
| Learning objectives | Check that every P wave is followed by a QRS complex. / Compare the gap between P wave and QRS across beats. / Estimate the rate. |
| Caveats | An incidental finding on one strip needs clinical context; this exercise only practises recognising the pattern. |

### Case `patient.skipped-beats.01` / `0.1.0` — Occasional skipped beats

| Field | Current record (exact) |
|---|---|
| Status | `draft` / `unreviewed`; escalation guidance: none; not published |
| ECG | `rhythm.pvc.01` (Premature ventricular contraction) |
| Age range | 46–60 years |
| Presentation | A fictional patient describes occasional skipped or thumping beats lasting a few seconds, mostly when resting. They have not fainted. |
| Symptoms | Occasional skipped or thumping beats; No fainting |
| History | Drinks several cups of coffee a day (fictional) |
| Simulated observations | Blood pressure: 126/80 mmHg; Oxygen saturation: 98% on room air; Respiratory rate: 15 per minute; Temperature: 36.6 °C |
| Learning objectives | Find the beat that comes early. / Describe its width and whether a P wave precedes it. / Notice the pause after it. |
| Caveats | A short strip may not capture every symptom. / A single strip cannot establish a cause. |

### Case `patient.unwell-with-fast-pulse.01` / `0.1.0` — Feeling unwell with a fast heartbeat

| Field | Current record (exact) |
|---|---|
| Status | `draft` / `unreviewed`; escalation guidance: none; not published |
| ECG | `rhythm.sinus-tachycardia.01` (Sinus tachycardia) |
| Age range | 31–45 years |
| Presentation | A fictional patient feels hot and tired and has had a fast heartbeat since the morning. They have a raised temperature. |
| Symptoms | Fast heartbeat; Feeling hot and tired |
| History | Symptoms started this morning (fictional) |
| Simulated observations | Blood pressure: 124/76 mmHg; Oxygen saturation: 97% on room air; Respiratory rate: 20 per minute; Temperature: 38.6 °C |
| Learning objectives | Estimate the rate from the strip. / Check that each QRS has a P wave before it. / Separate what the strip shows from what it cannot show. |
| Caveats | The strip shows the rhythm, not why the rate is fast. |

**Questions for the educational reviewer**

- Is each story clear, plausible and free of leading wording, and is the order presentation, ECG, rate, interpretation, debrief the right sequence?
- Are the learning objectives skills a learner can actually practise on one strip?
- Is withholding the heart rate until after answering the right choice?

**Questions requiring qualified medical review**

- P1: Does each presentation, with its symptoms and simulated observations, make a clinically sensible fictional picture without implying a diagnosis or a causal link between a symptom and the rhythm?
- P2: Are the simulated observation values plausible for each story and not misleading (for example the temperature in the case with a fast regular rhythm, or blood pressure in the case with a fast regular narrow-complex rhythm)?
- P3: Is it acceptable to give no urgency or escalation guidance for these cases in release 1, or must reviewed framing exist first (decision D6)? Every case currently says that none is given.
- P4: Is "cannot be determined from this strip" appropriately framed, and are the "keep in mind" caveats accurate?

**Recommended revisions before any release**

- Have a reviewer approve or rewrite each story and its observations before any wider use.
- Add reviewed escalation guidance only through a schema change (the current schema refuses free text there), with its own claim inventory and sources.
- Keep the fictional-patient banner and the "not a clinical tool" wording visible on every step.

## Candidate reference register — additions for the exercises (all UNVERIFIED)

Nothing below has been opened, read or confirmed in this pass. Only title/author information a reviewer can search for is listed; do not treat any of it as a citation until a reviewer records edition, chapter/page, access and rights.

| Candidate | Proposed to support | What is not verified |
|---|---|---|
| Becker 2006 (`ref.becker-fundamentals-ecg`, already registered) | `ex-rr.rr-is-peak-to-peak`, `ex-rr.rate-from-rr`, `ex-speed.mm-equals-seconds-times-speed` — only if its "ECG Paper" / rate sections say so | Whether it states these at all; full text was not reviewable earlier; dental/anesthesia framing; rights |
| Kligfield et al. 2007 (`ref.kligfield-ecg-technology`, already registered) | `ex-lead.single-beat-one-time` via "Simultaneous Lead Presentation" (indexed excerpt p. 1315 only) | Exact passage; no paper-speed or gain passage was located; permissions require express permission to copy or alter; 2007 currentness |
| Goldberger AL, Goldberger ZD, Shvilkin A. *Goldberger's Clinical Electrocardiography: A Simplified Approach* (Elsevier) | R–R definition, rate calculation, grid and speed conventions | Edition, chapter, page, ISBN, access, rights |
| Hampton JR. *The ECG Made Easy* (Elsevier) | Same basic-measurement claims, more introductory | Edition, chapter, page, ISBN, access, rights |
| IEC 60601-2-25 (ECG equipment particular requirements) | Only if a statement about standard speed or sensitivity is kept | Edition and currentness; paywalled; not reproducible; probably better to avoid the claim |
| Indian NMC competency-based curriculum documents | Any India-specific alignment | Not retrieved (an earlier attempt returned an error). No competency code is recorded and none may be invented |

## Targeted verification tasks (for a person with source access)

- **VT1** Locate, in an accessible edition, the passage defining the R–R interval and heart-rate-from-interval for regular rhythms. Record edition, page, and whether it limits the rule to regular rhythms. Supports `ex-rr.rr-is-peak-to-peak`, `ex-rr.rate-from-rr`.
- **VT2** Locate passages defining paper speed and gain (units and the speed-to-distance relationship). Record exact wording and edition; decide whether the exercise text can say "In this simulator" or needs the general statement. Supports `ex-gain.gain-definition`, `ex-speed.mm-equals-seconds-times-speed`.
- **VT3** Inspect Kligfield "Simultaneous Lead Presentation" directly (p. 1315 is an unconfirmed index hit). Supports `ex-lead.single-beat-one-time`, lesson 1/2 lead claims.
- **VT4** Find a source for the blood-flow statement (lesson 1, check 1) or confirm it should be removed.
- **VT5** Check whether Becker and Kligfield are still the best available sources, or whether a newer or India-appropriate one replaces them; record currentness.
- **VT6** Find the official NMC curriculum document for the intended audience and record any competency codes actually present.
- **VT7** Obtain the rights position for any text or figure to be reproduced; none is currently reproduced.
- **VT8** Project owner: choose a licence for the repository and decide the declared rights for generated synthetic signals (`usageRights` is `unknown` for all three modes today).
## Shared publication blockers

- No current-version source/licensing, educational, qualified medical, or publication review records exist.
- No claim reference has been set to `source-verified` or `source-and-rights-verified`; source metadata presence is not support verification.
- Claim-to-source rows with unresolved or absent evidence remain blockers. In particular, both blood-flow claims are unmapped.
- Kligfield is 2007 and Becker is 2006; currentness and suitability require human judgment. Indian NMC/CBME mapping is absent.
- Lesson waveforms are synthetic educational templates; morphology is not validated and usage rights remain unknown.
- Each clinical question is gated by a current approved parent lesson; each lesson is gated by published eligible prerequisites and linked questions.

## Outstanding work by category (2026-10-21)

### 1. Missing or uncertain source evidence
- `ecg-not-blood-flow-measurement` (lesson 1 and check 1) has no source mapped. Source, narrow or remove (VT4).
- Exact page or section for every external-source claim in lessons 1–2 and checks 1–2 is unresolved (see the matrix); semantic support is unchecked for both references.
- Exercise class-B claims have no source: R–R definition, rate from interval, gain definition, speed-to-distance rule, simultaneous leads, differing shapes (VT1–VT3).
- Currentness of 2006/2007 sources and India-specific suitability are unestablished (VT5, VT6).

### 2. Licensing and reuse permissions
- Becker: reuse, redistribution, modification and figure rights unknown. Kligfield: express permission required for copying, alteration or distribution.
- Synthetic signal `usageRights` are `unknown` in all lesson and question provenance; the repository has no licence file. Owner decision D3 / VT8.
- No third-party figures, ECG images or quotations were identified in lesson or exercise records; a reviewer should confirm.

### 3. Educational review
- Decide whether lesson 3 should be reframed as product documentation rather than ECG teaching (D2).
- Review the exercise questions in packets 4–7 (reproducible targets across leads, tolerance rationale, whether width entry shows understanding).
- Decide whether exercise wording must match lesson 3's "In this simulator" scoping (recommended).

### 4. Qualified medical review
- M1 regular-R–R caveat for the simplified atrial-fibrillation preset; M2–M6 in packets 4–8; R1–R6 for the Rhythm Challenge categories in packet 9; P1–P4 for the Virtual Patient cases in packet 10.
- Lessons 1–2 definition accuracy and the "more lead views than electrodes" statement.
- Whether lesson 3/check 3 truly need medical review under their current `clinical-education` domain (D2). Do not reclassify without a version bump and a reviewer's advice; the `non-clinical-education` value exists but changing it relaxes a gate.

### 5. Automated verification of software behavior (class A)
| Behavior | Evidence (software only, not medical correctness) |
|---|---|
| Leads share one timeline; limb-lead equations | `src/engine/signal-window.test.ts` |
| Time/voltage transforms, calibration pulse, logical grid units | `src/engine/calibration.test.ts` |
| Exercise targets follow the preset; tolerance boundaries; progress and persistence | `src/exercises/exercises.test.ts`, `src/exercises/GuidedExercises.test.tsx` |
| Exercise workflows, keyboard use, axe, no overflow, exercises absent from Learn | `tests/e2e/ecg-lab.spec.ts` (guided ECG exercises), `tests/e2e/layout-stress.spec.ts` |
| Rhythm strips match their category descriptions; rate expectations come from the displayed signal; scoring, options, hints, ambiguity handling | `src/rhythm/cases.test.ts` |
| Challenge sessions: selection, duplicate-submission prevention, retry, timer, pause, expiry | `src/rhythm/session.test.ts`, `src/rhythm/RhythmChallenge.test.tsx` |
| XP, achievements, personal bests, persistence, corrupt storage | `src/academy/progress.test.ts`, `src/academy/patients.test.ts` |
| Patient cases validate, point at real ECGs, share the challenge waveform, withhold the heart rate, refuse stored escalation text; the flow, focus, unavailable content, accessibility and layout | `src/patients/cases.test.ts`, `src/patients/VirtualPatient.test.tsx`, `tests/e2e/virtual-patient.spec.ts` |
| Review packets and matrix stay in step with the code | `src/exercises/review-packet.test.ts` (added 2026-10-21) |
No class-A claim is currently untested. Class-A tests say nothing about whether the synthetic morphology is medically sound.

### Decisions needed from people
- **D1** Approve adding an `exercise` content type so exercises can go through the same gates.
- **D2** Decide the correct content domain and review scope for lesson 3 / check 3 and for the exercises.
- **D3** Declare licence and signal usage rights (VT8).
- **D4** Decide whether exercise text is narrowed to "In this simulator" or sourced for general statements.
- **D5** Decide whether ventricular tachycardia and fibrillation strips stay in Practice and Timed modes before escalation-oriented framing is reviewed (R5).
- **D6** Decide whether the Virtual Patient cases may be used with no urgency or escalation guidance (P3), or must wait for reviewed framing. The schema currently refuses escalation text.

## Reviewer checklist (blank; to be completed only by a real reviewer)

Do not tick on anyone's behalf. Bind every record you submit to the exact content ID and version, and use `recordReviewIntake()` fields from [CONTENT_REVIEW_WORKFLOW.md](CONTENT_REVIEW_WORKFLOW.md).

**Source / licensing reviewer**
- [ ] For each claim row in the matrix I opened the cited source and recorded edition and page or section.
- [ ] I judged whether each passage supports the exact wording, and noted narrowing or removal where it does not.
- [ ] I checked currentness and jurisdiction (including India suitability).
- [ ] I recorded rights for reuse, redistribution and modification separately from access.
- [ ] I confirmed no unlicensed figure, ECG image or quotation is reproduced.

**Educational reviewer**
- [ ] I reviewed the exact version text of each lesson, question and exercise in the packets.
- [ ] I answered the educational questions listed for each packet.
- [ ] I checked answer keys, distractors and explanations.
- [ ] I decided on the recommended revisions (accept, change or reject, with reasons).

**Qualified medical reviewer**
- [ ] I supplied my own name and qualifications for the record (not copied from this document).
- [ ] I answered M1–M6, R1–R6, P1–P4 and the lesson 1–2 definition questions.
- [ ] I confirmed or corrected the limitation statements about synthetic, unvalidated morphology.

**Publication approver**
- [ ] All source, educational and medical records exist for the exact version and cover the complete claim inventory with no unresolved follow-up.
- [ ] Parent lesson and prerequisites are eligible before any linked question.
