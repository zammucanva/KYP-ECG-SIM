# QA report

Date: 2026-10-19. This report records checks actually run against the current local source. It is not a clinical-validation report.

## Pre-change baseline

The inspected local source matched the reported remote branch content, with text files differing only in Windows line endings/final-newline normalization. The local directory had no `.git` directory, so no local branch or dirty-tree status could be asserted. GitHub confirmed `codex/playwright-browser-regression` at `6e04906d11c5ee6b304c291cec643db3ec430f5e`; `main` remained at `9544b96d87a44fce4334691145f5c53870871fa5`.

Before edits, actual checks passed: `pnpm test` (9/9), `pnpm typecheck` (app and E2E TypeScript), `pnpm build`, and `pnpm test:e2e` (5/5 Chromium scenarios).

## Final local verification

- `pnpm test:all`: exit 0.
- `pnpm install --frozen-lockfile`: passed after adding the Zod and axe dependencies.
- Vitest: 2 files, 19/19 tests passed (9 existing engine tests + 10 content governance tests).
- `pnpm typecheck`: passed for the app and Playwright configuration/specs.
- `pnpm build`: passed with Vite 8.3.4; 18 modules, 8.77 kB CSS and 231.90 kB JavaScript before gzip.
- `pnpm test:e2e` as part of `test:all`: 8/8 Chromium scenarios passed (23.4 seconds reported by Playwright).
- Playwright version: 1.64.1. Axe integration: `@axe-core/playwright` 4.14.0. Runtime schema library: Zod 4.6.7.

Browser scenarios cover defaults and calibration pulse; all-lead selection and aligned 12-lead rows; machine controls; manual interval values and reset; theme keyboard operation, SVG colors and persistence; desktop/tablet/mobile scrolling and no page-level horizontal overflow; mobile controls-before-monitor reading order; keyboard control of native inputs and focus visibility; reduced-motion static behavior; and axe scans for six light/dark, single/multi-lead, desktop/mobile states. Axe uses WCAG 2.0 A/AA and WCAG 2.1 A/AA rules with no suppressed rules. The initial scan found low-contrast small light-theme labels and a visible-label/accessibility-name mismatch on the theme toggle; both were corrected and the final six-state scan passed.

The first full run after changing waveform accessible names timed out in one pre-existing browser assertion because it kept a V3-specific accessible-name locator after switching to V4. The app had rendered the correct dynamic name; the assertion was updated to locate the unique waveform image independently of its current lead. The final full `pnpm test:all` rerun passed.

## Scope and limitations

No screen reader was run; accessibility findings combine code review, browser-visible inspection, keyboard Playwright scenarios, and axe automation. Axe is not proof of WCAG conformance. True browser zoom, text-only enlargement, operating-system high contrast, translated long labels, physical print calibration, and a full WCAG audit remain unverified. The light/dark trace and grid were also inspected visually in desktop and mobile browser captures; the grid is deliberately lower emphasis than the trace.

No medical-content review or clinical validation was performed. No patient recordings, clinical citations, reviewer identities/qualifications, review dates, or publication approvals were fabricated. All starter content remains draft; the learner-facing published registry is empty. No Learn, Practice, or Exam UI, KYP production integration, merge, or deployment was performed.

## Remote verification

The source checkpoint is published on a new non-main branch from the verified browser-regression commit. The local folder has no Git metadata; remote branch/head and any GitHub Actions result are verified through GitHub and reported in the task handoff. Workflow status is not inferred from the workflow configuration.
