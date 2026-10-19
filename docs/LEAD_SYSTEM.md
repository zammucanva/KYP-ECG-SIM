# Twelve-lead system

The engine exposes I, II, III, aVR, aVL, aVF, and V1–V6. I and II are generated from the same cardiac event timeline. The augmented and III leads are derived sample-by-sample:

- `III = II - I`
- `aVR = -(I + II) / 2`
- `aVL = I - II / 2`
- `aVF = II - I / 2`

V1–V6 use explicit educational morphology profiles that alter P/QRS/ST/T component amplitudes while preserving the shared sample timestamps. These are transparent mathematical illustrations, not validated physiological projections or diagnostic patient models. All leads are returned in one `LeadSignals` object and the simultaneous UI renders that object without starting separate recordings.

