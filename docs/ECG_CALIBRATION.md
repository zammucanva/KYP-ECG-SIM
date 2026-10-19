# ECG calibration

The engine represents time in milliseconds and voltage in millivolts. `timeToMm(seconds, speed)` implements `x_mm = seconds × paper_speed_mm_per_second`; `voltageToMm(mV, gain)` implements `y_mm = voltage_mV × gain_mm_per_mV`. The source samples are regenerated only when rhythm or lead changes; speed, gain, and grid are display concerns.

The SVG currently uses a logical viewport. CSS pixels are not treated as physical millimetres. Export/print calibration is not implemented yet.

