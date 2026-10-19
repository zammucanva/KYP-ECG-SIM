# ECG calibration

## Canonical and logical units

Signal timestamps remain milliseconds and voltages remain millivolts. The calibration engine converts these to ECG-paper millimetres:

- `timeToMm(seconds, speed) = seconds × paper_speed_mm_per_second`
- `voltageToMm(mV, gain) = voltage_mV × gain_mm_per_mV`

The SVG coordinate system uses **4 SVG user units per logical millimetre** (`SVG_UNITS_PER_MM`). Therefore `x = timeMsToSvgUnits(timeMs, speed)` and the waveform ordinate is `baseline - voltageMvToSvgUnits(mV, gain)`. The 1 mm minor grid uses 4 units and the 5 mm major grid uses 20 units.

## Recording width and clipping

A 10-second signal occupies 125 mm at 12.5 mm/s, 250 mm at 25 mm/s, and 500 mm at 50 mm/s (respectively 500, 1000, and 2000 SVG units). The preview viewBox is at least 250 mm wide and expands to the complete recording width when needed. Thus the 12.5 mm/s strip uses half the standard 250 mm view, while the 50 mm/s strip becomes wider than an ordinary desktop viewport and is horizontally scrollable instead of being clipped or compressed.

## Voltage and calibration pulse

At gains of 5, 10, and 20 mm/mV, a 1 mV waveform excursion and calibration pulse are 5, 10, and 20 logical mm high (20, 40, and 80 SVG units). Single- and 12-lead traces share one voltage transform and one vertical viewport calculated from the largest absolute voltage across all leads, with a 4 mm margin. This keeps every synthetic sample in bounds without changing the voltage scale between leads or layouts.

The drawn calibration pulse is 1 mV by 200 ms and uses the same time and voltage helpers as the trace. Its width therefore changes with paper speed, and its height changes with gain; at 20 mm/mV its logical height is exactly 20 mm / 80 SVG units.

## Screen preview versus physical output

The browser preview maps one SVG user unit to 0.8 CSS pixels as a deliberate display scale. The resulting CSS-pixel size is not a physical millimetre measurement: browser zoom, operating-system scaling, monitor density, and responsive layout affect perceived size. The geometry is calibrated in SVG user units and logical millimetres, not by assuming CSS pixels are millimetres. Physical-size print/export is not implemented; such output must set SVG/print dimensions in millimetres and be verified at print scale.

## Measurements and limitations

Manual time points are stored in milliseconds. SVG marker positions are derived from the shared paper-speed transform, while the measurement result is calculated from timestamps; changing speed, gain, layout, or preview scale does not mutate those timestamps. `previewPixelsToTimeMs` and `previewPixelsToVoltageMv` invert the display transform for calibrated coordinate conversion. The current interface uses accessible numeric time points, not pointer-drag calipers or automated boundary detection.

The signal is deterministic synthetic educational material, not validated physiology or a patient recording. Calibration correctness does not establish clinical validity. Physical export, pointer-based calipers, and automated wave-boundary detection remain outstanding.
