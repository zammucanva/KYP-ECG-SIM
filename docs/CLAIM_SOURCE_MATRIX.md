# Claim-to-source matrix — Learn review packet

This matrix is a reviewer worklist, not a statement that a source supports every mapped claim. Record-level source references currently remain `unverified`. The bibliographic records were checked; semantic support, currentness, and rights are not thereby verified. A mapping means “candidate source to inspect,” not “evidence established.”

## Candidate sources checked in this checkpoint

### `ref.becker-fundamentals-ecg`

- **Citation checked:** Daniel E. Becker. “Fundamentals of electrocardiography interpretation.” *Anesthesia Progress*. 2006 Summer;53(2):53–63; quiz 64. DOI `10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2`. PMID 16863387; PMCID PMC1614214.
- **Verified bibliographic details:** title, author, journal/date season, volume/issue/page range, DOI, PMID/PMCID match the indexed record. The earlier record’s page range incorrectly included quiz page 64; metadata has been corrected.
- **Source inspection in this pass (2026-10-20):** PubMed bibliographic metadata was checked. The available browser tool did not provide reviewable PMC full text (the prior direct attempt was blocked by its access challenge). Search snippets and indexed excerpts are not accepted as direct claim evidence here. Exact page/paragraph for all clinical claims remains unresolved.
- **Limitations:** a 2006 continuing-education article situated in dental/anesthesia monitoring, not an Indian MBBS curriculum source. Applicability and currentness require reviewer judgment. The source itself or its figures must not be reproduced based solely on PubMed/PMC access.
- **Rights:** reuse, redistribution, modification, and figure permissions unresolved. Reference metadata has no licence grant. Runtime `verificationStatus` remains `unverified`.

### `ref.kligfield-ecg-technology`

- **Citation checked:** Paul Kligfield et al. “Recommendations for the standardization and interpretation of the electrocardiogram. Part I: The electrocardiogram and its technology: a scientific statement from the American Heart Association Electrocardiography and Arrhythmias Committee, Council on Clinical Cardiology; the American College of Cardiology Foundation; and the Heart Rhythm Society: endorsed by the International Society for Computerized Electrocardiology.” *Circulation*. 2007 Mar 13;115(10):1306–1324; published online Feb 23. DOI `10.1161/CIRCULATIONAHA.106.180200`. PMID 17322457.
- **Verified bibliographic details:** title, author group, issuing bodies, date, journal, volume/issue/pages, DOI, and PMID match PubMed. It is a professional-society scientific statement, not classified as an ordinary peer-reviewed research study.
- **Source inspection in this pass (2026-10-20):** PubMed metadata and the AHA-hosted PDF front matter/abstract were accessible. The source states that multiple copying, modification, alteration, enhancement, and distribution require express permission. No exact paper-speed or gain passage was located in the inspected excerpt. An indexed excerpt elsewhere had identified a page-1315 section, but it was not directly checked in this pass and is not treated as exact claim evidence.
- **Limitations/currentness:** this is a 2007 international/US professional-society statement, not Indian guidance. Currentness against later standards was not established. Reviewer must check for current standards before any sourced clinical claim is approved.
- **Rights:** source access is not reuse permission; reuse conditions for any proposed source material remain unresolved. Runtime `verificationStatus` remains `unverified`.

No source reference currently establishes Indian NMC/CBME alignment. An official NMC CBME 2024 listing appeared in the source search, but the discovered PDF endpoint returned an error during retrieval; no competency code or India-specific claim has been mapped. If such alignment is later added, record the accessible official source and precise competency/page after direct verification.

