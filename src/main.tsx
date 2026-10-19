import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { calibrationPulseHeightUnits, calibrationPulseWidthUnits, recordingViewWidthUnits, SVG_UNITS_PER_MM, timeMsToSvgUnits, traceViewHeightUnits, voltageMvToSvgUnits } from './engine/calibration';
import { createMeasurement, type MeasurementKind } from './engine/measurements';
import { allLeads, generateLeadSignals } from './engine/signal';
import type { Gain, Lead, LeadSignals, MachineConfig, PaperSpeed, RhythmPreset, Sample } from './engine/types';
import './styles.css';

const leads = allLeads();
const presets: [RhythmPreset, string][] = [['sinus', 'Normal sinus'], ['brady', 'Sinus bradycardia'], ['tachy', 'Sinus tachycardia'], ['afib', 'Atrial fibrillation · simplified']];
const measurementDefaults: Record<MeasurementKind, [number, number]> = { RR: [0, 800], PR: [120, 280], QRS: [280, 360], QT: [280, 580] };
const DISPLAY_CSS_PIXELS_PER_SVG_UNIT = 0.8;
const CALIBRATION_PULSE_DURATION_MS = 200;
const CALIBRATION_PULSE_MARGIN_MM = 4;

function GridDefinitions({ id }: { id: string }) {
  return <defs><pattern id={`minor-${id}`} width={SVG_UNITS_PER_MM} height={SVG_UNITS_PER_MM} patternUnits="userSpaceOnUse"><path d={`M ${SVG_UNITS_PER_MM} 0 L 0 0 0 ${SVG_UNITS_PER_MM}`} fill="none" stroke="var(--grid-minor)" strokeWidth="0.45" /></pattern><pattern id={`major-${id}`} width={SVG_UNITS_PER_MM * 5} height={SVG_UNITS_PER_MM * 5} patternUnits="userSpaceOnUse"><rect width={SVG_UNITS_PER_MM * 5} height={SVG_UNITS_PER_MM * 5} fill={`url(#minor-${id})`} /><path d={`M ${SVG_UNITS_PER_MM * 5} 0 L 0 0 0 ${SVG_UNITS_PER_MM * 5}`} fill="none" stroke="var(--grid-major)" strokeWidth="0.8" /></pattern></defs>;
}

function CalibrationPulse({ speed, gain }: { speed: PaperSpeed; gain: Gain }) {
  const marginUnits = CALIBRATION_PULSE_MARGIN_MM * SVG_UNITS_PER_MM;
  const pulseWidthUnits = calibrationPulseWidthUnits(speed, CALIBRATION_PULSE_DURATION_MS);
  const pulseHeightUnits = calibrationPulseHeightUnits(gain);
  const width = pulseWidthUnits + marginUnits * 3;
  const height = pulseHeightUnits + marginUnits * 2;
  const baseline = height - marginUnits;
  const pulseStart = marginUnits;
  const pulseEnd = pulseStart + pulseWidthUnits;
  const pulseTop = baseline - pulseHeightUnits;

  return <svg className="calibration-pulse" width={width * DISPLAY_CSS_PIXELS_PER_SVG_UNIT} height={height * DISPLAY_CSS_PIXELS_PER_SVG_UNIT} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`One millivolt, ${CALIBRATION_PULSE_DURATION_MS} millisecond calibration pulse at ${gain} millimetres per millivolt and ${speed} millimetres per second`}>
    <GridDefinitions id="calibration" />
    <rect width={width} height={height} fill="var(--surface-soft)" />
    <rect width={width} height={height} fill="url(#major-calibration)" />
    <path d={`M 0 ${baseline} H ${pulseStart} V ${pulseTop} H ${pulseEnd} V ${baseline} H ${width}`} fill="none" stroke="var(--primary)" strokeWidth="2" />
  </svg>;
}

