import { useEffect, useMemo, useRef, useState } from 'react';
import { EcgGridDefinitions } from './EcgGrid';
import { PREVIEW_CSS_PIXELS_PER_SVG_UNIT, SVG_UNITS_PER_MM, svgUnitsToTimeMs, timeMsToSvgUnits, traceViewHeightUnits, voltageMvToSvgUnits } from '../engine/calibration';
import { SimulationClock, type ClockSnapshot } from '../engine/clock';
import { generateLeadSamples, generateLeadWindow, allLeads } from '../engine/signal';
import type { Gain, Lead, LeadSignals, MachineConfig, PaperSpeed, Sample } from '../engine/types';

type LiveEcgMonitorProps = {
  config: MachineConfig;
  view: 'single' | 'multi';
  onViewChange: (view: 'single' | 'multi') => void;
  onPlaybackReset: () => void;
  maxAbsVoltageMv: number;
  markers: [number, number];
};

const leads = allLeads();
const initialClock: ClockSnapshot = { elapsedMs: 0, isPlaying: false, isSuspended: false };

function browserScheduler() {
  return {
    request: (callback: (timestampMs: number) => void) => window.requestAnimationFrame(callback),
    cancel: (handle: number) => window.cancelAnimationFrame(handle),
  };
}

function useViewportWidth(element: HTMLElement | null): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;
    const update = () => {
      const nextWidth = element.clientWidth;
      setWidth(current => current === nextWidth ? current : nextWidth);
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [element]);

  return width;
}

