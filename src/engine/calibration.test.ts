import { describe, expect, it } from 'vitest';
import { heartRateFromRrMs, mmToTimeMs, mmToVoltageMv, timeToMm, voltageToMm } from './calibration';
import { createMeasurement, measureTime, measureVoltage } from './measurements';
import { allLeads, generateLeadSignals, generateSignal, limbLeads } from './signal';
import type { Sample } from './types';

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 10);
const fixture = (values: number[]): Sample[] => values.map((voltageMv, i) => ({ timeMs: i * 4, voltageMv }));

describe('ECG calibration and measurements', () => {
  it('supports all machine calibration settings', () => {
    close(timeToMm(1, 12.5), 12.5); close(timeToMm(1, 25), 25); close(timeToMm(1, 50), 50);
    close(voltageToMm(1, 5), 5); close(voltageToMm(1, 10), 10); close(voltageToMm(1, 20), 20);
    close(mmToTimeMs(5, 25), 200); close(mmToVoltageMv(20, 20), 1);
  });
  it('converts time, voltage, and heart rate through shared helpers', () => {
    close(measureTime(120, 920), 800); close(measureVoltage(0, 20, 20), 1); close(heartRateFromRrMs(800), 75);
    expect(createMeasurement('RR', 0, 800)).toMatchObject({ durationMs: 800, heartRateBpm: 75 });
  });
});

describe('12-lead engine', () => {
  it('contains all twelve lead identifiers and shared timelines', () => {
    expect(allLeads()).toEqual(['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6']);
    const leads = generateLeadSignals('sinus', 11);
    const lengths = allLeads().map(lead => leads[lead].length);
    expect(new Set(lengths).size).toBe(1);
    for (const lead of allLeads()) expect(leads[lead].map(s => s.timeMs)).toEqual(leads.I.map(s => s.timeMs));
  });
  it('holds limb equations across every sample', () => {
    const i = fixture([0.1, -0.2, 0.4]); const ii = fixture([0.3, 0.2, -0.1]); const derived = limbLeads(i, ii);
    derived.III.forEach((s, n) => close(s.voltageMv, ii[n].voltageMv - i[n].voltageMv));
    derived.aVR.forEach((s, n) => close(s.voltageMv, -(i[n].voltageMv + ii[n].voltageMv) / 2));
    derived.aVL.forEach((s, n) => close(s.voltageMv, i[n].voltageMv - ii[n].voltageMv / 2));
    derived.aVF.forEach((s, n) => close(s.voltageMv, ii[n].voltageMv - i[n].voltageMv / 2));
  });
  it('keeps source signals immutable and changes the selected series', () => {
    const source = generateSignal('sinus', 'V3', 3); const before = source.samples.map(s => ({ ...s })); const v1 = generateSignal('sinus', 'V1', 3);
    expect(v1.samples).not.toEqual(source.samples); expect(source.samples).toEqual(before);
  });
});

