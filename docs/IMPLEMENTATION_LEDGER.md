# Implementation ledger

## Current checkpoint - ECG-CP11 CI findings (2026-10-21)

- ECG-LAYOUT-11: the first CI run exposed a narrow-screen overflow in the measurement/annotation control grids that only appears with wider fallback fonts. Fixed with shrinkable grid columns; guarded by `tests/e2e/layout-stress.spec.ts`. Details and run URL in `QA_REPORT.md` and `SESSION_CHECKPOINT.md`. The CI result for the fix is not claimed until the run completes.
## Current checkpoint - ECG-CP10 guided ECG exercises, release 1 (2026-10-21)

### ECG-EXERCISE-10 - Typed draft exercise registry, signal-derived validation, versioned progress (tasks 027+)

- Status: Implemented, unit-tested and Chromium-tested locally. Not verified in CI (no `.git`). All four exercises are `publicationStatus: 'draft'`, `reviewStatus: 'unreviewed'`; the schema accepts no other value, and a test confirms the published Learn catalog is still empty.
- Verified first: before building, `tsc`, Vitest (81) and Chromium (19) were green on the existing seek/restore, snapshot, local save/restore, measurement and annotation work (see ECG-STATE-09).
- Authored vs learner state: `src/exercises/definitions.ts` is a frozen, zod-validated registry (read-only). Learner work lives in `src/exercises/progress.ts` (key `ecg-lab-exercise-progress-v1`, schema version 1, strict, max 50 exercises / 100,000 chars, readings capped at 2). Corrupt, oversized, wrong-version or blocked storage yields empty progress plus a notice; corrupt records are removed. An entry recorded against another definition `version` is treated as not started. Exercise progress is deliberately NOT part of experiment snapshots (that would need a snapshot schema v2 and migration); measurement workspaces and annotations used by the exercises remain in the snapshot system.
- Reuse, no second engine: event targets come from the existing signal model. `src/engine/signal.ts` now exports `R_PEAK_PHASE`, `beatIntervalMs` and `qrsEventTimesMs`; the generator itself uses the same constant, so targets move with the rhythm preset (sinus 240/1040 ms, brady 360/1560, tachy 180/780) and are verified against the generated lead II peaks. Conversions use `engine/calibration.ts`; markers use the existing measurement sets; no clock was added.
- Exercises: R-R interval (consecutive R peaks), gain invariance (two gains, same times, drawn height scales by gain ratio), cross-lead beat matching (same beat index in two leads by time only), paper speed and grid (two speeds, same duration, learner-entered width in mm = seconds x speed). Evaluation (`evaluate.ts`) is a placement check only: no automatic detection or clinical interpretation.
- Tolerances (configurable per definition and by override, boundary-tested): marker 40 ms, repeat-measurement invariance 8 ms, width 1 mm. The 40 ms default is about one small grid box at 25 mm/s and also covers the offset of the V1 S-wave from the R event; it is an educational choice, not a clinical standard.
- UI: `GuidedExercises.tsx` ("Guided exercises - draft · unreviewed · synthetic signal") with step list, Record reading, Check answer, Retry (clears readings, keeps attempts and an earlier pass), Reset exercise, a `role=status` live region, and Pass/Not yet text on every check (not colour only). Class is `guided-exercises`, not `experiment-workspace`, so existing selectors are unaffected.
- Tests added: 31 engine/progress tests (`exercises.test.ts`), 6 component tests (`GuidedExercises.test.tsx`), 7 Chromium scenarios (full workflows for all four exercises, preset-driven targets, refresh persistence, corrupt progress, keyboard operation, axe at 1280 px and 375 px with no overflow, Learn catalog unaffected). Debug note: one regression (4 saved-experiment scenarios) was caused by the new panel sharing a CSS class/selector with the saved-experiment panel; fixed by renaming rather than editing those tests.
- Limitations: the cross-lead task checks a point in each lead, not the shape; the rhythm 'afib' preset has regular R-R timing in this model, so the R-R exercise there is not an irregularity lesson; text of all exercises is unreviewed and uses no external clinical claims; no screen-reader (NVDA/VoiceOver) test; exercise progress is not exported or synced.
- Next: reviewer/source workflow for the exercise text, then optional snapshot schema v2 if exercise progress should travel with saved experiments.
## Current checkpoint - ECG-CP9 clock seek/restore and local experiment save/restore (2026-10-21)

### ECG-STATE-09 - Clock seek/restore, snapshot persistence and restore UI (task 026)

