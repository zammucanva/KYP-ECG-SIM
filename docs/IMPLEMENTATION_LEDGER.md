# Implementation ledger

| Task | Acceptance criterion | Status | Evidence / blocker |
|---|---|---|---|
| Preflight | Environment and boundaries documented | Complete | `PROJECT_PREFLIGHT.md` |
| Isolated foundation | Local React/TS app structure | Complete | `package.json`, Vite entrypoint |
| Canonical signal | Time/ms + voltage/mV, deterministic seed | Complete | `src/engine/types.ts`, `signal.ts` |
| Calibration | Speed/gain conversions and defaults | Complete | `calibration.ts`, unit tests |
| Functional shell | Lead, speed, gain, grid controls update display | Complete | `src/main.tsx` |
| Calibration pulse | Pulse reflects configured gain | Partial | UI labels configured gain; visual pulse is not yet plotted from the engine |
| Limb equations | All equations implemented and tested | Partial | Helper present; tests and UI integration remain |
| Measurements | Manual time/voltage calipers | Not started | Next milestone |
| Learning modes | Learn/practice/exam | Not started | Requires content review metadata |
| QA | Test/typecheck/build/browser evidence | Partial | `pnpm test`: 3/3 passed; `pnpm typecheck`: passed; `pnpm build`: passed; browser smoke check verified lead/gain/speed/grid controls |
| KYP integration | Public API and guide | Not started | KYP architecture unavailable in preflight |

## Current checkpoint

Files were created in `work/ecg-lab`. No unrelated project was changed. Verification is complete for this foundation checkpoint. Next action is manual calipers and expanded lead-system tests.

