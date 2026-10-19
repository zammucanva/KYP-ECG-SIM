# Educational content schema

This is the standalone ECG Lab content contract. It is independent of React and signal rendering. The Learn catalog consumes only records accepted by the shared runtime registry and publication-readiness gates. Runtime schemas are defined with [Zod 4](https://zod.dev/basics) and exported TypeScript types are inferred from those schemas so the runtime and static representations share one source of truth. Registry input uses `safeParse()` results so expected malformed records become validation issues instead of uncaught parse exceptions.

## Record types

`ContentRecord` is a discriminated union on `type`:

- `lesson`: requires structured `lessonContent` containing a stable sequence, prerequisite lesson IDs, ordered plain-text sections, optional section-to-demonstration links, key terms, takeaways, visual demonstrations, and linked knowledge-check IDs. Demonstrations are a discriminated union for calibration, limb-lead relationships, authored waveform annotations, or RR/rate interaction. Section and demonstration IDs must resolve within the record.
- `question`: requires question type, prompt, unique choices, answer IDs that exist in those choices, and an explanation. Single-best-answer records must contain exactly one correct answer.
- `case`: always has `contentDomain: clinical-education`; requires context, findings, prompt, answer, rationale, explanation, and may link to a waveform content ID.
- `waveform`: requires one of the ECG-signal provenance categories and its technical metadata.

All records require a stable ID, title, summary, one or more identified learning objectives, difficulty, unique tags, content domain, publication status, provenance, source-reference and review-record arrays, `createdAt`, `updatedAt`, semantic version, and a known-limitations array. `lastReviewedAt` and deprecation/replacement data are optional. Unknown object keys are rejected rather than silently discarded.

## Reference and review records

Source references have stable IDs, title, source kind, explicit claim/objective links, and a verification state. Author(s), issuing organization, jurisdiction, publication date, edition/version, DOI, ISBN, URL, access date, licence, and metadata-omission notes are optional when unavailable. A primary-guideline reference must identify its issuing organization and jurisdiction so Indian and international contexts are not silently conflated. Objective links must resolve within the content record. A licensed-dataset reference must include a licence record; unknown rights remain `unknown` and cannot be marked source-and-rights verified.

Review records identify their review type, state, version reviewed, and required follow-up list. Reviewer identity and review date may be absent for pending or incomplete records. An `approved` record is structurally invalid without a reviewer identity and ISO date. Qualifications are optional metadata but are required by the publication gate for clinical-content approval. Automated schema validation is not stored as a human review record.

## Dates, units, and bounds

Timestamps use ISO 8601 datetimes with an explicit timezone (for example, a UTC `Z` offset). Calendar-only publication, access, review, and deprecation dates use `YYYY-MM-DD`. Creation/update order, review/update order, and date ordering are checked.

ECG signal metadata requires a sample rate from 1 to 100,000 Hz, duration from 1 ms to 24 hours, 1–12 unique lead names in recorded order, voltage units `mV` or `µV`, timestamp unit `ms`, supported paper speed (12.5, 25, or 50 mm/s), supported gain (5, 10, or 20 mm/mV), signal state (`original` or `transformed`), and preprocessing steps. A transformed signal must describe preprocessing; an original signal must not claim preprocessing. The rendering engine's canonical values remain milliseconds and millivolts; imported µV data must be normalized before it is passed to that engine.

## Publication is not schema validity

`validateContentRecord()` parses structure and also rejects records already marked `published` unless their readiness gates pass. `getPublicationReadiness()` reports separate checks for technical schema, source/licensing, educational review, medical-content review, publication approval, and limitations/explanation. All published material requires current-version educational review and a separate current-version publication approval. Clinical education additionally requires source/licensing review, verified supporting references, a named and qualified medical reviewer for the current version, and explicit limitations/explanation. A linked case waveform must itself be an eligible published waveform record.

Review readiness is version-specific. A new version cannot inherit approval from a previous version. These gates validate recorded metadata; they do not independently prove a reviewer's identity, credentials, source accuracy, licence interpretation, or clinical correctness.

## Registry and safe failure

`loadContentRegistry(unknown)` returns validated records, an eligible published subset, rejected original values, and path-specific developer issues. Invalid and duplicate-ID entries are withheld; unresolved case-to-waveform and lesson-to-question/prerequisite links are reported. A published lesson requires every linked question and prerequisite lesson to be published and independently eligible; dependency cycles are rejected. No substitute diagnosis, waveform, or default content is generated. The caller may pass an issue callback for development logging. The initial Learn records are drafts and no fictitious review or approval metadata is seeded, so the learner-facing published list is correctly empty.

Lesson sections are plain text, not HTML. The renderer never interprets them as markup. Knowledge checks use the existing shared `question` record; answer keys and explanations are held until learner submission in the interface. This is a formative lesson interaction, not Practice or Exam mode. See `LEARN_CURRICULUM.md` for topic state and `ARCHITECTURE.md` for rendering and progress boundaries.

See `CONTENT_PROVENANCE.md`, `CLINICAL_CONTENT_POLICY.md`, and `CONTENT_REVIEW_WORKFLOW.md` for the source, clinical, and workflow rules.