- Status: Implemented, locally unit-tested and Chromium-tested in the source export. Not verified in CI (no `.git`; no commit, push or Actions run exists for this work).
- Clock contract (`src/engine/clock.ts`, single `SimulationClock`, no second clock): `elapsedMs` is absolute simulated time advanced only by animation-frame deltas (deltas over `MAX_FRAME_DELTA_MS` = 100 ms are discarded, so a backgrounded tab does not jump). `seek(ms)` sets absolute time, clears the stale frame timestamp, preserves paused/running state and rejects non-finite, negative, non-number or > `MAX_SIMULATION_TIME_MS` (86,400,000) values with `RangeError` before any state changes. `restore({elapsedMs,isPlaying})` validates then seeks and applies play/pause; `reset` returns to 0. Waveforms are a pure function of (preset, seed, absolute time), so playback, pause/resume, seek and restore give identical windows (unit-tested).
- Snapshot (`src/engine/experiment-state.ts`, version 1, zod strict): machine settings, view, theme, playback time/wasPlaying, named measurements, learner annotations, selections, and authored-region references only (never authored content). Unknown versions and malformed records parse to `null`. No older schema version exists, so no migration is implemented; unknown versions are rejected, not reinterpreted.
- Storage (`src/engine/experiment-storage.ts`): local `localStorage` only, key `ecg-lab-experiments-v1`, max 20 snapshots / 200,000 characters, per-record validation (corrupt records dropped, valid ones kept), explicit blocked-read, write/quota failure, duplicate-id, limit and missing-delete results; success is reported only after `setItem` returns. Duplicate display names get a numeric suffix; the stable `snapshotId` is the identity.
- Restore (`src/main.tsx`): selecting Restore opens a confirmation; Cancel changes nothing. Confirm re-validates the record, then applies machine/view/theme/measurements/annotations/selections together and issues a single clock `restore` with `isPlaying:false`, so playback is always restored paused and no second animation loop starts. Current authored annotations are kept; only learner notes come from the snapshot. Snapshot saves exclude authored annotations.
- Fixed in this session: `src/main.tsx` failed `tsc --noEmit` (annotation state typed `LearnerAnnotation[]` while helpers return `EcgAnnotation[]`); state is now `EcgAnnotation[]`, saves filter to learner notes, restore preserves authored entries.
- Tests added: 4 clock-contract tests (determinism across playback/pause/seek/restore, annotation and measurement invariance, malformed-input rejection without mutation/notifications, seek after reset), 3 storage-failure tests (blocked storage, oversize, limit, failed write, missing delete, invalid snapshot, reload), 3 Chromium scenarios (save-refresh-cancel-restore-delete with paused clock check; corrupt and quota-failing storage; axe + no horizontal overflow with both confirmations open on desktop and 375 px).
- Follow-up in same checkpoint: `restoreExperiment` re-reads storage and re-validates the record by id before applying, so a tampered, deleted or stale record cannot be restored and current work stays unchanged. Totals after this follow-up: 81 Vitest tests, 19 Chromium scenarios.
- Limitations: a full storage-quota failure is simulated, not observed on a real full browser; restore applies via React state setters plus a clock call, so it is validated-then-applied rather than a true transaction (nothing can fail between validation and application in the current code); no authored teaching regions exist yet, so reference resolution is untested end to end; no screen-reader (NVDA/VoiceOver) check was run, only axe and role/status assertions.
- Next task: guided calibration/lead/grid exercises on top of the validated state boundary, or wiring authored-region references once reviewed authored regions exist.
## Current checkpoint — ECG-CP8 measurement workspace foundations (2026-10-20)

### ECG-WORKSPACE-08 — Named measurements, annotations and reproducible state (tasks 021–025)

- Acceptance: multiple named manual measurement sets can be selected and deleted; an accessible list reports their duration/rate; optional annotations stay anchored to absolute simulated timestamps; learner notes remain distinct from versioned authored teaching regions; a reproducible state boundary validates supported simulator state before any persistence is attempted; none alters waveform samples, calibration or measurement results.
- Status: Implemented and locally verified in the source export. `src/engine/measurement-sets.ts` owns immutable manual sets. `src/engine/annotations.ts` defines a discriminated learner/authored annotation boundary: authored regions require content ID and exact content version, while the UI currently creates only private learner notes. `src/engine/experiment-state.ts` defines version 1 snapshots for supported machine/layout/playback state, measurements and annotations; malformed, stale, duplicate or contradictory records parse as `null`. A rendered note uses the existing rolling-window time transform, appears once on the first row of a 12-lead display to avoid repeated-label clutter, and leaves source signals unchanged. No authored annotation or clinical interpretation was added.
- Files: `src/engine/measurement-sets.ts`, `src/engine/measurement-sets.test.ts`, `src/engine/annotations.ts`, `src/engine/annotations.test.ts`, `src/engine/experiment-state.ts`, `src/engine/experiment-state.test.ts`, `src/components/LiveEcgMonitor.tsx`, `src/main.tsx`, `src/styles.css`, `tests/e2e/ecg-lab.spec.ts`, and checkpoint documentation.
- Tests/evidence: final local `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers pnpm test:all` exited 0: 10 Vitest files / 68 tests, application and E2E TypeScript checks, Vite build (127 modules), and 15 Chromium scenarios. The new browser scenario verifies a learner annotation remains timestamp-anchored across paper-speed/gain changes and appears once in 12-lead view; unit coverage rejects incomplete authored provenance, protects immutable updates, and rejects stale/contradictory experiment snapshots.
- Dependencies: ECG-MEASURE-07 absolute-time mapping, shared calibration, accessible native controls and the existing content version convention.
- Limitations/next action: state is intentionally not persisted or restored yet. Do not present learner notes as reviewed teaching content. Next task is 026: add local save/restore only after the clock has an explicit tested seek/restore operation.

