# Architecture

`src/engine/` owns canonical signal samples and calibration maths. It does not import React. `src/main.tsx` owns the current machine state and SVG presentation. Display settings transform coordinates only; they do not mutate source samples. The current renderer derives a lead-specific educational projection from one shared event timeline.

The public integration boundary is planned as an `EcgLab` component accepting typed initial machine settings. It is not exported yet; the current app is a standalone checkpoint.

