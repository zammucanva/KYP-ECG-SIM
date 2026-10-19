import type { Lead, LeadSignals, RhythmPreset, Sample, Signal } from './types';

const LEADS: Lead[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
export const allLeads = (): Lead[] => [...LEADS];
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
type Morphology = { p: number; q: number; r: number; s: number; t: number; st: number };
const morphology: Record<Lead, Morphology> = {
  I: { p: 1, q: 1, r: 0.8, s: 0.8, t: 0.9, st: 0 }, II: { p: 1.1, q: 1, r: 1, s: 1, t: 1, st: 0 },
  V1: { p: 0.7, q: 0.7, r: 0.35, s: 1.55, t: -0.55, st: 0 }, V2: { p: 0.8, q: 0.8, r: 0.65, s: 1.25, t: 0.1, st: 0 },
  V3: { p: 0.9, q: 0.9, r: 0.95, s: 0.85, t: 0.55, st: 0 }, V4: { p: 1, q: 1, r: 1.15, s: 0.55, t: 0.8, st: 0 },
  V5: { p: 1, q: 1, r: 1.2, s: 0.35, t: 0.9, st: 0 }, V6: { p: 1, q: 1, r: 1.1, s: 0.3, t: 0.85, st: 0 },
  III: { p: 0, q: 0, r: 0, s: 0, t: 0, st: 0 }, aVR: { p: 0, q: 0, r: 0, s: 0, t: 0, st: 0 }, aVL: { p: 0, q: 0, r: 0, s: 0, t: 0, st: 0 }, aVF: { p: 0, q: 0, r: 0, s: 0, t: 0, st: 0 },
};
function eventSamples(preset: RhythmPreset, profile: Morphology, noise: number[], durationMs = 10000, sampleRateHz = 250): Sample[] {
  const samples: Sample[] = []; const rr = preset === 'brady' ? 1200 : preset === 'tachy' ? 600 : 800;
  for (let i = 0; i < durationMs * sampleRateHz / 1000; i += 1) {
    const timeMs = i * 1000 / sampleRateHz; const phase = (timeMs % rr) / rr;
    const p = 0.12 * profile.p * Math.exp(-((phase - 0.18) ** 2) / 0.0018);
    const q = -0.12 * profile.q * Math.exp(-((phase - 0.285) ** 2) / 0.00018);
    const r = profile.r * Math.exp(-((phase - 0.30) ** 2) / 0.00012);
    const s = -0.22 * profile.s * Math.exp(-((phase - 0.325) ** 2) / 0.0002);
    const st = profile.st * (phase > 0.34 && phase < 0.44 ? 1 : 0);
    const t = 0.30 * profile.t * Math.exp(-((phase - 0.55) ** 2) / 0.012);
    samples.push({ timeMs, voltageMv: p + q + r + s + st + t + noise[i] });
  }
  return samples;
}
export function limbLeads(i: Sample[], ii: Sample[]): Pick<LeadSignals, 'III' | 'aVR' | 'aVL' | 'aVF'> {
  if (i.length !== ii.length) throw new Error('Limb leads must have equal sample lengths');
  return { III: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: ii[n].voltageMv - s.voltageMv })), aVR: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: -(s.voltageMv + ii[n].voltageMv) / 2 })), aVL: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: s.voltageMv - ii[n].voltageMv / 2 })), aVF: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: ii[n].voltageMv - s.voltageMv / 2 })) };
}
export function generateLeadSignals(preset: RhythmPreset, seed = 7, durationMs = 10000, sampleRateHz = 250): LeadSignals {
  const random = seeded(seed); const noise = Array.from({ length: durationMs * sampleRateHz / 1000 }, () => preset === 'afib' ? (random() - 0.5) * 0.08 : 0);
  const i = eventSamples(preset, morphology.I, noise, durationMs, sampleRateHz); const ii = eventSamples(preset, morphology.II, noise, durationMs, sampleRateHz); const derived = limbLeads(i, ii);
  const result: Partial<LeadSignals> = { I: i, II: ii, ...derived };
  for (const lead of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'] as Lead[]) result[lead] = eventSamples(preset, morphology[lead], noise, durationMs, sampleRateHz);
  return result as LeadSignals;
}
export function generateSignal(preset: RhythmPreset, lead: Lead, seed = 7): Signal {
  const all = generateLeadSignals(preset, seed); return { lead, samples: all[lead].map(sample => ({ ...sample })), sampleRateHz: 250, durationMs: 10000, provenance: 'synthetic', preset };
}
export function baseLeadSignal(preset: RhythmPreset, seed = 7, durationMs = 10000, sampleRateHz = 250): Sample[] { return generateLeadSignals(preset, seed, durationMs, sampleRateHz).II; }
export function deriveLeads(base: Sample[], lead: Lead): Sample[] { const scale: Record<Lead, number> = { I: 0.8, II: 1, III: 0.2, aVR: -0.9, aVL: 0.3, aVF: 0.7, V1: -0.45, V2: 0.05, V3: 0.45, V4: 0.75, V5: 0.9, V6: 0.85 }; return base.map(sample => ({ ...sample, voltageMv: sample.voltageMv * scale[lead] })); }

