# ECG Lab roadmap

This sequence keeps measurement and rendering reliability ahead of additional learning features.

1. **Calibration hardening — complete.** Shared time/voltage transforms, pulse, viewport extents, 12-lead alignment and unit tests are documented in `ECG_CALIBRATION.md` and `LEAD_SYSTEM.md`.
2. **Browser regression suite — complete.** Five Chromium scenarios cover startup, all leads, machine controls, manual intervals, theme state/colors, calibration pulse, aligned 12-lead x coordinates and responsive scrolling. The first GitHub Actions run for this checkpoint passed dependency install, browser setup, unit tests, type-check, build and browser tests.
3. **Accessibility review — next.** Conduct keyboard and screen-reader review across themes and responsive layouts; add an automated scan only as supporting evidence.
4. **Measurement tooling.** Add pointer-based and voltage calipers only after the current numeric manual measurements and coordinate mapping remain covered by tests. Do not imply automated wave-boundary detection.
5. **Content schema and provenance.** Define validated discriminated types and a review/provenance model before placing educational content in React views.
6. **Learn and Practice.** Start with a small, reviewed curriculum and deterministic questions. Keep local progress versioned and host-independent.
7. **Exam mode and case library.** Add only when question and case content has appropriate provenance, review status and explicit deterministic scoring.
8. **Integration boundary.** Stabilize a typed embeddable API and verify it in a separate KYP integration task; do not modify KYP production during standalone work.
9. **Optional export and signal artifacts.** Defer physical-size export, noise/artifact controls and import pipelines until core browser and calibration tests are stable.

No phase may describe the synthetic morphologies as clinically validated without evidence and review.