## Completed — ECG-CP7 moving-strip measurement UX and review readiness (2026-10-20)

### ECG-MEASURE-07 — Absolute-time marker placement and rolling-window status

- Acceptance: extend existing timestamp-based measurement points; place a selected start/end point from the visible trace and through keyboard-operable controls; show labeled/selected markers and explicit before/in/after-window state; preserve duration through speed, gain, lead, pause/resume and viewport movement; test inclusive bounds, exit transitions, reset policy, 12-lead consistency, themes and responsive behavior.
- Status: Implemented and verified. Remote follow-up commit `e266dfbe276172888ff04ca39e9c45e5425983d9` passed Actions run `39344966547` after correcting the deterministic narrow-viewport fixture. `main` remains `9544b96d87a44fce4334691145f5c53870871fa5`. Local export has no `.git` metadata.
- Files: `src/engine/measurements.ts`, `src/engine/measurements.test.ts`, `src/components/LiveEcgMonitor.tsx`, `src/main.tsx`, `src/styles.css`, `tests/e2e/ecg-lab.spec.ts` and documentation.
- Dependencies: shared `calibration.ts`, existing `createMeasurement()`, `SimulationClock` and rolling trace.
- Tests/evidence: final local `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers pnpm test:all` passed: 59/59 unit tests, app and E2E type checks, build (125 modules) and 13/13 Chromium scenarios. The targeted marker scenarios passed 2/2. Manual UI check found and fixed a 12-lead left-edge label collision; E2E verifies the safe inset. Full details are in `docs/QA_REPORT.md`.
- Limitations/next action: timestamp authority and reset-to-example-points policy are verified; no automated boundary detection or drag marker. Continue with session-only experiment-state design before persistence.

### ECG-REVIEW-07 — Paper-speed-and-gain lesson claim review

- Acceptance: inspect every claim, simulator assertion and linked question; verify candidate passages where accessible; narrow unsupported medical-device statements to code-supported simulator behavior; keep source, rights, education, qualified medical and publication review distinct; preserve current-version release gates.
- Status: Content scope correction completed locally. `learn.paper-speed-and-gain` and `learn.check.paper-speed-and-gain` were revised together to `0.4.0`; title now identifies simulator-scale content, general gain/physical-paper claims were removed, and no external references remain attached because exact source support was not established. Becker/Kligfield reference statuses remain `unverified`; all six records remain drafts with no review records or `lastReviewedAt`; the published Learn catalog remains empty. Bibliographic details and a limited AHA PDF excerpt were inspected; exact claim support, currentness, reuse rights and Indian-context suitability remain unresolved.
- Files: `src/content/learn/records.ts`, `src/content/content.test.ts`, `docs/LESSON_REVIEW_PACKETS.md`, `docs/CLAIM_SOURCE_MATRIX.md`, `docs/LEARN_CURRICULUM.md`.
- Evidence: regression asserts both current records are v0.4.0 drafts with no reviews/external refs and are absent from the published catalog; included in the final 59/59 passing unit tests.
- Limitations/next action: this is not a medical or educational approval. Do not alter `lastReviewedAt` or invent review records. A human must supply exact-version education/medical/source/licensing decisions before publication.

### ECG-QA-07 — Regression, checkpoint and branch verification

- Acceptance: all local unit/type/build/Chromium/axe checks pass; update actual evidence; inspect changed files; push only on the intended feature branch by expected-head check; verify resulting Actions; leave `main` untouched.
- Status: Local suite passed and the remote correction above passed Actions. The CP8 source-export changes are newer local work and have not been committed or pushed from this no-`.git` workspace.
- Files: tests and current architecture/roadmap/ledger/QA/session records.
- Dependencies: ECG-MEASURE-07 and ECG-REVIEW-07.
- Limitations/next action: no merge/deploy, clinical-use representation, patient data, or KYP production edits.

