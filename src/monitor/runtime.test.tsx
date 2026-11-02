import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MonitorAudio, type AudioContextLike, type GainLike, type OscillatorLike } from '../audio/monitor-audio';
import type { AnimationFrame, AnimationFrameScheduler } from '../engine/clock';
import { evaluateAlarmConditions } from './alarms';
import { getMonitorScenario, type MonitorScenario } from './scenario';
import { useMonitorRuntime } from './useMonitorRuntime';
import { readingsAt } from './vitals';

/**
 * Integration of the real runtime hook: one manual frame scheduler stands in for
 * requestAnimationFrame and one fake AudioContext advances with it, so the whole scenario can be
 * played and every tone compared with the simulation's own event times.
 */
const scenario = getMonitorScenario('scenario.monitored-fast-heartbeat.01')!;

function harness(target: MonitorScenario = scenario) {
  let pending: AnimationFrame | null = null;
  let frameTimeMs = 1_000;
  const scheduler: AnimationFrameScheduler = {
    request: callback => { pending = callback; return 1; },
    cancel: () => { pending = null; },
  };
  const tones: { at: number; frequency: number }[] = [];
  const param = () => ({ value: 0, setValueAtTime: vi.fn(function (this: { value: number }, value: number) { this.value = value; }), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  const context = {
    currentTime: 50,
    state: 'suspended',
    destination: {},
    resume: async () => { context.state = 'running'; },
    close: vi.fn(async () => { context.state = 'closed'; }),
    createGain: (): GainLike => ({ gain: param(), connect: vi.fn(), disconnect: vi.fn() }),
    createOscillator: (): OscillatorLike => {
      const oscillator: OscillatorLike = {
        type: 'sine', frequency: param(), connect: vi.fn(), disconnect: vi.fn(), onended: null, stop: vi.fn(),
        start: (at: number) => { tones.push({ at, frequency: (oscillator.frequency as unknown as { value: number }).value }); },
      };
      return oscillator;
    },
  };
  const audio = new MonitorAudio(() => context as unknown as AudioContextLike);
  const options = { scheduler, audio };
  const view = renderHook(() => useMonitorRuntime(target, options));
  return {
    view,
    tones,
    context,
    /** Runs animation frames of `stepMs` for `durationMs`; the audio clock advances with them. */
    run(durationMs: number, stepMs = 16) {
      for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) {
        act(() => {
          frameTimeMs += stepMs;
          context.currentTime += stepMs / 1000;
          const callback = pending;
          pending = null;
          callback?.(frameTimeMs);
        });
      }
    },
  };
}

describe('monitor runtime on one shared clock', () => {
  it('plays exactly one tone per ECG beat for the whole scenario, on one fixed time mapping', async () => {
    const run = harness();
    await act(async () => { await run.view.result.current.audio.enable(); });
    act(() => run.view.result.current.play());
    run.run(scenario.durationMs + 1_000);
    const { timeline, snapshot } = run.view.result.current;

    expect(snapshot.isPlaying).toBe(false);
    expect(snapshot.elapsedMs).toBe(scenario.durationMs);
    const beatsHeard = timeline.qrsTimesMs.filter(time => time > 16 && time <= scenario.durationMs);
    const beatTones = run.tones.filter(tone => tone.frequency === 880);
    expect(beatTones.length).toBe(beatsHeard.length);
    const offsets = beatTones.map((tone, index) => tone.at - beatsHeard[index] / 1000);
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThan(1e-6);
  });

  it('raises the alarm at the first frame whose readings breach the limit, and renders the same state', () => {
    const run = harness();
    act(() => run.view.result.current.play());
    run.run(50_000);
    const { alarms, timeline, snapshot } = run.view.result.current;
    const onset = alarms.log.find(entry => entry.id === 'hr-high' && entry.event === 'onset')!;
    expect(evaluateAlarmConditions(readingsAt(timeline, onset.atMs), scenario.alarmLimits).map(item => item.id)).toContain('hr-high');
    expect(evaluateAlarmConditions(readingsAt(timeline, onset.atMs - 16), scenario.alarmLimits).map(item => item.id)).not.toContain('hr-high');
    expect(alarms.active.map(alarm => alarm.id)).toEqual(evaluateAlarmConditions(readingsAt(timeline, snapshot.elapsedMs), scenario.alarmLimits).map(item => item.id));
  });

  it('switching the tone source to the pulse oximeter uses pleth pulse times, not ECG beats', async () => {
    const run = harness();
    await act(async () => { await run.view.result.current.audio.enable(); });
    act(() => run.view.result.current.audio.setToneSource('pleth'));
    act(() => run.view.result.current.play());
    run.run(10_000);
    const { timeline } = run.view.result.current;
    const pulses = timeline.plethPulseTimesMs.filter(time => time > 16 && time <= 10_000 + 150);
    const heard = run.tones.map(tone => tone.at);
    expect(heard.length).toBe(pulses.length);
    const offsets = heard.map((at, index) => at - pulses[index] / 1000);
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThan(1e-6);
  });

  it('reset returns time, alarms and audio scheduling to the start; unmount closes audio', async () => {
    const run = harness();
    await act(async () => { await run.view.result.current.audio.enable(); });
    act(() => run.view.result.current.play());
    run.run(50_000);
    expect(run.view.result.current.alarms.active.length).toBeGreaterThan(0);
    act(() => run.view.result.current.reset());
    expect(run.view.result.current.snapshot.elapsedMs).toBe(0);
    expect(run.view.result.current.snapshot.isPlaying).toBe(false);
    expect(run.view.result.current.alarms).toEqual({ active: [], silencedUntilMs: null, log: [] });
    const before = run.tones.length;
    run.run(2_000);
    expect(run.tones.length).toBe(before);
    run.view.unmount();
    await vi.waitFor(() => expect(run.context.close).toHaveBeenCalledTimes(1));
  });

  it('applies a bedside action mid-run without restarting the clock or breaking the tone mapping', async () => {
    const decision = getMonitorScenario('scenario.pulse-oximeter-signal.01')!;
    const run = harness(decision);
    await act(async () => { await run.view.result.current.audio.enable(); });
    act(() => run.view.result.current.play());
    run.run(40_000);
    expect(run.view.result.current.alarms.active.map(alarm => alarm.id)).toEqual(['spo2-poor-signal']);
    const before = run.view.result.current.snapshot.elapsedMs;
    let accepted = false;
    act(() => { accepted = run.view.result.current.takeAction('reposition-sensor'); });
    expect(accepted).toBe(true);
    act(() => { accepted = run.view.result.current.takeAction('reposition-sensor'); });
    expect(accepted).toBe(false);
    run.run(10_000);
    const { snapshot, alarms, taken, timeline } = run.view.result.current;
    expect(snapshot.isPlaying).toBe(true);
    expect(snapshot.elapsedMs).toBeGreaterThan(before + 9_000);
    expect(taken).toEqual([{ actionId: 'reposition-sensor', atMs: before }]);
    expect(alarms.active).toEqual([]);
    expect(alarms.log.filter(entry => entry.id === 'spo2-poor-signal').map(entry => entry.event)).toEqual(['onset', 'cleared']);
    const beats = timeline.qrsTimesMs.filter(time => time > 16 && time <= snapshot.elapsedMs + 150);
    const beatTones = run.tones.filter(tone => tone.frequency === 880);
    // The other tones are the low-priority alarm burst for the poor signal.
    expect(run.tones.length - beatTones.length).toBeGreaterThan(0);
    const offsets = beatTones.map((tone, index) => tone.at - beats[index] / 1000);
    expect(beatTones.length).toBe(beats.length);
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThan(1e-6);
    act(() => run.view.result.current.reset());
    expect(run.view.result.current.taken).toEqual([]);
  });
});
