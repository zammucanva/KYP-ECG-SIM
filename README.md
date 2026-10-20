# ECG Lab Simulator

Standalone React/TypeScript educational module for future KYP integration. The current release includes a deterministic shared-timeline synthetic 12-lead model, a real-time moving paper sweep with start/pause/reset controls, single- and multi-lead views, calibrated machine controls, manual time calipers, KYP-matched light/dark themes, and a content-governed Learn shell with lesson rendering, formative checks, shared-engine demonstrations, and local progress. Playback starts automatically unless the browser requests reduced motion.

## What is in the app

- **ECG simulator**: calibrated moving paper, twelve leads, measurements, private annotations, local save/restore, and five guided exercises with hints.
- **Rhythm Challenge**: six-second synthetic strips across 18 rhythm categories with Learn, Practice and Timed modes, rate estimation, and explanations. Draft content, not clinically reviewed.
- **Virtual Patients**: six fictional cases with simulated observations and an ECG from the same case library; heart rate is measured from the strip, and no urgency advice is given. Draft content.
- **Academy**: local XP, levels, achievements and personal bests derived only from what you actually do.
- **Learn**: draft lessons behind review gates (the published catalog is intentionally empty).

## Run locally

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm test:e2e
```

Install the Playwright Chromium runtime once before the first browser run:

```bash
pnpm exec playwright install chromium
```

`pnpm test` runs unit tests; `pnpm test:e2e` runs browser regressions; `pnpm test:all` runs both plus type-check and production build.

Synthetic traces are simplified educational illustrations, not patient recordings or clinically validated physiology; the simulator is not a diagnostic device or patient monitor. The Learn framework and three introductory draft lessons are implemented, but no lessons or answers are published until the required source, educational, medical, and publication review records are supplied and validated. Practice and Exam modes, automated wave-boundary detection, artifact pipeline, and clinical case library remain incomplete. Content records are governed independently of the UI; see [the curriculum plan](docs/LEARN_CURRICULUM.md), [the schema](docs/CONTENT_SCHEMA.md), [provenance rules](docs/CONTENT_PROVENANCE.md), [review workflow](docs/CONTENT_REVIEW_WORKFLOW.md), and [accessibility audit](docs/ACCESSIBILITY_AUDIT.md). No clinical content is published by this checkpoint.

