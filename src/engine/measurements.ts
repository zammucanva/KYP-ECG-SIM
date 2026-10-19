import { heartRateFromRrMs, mmToTimeMs, mmToVoltageMv } from './calibration';
import type { Gain, PaperSpeed } from './types';

export type MeasurementKind = 'RR' | 'PR' | 'QRS' | 'QT';
export type Measurement = { kind: MeasurementKind; startMs: number; endMs: number; durationMs: number; heartRateBpm?: number };
export const measureTime = (startMs: number, endMs: number): number => Math.abs(endMs - startMs);
export const measureVoltage = (startMm: number, endMm: number, gain: Gain): number => Math.abs(mmToVoltageMv(endMm - startMm, gain));
export const createMeasurement = (kind: MeasurementKind, startMs: number, endMs: number): Measurement => {
  const durationMs = measureTime(startMs, endMs);
  return kind === 'RR' ? { kind, startMs, endMs, durationMs, heartRateBpm: heartRateFromRrMs(durationMs) } : { kind, startMs, endMs, durationMs };
};
export const screenMmToTimeMs = (distanceMm: number, speed: PaperSpeed): number => mmToTimeMs(distanceMm, speed);

