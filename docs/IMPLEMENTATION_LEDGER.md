# Implementation ledger

| Task | Acceptance criterion | Status | Evidence / blocker |
|---|---|---|---|
| Preflight | Environment and boundaries documented | Complete | `PROJECT_PREFLIGHT.md` |
| Isolated foundation | Local React/TS app structure | Complete | `package.json`, Vite entrypoint |
| Canonical signal | Time/ms + voltage/mV, deterministic seed | Complete | `src/engine/types.ts`, `signal.ts` |
| Calibration | Speed/gain conversions, logical SVG mapping and unclipped duration | Complete | `calibration.ts`; all supported speeds/gains, width and bounds tests |
| Functional shell | Lead, speed, gain, grid controls update display | Complete | `src/main.tsx` |
| Calibration pulse | Pulse reflects configured speed/gain using waveform transforms | Complete | SVG pulse uses shared time/voltage helpers; 1 mV at 20 mm/mV is 20 logical mm |
| Limb equations | All equations implemented and tested | Complete | Shared I/II timeline derives III/aVR/aVL/aVF; array-wide tests pass |
| Lead-specific morphology | Explicit V1–V6 educational templates | Complete | Shared event timing with documented projection profiles |
| Measurements | Manual time calipers for RR/PR/QRS/QT | Complete | Accessible numeric points, visible overlay, shared measurement helpers |
| Simultaneous view | Twelve aligned labelled traces | Complete | Shared `generateLeadSignals()` timeline and responsive horizontal overflow |
| KYP theme parity | Light/dark palette, accessible toggle and persisted preference | Complete | KYP palette tokens applied across app surfaces and SVG; browser verified both modes and reload persistence |
| Calibration correctness audit | No horizontal/vertical clipping; logical units documented; measurement invariance | Complete | 9/9 tests; 12-lead browser check; screen-to-calibration geometry documented |
| Learning modes | Learn/practice/exam | Not started | Requires content review metadata |
| QA | Test/typecheck/build/browser evidence | Complete for calibration checkpoint | Final results recorded in `QA_REPORT.md`; browser verified 12 aligned traces, 50 mm/s scrolling, 1 mV pulse height and theme persistence |
| KYP integration | Public API and guide | Not started | KYP architecture unavailable in preflight |

## Current checkpoint

Files were extended in `work/ecg-lab`. Calibration geometry is now explicit in logical millimetres and SVG units; screen size is documented separately from physical output. The local folder has no `.git` directory, so it has no local branch/working-tree status. Next action is implementing educational learning modes from reviewed learning objectives, followed by a formal browser test suite and physical-size export.
