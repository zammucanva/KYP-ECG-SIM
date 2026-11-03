# Focused accessibility audit

Status: focused review of the standalone simulator and the newly added Learn shell/lesson interactions, not a complete WCAG conformance audit.

## Scope and evidence

Audited the application shell, machine controls, lead selector, waveform viewport, calibration pulse, manual measurement controls, theme toggle, single/12-lead switch, simulation-only disclosures, Learn navigation, draft-only empty catalog, lesson reader, section links, demonstrations, formative knowledge checks, progress/reset controls, and lesson navigation. The Learn catalog intentionally has no learner-accessible lessons until review requirements are met. No modal dialog is present.

Playwright coverage uses 1280 × 900 desktop, 768 × 1024 tablet, and 390 × 844 mobile viewports. Automated axe scans cover simulator light/dark and responsive states plus the Learn shell in its reviewed empty state. The scan uses WCAG 2.0 A/AA and WCAG 2.1 A/AA rules with no rule exclusions. React Testing Library exercises the lesson reader, section navigation, keyboard-operable answer controls, feedback/retry, focus management, progress gating, and demonstration controls using draft records only in isolated component tests. These results supplement, not replace, manual evaluation.

## Keyboard operation

Verified through browser regressions that Tab reaches the theme toggle first; Space toggles it; Enter selects a lead, changes view, and opens Learn; native selects respond to ArrowDown, Home and End; Space toggles the grid; both waveform scroll regions can receive keyboard focus; numeric measurement points respond to arrow keys; and Enter activates Reset points. Learn section links and answer controls use native anchor/radio/checkbox behavior; changing lesson content moves focus to the new lesson heading. Focus rings are explicit for buttons, links, selects, inputs, the focused lesson title, and scrollable waveform regions. The existing controls retain their native keyboard behavior.

The mobile layout previously moved the controls visually after the monitor while leaving them first in DOM and keyboard order. That mismatch also put the controls below a very long 12-lead display. The CSS reordering was removed; a browser regression now verifies that mobile visual and DOM order both place controls before the monitor. No focus trap or unexpected loss of focus was observed in the tested flows.

## Screen-reader-oriented semantics

- One `main` landmark, a single `h1`, a labelled section navigation landmark, and descending section headings are present.
- The lead buttons are grouped by a `fieldset` and `legend`; selected lead and view/grid/theme states use `aria-pressed`.
- Rhythm, paper-speed, gain, measurement type, and measurement-point inputs have associated labels.
- Each waveform is exposed as one named SVG image, not as a sequence of sample points. Its name states lead, 10-second duration, speed, gain, and grid state. The 12-lead viewport names its shared duration and calibration.
- Measurement results are announced through a polite status region with units; the calibration pulse has a descriptive accessible name.
- Simulation-only wording remains visible in the header/footer and near the measured output.

The Learn reader uses section landmarks and anchor navigation, focuses its lesson heading on content change, labels radio/checkbox answers, and announces check feedback and demo measurements. Its published list is registry-filtered and does not expose draft titles or answer keys. The automated Learn scan covers light and dark at desktop and mobile sizes, while component tests cover reader/check interactions. No manual browser screenshot review was completed for the new lesson composition because the desktop inspection runtime could not initialize. This was a code and browser accessibility-tree review, not a test with NVDA, JAWS, VoiceOver, TalkBack, or another assistive technology. Actual screen-reader speech and rotor/navigation behavior remain unverified.

## Contrast and visual review

The first axe scan found small light-theme secondary text at 3.52:1 and 3.61:1 against its background, below the 4.5:1 threshold for that text, and found that the theme button's explicit name omitted its visible Light/Dark text. The light-theme subtle token now reuses the already readable muted token. The accessible name retains “Toggle theme” and includes the visible current mode. A fresh six-state axe scan reports no automated violations.

Desktop light and dark 12-lead screenshots and a mobile dark screenshot were inspected at browser size. The teal trace and measurement markers remain distinguishable from the paper in both themes. Minor and major grid lines are intentionally lower emphasis than the trace; they are visible in the inspected renders, although no numeric non-text contrast claim is made. Selected controls also use a pressed state and fill/border treatment, not color alone.

Reduced-motion behavior: the current UI defines no transitions or animation, so it has no motion to suppress. No animation was added.

## Responsive behavior and limits

The browser tests cover desktop, tablet, and mobile widths, verify there is no page-level horizontal overflow, and verify that intentionally long waveforms scroll inside their viewport. The Learn demo likewise keeps a calibrated strip scrollable rather than compressing it. At mobile width the multi-lead recording remains horizontally scrollable rather than compressed to an unreadable width.

The Playwright harness cannot set a user's browser zoom level. Narrow viewport coverage is not represented as a true 200% browser-zoom test. Text-only zoom, operating-system high-contrast mode, translated/long localized labels, print output, physical devices, and actual assistive technology were not tested. There is no localization layer or dialog/navigation surface to audit yet.

## Corrected and unresolved findings

Corrected: low-contrast light-theme secondary labels; theme-toggle accessible-name mismatch; explicit focus treatment for scrollable traces; and mobile mismatch between visual and DOM control order.

Unresolved: assistive-technology compatibility, true browser zoom and text enlargement, localization stress, non-text contrast measurement against applicable criteria, high-contrast mode, and broader WCAG criteria not exercised by axe or this focused review. No complete WCAG conformance claim is made.
