# Project preflight

Date: 2026-10-19

## Findings

- The requested workspace was empty except for `work/` and `outputs/`; it is not a Git repository.
- No KYP source, package manifest, lockfile, or test infrastructure was present. No KYP files were modified.
- Node.js 24.19.0, npm 11.17.0, and pnpm 11.25.0 are available.
- No existing design tokens or component conventions were available to reuse.

## Architecture

The isolated module uses Vite + React + strict TypeScript. The signal engine is framework-independent under `src/engine/`; display calibration is separate from signal generation; the first UI is a single-page application with a deliberately small dependency surface.

## Constraints and risks

This environment has no verified KYP architecture, no clinical review workflow, and no imported recordings. The synthetic morphology is a transparent educational approximation. It must not be labelled clinically validated. The initial preflight preceded the 12-lead and manual measurement checkpoints; their implemented scope and evidence are recorded in the implementation ledger and QA report.

## Implementation phases

1. Foundation and preflight.
2. Deterministic signal and calibration engine.
3. Responsive simulator shell and machine controls.
4. Measurement/caliper layer.
5. Twelve-lead consistency and simultaneous view.
6. Learning content and practice/exam modes.
7. Automated UI QA and integration documentation.

## Continuation audit — 2026-10-19

- The current workspace already contains the calibration-correctness checkpoint and the standalone Vite/React app; no rebuild was needed.
- The project directory has no `.git` directory, so local branch and dirty-tree state cannot be inspected. The GitHub connector verified commit `63342ea406c8176868f2654914ac454231cd86bb` on `codex/calibration-correctness-audit`; `main` was not modified.
- Actual pre-change baseline in this workspace: `pnpm test` 9/9 passed, `pnpm typecheck` passed, and `pnpm build` passed.
- A formal browser suite was absent. The next coherent phase is Playwright regression coverage for the existing simulator, not educational content modes.