## Lesson 1 — `learn.what-an-ecg-measures` — version `0.3.0`

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `potential-difference-is-voltage-difference` | Key term “Potential difference” | Becker, “Electrophysiological Considerations” / “ECG Paper”; Kligfield abstract and technology section. Exact page not recorded. | Candidate only. Confirm that the cited material supports the definition, or replace with an appropriate basic-electrophysiology source. |
| `ecg-surface-potential-over-time` | `signal-over-time` body; objective; takeaway 1 | Becker, “Technical Considerations” / “The ECG Tracing”; Kligfield abstract on how ECG is derived/displayed. Exact Kligfield page unresolved. | Candidate only. Verify exact wording and ensure “body surface” and “over time” are adequately supported. |
| `ecg-not-mechanical-measurement` | `signal-over-time` body; takeaway 2 | Becker, “The ECG Tracing” discussion of P/QRS events and contraction. Exact paragraph/page unresolved. | Candidate only. Confirm wording and avoid conflating electrical recording with mechanical activity. |
| `ecg-not-blood-flow-measurement` | `signal-over-time` body | No source currently linked to this claim. | **Unmapped/unsupported in current packet.** Supply a suitable source and exact location, or remove/narrow this sentence. |
| `ecg-not-palpable-pulse` | `signal-over-time` body | Becker, “The ECG Tracing” discussion of clinical pulse and electrical activity; exact location to be checked. | Candidate only. Verify the distinction directly; do not assume the contraction discussion proves this full wording. |
| `lead-is-derived-view` | `read-the-representation` body; key term “Lead”; takeaway 2 | Becker, “Technical Considerations,” lead/electrode arrangements; Kligfield abstract and “Simultaneous Lead Presentation” (indexed excerpt p. 1315). | Candidate only. Verify the precise definition and terminology. |
| `lead-view-changes-trace-appearance` | `read-the-representation` body | Becker, “Technical Considerations,” passage on tracings varying with electrode locations/polarity; Kligfield discussion of lead placement/presentation. Exact page unresolved. | Candidate only. Check whether “same underlying cardiac activity” is accurately and sufficiently qualified. |
| `template-is-synthetic` | `read-the-representation` body; demonstration description; takeaway 3 | Project behavior: `src/engine/signal.ts`, `src/content/learn/records.ts`, existing signal tests. No external clinical source. | Code/provenance check. Confirm generator output remains explicitly synthetic and unvalidated. |
| `annotations-are-authored-regions` | `template-waveform` description and annotations | Project behavior: lesson record annotations and `src/learn/Demonstrations.tsx`; no automated detector exists. | Code check. Confirm phrasing does not imply validated ECG wave boundaries. |

## Linked question — `learn.check.what-an-ecg-measures` — version `0.3.0`

Parent: `learn.what-an-ecg-measures`.

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `ecg-surface-potential-over-time` | Prompt; “Electrical potential differences displayed over time” choice; answer key; explanation | Becker, “Technical Considerations” / “The ECG Tracing”; Kligfield abstract. Exact claim location unresolved. | Candidate only. Check key and explanation against source wording. |
| `ecg-not-mechanical-measurement` | “Direct measurement of mechanical contraction” distractor; explanation | Becker, “The ECG Tracing”; exact paragraph/page unresolved. | Candidate only. Confirm the distractor is unequivocally false as phrased. |
| `ecg-not-blood-flow-measurement` | “Direct measurement of blood flow through the chambers” distractor; explanation | No source currently linked. | **Unmapped/unsupported.** Source the claim, remove the distractor, or revise the explanation before publishing this question. |

## Lesson 2 — `learn.electrodes-versus-leads` — version `0.3.0`

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `electrode-is-physical-contact` | `physical-electrodes` body; key term “Electrode” | Becker, “Technical Considerations”; Kligfield abstract/lead-placement discussion. Exact page unresolved. | Candidate only. Verify distinction and exact terms. |
| `lead-is-derived-view` | `physical-electrodes` body; key term “Lead view”; takeaway 1 | Becker, “Technical Considerations”; Kligfield, “Simultaneous Lead Presentation” (indexed excerpt p. 1315). | Candidate only. Confirm the claim does not oversimplify lead derivation. |
| `views-can-exceed-electrodes` | `physical-electrodes` body | Becker, “Technical Considerations,” 12-lead discussion; Kligfield, “Simultaneous Lead Presentation” (p. 1315 excerpt about derived/redundant leads). Exact full source context must be inspected. | Candidate only. If adding a specific electrode count, supply an exact source location; current text deliberately avoids a numeric count. |
| `limb-leads-share-timeline` | `derived-lead-views` body; “Time alignment” term; demonstration description | Project behavior: `src/engine/signal.ts`, `src/learn/Demonstrations.tsx`, `src/engine/calibration.test.ts` / signal tests. | Code/test check only. Confirm every lead is from one shared timestamp array and no separate recording is generated per row. |
| `limb-lead-demo-is-not-patient-placement` | `derived-lead-views` body; takeaway 3 | Project provenance and lesson UI; `src/content/learn/records.ts`. | Educational limitation check. Confirm the demo is not framed as placement instruction or clinically validated morphology. |

