# Claim-to-source matrix — Learn review packet

This matrix is a reviewer worklist, not a statement that a source supports every mapped claim. Record-level source references currently remain `unverified`. The bibliographic records were checked; semantic support, currentness, and rights are not thereby verified. A mapping means “candidate source to inspect,” not “evidence established.”

## Candidate sources checked in this checkpoint

### `ref.becker-fundamentals-ecg`

- **Citation checked:** Daniel E. Becker. “Fundamentals of electrocardiography interpretation.” *Anesthesia Progress*. 2006 Summer;53(2):53–63; quiz 64. DOI `10.2344/0003-3006(2006)53[53:FOEI]2.0.CO;2`. PMID 16863387; PMCID PMC1614214.
- **Verified bibliographic details:** title, author, journal/date season, volume/issue/page range, DOI, PMID/PMCID match the indexed record. The earlier record’s page range incorrectly included quiz page 64; metadata has been corrected.
- **Candidate source locations:** article sections “The ECG Tracing,” “Technical Considerations,” and “ECG Paper”; Figures 4 and 5. Searchable full text identifies body-surface electrical recording, lead arrangements, the voltage/time axes, 25 mm/s, and 1 mm/5 mm timing divisions. Exact print page/paragraph for each mapped claim was not recorded during this focused pass; reviewer must locate it in the full text.
- **Limitations:** a 2006 continuing-education article situated in dental/anesthesia monitoring, not an Indian MBBS curriculum source. Applicability and currentness require reviewer judgment. The source itself or its figures must not be reproduced based solely on PubMed/PMC access.
- **Rights:** reuse, redistribution, modification, and figure permissions unresolved. Reference metadata has no licence grant. Runtime `verificationStatus` remains `unverified`.

### `ref.kligfield-ecg-technology`

- **Citation checked:** Paul Kligfield et al. “Recommendations for the standardization and interpretation of the electrocardiogram. Part I: The electrocardiogram and its technology: a scientific statement from the American Heart Association Electrocardiography and Arrhythmias Committee, Council on Clinical Cardiology; the American College of Cardiology Foundation; and the Heart Rhythm Society: endorsed by the International Society for Computerized Electrocardiology.” *Circulation*. 2007 Mar 13;115(10):1306–1324; published online Feb 23. DOI `10.1161/CIRCULATIONAHA.106.180200`. PMID 17322457.
- **Verified bibliographic details:** title, author group, issuing bodies, date, journal, volume/issue/pages, DOI, and PMID match PubMed. It is a professional-society scientific statement, not classified as an ordinary peer-reviewed research study.
- **Candidate source locations:** PubMed abstract describes derivation/display, lead placement, recording methods, waveform presentation, and global measurements. An indexed full-text excerpt identifies “Simultaneous Lead Presentation” and derived/redundant limb leads at page 1315. Exact locations for the introductory definitions and paper/gain values remain unresolved and must be checked in the full article.
- **Limitations/currentness:** this is a 2007 statement. A focused search found later Part II–V statements and subsequent technical literature, but did not establish that Part I remains current or identify a superseding Part I. Reviewer must check for current standards before approval. It is international/US-society context, not Indian guidance.
- **Rights:** publisher permissions for reuse, redistribution, modification, and figures are unresolved. Runtime `verificationStatus` remains `unverified`.

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

## Lesson 3 — `learn.paper-speed-and-gain` — version `0.3.0`

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `paper-speed-time-scale` | `horizontal-time-scale` body; “Paper speed” term; takeaway 1; linked question prompt/explanation | Becker, “ECG Paper” (25 mm/s and 5 mm = 0.2 s); Kligfield technology/recording standard section. Becker page and Kligfield exact passage to verify. | Candidate only. Confirm the 25 mm/s example and arithmetic; do not generalize it to other speeds. |
| `gain-voltage-scale` | `vertical-voltage-scale` body; “Gain” term; takeaway 2 | Becker, “ECG Paper” (vertical axis denotes voltage); Kligfield technology/calibration section. Exact location for gain/voltage scale not established. | **Support location unresolved.** Find an authoritative exact statement for calibration/gain or narrow the claim to simulator-specific behavior. |
| `standard-grid-units` | `read-the-grid` body | Becker, “ECG Paper” and Figure 5; paper page for this section not recorded. | Candidate only. Verify 1 mm and 5 mm physical paper descriptions and distinguish them from the browser preview. |
| `simulator-time-voltage-transform` | Time and voltage sections; takeaways 1–2 | Project behavior: `src/engine/calibration.ts`, `src/engine/signal.ts`, `src/main.tsx`, regression tests. | Code/test check. Confirm settings alter rendering transforms only, not source samples/timestamps. |
| `calibration-pulse-shares-transform` | Voltage section; calibration explorer description | `src/engine/calibration.ts`, `src/main.tsx`, calibration tests. | Code/test check. Confirm one-millivolt height uses the waveform’s shared transform. |
| `logical-grid-is-not-screen-mm` | Voltage section; takeaway 3 | `src/engine/calibration.ts`, `src/main.tsx`; CSS/SVG preview scale. | Code check. Confirm no statement implies physical-size browser rendering or print calibration. |
| `simulator-grid-coordinate-units` | `read-the-grid` body | SVG/grid renderer and `src/engine/calibration.ts`; unit tests. | Code/test check. Confirm logical minor/major spacing is 1/5 units and not a CSS-pixel assertion. |

## Linked question — `learn.check.paper-speed-and-gain` — version `0.3.0`

Parent: `learn.paper-speed-and-gain`.

| Claim ID | Exact record location | Candidate source and source location to inspect | Status / reviewer action |
|---|---|---|---|
| `paper-speed-time-scale` | Prompt; “200 ms” choice/key; explanation | Becker, “ECG Paper” (5 mm corresponds to 0.20 seconds at the stated standard speed); Kligfield exact paper-speed location unresolved. | Candidate only. Confirm units and arithmetic; question remains formative and draft. |

## Required reviewer disposition for each row

For every external-source row, record the source edition/version actually inspected and exact page/section/recommendation or mark it unavailable. Decide whether the passage supports the wording, whether a newer authoritative source supersedes it, and whether the claim should be narrowed or removed. For project-behavior rows, link an implementation/test result. An unresolved row remains a publication blocker. Do not change a reference to `source-verified` solely because its citation metadata was found.

