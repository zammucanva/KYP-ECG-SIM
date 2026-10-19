# QA report

Status: calibration and formal browser-regression checkpoint verified on 2026-10-19.

## Commands and actual results

- Pre-change baseline: `pnpm test` 9/9 passed; `pnpm typecheck` passed; `pnpm build` passed.
- Dependency reproducibility: `pnpm install --frozen-lockfile` passed after adding Playwright.
- Final `pnpm test`: 1 test file, 9/9 passed.
- Final `pnpm typecheck`: passed for both the application and Playwright config/spec types.
- Final `pnpm build`: passed with Vite 8.3.4 (18 modules; 8.74 kB CSS and 231.68 kB JS before gzip).
- Final `pnpm test:all`: exit 0; unit, type-check, build, and all five Chromium tests passed (Playwright 1.64.1; 21.9 seconds reported browser test time).

## Browser coverage

The Playwright tests verify startup without uncaught page/console errors; V3, 25 mm/s, 20 mm/mV and visible-grid defaults; the actual SVG pulse path height of 80 logical units (20 mm) at 20 mm/mV; all twelve selectable leads; lead-specific signal change; 50 mm/s horizontal scrolling rather than clipping; grid and single/multi-view controls; equal 12-lead viewBoxes and identical x-coordinate arrays; RR/PR/QRS/QT values and reset; the known 800 ms RR result of 75 bpm; measurement stability through speed and gain changes; keyboard theme operation and focus indication; distinct light/dark SVG trace colors and saved theme after reload; and usable desktop, tablet and mobile layouts without page-level horizontal overflow.

The first browser attempt found an ambiguous accessible name for the I/II/III buttons because they were nested in a `label`. The control was corrected to a labelled `fieldset`; selectors now identify each lead exactly. Vitest also initially discovered the browser spec; `vite.config.ts` now scopes Vitest to `src/**/*.test.ts`, keeping the unit and browser suites separate.

The local sandbox could not create Playwright's default user cache, so Chromium was installed to a temporary path through `PLAYWRIGHT_BROWSERS_PATH`; the package test script and CI use normal Playwright runtime discovery when installed conventionally. GitHub Actions run [39247366495](https://github.com/zammucanva/KYP-ECG-SIM/actions/runs/39247366495) completed successfully: dependency installation, Chromium setup, unit tests, type-check, build and browser tests all passed.

No local `.git` directory exists in the project folder, so local branch/dirty-tree status is unavailable. The verified implementation was published to `codex/playwright-browser-regression`; `main` was not modified.

## Not verified or implemented

No full accessibility audit, physical-size print/export, automated wave-boundary detection, KYP integration, educational content review, or clinical validation was performed. Synthetic morphologies remain educational templates, not validated physiology or patient recordings.
