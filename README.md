# ECG Lab Simulator

Standalone React/TypeScript educational module for future KYP integration. The current release includes a deterministic shared-timeline synthetic 12-lead model, single- and multi-lead views, calibrated machine controls, manual time calipers, and KYP-matched light/dark themes.

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

Synthetic traces are educational illustrations, not patient recordings and not a diagnostic device. Automated wave-boundary detection, artifact pipeline, learning modes, and clinical review remain incomplete. Content records are governed independently of the UI; see [the schema](docs/CONTENT_SCHEMA.md), [provenance rules](docs/CONTENT_PROVENANCE.md), [review workflow](docs/CONTENT_REVIEW_WORKFLOW.md), and [accessibility audit](docs/ACCESSIBILITY_AUDIT.md). No clinical content is published by this checkpoint.
