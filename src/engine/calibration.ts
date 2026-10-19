import type { Gain, PaperSpeed } from './types';
export const timeToMm = (seconds: number, speed: PaperSpeed) => seconds * speed;
export const voltageToMm = (mv: number, gain: Gain) => mv * gain;
export const mmToTimeMs = (mm: number, speed: PaperSpeed) => (mm / speed) * 1000;
export const mmToVoltageMv = (mm: number, gain: Gain) => mm / gain;
export const heartRateFromRrMs = (rrMs: number) => rrMs > 0 ? 60000 / rrMs : 0;
export const qtcBazettMs = (qtMs: number, rrMs: number) => rrMs > 0 ? qtMs / Math.sqrt(rrMs / 1000) : 0;