## Next milestone — ECG-EXPERIMENT-09 supported local save and restore

- Acceptance: add an explicit, tested clock seek/restore operation and a local-storage adapter for valid version-1 experiment snapshots; malformed stored data must safely fall back without presenting a clinical record.
- Status: Not started.
- Dependencies: ECG-WORKSPACE-08, `experiment-state.ts`, `SimulationClock`, and existing local-first progress patterns.
- Limitations: no accounts, KYP integration, patient information, clinical cases, automatic interpretation, or physical-size export.

This is the canonical task record. Status and evidence below reflect local verification and remote GitHub evidence; the local source export has no `.git` metadata. See `SESSION_CHECKPOINT.md` for the verified branch head and CI run.

## Current checkpoint — ECG-CP6 live moving paper sweep

### ECG-ANIM-06 — Time-based shared ECG clock and rolling signal window

- Acceptance: one injectable, deterministic animation clock with idempotent start/pause/resume/reset/dispose and visibility suspension; bounded, time-addressable synthetic signals share one timeline across all 12 leads; rhythm timing does not depend on render-frame count.
- Status: Complete locally. The injected clock advances on animation-frame timestamps, not frame counts; its lifecycle is tested using a deterministic scheduler. Remote baseline feature branch head `2cd31e1a864f7ead8286f07aa6587f9cd4f46e6d` and Actions run `39324432585` passed before edits. Remote `main` was `9544b96d87a44fce4334691145f5c53870871fa5`. Local export has no `.git` metadata.
- Files: `src/engine/clock.ts`, `src/engine/clock.test.ts`, `src/engine/signal.ts`, `src/engine/signal-window.test.ts`.
- Tests/evidence: final local `pnpm test:all` passed: 53/53 Vitest, application and E2E type checks, production build, and 11/11 Chromium scenarios. Clock tests cover injected timestamps, idempotent start, pause/resume/reset, visibility suspension, large frame gaps and disposal. Signal tests cover aligned rolling windows, limb equations across arrays, overlap determinism, lead morphology, no source mutation, and speed/gain invariance.
- Dependencies: existing calibrated time/voltage transforms, lead templates, Playwright setup.
- Limitations/next action: the synthetic morphology remains simplified, educational, and unvalidated; no patient data or clinical-monitor performance is represented.

### ECG-ANIM-07 — Responsive rolling SVG renderer and playback controls

- Acceptance: right-edge trace is generated only through current simulated time; calibrated grid and samples move together in a fixed responsive viewport; paper speed changes horizontal scale without resetting the clock; gain changes only vertical mapping; single/12-lead layouts share time; pause/resume/reset and reduced-motion defaults work.
- Status: Complete locally. A bounded rolling SVG viewport now moves trace and calibrated grid together; all 12 leads share one simulation clock and sample timeline. Reduced-motion users start paused. Pause/resume/reset and single/multi switching preserve the intended clock state.
- Files: `src/components/LiveEcgMonitor.tsx`, `src/components/EcgGrid.tsx`, `src/main.tsx`, `src/styles.css`, `tests/e2e/ecg-lab.spec.ts`, `playwright.config.ts`, `README.md`.
- Tests/evidence: final browser suite passed 11/11. It observes movement, pause freeze, resume, reset, speed-dependent horizontal scale, gain-only vertical change, lead/layout time consistency, 12-lead alignment, reduced motion, responsive logical scale, and axe scans without suppressing rules. Existing calibration, themes, measurements and draft-gated Learn behavior remain covered.
- Dependencies: ECG-ANIM-06.
- Limitations/next action: manual measurement points remain absolute milliseconds from reset and are visible only while within the rolling window; no drag calipers or automatic boundary detection were added. The next product milestone should address genuine content review rather than claim this simulator is clinically validated.

### ECG-QA-06 — Motion regressions, visual QA and checkpoint

- Acceptance: deterministic unit coverage for clock lifecycle, time-based samples, speed/gain/lead invariants; Playwright proves live movement, pause freeze, continuous resume, reset, speed changes, lead/time alignment, reduced motion, responsive layout, axe and bounded path size; documentation records actual test and remote evidence.
- Status: Complete locally and on the feature branch. Implementation commit `0dce61202093d5f0c08d9186fe027f31ec13494e` is on `codex/accessibility-content-governance`; GitHub Actions run `39340233374` completed successfully. Remote `main` remains `9544b96d87a44fce4334691145f5c53870871fa5`.
- Files: engine tests, `tests/e2e/ecg-lab.spec.ts`, `playwright.config.ts`, `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/QA_REPORT.md`, `docs/IMPLEMENTATION_LEDGER.md`, `docs/SESSION_CHECKPOINT.md`.
- Tests/evidence: `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers pnpm test:all` exited 0; 53 Vitest tests, application and Playwright type checks, Vite production build, and 11 Chromium scenarios passed. Browser checks include unsuppressed axe scans and observed animation lifecycle controls. Local app was also inspected at `http://localhost:5173/` in Chromium.
- Dependencies: ECG-ANIM-06, ECG-ANIM-07.
- Limitations/next action: no clinical validation or patient-monitor claim; this cannot be used as a real ECG machine or for patient care. Continue only with educational features or genuine review-gated content work. Do not merge, deploy, or touch `main`.

