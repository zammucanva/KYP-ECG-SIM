# ECG Learn curriculum plan

Status: curriculum plan plus three authored draft lessons. Nothing is currently published to learners. Passing the schema is not educational, source/licensing, medical, or publication approval.

## Authoring and release rules

- IDs below are the stable IDs reserved for the content registry. Items marked **draft record** exist in `src/content/learn/records.ts`; the remaining entries are **curriculum plans**, not learner content.
- Every future record must carry its objective-to-source links, explicit provenance, limitations, version, and review metadata. New or changed versions require fresh approvals.
- A lesson and every linked question must pass the shared registry gates independently. Lessons remain absent from the learner catalog until the full dependency chain is eligible and published.
- The first three records use text plus an explicitly synthetic simulator illustration. The authored explanation, source mapping, and formative answer keys still require human review. The signal is an educational template, not a validated patient tracing.
- Indian MBBS/CBME alignment is an authoring requirement, not an established mapping in this release. No NMC competency code or Indian clinical recommendation is asserted here. NMC source mapping must use a current, verified curriculum source and be reviewed before inclusion.
- References listed as **candidate** require claim-by-claim source verification before content can be published. “Source research required” is intentionally not a citation.
- Reviewer-ready claim locations and blockers for the three existing records are listed in `LESSON_REVIEW_PACKETS.md` and `CLAIM_SOURCE_MATRIX.md`.

## Sequence

### 1. What an ECG measures — `learn.what-an-ecg-measures` — draft record

- Objective: describe an ECG as a time-varying recording of cardiac electrical potential differences and distinguish this from direct mechanical measurement.
- Prerequisites/difficulty: none; introductory.
- Ordered sections: A signal plotted over time; Read the representation, not more than it shows.
- Key terms: potential difference; electrode; lead.
- Visual/check: annotated synthetic template strip and one formative single-best-answer check.
- References: Becker (`review-article`) and Kligfield (`professional-society-statement`) candidate records are attached to objectives and candidate claim IDs but remain `unverified` pending claim-level source review and rights review. Current content version: `0.3.0`.
- Provenance/review: clinical-education explanation plus synthetic ECG from the simulator generator; draft; no review records.
- Limitations: simplified, unvalidated template; no direct patient data; source support and educational/medical/publication approvals remain outstanding.

### 2. Cardiac electrical conduction — `learn.cardiac-conduction` — curriculum plan

- Objective: outline the conduction sequence at the level supported by approved teaching sources.
- Prerequisites/difficulty: lesson 1; introductory.
- Ordered sections: conduction structures; sequence and timing; what a surface ECG can and cannot show.
- Key terms: to be fixed against reviewed source material; candidate terms include sinoatrial node, atrioventricular node, and His–Purkinje system.
- Visual/check: a sourced, labelled schematic (not an inferred simulator trace); sequence-recall question with explanation.
- References: source research required; select Indian undergraduate teaching references first where available, with international references clearly identified as complementary.
- Provenance/review: planned text-only explanation and externally sourced or separately authored schematic; draft/not authored; no review records.
- Limitations: no clinical inferences or exact conduction timings authored in this checkpoint.

### 3. Electrodes versus leads — `learn.electrodes-versus-leads` — draft record

- Objective: distinguish physical recording contacts from electrical views derived from electrode measurements.
- Prerequisites/difficulty: lesson 1; introductory.
- Ordered sections: physical electrodes; several views share one recording.
- Key terms: electrode; lead view; time alignment.
- Visual/check: six limb-lead views from one aligned synthetic recording; one formative single-best-answer check.
- References: Becker (`review-article`) and Kligfield (`professional-society-statement`) candidates are linked to objectives/claims and remain `unverified`. Current content version: `0.3.0`.
- Provenance/review: sourced-draft text plus synthetic educational ECG; draft; no review records.
- Limitations: the software demonstration does not teach patient electrode placement, validate morphology, or establish clinical interpretation.

### 4. Standard twelve-lead ECG overview — `learn.standard-12-lead-overview` — curriculum plan

- Objective: explain what the standard lead set is intended to represent using a reviewed, jurisdiction-aware source.
- Prerequisites/difficulty: lessons 1 and 3; introductory.
- Ordered sections: limb-lead group; precordial-lead group; shared recording and alignment.
- Key terms: to be finalized after source review; lead groups and electrode count require explicit source support.
- Visual/check: labelled, sourced placement/view diagram; identify groups and distinguish them from electrodes.
- References: Kligfield is a candidate for recording/lead technology; source verification and claim mapping required.
- Provenance/review: text plus sourced schematic; draft/not authored; no review records.
- Limitations: no placement advice or regional interpretation until verified and reviewed.

### 5. Simulator scale: time and voltage — `learn.paper-speed-and-gain` — draft record, revised v0.4.0

