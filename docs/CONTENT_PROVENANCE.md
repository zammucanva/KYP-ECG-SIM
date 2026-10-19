# Content provenance and references

Provenance is required on every content record. It distinguishes what the learner is seeing and what reuse rights are actually known; it is not a generic `verified` flag.

## Provenance categories

| Category | Required provenance |
|---|---|
| Synthetic educational waveform | Generator identifier, waveform technical metadata, explicit usage-rights states; optional source URL or dataset ID |
| Synthetic/algorithmically derived illustration | Generator identifier, usage-rights states, and a reason ECG signal metadata does not apply |
| Licensed real ECG recording | Source identifier and source URL or dataset ID, technical metadata, and explicit licence/reuse/redistribution/modification states |
| Authorized, de-identified patient ECG | Source identifier, authorization reference, de-identification method, source URL or dataset ID, technical metadata, and explicit rights states |
| External educational illustration | Source identifier, optional URL, usage-rights states, and either available signal metadata or a reason it is absent |
| Text-only educational explanation | A reason signal metadata is not applicable |

For ECG signals, the required technical record includes sample rate, duration, lead names and order, voltage and timestamp units, calibration settings, preprocessing, and whether the signal is original or transformed. Source/dataset identifiers and URLs are captured where available. Missing metadata is not inferred; categories without signal data state why it is absent. The actual project fixtures are synthetic or text-only and do not represent real patient data.

Rights are stored as explicit `permitted`, `not-permitted`, or `unknown` values for reuse, redistribution, and modification, with licence name/terms URL where known. A URL alone does not grant permission. The registry blocks public publication of material whose applicable reuse and redistribution rights remain unknown or disallowed; transformation additionally requires modification permission. Real patient-derived material requires recorded authorization and de-identification metadata. The schema does not itself certify that consent, authorization, de-identification, or licensing is legally sufficient.

## Reusable source references

Each reference has an ID, title, source category (primary guideline, professional-society statement, peer-reviewed study, review article, textbook, licensed dataset, educational webpage, or other), and at least one explicit association to a learning-objective ID or claim ID. Optional fields capture authors, issuing organization, jurisdiction, publication date, edition/version, DOI, ISBN, URL, access date, and licence terms. Guideline records require an issuing organization and jurisdiction so Indian and international authority is clear. Verification status is explicit: unverified, source-verified, or source-and-rights-verified. Missing known details can carry a metadata-omission note with the reason.

References are not blanket citations for an entire lesson. Claim links are record-local and must resolve to a claim record. Runtime publication readiness requires every external-source clinical claim to have at least one claim-specific reference marked source-verified or source-and-rights-verified. That status must only follow human inspection of the cited source location and claim; the schema cannot judge semantic support. Project-behavior claims are mapped to code/tests rather than clinical references.

## Source-check and update process

Before publication, a source reviewer checks the source itself, relevant version/edition/date, each mapped claim, exact page/section/recommendation or other location, access conditions, and currentness. Recheck a source when content changes, a guideline/edition is superseded, a URL becomes unavailable, or a licence changes. Record the checked version/date and outcome through the structured review workflow; leave unavailable author, date, DOI, ISBN, or rights information absent and explain the omission rather than guessing. Citation metadata or free full-text access alone does not authorize redistributing source prose, figures, recordings, or images.

Three draft lessons and their three linked formative questions carry candidate references and claim inventories. Bibliographic metadata for Becker and Kligfield was checked against PubMed records during the content-readiness checkpoint, but the records remain `unverified` because exact claim support, applicability/currentness, and reuse permissions are not comprehensively confirmed. Claim-to-source matrices mark unresolved locations and unsupported assertions. No reviewer identity, qualification, medical approval, rights clearance, or publication approval has been entered. The registry remains unpublished until the appropriate genuine current-version records are supplied and validated.

