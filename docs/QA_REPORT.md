# QA report

Date: 2026-10-20. This report records checks actually run against the local source. It is not a clinical-validation report.

## ECG-CP7 — moving-strip measurements and review readiness

### Local verification (2026-10-20)

- Final `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers pnpm test:all`: exit 0.
- Vitest: 7 files, 59/59 tests passed. This includes absolute-time marker mapping/boundary tests and a regression that the v0.4.0 lesson and linked question remain drafts, have no fabricated review dates/records, and are absent from the published catalog.
- Application and Playwright TypeScript checks passed.
- Production build passed using Vite 8.3.4: 125 modules transformed.
- Playwright Chromium: 13/13 scenarios passed. New cases place and edit markers, verify timestamp/duration invariance across speed, gain, lead, layout and sweep motion, check window boundaries/exit states, pause/resume/reset, and check keyboard focus and marker-label visibility at the left edge of 12-lead rows.
- The integrated axe scenario passed across its tested light/dark, single/multi-lead and mobile states without suppressed rules. This is supporting evidence, not a full WCAG evaluation.
- Manual visual inspection at `http://localhost:5173/` covered the dark single-lead and 12-lead views. It found a start-badge collision with the lead label near the left edge; a label-safe inset was implemented and the browser regression asserts both text labels remain visible.
- Focused marker Playwright scenarios also passed 2/2 before the final full run.

### Remote baseline before this checkpoint

- GitHub API reported `codex/accessibility-content-governance` at `7bbdae6faed1a0be09e78cb481833b3c34ea8f9d`; Actions run `39340528339` completed successfully for that commit. `main` was `9544b96d87a44fce4334691145f5c53870871fa5`.
- The local source export has no `.git` directory. The local working-tree branch/status cannot be asserted; these remote facts are separate from local tests.
- Changes in this checkpoint do not establish clinical validation, patient-monitor performance, hospital deployment readiness, source/licence approval, lesson review, or publication approval.

## ECG-CP4 pre-change baseline

The actual starting feature branch was `codex/accessibility-content-governance` at `6b0d7ef01cd218c62d9376bb816cb5d95299d7a8`. GitHub Actions baseline run `39252642744` completed successfully. `main` remained at `9544b96d87a44fce4334691145f5c53870871fa5`. The local exported project directory has no `.git`; no local branch or dirty-tree assertion is possible.

Before Learn changes, `pnpm test:all` passed unit tests (19/19), application and Playwright type checks, and production build. Its first browser attempt did not launch because Chromium was missing. After installing Chromium in a task-local cache, `pnpm test:e2e` passed 8/8. That cache is generated local state and excluded from source changes.

## Historical ECG-CP3 baseline (2026-10-19)

The inspected local source matched the reported remote branch content, with text files differing only in Windows line endings/final-newline normalization. The local directory had no `.git` directory, so no local branch or dirty-tree status could be asserted. GitHub confirmed `codex/playwright-browser-regression` at `6e04906d11c5ee6b304c291cec643db3ec430f5e`; `main` remained at `9544b96d87a44fce4334691145f5c53870871fa5`.

Before edits, actual checks passed: `pnpm test` (9/9), `pnpm typecheck` (app and E2E TypeScript), `pnpm build`, and `pnpm test:e2e` (5/5 Chromium scenarios).

## Historical ECG-CP3 final local verification

- `pnpm test:all`: exit 0.
- `pnpm install --frozen-lockfile`: passed after adding the Zod and axe dependencies.
- Vitest: 2 files, 19/19 tests passed (9 existing engine tests + 10 content governance tests).
- `pnpm typecheck`: passed for the app and Playwright configuration/specs.
- `pnpm build`: passed with Vite 8.3.4; 18 modules, 8.77 kB CSS and 231.90 kB JavaScript before gzip.
- `pnpm test:e2e` as part of `test:all`: 8/8 Chromium scenarios passed (23.4 seconds reported by Playwright).
- Playwright version: 1.64.1. Axe integration: `@axe-core/playwright` 4.14.0. Runtime schema library: Zod 4.6.7.

