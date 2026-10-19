# Content review and publication workflow

This document is authoritative for content lifecycle transitions and publication gates. Schema validity is a technical prerequisite, not evidence of source verification, educational quality, medical correctness, or approval to publish.

## Lifecycle states and allowed transitions

| Current state | Allowed next state |
|---|---|
| Draft | Awaiting review |
| Awaiting review | Draft; Reviewed for educational use |
| Reviewed for educational use | Awaiting review; Published; Retired |
| Published | Retired |
| Retired | None (terminal) |

The `awaiting-review` state requires a pending educational-content review for the current version. `reviewed-for-educational-use` requires an approved educational-content review for that version. A version change invalidates old approval for publication. The pure transition helper rejects illegal moves and refuses publication unless readiness checks pass.

## Separate checks

1. **Technical/schema validation.** `contentRecordSchema` and `validateContentRecord()` check the record's structure, units, dates, answer keys, provenance metadata, and links. This is automated and is not a human `verified` approval.
2. **Source and licensing verification.** Check the provenance, exact cited versions/claims, source references, rights for reuse/redistribution/modification, and authorization where patient-derived data is involved. Clinical records need an approved `source-and-licensing` review for the current version.
3. **Educational and medical review.** An educational-content review is required for all published items. Clinical education additionally requires a distinct medical-content review tied to the current version. Publication readiness requires the medical reviewer identity and qualifications; the schema records no identity or qualifications unless supplied by the real workflow.
4. **Publication approval.** A separate current-version publication-approval record is required. It does not replace technical, rights, educational, or medical checks.

For a clinical ECG case, all four named controls are independently evaluated. In addition, the case must have an explanation, answer data, supporting verified references, explicit limitations, allowed source/provenance use, and valid calibration metadata for any linked waveform. A linked waveform must itself be eligible for publication. Synthetic cases still require appropriate review; passing limb equations or runtime validation is not clinical validation.

Approved review records require an identity and review date. Clinical medical approval additionally requires recorded qualifications. Pending or incomplete review records may omit reviewer metadata. Unknown reviewer identity remains absent and blocks publication where identity is required; no placeholder reviewer is used. A badge or “medically reviewed” label must not be rendered from a schema-valid record alone.

## Failure handling and current content state

`loadContentRegistry()` keeps raw rejected values and useful path-specific errors for correction, but excludes them from its valid and published lists. Duplicate IDs and unresolved case-to-waveform references are withheld. It does not silently replace invalid content.

The registry contains starter governance fixtures plus three authored introductory lesson drafts and their three linked formative-question drafts. Candidate references on those drafts remain unverified. The case shell and waveform example remain unpublished drafts. There are no published lessons, questions, waveforms, or clinical cases. This is intentional: no reviewer identity, qualification, source/licensing check, or approval has been supplied for this project.