## Linked question — `learn.check.electrodes-versus-leads` — version `0.3.0`

Parent: `learn.electrodes-versus-leads`.

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `electrode-is-physical-contact` | Prompt; correct “contact-and-view” choice; explanation | Becker, “Technical Considerations”; Kligfield lead-placement/derived-lead discussion. Exact page unresolved. | Candidate only. Review wording and key. |
| `views-can-exceed-electrodes` | “one-trace-per-electrode” distractor; explanation | Becker, “Technical Considerations”; Kligfield, “Simultaneous Lead Presentation” (p. 1315 indexed excerpt). | Candidate only. Check that the distractor is unambiguous and not confused by acquisition/display format. |

## Lesson 3 — `learn.paper-speed-and-gain` — version `0.4.0` (title: “Simulator scale: time and voltage”)

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `simulator-paper-speed-time-scale` | `horizontal-time-scale` body; “Paper speed” term; takeaway 1; linked question prompt/explanation | Project behavior: `timeMsToSvgUnits` and `svgUnitsToTimeMs` in `src/engine/calibration.ts`; tests in `src/engine/calibration.test.ts`. No external source attached. | Verify current implementation/tests; wording is limited to simulator logical coordinates and does not establish physical ECG-paper size. |
| `simulator-gain-voltage-scale` | `vertical-voltage-scale` body; “Gain” term; takeaway 2 | Project behavior: `voltageMvToSvgUnits` / `svgUnitsToVoltageMv` in `src/engine/calibration.ts`; calibration tests. No external source attached. | Verify current implementation/tests; not a claim about universal medical-device gain. |
| `simulator-time-voltage-transform` | Time and voltage sections; takeaways 1–2 | `src/engine/calibration.ts` and `src/engine/calibration.test.ts`. | Verify settings change display transforms but not source samples/timestamps. |
| `calibration-pulse-shares-transform` | Voltage section; calibration explorer description | `calibrationPulseHeightUnits` in `src/engine/calibration.ts`; `CalibrationPulse` in `src/main.tsx`; calibration tests. | Verify one-millivolt height uses the same transformation as the trace. |
| `logical-grid-is-not-screen-mm` | Voltage/grid sections; takeaway 3 | `SVG_UNITS_PER_MM`, `PREVIEW_CSS_PIXELS_PER_SVG_UNIT` in `src/engine/calibration.ts`; SVG viewBox/rendering. | Verify that the text distinguishes logical units, preview CSS pixels, and physical output; no physical-size export exists. |
| `simulator-grid-coordinate-units` | `read-the-grid` body | `src/components/EcgGrid.tsx` and `src/engine/calibration.test.ts`. | Verify logical 1-unit minor and 5-unit major spacing only; do not describe them as verified physical paper divisions. |
| `synthetic-example-is-not-patient-data` | Provenance; known limitation; demonstration description | `signalProvenance` in `src/content/learn/records.ts`; generator in `src/engine/signal.ts`; synthetic label in the simulator UI. | Verify provenance and learner-facing disclosure; no patient recording or clinical validation is implied. |

## Linked question — `learn.check.paper-speed-and-gain` — version `0.4.0`

Parent: `learn.paper-speed-and-gain`.

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `simulator-paper-speed-time-scale` | Prompt; “200 ms” choice/key; explanation | Project behavior: shared calibration conversion functions and `src/engine/calibration.test.ts`. No external reference attached. | Confirm against code/tests and preserve the phrase “in this simulator”; lesson/question remain draft pending genuine educational and required content review. |

## Required reviewer disposition for each row

For every external-source row, record the source edition/version actually inspected and exact page/section/recommendation or mark it unavailable. Decide whether the passage supports the wording, whether a newer authoritative source supersedes it, and whether the claim should be narrowed or removed. For project-behavior rows, link an implementation/test result. An unresolved row remains a publication blocker. Do not change a reference to `source-verified` solely because its citation metadata was found.