Browser scenarios cover defaults and calibration pulse; all-lead selection and aligned 12-lead rows; machine controls; manual interval values and reset; theme keyboard operation, SVG colors and persistence; desktop/tablet/mobile scrolling and no page-level horizontal overflow; mobile controls-before-monitor reading order; keyboard control of native inputs and focus visibility; reduced-motion static behavior; and axe scans for six light/dark, single/multi-lead, desktop/mobile states. Axe uses WCAG 2.0 A/AA and WCAG 2.1 A/AA rules with no suppressed rules. The initial scan found low-contrast small light-theme labels and a visible-label/accessibility-name mismatch on the theme toggle; both were corrected and the final six-state scan passed.

The first full run after changing waveform accessible names timed out in one pre-existing browser assertion because it kept a V3-specific accessible-name locator after switching to V4. The app had rendered the correct dynamic name; the assertion was updated to locate the unique waveform image independently of its current lead. The final full `pnpm test:all` rerun passed.

## Historical ECG-CP3 scope and limitations

No screen reader was run; accessibility findings combine code review, browser-visible inspection, keyboard Playwright scenarios, and axe automation. Axe is not proof of WCAG conformance. True browser zoom, text-only enlargement, operating-system high contrast, translated long labels, physical print calibration, and a full WCAG audit remain unverified. The light/dark trace and grid were also inspected visually in desktop and mobile browser captures; the grid is deliberately lower emphasis than the trace.

No medical-content review or clinical validation was performed. No patient recordings, clinical citations, reviewer identities/qualifications, review dates, or publication approvals were fabricated. All starter content remains draft; the learner-facing published registry is empty. No Learn, Practice, or Exam UI, KYP production integration, merge, or deployment was performed.

## Historical ECG-CP3 remote verification

The previous source checkpoint was published on a non-main branch. Its historical remote branch/head and CI result were verified through GitHub. Workflow status was not inferred from configuration.

## ECG-CP4 final local verification

- `pnpm install --frozen-lockfile`: passed (`Already up to date`).
- `pnpm test:all`: exit code 0.
- Vitest: 3 test files; 32/32 tests passed. Coverage includes content dependency/publication rules; progress schema, persistence, corrupt/outdated storage recovery; draft exclusion; lesson reader structure and focus; answer submission/explanation/retry; completion gating; aligned twelve-lead examples; shared calibration transforms; source-signal nonmutation; and RR/rate calculation.
- `pnpm typecheck`: passed for application and Playwright TypeScript.
- `pnpm build`: passed with Vite 8.3.4; 122 modules transformed; CSS 17.84 kB (4.00 kB gzip), JavaScript 374.10 kB (111.54 kB gzip).
- `pnpm test:e2e` within `test:all`: 9/9 Chromium scenarios passed. The added Learn scenario verifies keyboard opening, review-gated draft exclusion, dark/light preference retention, returning to the simulator with lead/speed/gain/measurement state unchanged, and no mobile page overflow.
- Axe scans: no violations with no rule exclusions across six simulator states (light/dark, single/12-lead, desktop/mobile coverage) and four Learn empty-catalog states (light/dark desktop and mobile). The learner catalog is empty by design, so no published lesson page is available for browser-level accessibility scanning; isolated component tests exercise reader/check controls.
- The desktop visual-inspection helper could not initialize because its kernel asset path was missing. No manual screenshot review of the newly added Learn layout is claimed. Headless browser tests and axe passed, but this is not equivalent to visual/manual assistive-technology testing.

## ECG-CP4 scope and limitations

No actual screen-reader session, true browser zoom, text-only enlargement, OS high-contrast mode, translated-label stress test, physical-size print/export test, or full WCAG audit was performed. Axe is supporting evidence only. Candidate references on the three authored lessons remain marked `unverified`; no reviewer identity, qualifications, approval dates, medical review, or publication approval were fabricated. Therefore no Learn lesson or linked question is published, and the learner catalog correctly remains empty. The 16-topic curriculum is a plan; India-specific MBBS/CBME alignment is not established. Synthetic traces remain unvalidated educational templates. No Practice/Exam interface, KYP production change, merge, or deployment was performed.