function pathForSamples(samples: Sample[], elapsedMs: number, speed: PaperSpeed, gain: Gain, widthUnits: number, heightUnits: number, preset: MachineConfig['preset']): string {
  const baseline = heightUnits / 2;
  const rrMs = preset === 'brady' ? 1200 : preset === 'tachy' ? 600 : 800;
  const rPeakIndex = Math.round(rrMs * 0.3 * 250 / 1000);
  const previewPixelsPerSample = speed * SVG_UNITS_PER_MM / 250 * PREVIEW_CSS_PIXELS_PER_SVG_UNIT;
  const decimation = Math.max(1, Math.ceil(1 / (previewPixelsPerSample * 2)));
  const displayPhase = ((rPeakIndex % decimation) + decimation) % decimation;
  const commands: string[] = [];
  let commandIndex = 0;
  samples.forEach((sample, index) => {
    const absoluteSampleIndex = Math.round(sample.timeMs * 250 / 1000);
    const phase = ((absoluteSampleIndex % decimation) + decimation) % decimation;
    if (phase !== displayPhase && index !== samples.length - 1) return;
    const x = widthUnits + timeMsToSvgUnits(sample.timeMs - elapsedMs, speed);
    const y = baseline - voltageMvToSvgUnits(sample.voltageMv, gain);
    commands.push(`${commandIndex++ === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  });
  return commands.join(' ');
}

function LiveTrace({ lead, samples, config, elapsedMs, widthUnits, heightUnits, showLabel, showMarkers, markers }: {
  lead: Lead;
  samples: Sample[];
  config: MachineConfig;
  elapsedMs: number;
  widthUnits: number;
  heightUnits: number;
  showLabel: boolean;
  showMarkers: boolean;
  markers: [number, number];
}) {
  const baseline = heightUnits / 2;
  const patternId = `live-${lead.replace(/[^a-z0-9]/gi, '-')}`;
  const currentPaperPositionUnits = timeMsToSvgUnits(elapsedMs, config.paperSpeed);
  const gridOffsetUnits = widthUnits - currentPaperPositionUnits;
  const markerX = showMarkers ? markers.map(timeMs => widthUnits + timeMsToSvgUnits(timeMs - elapsedMs, config.paperSpeed)) : [];
  const visibleStartMs = elapsedMs - svgUnitsToTimeMs(widthUnits, config.paperSpeed);
  const waveformLabel = `${lead} synthetic educational ECG waveform, moving paper sweep, ${config.paperSpeed} mm/s, ${config.gain} mm/mV, ECG grid ${config.showGrid ? 'visible' : 'hidden'}`;

  return <div className={`live-trace-row${showLabel ? ' has-lead-label' : ''}`} data-lead={lead} data-sample-count={samples.length}>
    {showLabel && <strong className="live-lead-label">{lead}</strong>}
    <svg
      className="live-trace-svg"
      width="100%"
      height={heightUnits * PREVIEW_CSS_PIXELS_PER_SVG_UNIT}
      viewBox={`0 0 ${widthUnits} ${heightUnits}`}
      role="img"
      aria-label={waveformLabel}
      data-simulation-time-ms={elapsedMs.toFixed(3)}
      data-paper-position-units={currentPaperPositionUnits.toFixed(3)}
      data-visible-start-ms={visibleStartMs.toFixed(3)}
      data-sample-count={samples.length}
    >
      <EcgGridDefinitions id={patternId} paperOffsetUnits={gridOffsetUnits} />
      {config.showGrid && <rect width={widthUnits} height={heightUnits} fill={`url(#major-${patternId})`} />}
      <line x1="0" x2={widthUnits} y1={baseline} y2={baseline} stroke="var(--trace-axis)" strokeDasharray="3 4" />
      <path className="live-waveform-path" d={pathForSamples(samples, elapsedMs, config.paperSpeed, config.gain, widthUnits, heightUnits, config.preset)} fill="none" stroke="var(--trace)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      {markerX.map((x, index) => x >= 0 && x <= widthUnits && <line key={index} className="measurement-marker" x1={x} x2={x} y1="0" y2={heightUnits} stroke="var(--marker)" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />)}
    </svg>
  </div>;
}

export function LiveEcgMonitor({ config, view, onViewChange, onPlaybackReset, maxAbsVoltageMv, markers }: LiveEcgMonitorProps) {
  const [clockSnapshot, setClockSnapshot] = useState(initialClock);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const clockRef = useRef<SimulationClock | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const viewportWidthPx = useViewportWidth(viewportElement);
  const widthUnits = Math.max(1, viewportWidthPx / PREVIEW_CSS_PIXELS_PER_SVG_UNIT);
  const heightUnits = traceViewHeightUnits(maxAbsVoltageMv, config.gain);
  const visibleDurationMs = svgUnitsToTimeMs(widthUnits, config.paperSpeed);
  const singleSamples = useMemo(
    () => generateLeadSamples(config.preset, config.lead, clockSnapshot.elapsedMs - visibleDurationMs, clockSnapshot.elapsedMs),
    [config.preset, config.lead, clockSnapshot.elapsedMs, visibleDurationMs],
  );
  const multiSamples = useMemo(
    () => view === 'multi' ? generateLeadWindow(config.preset, clockSnapshot.elapsedMs - visibleDurationMs, clockSnapshot.elapsedMs) : null,
    [view, config.preset, clockSnapshot.elapsedMs, visibleDurationMs],
  );

  useEffect(() => {
    const clock = new SimulationClock(browserScheduler());
    clockRef.current = clock;
    let lastRenderedElapsedMs = Number.NEGATIVE_INFINITY;
    const unsubscribe = clock.subscribe(snapshot => {
      const minimumIntervalMs = viewRef.current === 'multi' ? 1000 / 30 : 0;
      const shouldRender = !snapshot.isPlaying || snapshot.isSuspended || snapshot.elapsedMs === 0 || snapshot.elapsedMs - lastRenderedElapsedMs >= minimumIntervalMs;
      if (shouldRender) {
        lastRenderedElapsedMs = snapshot.elapsedMs;
        setClockSnapshot(snapshot);
      }
    });
    const motionPreference = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    const updateMotionPreference = () => {
      const prefersReduced = motionPreference?.matches ?? false;
      setReducedMotion(prefersReduced);
      if (prefersReduced) clock.pause();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') clock.suspend();
      else clock.resumeFromSuspension();
    };

    updateMotionPreference();
    if (!motionPreference?.matches) clock.play();
    motionPreference?.addEventListener('change', updateMotionPreference);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      motionPreference?.removeEventListener('change', updateMotionPreference);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe();
      clock.dispose();
      if (clockRef.current === clock) clockRef.current = null;
    };
  }, []);

  const reset = () => {
    clockRef.current?.reset();
    onPlaybackReset();
  };
  const heading = view === 'single' ? `${config.lead} rhythm strip` : '12-lead overview';
  const label = view === 'single'
    ? `ECG waveform viewport for ${config.lead}, ${config.paperSpeed} mm/s, ${config.gain} mm/mV`
    : `12-lead ECG waveform viewport, shared time, ${config.paperSpeed} mm/s, ${config.gain} mm/mV`;

  return <>
    <div className="monitor-head">
      <div>
        <span className="live">MOVING PAPER STRIP · SYNTHETIC</span>
        <h3>{heading}</h3>
      </div>
      <div className="monitor-actions">
        <div className="playback-controls" role="group" aria-label="ECG playback controls">
          <button type="button" onClick={() => clockRef.current?.play()} disabled={clockSnapshot.isPlaying}>Start / resume</button>
          <button type="button" onClick={() => clockRef.current?.pause()} disabled={!clockSnapshot.isPlaying}>Pause</button>
          <button type="button" onClick={reset}>Reset playback</button>
          <span className="playback-state" aria-live="off">{clockSnapshot.isPlaying ? 'Running' : reducedMotion ? 'Paused · reduced motion' : 'Paused'}</span>
        </div>
        <div className="view-toggle" role="group" aria-label="Waveform layout">
          <button type="button" aria-pressed={view === 'single'} className={view === 'single' ? 'active' : ''} onClick={() => onViewChange('single')}>Single lead</button>
          <button type="button" aria-pressed={view === 'multi'} className={view === 'multi' ? 'active' : ''} onClick={() => onViewChange('multi')}>12 leads</button>
        </div>
      </div>
    </div>

    <div
      ref={setViewportElement}
      className={view === 'single' ? 'trace-wrap live-viewport' : 'multi-trace live-viewport'}
      role="region"
      aria-label={label}
      tabIndex={0}
      data-playing={clockSnapshot.isPlaying}
      data-suspended={clockSnapshot.isSuspended}
      data-simulation-time-ms={clockSnapshot.elapsedMs.toFixed(3)}
      data-paper-position-units={timeMsToSvgUnits(clockSnapshot.elapsedMs, config.paperSpeed).toFixed(3)}
      data-speed-mm-s={config.paperSpeed}
      data-gain-mm-mv={config.gain}
    >
      {view === 'single'
        ? <LiveTrace lead={config.lead} samples={singleSamples} config={config} elapsedMs={clockSnapshot.elapsedMs} widthUnits={widthUnits} heightUnits={heightUnits} showLabel={false} showMarkers markers={markers} />
        : leads.map(lead => <LiveTrace key={lead} lead={lead} samples={multiSamples?.[lead] ?? []} config={config} elapsedMs={clockSnapshot.elapsedMs} widthUnits={widthUnits} heightUnits={heightUnits} showLabel showMarkers={false} markers={markers} />)}
      <div className="trace-meta"><span>{config.paperSpeed} mm/s · {config.gain} mm/mV</span><span>Shared recording clock · {view === 'single' ? config.lead : '12 leads aligned'}</span></div>
    </div>
  </>;
}

