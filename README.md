# ECG Lab Simulator

Standalone React/TypeScript educational module for future KYP integration. The current release is a calibrated synthetic single-lead preview: it includes deterministic time-based signal generation, lead selection, paper-speed/gain/grid controls, calibration pulse, and reset behaviour.

## Run locally

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

Synthetic traces are educational illustrations, not patient recordings and not a diagnostic device. Manual calipers, full 12-lead derivation, artifact pipeline, learning modes, browser tests, and clinical review remain incomplete.