- Objective: describe the simulator’s horizontal time and vertical voltage coordinate mappings, and distinguish logical preview units from physical paper.
- Prerequisites/difficulty: lesson 1; introductory.
- Ordered sections: paper speed sets horizontal scale; gain sets vertical scale; use the grid as a ruler.
- Key terms: paper speed; gain; calibration pulse.
- Visual/check: interactive speed and gain demonstration using shared engine transforms; the linked question tests a simulator-specific time-coordinate mapping.
- References: none attached in v0.4.0 because the remaining claims are explicitly project-behavior claims. Becker/Kligfield candidate sources did not provide verified exact support during this pass; their reference records elsewhere remain unverified.
- Provenance/review: explanatory text and simulator-generated synthetic trace; draft; no review records; `lastReviewedAt` absent.
- Limitations: logical SVG units are not physical screen millimetres; print/export is not implemented; the text does not teach general ECG device standards; synthetic morphology is unvalidated.

### 6. P waves — `learn.p-waves` — curriculum plan

- Objective: identify the P-wave region in a labelled, sourced teaching example and explain only its reviewed basic interpretation.
- Prerequisites/difficulty: lessons 1, 2, and 5; introductory.
- Ordered sections: where the P wave is displayed; relationship to atrial activation; limits of a simplified illustration.
- Key terms: finalized after review.
- Visual/check: use a sourced or explicitly schematic example; identify the annotated region and explain its limits.
- References: source research required.
- Provenance/review: text-only or rights-cleared illustration; draft/not authored; no review records.
- Limitations: do not imply that the simulator’s P-like template is a clinical waveform.

### 7. PR interval — `learn.pr-interval` — curriculum plan

- Objective: measure a manually selected interval with the shared calibration and explain its stated boundaries in an approved educational context.
- Prerequisites/difficulty: lessons 5 and 6; introductory.
- Ordered sections: selected start/end points; calibrated duration; why manual points are not automated detection.
- Key terms: PR interval; measurement boundary.
- Visual/check: shared simulator manual calipers and a boundary-selection check.
- References: source research required for definition and any interpretation.
- Provenance/review: explanatory text plus synthetic template; draft/not authored; no review records.
- Limitations: no diagnostic threshold or automated boundary detection in this lesson plan.

### 8. QRS complexes — `learn.qrs-complexes` — curriculum plan

- Objective: identify a QRS region and measure a manually selected duration without treating template annotations as validated boundaries.
- Prerequisites/difficulty: lessons 2, 5, and 7; introductory.
- Ordered sections: labelled QRS region; selecting boundaries; duration versus morphology.
- Key terms: finalized after review.
- Visual/check: sourced example or explicitly schematic teaching illustration; manual measurement practice.
- References: source research required.
- Provenance/review: sourced or schematic visual; draft/not authored; no review records.
- Limitations: morphology and duration interpretation require qualified review; no simulator-generated diagnosis.

### 9. ST segments — `learn.st-segments` — curriculum plan

- Objective: locate the ST segment on an approved example and describe the limits of a single visual feature.
- Prerequisites/difficulty: lessons 5, 6, and 8; intermediate.
- Ordered sections: orientation to the segment; measurement reference; context and limitations.
- Key terms: finalized after review.
- Visual/check: sourced, rights-cleared example; recognition check that avoids unsupported diagnosis.
- References: source research required, prioritizing current Indian guidance where relevant.
- Provenance/review: only sourced/licensed illustration or text until suitable data is available; draft/not authored; no review records.
- Limitations: no clinical thresholds, triage statements, or diagnostic rules authored here.

### 10. T waves — `learn.t-waves` — curriculum plan

- Objective: identify the T-wave region and explain the approved introductory description without inferring disease from a synthetic template.
- Prerequisites/difficulty: lessons 2, 5, 8, and 9; intermediate.
- Ordered sections: locate the T-wave region; relation to the surrounding trace; interpretation limits.
- Key terms: finalized after review.
- Visual/check: sourced or explicitly schematic visual and a recognition check.
- References: source research required.
- Provenance/review: sourced or schematic visual; draft/not authored; no review records.
- Limitations: no morphology is claimed clinically representative.

### 11. QT interval and QTc — `learn.qt-and-qtc` — curriculum plan

- Objective: distinguish a measured QT interval from a correction calculation and reproduce only a reviewed formula with its limitations.
- Prerequisites/difficulty: lessons 5, 8, and 12; intermediate.
- Ordered sections: manual QT boundaries; why correction is considered; formula demonstration and limitations.
- Key terms: QT; QTc; RR; correction formula.
- Visual/check: shared manual QT measurement and a deterministic arithmetic example; no medication decision support.
- References: source research required for formulas and caveats.
- Provenance/review: text and synthetic educational illustration; draft/not authored; no review records.
- Limitations: simulator helper functions are not clinical decision support; no treatment thresholds or recommendations.

