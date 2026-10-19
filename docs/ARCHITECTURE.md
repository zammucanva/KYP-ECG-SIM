# Architecture

`src/engine/` owns canonical signal samples, calibration maths, lead derivation, and measurement calculations. It does not import React. `generateLeadSignals()` creates I and II from shared event timing, derives III/aVR/aVL/aVF algebraically, and creates V1–V6 from explicit educational morphology profiles using the same noise/time arrays. `src/main.tsx` owns machine state and SVG presentation. Display settings transform coordinates only; they do not mutate source samples.

Renderer coordinates share `src/engine/calibration.ts`: 4 SVG user units represent one logical millimetre, x derives from paper speed, and y derives from gain. A common viewBox width and amplitude-safe height are passed to the single trace and every lead row. The SVG preview is horizontally scrollable when its calibrated recording width exceeds the container. CSS pixels are a separate presentation scale, not physical millimetres; physical-size export is not implemented.

The public integration boundary is planned as an `EcgLab` component accepting typed initial machine settings. It is not exported yet; the current app is a standalone checkpoint.

The UI theme uses CSS custom properties mapped to the live KYP light and dark palette: neutral blue-gray surfaces and text, cyan-teal primary controls, and low-contrast teal ECG grid lines. The standalone theme toggle persists its choice in `localStorage` under `ecg-lab-theme`; it does not access host application state.
