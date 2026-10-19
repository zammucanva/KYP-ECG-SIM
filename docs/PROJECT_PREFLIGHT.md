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

This environment has no verified KYP architecture, no clinical review workflow, and no imported recordings. The synthetic morphology is a transparent educational approximation. It must not be labelled clinically validated. The project is intentionally staged: measurement interactions and the complete lead-equation model are not claimed complete in this checkpoint.

## Implementation phases

1. Foundation and preflight.
2. Deterministic signal and calibration engine.
3. Responsive simulator shell and machine controls.
4. Measurement/caliper layer.
5. Twelve-lead consistency and simultaneous view.
6. Learning content and practice/exam modes.
7. Automated UI QA and integration documentation.