### 12. Heart rate — `learn.heart-rate` — curriculum plan

- Objective: calculate rate from a measured RR interval in a clearly stated regular-rhythm teaching example.
- Prerequisites/difficulty: lessons 5 and 8; introductory.
- Ordered sections: measure RR; calculate a rate; state when the simple example does not apply.
- Key terms: RR interval; beats per minute; regularity.
- Visual/check: shared `heartRateFromRrMs` helper and known-value calculation.
- References: source research required for the teaching explanation and limitations.
- Provenance/review: synthetic educational trace; draft/not authored; no review records.
- Limitations: no clinical classification, irregular-rhythm shortcut, or patient-specific inference.

### 13. Rhythm analysis — `learn.rhythm-analysis` — curriculum plan

- Objective: follow a source-reviewed descriptive sequence for rhythm observations without claiming automated interpretation.
- Prerequisites/difficulty: lessons 2, 6, 8, and 12; intermediate.
- Ordered sections: describe regularity; inspect repeated components; state uncertainty and context.
- Key terms: finalized after reviewer selects a bounded method.
- Visual/check: source-backed examples; deterministic descriptive question, not diagnosis scoring.
- References: source research required; Indian context and exam relevance require separate review.
- Provenance/review: sourced, rights-cleared examples; draft/not authored; no review records.
- Limitations: no algorithmic rhythm classification is implemented.

### 14. Cardiac axis — `learn.cardiac-axis` — curriculum plan

- Objective: explain an approved introductory axis method and apply it only to a suitable, sourced teaching example.
- Prerequisites/difficulty: lessons 3, 4, 8, and 13; intermediate.
- Ordered sections: lead-view orientation; selected method; assumptions and limitations.
- Key terms: finalized after source and medical review.
- Visual/check: labelled limb-lead schematic and reviewed worked example.
- References: source research required.
- Provenance/review: text plus rights-cleared schematic or case; draft/not authored; no review records.
- Limitations: no axis classification of the unvalidated simulator morphology.

### 15. Systematic ECG interpretation — `learn.systematic-interpretation` — curriculum plan

- Objective: apply a reviewed, explicitly sourced descriptive checklist to a suitable educational ECG example and state uncertainty.
- Prerequisites/difficulty: lessons 1–14; intermediate.
- Ordered sections: recording quality and calibration; rate/rhythm; intervals and waveform review; summary and limits.
- Key terms: finalized after expert review.
- Visual/check: a fully sourced/licensed example; formative explanation rather than a high-stakes score.
- References: source research required; Indian recommendations must not be replaced silently by international guidance.
- Provenance/review: only reviewed educational examples; draft/not authored; no review records.
- Limitations: no diagnosis, triage, or exam-performance claim until separately reviewed.

### 16. Technical errors and common artifacts — `learn.technical-errors-and-artifacts` — curriculum plan

- Objective: identify technical quality concerns on source-reviewed examples and distinguish them from physiologic interpretation.
- Prerequisites/difficulty: lessons 4 and 5; intermediate.
- Ordered sections: acquisition/setup; display/calibration; artifact examples; limits of automated checks.
- Key terms: finalized after technical and medical review.
- Visual/check: sourced or specifically simulated artifact examples with provenance and nonclinical labels.
- References: source research required; recording standards are a candidate topic for Kligfield, subject to claim-level verification.
- Provenance/review: separately described synthetic illustrations or rights-cleared source data; draft/not authored; no review records.
- Limitations: the current signal engine does not simulate a validated acquisition-artifact pipeline.

## References presently attached to draft records

- Becker DE. “Fundamentals of electrocardiography interpretation.” *Anesthesia Progress*. 2006 Summer;53(2):53–63; quiz 64. DOI: `10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2`. [PubMed record](https://pubmed.ncbi.nlm.nih.gov/16863387/). Bibliographic details checked; candidate only, exact claim support/context and rights unresolved.
- Kligfield P, et al. “Recommendations for the standardization and interpretation of the electrocardiogram. Part I: The electrocardiogram and its technology.” *Circulation*. 2007;115(10):1306–1324. DOI: `10.1161/CIRCULATIONAHA.106.180200`. [PubMed record](https://pubmed.ncbi.nlm.nih.gov/17322457/). Professional-society statement; bibliographic details checked; candidate only, currentness, exact claim support, and reuse rights unresolved.

Lessons/checks 1–2 remain at version `0.3.0`; lesson/check 3 were revised together to version `0.4.0` with claim inventories and linked formative-question parent IDs. This is review preparation, not new curriculum publication. The Learn catalog remains empty. Two blood-flow assertions in the first draft remain unmapped and must be sourced, narrowed, or removed before release. The review workflow and source-refresh process are authoritative in `CONTENT_REVIEW_WORKFLOW.md` and `CONTENT_PROVENANCE.md`.