## Current checkpoint — ECG-CP5 content review readiness

### ECG-CONTENT-05 — Claim inventory and reviewer packets

- Acceptance: every existing lesson and linked formative question is inventoried by stable ID/version; factual claims point to exact record locations and candidate source locations or are explicitly marked unmapped; source metadata and rights are not overstated; reviewer packets are understandable without repository context.
- Status: Complete locally; all six items remain drafts.
- Files: `src/content/learn/records.ts`, `src/content/references.ts`, `src/content/schema.ts`, `src/content/types.ts`, `docs/LESSON_REVIEW_PACKETS.md`, `docs/CLAIM_SOURCE_MATRIX.md`, `docs/LEARN_CURRICULUM.md`, `docs/CONTENT_SCHEMA.md`, `docs/CONTENT_PROVENANCE.md`.
- Tests/evidence: `pnpm test:all` exit 0; 42/42 Vitest, app and Playwright type-checks, production build, and 9/9 Chromium scenarios passed. The Learn browser scenario confirms no draft lesson is shown. See current `QA_REPORT.md` section ECG-CP5.
- Dependencies: ECG-LEARN-04; shared source-reference and publication-gate model.
- Limitations/next action: Becker/Kligfield bibliographic metadata was checked, but both runtime references remain `unverified` pending exact claim support, currentness, and rights review. Two blood-flow assertions are unmapped. Obtain genuine source-review dispositions; narrow/remove claims if unsupported.

### ECG-REVIEW-05 — Versioned review intake and release gate

- Acceptance: reviews bind to content ID, current semantic version, explicit claim/reference scope, and actual update timestamp; incomplete/stale/mismatched/unqualified/contradictory review entries cannot satisfy publication; clinical questions require eligible parent lessons; lessons require eligible published questions/prerequisites; drafts stay out of the Learn catalog.
- Status: Implemented and locally verified; no real review records added and no content published.
- Files: `src/content/review-intake.ts`, `src/content/validation.ts`, `src/content/schema.ts`, `src/content/content.test.ts`, `src/content/review-intake.test.ts`, `docs/CONTENT_REVIEW_WORKFLOW.md`, `docs/ARCHITECTURE.md`, `docs/CLINICAL_CONTENT_POLICY.md`.
- Tests/evidence: 10 new review-intake/publication regression tests added; current `pnpm test:all` passes with 42 total unit tests and 9 browser scenarios. Test-only synthetic reviewer values are confined to unit-test scope and are explicitly labelled as not real; none are in fixtures or the content registry.
- Dependencies: ECG-CONTENT-05; existing Zod registry and Learn parent/dependency IDs.
- Limitations/next action: field validation cannot authenticate reviewer identity/credentials, prove source support, determine copyright permission, or prove clinical truth. Reviewers must provide genuine evidence externally; use the intake helper only after verification.

### ECG-QA-05 — Source audit, QA and resumable checkpoint

- Acceptance: correct verified bibliographic defects; report focused source research honestly; record actual local test outputs and current feature-branch/CI status; retain main and production unchanged.
- Status: Complete; committed to the existing feature branch and verified by GitHub Actions.
- Files: `docs/IMPLEMENTATION_LEDGER.md`, `docs/QA_REPORT.md`, `docs/SESSION_CHECKPOINT.md`, `docs/LESSON_REVIEW_PACKETS.md`, `docs/CLAIM_SOURCE_MATRIX.md`.
- Tests/evidence: source code, generated artifacts, and Learn catalog inspected; actual `pnpm test:all` result and browser-gate assertion recorded. Commit `d3f49a33e352d0ab24599cebafdeb6c79c3cee65` was pushed via non-forced expected-head update; GitHub Actions run `39323889336` completed successfully. `main` remains unchanged at `9544b96d87a44fce4334691145f5c53870871fa5`.
- Dependencies: ECG-CONTENT-05, ECG-REVIEW-05.
- Limitations/next action: local export has no `.git`; refresh the remote branch head and CI when resuming. Do not merge or deploy. Next content action requires genuine reviewer dispositions and exact source locations.

## Completed foundation

### ECG-BASE-01 — Standalone deterministic simulator and calibration

