import type { Lead, RhythmPreset, Sample, Signal } from './types';

const LEADS: Lead[] = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
export const allLeads = () => [...LEADS];
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

export function baseLeadSignal(preset: RhythmPreset, seed = 7, durationMs = 10000, sampleRateHz = 250): Sample[] {
  const rand = seeded(seed); const samples: Sample[] = []; const rr = preset === 'brady' ? 1200 : preset === 'tachy' ? 600 : 800;
  for (let i = 0; i < durationMs * sampleRateHz / 1000; i++) {
    const timeMs = i * 1000 / sampleRateHz; const phase = (timeMs % rr) / rr;
    const p = 0.12 * Math.exp(-((phase - 0.18) ** 2) / 0.0018);
    const q = -0.12 * Math.exp(-((phase - 0.285) ** 2) / 0.00018);
    const r = 1.0 * Math.exp(-((phase - 0.30) ** 2) / 0.00012);
    const s = -0.22 * Math.exp(-((phase - 0.325) ** 2) / 0.0002);
    const t = 0.30 * Math.exp(-((phase - 0.55) ** 2) / 0.012);
    const afNoise = preset === 'afib' ? (rand() - 0.5) * 0.08 : 0;
    samples.push({ timeMs, voltageMv: p + q + r + s + t + afNoise });
  }
  return samples;
}

export function deriveLeads(base: Sample[], lead: Lead): Sample[] {
  const scale: Record<Lead, number> = { I: 0.8, II: 1, III: 0.2, aVR: -0.9, aVL: 0.3, aVF: 0.7, V1: -0.45, V2: 0.05, V3: 0.45, V4: 0.75, V5: 0.9, V6: 0.85 };
  return base.map((sample) => ({ ...sample, voltageMv: sample.voltageMv * scale[lead] }));
}

export function generateSignal(preset: RhythmPreset, lead: Lead, seed = 7): Signal {
  const base = baseLeadSignal(preset, seed); return { lead, samples: deriveLeads(base, lead), sampleRateHz: 250, durationMs: 10000, provenance: 'synthetic', preset };
}

export function limbLeads(i: Sample[], ii: Sample[]) {
  return { III: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: ii[n].voltageMv - s.voltageMv })), aVR: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: -(s.voltageMv + ii[n].voltageMv) / 2 })), aVL: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: s.voltageMv - ii[n].voltageMv / 2 })), aVF: i.map((s, n) => ({ timeMs: s.timeMs, voltageMv: ii[n].voltageMv - s.voltageMv / 2 })) };
}

