# QA report

Status: calibration-correctness checkpoint verified on 2026-10-19.

Pre-change baseline: `pnpm test` passed (1 file, 5 tests), `pnpm typecheck` passed, and `pnpm build` passed.

Final calibration checkpoint results: `pnpm test` passed (1 file, 9 tests); `pnpm typecheck` passed; `pnpm build` passed (Vite 8.3.4, 18 modules transformed; 8.62 kB CSS and 231.34 kB JS before gzip).

Automated checks cover all paper speeds (12.5, 25, 50 mm/s), gains (5, 10, 20 mm/mV), ten-second logical widths, pulse dimensions, screen-coordinate inverse conversion across preview zoom values, and vertical sample bounds for all 12 leads and all four synthetic presets.

Browser regression: verified the default V3 / 25 mm/s / 20 mm/mV / grid-on controls; the 1 mV, 200 ms SVG pulse is 80 SVG units high at 20 mm/mV; the 50 mm/s single trace uses a 2000-unit viewBox, ends at x=1998.4, and horizontally scrolls rather than clipping; the 12-lead view shows all twelve labels with identical x-coordinate timelines, shared viewBox dimensions, and sample paths in bounds. The theme switch operated with Enter, dark SVG trace/grid colors resolved to dark tokens, and dark selection survived reload. The CSS-pixel preview remains explicitly separate from physical millimetres. The browser automation environment did not expose localStorage directly for inspection; reload persistence was confirmed through the rendered theme state.

There is no local `.git` directory in the project folder, so local branch and dirty-tree state cannot be reported or used for a local branch commit. The remote theme commit was verified on GitHub `main`; no correction was pushed to `main`.

Not performed: formal Playwright suite (not configured), physical-size print/export, full accessibility audit, automated wave-boundary detection, or clinical validation. The synthetic morphologies remain educational templates, not validated patient physiology.