- Acceptance: deterministic millisecond/millivolt signal engine; calibrated SVG mapping; all 12 lead data; manual time measurements; KYP-matched persistent light/dark theme; preserve the standalone boundary.
- Status: Complete.
- Files: `src/engine/`, `src/main.tsx`, `src/styles.css`, `README.md`, calibration/lead/architecture docs.
- Tests/evidence: baseline `pnpm test` 9/9; `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e` 5/5 passed before this checkpoint; current full suite is recorded in `QA_REPORT.md`.
- Dependencies: none.
- Limitations/next action: synthetic morphology is an educational template, not clinically validated; preserve this disclaimer.

### ECG-CAL-02 — Calibration correctness

- Acceptance: shared logical millimetre transforms for time and voltage; pulse uses the same transforms; no clipping; screen pixels are not represented as physical millimetres.
- Status: Complete.
- Files: `src/engine/calibration.ts`, `src/engine/calibration.test.ts`, `src/main.tsx`, `docs/ECG_CALIBRATION.md`.
- Tests/evidence: prior calibration tests cover all supported speeds/gains, pulse size, bounds and invariance; browser suite checks the rendered pulse and scrolling extent.
- Dependencies: ECG-BASE-01.
- Limitations/next action: physical-size print/export is not implemented.

### ECG-LEAD-02 — Twelve leads and manual measurements

- Acceptance: derived limb equations over aligned sample arrays; lead-specific synthetic templates; selected lead does not mutate source data; RR/PR/QRS/QT manual points and RR heart rate.
- Status: Complete.
- Files: `src/engine/signal.ts`, `src/engine/measurements.ts`, `src/engine/types.ts`, `src/main.tsx`, `src/engine/calibration.test.ts`.
- Tests/evidence: prior unit suite verifies limb equations, shared timebase, lead series selection and measurement invariance; browser suite verifies the 12-lead alignment and interval controls.
- Dependencies: ECG-BASE-01.
- Limitations/next action: no automated wave-boundary detection; numeric inputs remain the accessible alternative to pointer calipers.

### ECG-THEME-02 — KYP-matched theme

- Acceptance: persistent light/dark preference; accessible keyboard-operable theme toggle; SVG grid and trace use theme tokens.
- Status: Complete and preserved.
- Files: `src/main.tsx`, `src/styles.css`, `tests/e2e/ecg-lab.spec.ts`.
- Tests/evidence: current browser suite verifies keyboard toggle, persisted preference, pressed state, and theme-specific SVG trace colors.
- Dependencies: ECG-BASE-01.
- Limitations/next action: preference remains local to this standalone module; it does not read KYP host state.

### ECG-E2E-02 — Browser regression infrastructure

- Acceptance: run app in Chromium and verify defaults, machine controls, measurements, themes, calibration extent, 12-lead alignment and responsive behavior.
- Status: Complete and extended in ECG-CP3.
- Files: `tests/e2e/ecg-lab.spec.ts`, `playwright.config.ts`, `scripts/test-e2e.mjs`, `.github/workflows/verify.yml`.
- Tests/evidence: baseline browser suite 5/5; current suite 8/8 locally; the current branch's GitHub Actions run is checked after publication.
- Dependencies: Playwright and installed Chromium runtime.
- Limitations/next action: browser automation does not substitute for manual assistive-technology testing.

## Previous checkpoint — ECG-CP3

### ECG-A11Y-03 — Focused accessibility audit

- Acceptance: keyboard operation, semantic names/state, both themes, visual trace/grid review, responsive order, reduced motion, axe support and explicit unresolved limits.
- Status: Complete for the documented focused scope.
- Files: `src/main.tsx`, `src/styles.css`, `tests/e2e/ecg-lab.spec.ts`, `docs/ACCESSIBILITY_AUDIT.md`.
- Tests/evidence: 8 Chromium tests pass, including keyboard control, reduced-motion behavior, mobile layout ordering and six unsuppressed axe states; manual screenshots reviewed at desktop and mobile sizes.
- Dependencies: ECG-E2E-02.
- Limitations/next action: no screen reader, true 200% browser zoom, OS high-contrast, localization stress, or full WCAG audit was performed.

### ECG-CONTENT-03 — Typed content and provenance schema

- Acceptance: lesson, question, clinical case, waveform, source-reference and review-record shapes; stable IDs, ISO dates, explicit provenance, version, limitations, references, status and applicable technical metadata.
- Status: Complete.
- Files: `src/content/schema.ts`, `src/content/types.ts`, `src/content/references.ts`, `docs/CONTENT_SCHEMA.md`, `docs/CONTENT_PROVENANCE.md`.
- Tests/evidence: Vitest validates IDs, types, dates, references/objective links, answer keys, units, waveform bounds/calibration and review-state metadata.
- Dependencies: Zod 4 runtime validation.
- Limitations/next action: schema cannot prove source truth, legal rights, identity, qualifications, or clinical accuracy; human review remains mandatory.