## ECG-CP4 remote verification

The local export has no Git metadata. The implementation was committed only to the existing feature branch `codex/accessibility-content-governance` using a non-forced compare-and-swap from the verified starting SHA `6b0d7ef01cd218c62d9376bb816cb5d95299d7a8` to `eb09784cca1fe2b122bbb9e21f8ec1792c30a5f9`. GitHub Actions run [39316691334](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39316691334) completed successfully on that implementation commit. The checkpoint documentation follow-up commit `4d7771e25c2f4f0e4cb7b86666c690d5e48af909` also passed [Actions run 39316996682](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39316996682). These commits were pushed with non-forced expected-head checks. `main` remained at `9544b96d87a44fce4334691145f5c53870871fa5`. The latest update to this report is documentation-only; refresh the live branch head and Actions status on resume. No merge or deployment was performed.

## ECG-CP5 content review readiness — local verification

### Starting repository state

- Remote feature branch: `codex/accessibility-content-governance` at `1ffcfd553fd1caa18bd156417c9c6f1e67370db3`.
- Remote `main`: `9544b96d87a44fce4334691145f5c53870871fa5`.
- Baseline GitHub Actions run [39317284992](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39317284992) completed successfully for the starting feature-branch head.
- Local path has no `.git` directory. The local export therefore cannot independently show branch/status or be used for a normal local commit. Remote facts were obtained through the GitHub connector; local command results below are from the local source tree.

### Source audit outcomes

- Becker PubMed metadata was checked. Corrected the article pages to 53–63 and separated quiz page 64; kept the seasonal date as such rather than inventing an exact date. The entry is now categorized as a review article.
- Kligfield PubMed metadata was checked and the entry categorized as a professional-society statement. Exact claim locations, whether the older statement remains current for each lesson claim, and publisher reuse rights remain unresolved.
- Both references remain `verificationStatus: unverified`. Candidate mappings do not imply semantic claim support; rights remain unknown. `CLAIM_SOURCE_MATRIX.md` records specific source sections/pages where found and every unresolved location.
- No Indian NMC/CBME competency is asserted. The official CBME 2024 lead could not be retrieved during this audit; no source mapping was added.
- Lesson/check content version advanced to `0.3.0` to bind future review intake to the new claim inventory and source links. No approval metadata or publication status was added.

### Actual commands and results

- First `pnpm test:all`: unit tests (42/42), application and E2E type checks, and production build passed; browser runner did not launch because the default Playwright Chromium cache lacked its executable. This was an environment setup issue; no browser scenario ran in that attempt.
- `PLAYWRIGHT_BROWSERS_PATH=<project>/.playwright-browsers pnpm test:e2e`: passed 9/9 Chromium scenarios using the existing task-local browser cache.
- Final `PLAYWRIGHT_BROWSERS_PATH=<project>/.playwright-browsers pnpm test:all`: exit 0. Vitest: 4 files, 42/42 tests; application and Playwright TypeScript checks passed; Vite 8.3.4 production build passed (122 modules; CSS 17.84 kB, JS 388.67 kB); Playwright: 9/9 Chromium scenarios passed.
- Browser scenario `Learn navigation keeps draft content private...` verified the learner catalog still says no lessons are published, hides the three draft titles and answers, and preserves simulator/theme state. Axe scans in existing theme/responsive states had no violations and no suppressed rules.

### Limits

Unit tests include clearly labelled test-only synthetic reviewer strings and a fixed fixture date solely to validate schema behavior. They are not real review records and are never placed in the registry or fixtures. They do not establish the truth of any medical claim. No real reviewer details, clinical approval, source-and-licensing approval, rights clearance, or publication approval were added. No manual screen-reader session or standalone manual visual review was performed in this checkpoint; Playwright and Axe are supporting evidence only.

All six Learn records remain drafts, all candidate sources remain `unverified`, and the published Learn catalog remains empty. No merge, deployment, or KYP production change was made.

### ECG-CP5 remote verification

