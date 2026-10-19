# Implementation ledger

| Task | Acceptance criterion | Status | Evidence / blocker |
|---|---|---|---|
| Preflight | Environment and boundaries documented | Complete | `PROJECT_PREFLIGHT.md` |
| Isolated foundation | Local React/TS app structure | Complete | `package.json`, Vite entrypoint |
| Canonical signal | Time/ms + voltage/mV, deterministic seed | Complete | `src/engine/types.ts`, `signal.ts` |
| Calibration | Speed/gain conversions and defaults | Complete | `calibration.ts`, unit tests |
| Functional shell | Lead, speed, gain, grid controls update display | Complete | `src/main.tsx` |
| Calibration pulse | Pulse reflects configured gain | Partial | UI labels configured gain; visual pulse is not yet plotted from the engine |
| Limb equations | All equations implemented and tested | Complete | Shared I/II timeline derives III/aVR/aVL/aVF; array-wide tests pass |
| Lead-specific morphology | Explicit V1–V6 educational templates | Complete | Shared event timing with documented projection profiles |
| Measurements | Manual time calipers for RR/PR/QRS/QT | Complete | Accessible numeric points, visible overlay, shared measurement helpers |
| Simultaneous view | Twelve aligned labelled traces | Complete | Shared `generateLeadSignals()` timeline and responsive horizontal overflow |
| Learning modes | Learn/practice/exam | Not started | Requires content review metadata |
| QA | Test/typecheck/build/browser evidence | Complete for checkpoint | `pnpm test`: 5/5 passed; typecheck/build passed; browser verified 12 traces and editable 800 ms RR measurement |
| KYP integration | Public API and guide | Not started | KYP architecture unavailable in preflight |

## Current checkpoint

Files were extended in `work/ecg-lab`. No unrelated project was changed. Next action is educational learning modes and a formal browser test suite.

