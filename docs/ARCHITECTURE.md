# Architecture

`src/engine/` owns canonical signal samples, calibration maths, lead derivation, and measurement calculations. It does not import React. `generateLeadSignals()` creates I and II from shared event timing, derives III/aVR/aVL/aVF algebraically, and creates V1–V6 from explicit educational morphology profiles using the same noise/time arrays. `src/main.tsx` owns machine state and SVG presentation. Display settings transform coordinates only; they do not mutate source samples.

The public integration boundary is planned as an `EcgLab` component accepting typed initial machine settings. It is not exported yet; the current app is a standalone checkpoint.