The local source export has no `.git` metadata. The 19-file checkpoint was committed to the existing `codex/accessibility-content-governance` branch as [`d3f49a33e352d0ab24599cebafdeb6c79c3cee65`](https://github.com/zammucanva/KYP-ECG-SIM/commit/d3f49a33e352d0ab24599cebafdeb6c79c3cee65), with parent `1ffcfd553fd1caa18bd156417c9c6f1e67370db3`, using a non-forced expected-head update. GitHub Actions run [39323889336](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39323889336) completed successfully for that exact commit. At verification, the feature branch pointed to that commit and `main` remained at `9544b96d87a44fce4334691145f5c53870871fa5`. No merge, deployment, or KYP production change was made.

The subsequent three-file documentation-only follow-up commit [`18d53d0d8e214d0a3af02286fc6528f0e501a60a`](https://github.com/zammucanva/KYP-ECG-SIM/commit/18d53d0d8e214d0a3af02286fc6528f0e501a60a) also passed GitHub Actions run [39324210042](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39324210042). `main` remained unchanged.

# ECG-CP6 — live moving paper sweep verification

## Actual local results

- Local source tree: `C:\Users\TSHAM\Documents\Codex\2026-10-19\hel\work\ecg-lab`; it has no `.git` directory. Branch and CI statements below are remote GitHub observations, not local Git status.
- `PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers pnpm test:all`: exit 0.
- Vitest: 6 files, 53/53 tests passed. New coverage includes deterministic animation-clock lifecycle and time-addressable rolling signal generation across the lead array, plus calibration invariance.
- `pnpm typecheck` within `test:all`: passed for application and Playwright TypeScript.
- `pnpm build` within `test:all`: passed; Vite production build completed.
- `pnpm test:e2e` within `test:all`: 11/11 Chromium scenarios passed. Added checks observed the live sweep move, pause without drift, resume, reset, calibrated speed/gain behavior, lead/layout clock continuity, aligned 12-lead traces, responsive rendering, and reduced-motion startup.
- Axe scans ran against primary light/dark, single/multi-lead and mobile browser states. No violations were reported; no rules were suppressed. This is automated supporting evidence, not a full WCAG audit.
- The local Chromium page at `http://localhost:5173/` was visually inspected: the rolling trace and ECG grid move together, controls remain visible, and the existing theme/layout is preserved. Playwright, rather than screenshot appearance alone, verifies the motion and coordinate invariants.

## Scope and limitations

The view generates only the bounded past-to-current sample window; it does not pre-render future beats. The single-lead view computes only the selected lead (or its limb derivation inputs); the 12-lead view derives all leads from one shared clock/window. Screen rendering uses the existing calibrated SVG transforms and a separate explicit CSS preview scale; CSS pixels are not physical millimetres. Render-path decimation is display-only and leaves source samples unchanged.

The clock drops long animation-frame gaps over 100 ms rather than catching up with a visually abrupt paper jump. Thus simulated time deliberately does not account for a long blocked/hidden interval as uninterrupted elapsed wall time. Manual measurement points remain absolute time values from reset and can move outside the visible rolling window. Reduced-motion preference starts playback paused; the learner can start it explicitly.

The synthetic traces are simplified educational illustrations. They are not patient recordings, clinically validated physiology, or a real-time clinical monitor; no clinical validation, diagnostic performance, or equivalence to hospital equipment is claimed. No KYP production change, merge, or deployment was made.

## Remote state

Before implementation, GitHub showed feature branch `codex/accessibility-content-governance` at `2cd31e1a864f7ead8286f07aa6587f9cd4f46e6d` with successful Actions run `39324432585`; `main` was `9544b96d87a44fce4334691145f5c53870871fa5`. The implementation was committed as [`0dce61202093d5f0c08d9186fe027f31ec13494e`](https://github.com/zammucanva/KYP-ECG-SIM/commit/0dce61202093d5f0c08d9186fe027f31ec13494e) on the existing feature branch using a non-forced expected-head update. GitHub Actions run [39340233374](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39340233374) completed successfully for that commit. `main` remains unchanged at `9544b96d87a44fce4334691145f5c53870871fa5`. The local source export has no Git metadata.