### ECG-REG-03 — Runtime validation and publication-safe registry

- Acceptance: separate technical/source/licensing/educational/medical/publication gates; allowed lifecycle transitions; duplicate/link checks; developer-visible errors; rejected values retained for correction; learner list receives only eligible published records.
- Status: Complete.
- Files: `src/content/validation.ts`, `src/content/registry.ts`, `src/content/fixtures/index.ts`, `src/content/content.test.ts`, `docs/CONTENT_REVIEW_WORKFLOW.md`, `docs/CLINICAL_CONTENT_POLICY.md`.
- Tests/evidence: 10 content tests cover valid/draft/invalid content, blocked publication, review requirements, duplicate IDs, source links and unresolved waveform links. Starter registry currently returns no published items because no actual review approvals exist.
- Dependencies: ECG-CONTENT-03.
- Limitations/next action: human source/licence and clinical checks are represented as workflow data, not automated proof; no medical reviewer data has been supplied.

### ECG-LEARN-04 — First Learn-mode milestone

- Acceptance: validated-content-backed Learn catalog and reusable lesson renderer; structured beginner-to-intermediate ECG curriculum; interactive calibration/lead demonstrations using shared engine transforms; deterministic accessible checks; versioned local progress and reset; responsive light/dark UI; no Practice/Exam interface or KYP integration.
- Status: Learn framework implemented; first content release is gated on genuine review records that the user will provide after review. No draft is exposed as published and the learner catalog is intentionally empty.
- Files: `src/learn/`, `src/content/learn/`, shared lesson schema/registry validation, `tests/e2e/ecg-lab.spec.ts`, `docs/LEARN_CURRICULUM.md`, schema/architecture/accessibility/QA/roadmap/checkpoint documentation, `src/styles.css`, `src/main.tsx`, `vite.config.ts`, `package.json`, `pnpm-lock.yaml`.
- Baseline evidence (2026-10-20): remote feature branch `codex/accessibility-content-governance` at `6b0d7ef01cd218c62d9376bb816cb5d95299d7a8`; `main` remains `9544b96d87a44fce4334691145f5c53870871fa5`; baseline CI run `39252642744` passed. Local folder has no `.git`. Before implementation, unit tests (19), app/E2E type checks, and build passed; browser tests passed 8/8 after installing Chromium in a task-local browser cache because the first attempt lacked the binary. The browser installation is generated local state and is not part of source changes.
- Dependencies: ECG-CONTENT-03, ECG-REG-03, ECG-A11Y-03, ECG-CAL-02, ECG-LEAD-02.
- Outstanding limitations: no reviewer/approval evidence, so no content can be honestly represented as published. Existing publication checks must remain authoritative. Synthetic signal templates are educational only and unvalidated.
- Current evidence: `pnpm install --frozen-lockfile` passed; final `pnpm test:all` exit 0; 32/32 Vitest, application and E2E type checks, production build, and 9/9 Chromium scenarios passed. Axe reported no violations for six simulator and four Learn theme/responsive states with no rule exclusions. See `QA_REPORT.md` for exact details.
- Outstanding limitations: no reviewer/approval evidence, so no lesson/question can be represented as published and the visible catalog is empty. Candidate references are explicitly unverified; India-specific MBBS/CBME mapping is not yet established. Synthetic morphology is educational only and unvalidated. Desktop visual inspection helper failed to initialize; automated browser coverage passed, but no manual visual screenshot review of the new Learn composition was completed.
- Next action: receive actual source/educational/qualified medical/publication review records, verify that they match the exact record versions and claim mappings, then update only those drafts and confirm the published registry populates. Do not invent or fabricate approval metadata.

## Current checkpoint — ECG-CP4

### ECG-LEARN-04 — First Learn-mode framework