function Trace({ samples, config, width, height, label, markers }: { samples: Sample[]; config: MachineConfig; width: number; height: number; label?: string; markers?: [number, number] }) {
  const baseline = height / 2;
  const patternId = label ? label.replace(/[^a-z0-9]/gi, '-') : 'single';
  const path = samples.filter((_, i) => i % 2 === 0).map((sample, i) => `${i ? 'L' : 'M'} ${timeMsToSvgUnits(sample.timeMs, config.paperSpeed).toFixed(2)} ${(baseline - voltageMvToSvgUnits(sample.voltageMv, config.gain)).toFixed(2)}`).join(' ');
  const markerX = markers?.map(timeMs => timeMsToSvgUnits(timeMs, config.paperSpeed));
  const svg = <svg width={width * DISPLAY_CSS_PIXELS_PER_SVG_UNIT} height={height * DISPLAY_CSS_PIXELS_PER_SVG_UNIT} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label ? `${label} ` : ''}synthetic ECG waveform`}>
    <GridDefinitions id={patternId} />
    {config.showGrid && <rect width={width} height={height} fill={`url(#major-${patternId})`} />}
    <line x1="0" x2={width} y1={baseline} y2={baseline} stroke="var(--trace-axis)" strokeDasharray="3 4" />
    <path d={path} fill="none" stroke="var(--trace)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
    {markerX?.map((x, i) => <line key={i} x1={x} x2={x} y1="0" y2={height} stroke="var(--marker)" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />)}
  </svg>;
  return <div className={label ? 'mini-trace' : 'trace-wrap'}>{label ? svg : <div className="trace-scroll" role="region" aria-label="ECG waveform viewport" tabIndex={0}>{svg}</div>}{label && <strong className="mini-label">{label}</strong>}{!label && <div className="trace-meta"><span>{config.lead} · {config.paperSpeed} mm/s · {config.gain} mm/mV</span><span>10 s synthetic strip</span></div>}</div>;
}

function MultiLead({ signals, config, width, height }: { signals: LeadSignals; config: MachineConfig; width: number; height: number }) {
  return <div className="multi-trace" role="region" aria-label="12-lead ECG waveform viewport" tabIndex={0}>{leads.map(lead => <Trace key={lead} label={lead} samples={signals[lead]} config={config} width={width} height={height} />)}</div>;
}

