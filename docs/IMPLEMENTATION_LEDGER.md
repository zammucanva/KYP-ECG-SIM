# Implementation ledger

This is the canonical task record. Status and evidence below reflect the current local verification and the remote checkpoint branch inspected for this task; local files are an export without `.git` metadata. See `SESSION_CHECKPOINT.md` for the GitHub base and published branch.

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
- Status: Source implementation and full local/remote verification complete; a documentation-only follow-up records the evidence.
- Files: `docs/ACCESSIBILITY_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/LEARN_CURRICULUM.md`, `docs/IMPLEMENTATION_LEDGER.md`, `docs/QA_REPORT.md`, `docs/ROADMAP.md`, `docs/SESSION_CHECKPOINT.md`, `README.md`.
- Tests/evidence: `pnpm test:all` exit 0; 32 unit tests, type-check, build, and 9 browser scenarios passed. Published on `codex/accessibility-content-governance` as implementation commit `eb09784cca1fe2b122bbb9e21f8ec1792c30a5f9` by a non-forced compare-and-swap from `6b0d7ef01cd218c62d9376bb816cb5d95299d7a8`; GitHub Actions run `39316691334` passed. `main` remained unchanged at `9544b96d87a44fce4334691145f5c53870871fa5`.
- Dependencies: ECG-LEARN-04.
- Limitations/next action: local export has no `.git`; refresh the live feature-branch head and verify the documentation-only follow-up CI before further work. Never force-push. Content publication still awaits genuine review records.

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
