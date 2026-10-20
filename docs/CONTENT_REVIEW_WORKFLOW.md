# Content review and publication workflow

This is the authoritative lifecycle and release policy for the standalone ECG Lab. Schema validity is only a technical prerequisite. It is not evidence that a claim is true, a source supports a claim, a licence permits reuse, or a reviewer is appropriately qualified.

## Lifecycle states and allowed transitions

| Current state | Allowed next state |
|---|---|
| Draft | Awaiting review |
| Awaiting review | Draft; Reviewed for educational use |
| Reviewed for educational use | Awaiting review; Published; Retired |
| Published | Retired |
| Retired | None (terminal) |

`awaiting-review` requires a pending educational review for the current version. `reviewed-for-educational-use` requires an approved educational review for that version. Publication still has independent source/licensing, medical, and publication gates. A content-semantic change—including lesson prose, a question prompt/key/explanation, claim inventory, or claim/reference mapping—requires a new version and fresh approvals. Do not reuse prior approvals for a new version.

## Four distinct review tracks

1. **Technical/schema validation.** `contentRecordSchema` and `validateContentRecord()` validate shape, dates, links, answer keys, provenance metadata, signal units, claim IDs, and review-record structure. Technical success is not human approval.
2. **Source and licensing review.** A reviewer checks each cited source and mapped claim at a specific page, section, recommendation, or equivalent location; version/currentness; jurisdiction; source access; reuse/redistribution/modification permissions; and patient-data authorization where relevant. A source URL or free-to-read full text is not a reuse licence. Clinical records require an approved current-version `source-and-licensing` record. For release, every external-source claim must have a claim-specific reference no longer marked `unverified`.
3. **Educational and medical-content review.** Every released item needs current-version educational approval. Clinical records additionally need distinct current-version `medical-content` approval with reviewer identity and qualifications actually provided. The software checks that these fields are present; it cannot authenticate identity, professional registration, or competence.
4. **Publication approval.** A separate current-version `publication-approval` record is required. It does not replace technical, rights, educational, or medical review.

For clinical cases, these four tracks are independent. A case also needs a reviewed explanation/answer, verified supporting claim references, explicit limitations, allowed provenance, and valid calibration metadata for linked ECG material. A linked waveform must itself be eligible. Synthetic cases still require appropriate review; correct lead equations and runtime validation are not clinical validation.

## Claim and review scope

Each clinical record contains a record-local claim inventory. A claim lists its exact section, question-choice, answer, explanation, key-term, or demonstration location and identifies whether it is externally sourced or describes project behavior. `sourceReferences[].supports` links references to particular claim IDs; attaching a reference only to an objective is not enough. A source reviewer must check each linked claim in the cited source. Unsupported or unresolved assertions must be sourced, narrowed, or removed before release.

A review record binds to `contentId` and `versionReviewed` and carries:

- `scope.completeRecord`, which must be true for approval;
- `scope.claimIds`, listing the reviewed claims;
- `scope.referenceIds`, listing reviewed references where source/licensing or publication review applies;
- review type/status, actual reviewer details where supplied, actual review date, notes, and follow-up.

Educational, medical, and publication approvals must cover the full claim inventory. Source/licensing approval must cover every reference and every external-source claim. Publication approval covers all claims and references. Approval cannot contain unresolved required follow-up. `recordReviewIntake()` rejects an ID mismatch, stale version, malformed or incomplete scope, absent medical qualifications, and invalid update timestamp. It replaces the same review-type/version slot instead of accumulating conflicting outcomes. The caller must provide the actual record update timestamp; the helper does not invent one.

Only one final outcome may occupy a review-type/version slot. A pending record may be replaced by its completed outcome. Conflicting approved and rejected/changes-requested entries, or duplicate approvals, are invalid. If substantive content changes after a rejection or approval, version the content and start review again.

### Intake shape (illustrative only)

The fields below describe the interface, not a real reviewer or approval. Do not copy placeholder identity or date data into repository records.

```json
{
  "contentId": "learn.example",
  "reviewType": "medical-content",
  "status": "approved",
  "versionReviewed": "1.0.0",
  "scope": {
    "completeRecord": true,
    "claimIds": ["example-claim"],
    "referenceIds": []
  },
  "reviewer": {
    "displayName": "actual reviewer identity supplied by the reviewer",
    "qualifications": "actual qualifications supplied by the reviewer"
  },
  "reviewedAt": "YYYY-MM-DD",
  "requiredFollowUp": [],
  "notes": "Optional reviewer notes"
}
```

The example is not valid production content until real values are supplied and independently checked. A schema-accepted identity string or qualifications string is not credential verification.

## Parent lesson and question release order

A clinical formative question must identify its parent lesson, and the relationship must be reciprocal. A question cannot publish until that parent is at least `reviewed-for-educational-use` and has passed its own current-version claim/source mapping, source/licensing, educational, qualified medical, limitation, and publication-approval checks. The parent’s prerequisite lessons must also be eligible. This allows question release without a dependency cycle. The lesson remains unpublished until every linked question and prerequisite is itself published and eligible.

Release sequence:

1. Validate record structure, parent links, claims, and reference links.
2. Complete source/licensing review and verification.
3. Complete educational review; move the parent lesson to `reviewed-for-educational-use` when appropriate.
4. Complete qualified medical review for clinical records.
5. Complete separate publication approvals for the lesson and each question.
6. Publish eligible questions against the reviewed parent.
7. Publish the lesson only after all linked questions and prerequisites are published and eligible.

This ordering does not imply that any current item has passed a track.

## Failure handling and present state

`loadContentRegistry()` retains invalid original input and useful developer issues while excluding invalid, duplicate-ID, unresolved, or ineligible records from learner-facing lists. No diagnosis, answer, or waveform is substituted to hide failure.

The registry contains three lesson drafts and their three linked formative-question drafts. All six currently have no review records. Their references remain `unverified`, the synthetic signal rights remain unknown where applicable, and at least two blood-flow assertions have no claim-specific reference mapping. The Learn catalog is intentionally empty. Review packet details are in `LESSON_REVIEW_PACKETS.md`; source-level crosswalk is in `CLAIM_SOURCE_MATRIX.md`.

No reviewer identity, qualification, date, medical approval, rights clearance, or publication approval has been entered. Do not render clinical review badges from schema-valid metadata alone.

## Exercises and the content schema

The five guided exercises (`src/exercises/definitions.ts`) the Rhythm Challenge cases (`src/rhythm/cases.ts`) and the Virtual Patient cases (`src/patients/cases.ts`) are draft/unreviewed by construction: their schema accepts only `publicationStatus: 'draft'` and `reviewStatus: 'unreviewed'`, and they are not in the content registry, so they cannot appear in the Learn catalog and **cannot be published through any current path**. That is deliberate. Before any exercise can be released it must first become a content-schema record (a new content type with a claim inventory, source references and review records bound to its ID and version) so that the same four review tracks and gates apply. That schema work has not been done and is not part of the review packet. Packets 4–10 in [LESSON_REVIEW_PACKETS.md](LESSON_REVIEW_PACKETS.md) use documentation-only claim IDs (`ex-…`) until then; reviewers should cite those IDs and the exercise version, and the IDs must be migrated into the schema when it exists.
