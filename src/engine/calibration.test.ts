import { describe, expect, it } from 'vitest';
import { heartRateFromRrMs, mmToTimeMs, timeToMm, voltageToMm } from './calibration';
import { generateSignal } from './signal';
describe('ECG calibration', () => {
  it('maps time and voltage to logical millimetres', () => { expect(timeToMm(1, 25)).toBe(25); expect(timeToMm(1, 50)).toBe(50); expect(timeToMm(1, 12.5)).toBe(12.5); expect(voltageToMm(1, 20)).toBe(20); expect(voltageToMm(1, 10)).toBe(10); expect(voltageToMm(1, 5)).toBe(5); });
  it('round trips display dimensions', () => { expect(mmToTimeMs(5, 25)).toBe(200); expect(heartRateFromRrMs(800)).toBe(75); });
  it('generates deterministic finite time-ordered samples', () => { const a = generateSignal('sinus', 'V3', 11); const b = generateSignal('sinus', 'V3', 11); expect(a.samples).toEqual(b.samples); expect(a.samples.every((s, i) => Number.isFinite(s.voltageMv) && (i === 0 || s.timeMs > a.samples[i-1].timeMs))).toBe(true); });
});