function readThemePreference(): 'light' | 'dark' {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('ecg-lab-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readThemePreference);
  const [config, setConfig] = useState<MachineConfig>({ lead: 'V3', paperSpeed: 25, gain: 20, showGrid: true, preset: 'sinus' });
  const [view, setView] = useState<'single' | 'multi'>('single');
  const [kind, setKind] = useState<MeasurementKind>('RR');
  const [[startMs, endMs], setPoints] = useState<[number, number]>(measurementDefaults.RR);
  const patch = (next: Partial<MachineConfig>) => setConfig(current => ({ ...current, ...next }));
  const signals = useMemo(() => generateLeadSignals(config.preset), [config.preset]);
  const maxAbsVoltageMv = useMemo(() => Math.max(...Object.values(signals).flatMap(leadSamples => leadSamples.map(sample => Math.abs(sample.voltageMv))), 0), [signals]);
  const plotWidth = recordingViewWidthUnits(10000, config.paperSpeed);
  const plotHeight = traceViewHeightUnits(maxAbsVoltageMv, config.gain);
  const measurement = createMeasurement(kind, startMs, endMs);
  const setKindAndDefaults = (next: MeasurementKind) => { setKind(next); setPoints(measurementDefaults[next]); };
  const rate = config.preset === 'brady' ? 50 : config.preset === 'tachy' ? 100 : 75;
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('ecg-lab-theme', theme);
    } catch {
      // Theme switching remains available when storage is disabled.
    }
  }, [theme]);
  return (
    <main>
      <header className="topbar">
        <div><p className="eyebrow">KYP / FUTURE MODULE</p><h1>ECG <em>Lab</em></h1></div>
        <div className="header-tools">
          <div className="status"><span className="dot" />SIMULATION ONLY <small>synthetic signal</small></div>
          <button className="theme-toggle" type="button" aria-label="Toggle theme" aria-pressed={theme === 'dark'} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}>
            <span aria-hidden="true">◐</span>{theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">CALIBRATED EXPLORATION</p>
          <h2>Read the trace,<br /><span>understand the heart.</span></h2>
          <p className="lede">A controlled environment for learning ECG fundamentals. One shared timeline drives every lead and every measurement.</p>
        </div>
        <div className="calibration-card">
          <span>CALIBRATION PULSE</span>
          <strong>1 mV</strong>
          <CalibrationPulse speed={config.paperSpeed} gain={config.gain} />
          <small>{config.gain} mm/mV · {CALIBRATION_PULSE_DURATION_MS} ms</small>
        </div>
      </section>

      <section className="lab-grid">
        <aside className="controls">
          <div className="section-label">01 / SIGNAL</div>
          <label>Rhythm preset
            <select value={config.preset} onChange={event => patch({ preset: event.target.value as RhythmPreset })}>
              {presets.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <fieldset className="lead-field">
            <legend>Displayed lead</legend>
            <div className="lead-grid">
              {leads.map(lead => (
                <button aria-pressed={config.lead === lead} className={config.lead === lead ? 'active' : ''} onClick={() => patch({ lead })} key={lead}>
                  {lead}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="section-label spacing">02 / MACHINE</div>
          <label>Paper speed
            <select value={config.paperSpeed} onChange={event => patch({ paperSpeed: Number(event.target.value) as PaperSpeed })}>
              <option value="12.5">12.5 mm/s</option><option value="25">25 mm/s</option><option value="50">50 mm/s</option>
            </select>
          </label>
          <label>Gain
            <select value={config.gain} onChange={event => patch({ gain: Number(event.target.value) as Gain })}>
              <option value="5">5 mm/mV</option><option value="10">10 mm/mV</option><option value="20">20 mm/mV</option>
            </select>
          </label>
          <button className="toggle" aria-pressed={config.showGrid} onClick={() => patch({ showGrid: !config.showGrid })}>
            <span className={config.showGrid ? 'switch on' : 'switch'} />ECG paper grid <small>{config.showGrid ? 'ON' : 'OFF'}</small>
          </button>
        </aside>

        <section className="monitor">
          <div className="monitor-head">
            <div>
              <span className="live">● LIVE PREVIEW</span>
              <h3>{view === 'single' ? `${config.lead} rhythm strip` : '12-lead overview'}</h3>
            </div>
            <div className="view-toggle">
              <button aria-pressed={view === 'single'} className={view === 'single' ? 'active' : ''} onClick={() => setView('single')}>Single lead</button>
              <button aria-pressed={view === 'multi'} className={view === 'multi' ? 'active' : ''} onClick={() => setView('multi')}>12 leads</button>
            </div>
          </div>

          {view === 'single'
            ? <Trace samples={signals[config.lead]} config={config} width={plotWidth} height={plotHeight} markers={[startMs, endMs]} />
            : <MultiLead signals={signals} config={config} width={plotWidth} height={plotHeight} />}

          <div className="measure-panel">
            <div className="section-label">03 / MANUAL CALIPERS</div>
            <div className="measure-controls">
              <label>Measurement
                <select value={kind} onChange={event => setKindAndDefaults(event.target.value as MeasurementKind)}>
                  <option value="RR">R–R interval</option><option value="PR">PR interval</option><option value="QRS">QRS duration</option><option value="QT">QT interval</option>
                </select>
              </label>
              <label>Start point (ms)
                <input type="number" min="0" max="10000" step="4" value={startMs} onChange={event => setPoints([Number(event.target.value), endMs])} />
              </label>
              <label>End point (ms)
                <input type="number" min="0" max="10000" step="4" value={endMs} onChange={event => setPoints([startMs, Number(event.target.value)])} />
              </label>
              <button className="reset" onClick={() => setPoints(measurementDefaults[kind])}>Reset points</button>
            </div>
            <div className="measurement-result" role="status" aria-live="polite">
              <strong>{measurement.durationMs.toFixed(0)} <small>ms</small></strong>
              {measurement.heartRateBpm && <strong>{measurement.heartRateBpm.toFixed(0)} <small>bpm</small></strong>}
              <span>Manual points are shown on the trace. Values use the shared timebase and remain unchanged when gain changes.</span>
            </div>
          </div>

          <div className="measure-row">
            <div><span>RATE</span><strong>{rate} <small>bpm</small></strong></div>
            <div><span>CALIBRATION</span><strong>1 mV <small>/ {config.gain} mm</small></strong></div>
            <div className="hint">Synthetic educational signal.<br />Not for clinical diagnosis or patient care.</div>
          </div>
        </section>
      </section>

      <footer><span>ECG LAB v0.2 · 12-LEAD CHECKPOINT</span><span>Educational simulation only.</span></footer>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