- Acceptance: validated-content-backed catalog and reusable lesson renderer; 16-topic beginner-to-intermediate curriculum plan; sourced introductory draft subset; interactive demonstrations using shared calibration/signal functions; accessible deterministic checks; versioned local progress/reset; responsive theme-aware layout; no Practice/Exam or KYP integration.
- Status: Framework implemented and tested. Content availability remains governance-gated; no lesson is published because the required genuine reviews have not yet been supplied.
- Files: `src/learn/LearnMode.tsx`, `src/learn/Demonstrations.tsx`, `src/learn/progress.ts`, `src/learn/learn.test.tsx`, `src/content/learn/records.ts`, `src/content/learn/registry.ts`, `src/content/schema.ts`, `src/content/validation.ts`, `src/content/registry.ts`, `src/engine/calibration.ts`, `src/main.tsx`, `src/styles.css`, `tests/e2e/ecg-lab.spec.ts`, `docs/LEARN_CURRICULUM.md`.
- Tests/evidence: Learn components are gated by `publishedLearnLessons`; drafts/questions do not appear in the rendered catalog. Unit and E2E test details are recorded in `QA_REPORT.md` after the final full-suite run.
- Dependencies: ECG-CONTENT-03, ECG-REG-03, ECG-A11Y-03, ECG-CAL-02, ECG-LEAD-02.
- Limitations/next action: the lesson reader, navigation, demonstrations, checks and progress mechanics are implemented, but learner-facing content remains unavailable until actual review records and verified source mappings are supplied. Finish publication review before treating Learn as content-complete.

### ECG-QA-04 — Learn regression, docs and checkpoint

- Acceptance: full tests, type-check, build, Playwright checks; docs and resumable checkpoint updated; current feature branch verified and updated without changing main; no KYP integration or deployment.
- Status: Source implementation and full local/remote verification complete; checkpoint docs record actual results.
- Files: `docs/ACCESSIBILITY_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/LEARN_CURRICULUM.md`, `docs/IMPLEMENTATION_LEDGER.md`, `docs/QA_REPORT.md`, `docs/ROADMAP.md`, `docs/SESSION_CHECKPOINT.md`, `README.md`.
- Tests/evidence: `pnpm test:all` exit 0; 32 unit tests, type-check, build, and 9 browser scenarios passed. Published on `codex/accessibility-content-governance` as implementation commit `eb09784cca1fe2b122bbb9e21f8ec1792c30a5f9` by a non-forced compare-and-swap from `6b0d7ef01cd218c62d9376bb816cb5d95299d7a8`; GitHub Actions run `39316691334` passed. Checkpoint documentation commit `4d7771e25c2f4f0e4cb7b86666c690d5e48af909` also passed Actions run `39316996682`. `main` remained unchanged at `9544b96d87a44fce4334691145f5c53870871fa5`.
- Dependencies: ECG-LEARN-04.
- Limitations/next action: local export has no `.git`; on resume, refresh the live feature-branch head and Actions status. Never force-push. Content publication still awaits genuine review records.

### ECG-QA-03 — Regression, documentation and checkpoint

- Acceptance: full tests/type-check/build/browser checks; architecture, QA, roadmap, session and ledger updated; non-main branch; no KYP integration or deployment.
- Status: Complete locally; remote publication/CI evidence is recorded after the branch update.
- Files: `README.md`, `docs/ACCESSIBILITY_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/CONTENT_PROVENANCE.md`, `docs/CLINICAL_CONTENT_POLICY.md`, `docs/CONTENT_REVIEW_WORKFLOW.md`, `docs/IMPLEMENTATION_LEDGER.md`, `docs/QA_REPORT.md`, `docs/SESSION_CHECKPOINT.md`, `docs/ROADMAP.md`.
- Tests/evidence: `pnpm test:all` passed: 19 unit tests, type checks, build, and 8 Chromium scenarios; see `QA_REPORT.md`.
- Dependencies: ECG-A11Y-03, ECG-CONTENT-03, ECG-REG-03.
- Limitations/next action: local folder has no `.git`; branch and commit are verified through GitHub. See final branch/commit in `SESSION_CHECKPOINT.md` and handoff.

## Not started / blocked by governance

### ECG-PRACTICE-05 / ECG-EXAM-06 — Questions and exam mode

- Acceptance: deterministic keys/explanations, versioned content and accessible interaction/scoring.
- Status: Not started.
- Files: none yet.
- Tests/evidence: none.
- Dependencies: reviewed question content and validated registry.
- Limitations/next action: do not begin screens until the curriculum and reviewed starter content exist.

### ECG-KYP-07 — KYP integration

- Acceptance: typed integration boundary reviewed against the actual KYP application architecture.
- Status: Not started; explicitly out of scope for ECG-CP3.
- Files: no KYP production files changed.
- Tests/evidence: none.
- Dependencies: user-authorized separate integration task and verified KYP repository context.
- Limitations/next action: keep this simulator standalone; do not deploy or merge as part of this checkpoint.

## Current checkpoint summary

ECG-CP4 implements the Learn framework while preserving the simulator and strict publication gate. The 16-topic curriculum plan is documented and three lessons/checks are authored as drafts with unverified candidate references. The learner catalog is intentionally empty until genuine reviews arrive. No Practice/Exam mode, KYP integration, merge, or deployment has been performed. The exact branch/commit and next action are recorded in `SESSION_CHECKPOINT.md` and the task handoff.
