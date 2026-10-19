import { describe, expect, it } from 'vitest';
import { MAX_FRAME_DELTA_MS, SimulationClock, type AnimationFrame, type AnimationFrameScheduler } from './clock';

function manualScheduler() {
  let nextHandle = 0;
  const callbacks = new Map<number, AnimationFrame>();
  const cancelled: number[] = [];
  const scheduler: AnimationFrameScheduler = {
    request: callback => {
      const handle = ++nextHandle;
      callbacks.set(handle, callback);
      return handle;
    },
    cancel: handle => {
      cancelled.push(handle);
      callbacks.delete(handle);
    },
  };
  return {
    scheduler,
    callbacks,
    cancelled,
    frame(timestampMs: number) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach(callback => callback(timestampMs));
    },
  };
}

describe('SimulationClock', () => {
  it('advances by monotonic elapsed time rather than counting frames', () => {
    const manual = manualScheduler();
    const clock = new SimulationClock(manual.scheduler);
    clock.play();
    manual.frame(100);
    manual.frame(116.5);
    manual.frame(149);
    expect(clock.getSnapshot().elapsedMs).toBeCloseTo(49, 8);
    clock.dispose();
  });

  it('keeps a single scheduled loop when start is requested repeatedly', () => {
    const manual = manualScheduler();
    const clock = new SimulationClock(manual.scheduler);
    clock.play();
    clock.play();
    clock.play();
    expect(manual.callbacks.size).toBe(1);
    manual.frame(0);
    expect(manual.callbacks.size).toBe(1);
    clock.dispose();
    expect(manual.callbacks.size).toBe(0);
  });

  it('freezes on pause and resumes continuously without catch-up', () => {
    const manual = manualScheduler();
    const clock = new SimulationClock(manual.scheduler);
    clock.play();
    manual.frame(0);
    manual.frame(40);
    clock.pause();
    expect(clock.getSnapshot().elapsedMs).toBe(40);
    expect(manual.callbacks.size).toBe(0);
    clock.play();
    manual.frame(5000);
    expect(clock.getSnapshot().elapsedMs).toBe(40);
    manual.frame(5024);
    expect(clock.getSnapshot().elapsedMs).toBe(64);
    clock.dispose();
  });

  it('resets to deterministic time zero without changing the paused/playing state', () => {
    const manual = manualScheduler();
    const clock = new SimulationClock(manual.scheduler);
    clock.play();
    manual.frame(0);
    manual.frame(40);
    clock.reset();
    expect(clock.getSnapshot()).toMatchObject({ elapsedMs: 0, isPlaying: true });
    manual.frame(56);
    expect(clock.getSnapshot().elapsedMs).toBe(0);
    manual.frame(72);
    expect(clock.getSnapshot().elapsedMs).toBe(16);
    clock.pause();
    clock.reset();
    expect(clock.getSnapshot()).toMatchObject({ elapsedMs: 0, isPlaying: false });
    clock.dispose();
  });

  it('suspends while hidden and resumes without adding hidden time', () => {
    const manual = manualScheduler();
    const clock = new SimulationClock(manual.scheduler);
    clock.play();
    manual.frame(0);
    manual.frame(32);
    clock.suspend();
    expect(clock.getSnapshot()).toMatchObject({ elapsedMs: 32, isPlaying: true, isSuspended: true });
    expect(manual.callbacks.size).toBe(0);
    clock.resumeFromSuspension();
    manual.frame(50000);
    expect(clock.getSnapshot().elapsedMs).toBe(32);
    manual.frame(50016);
    expect(clock.getSnapshot().elapsedMs).toBe(48);
    clock.dispose();
  });

  it('discards excessive frame gaps and cancels work on disposal', () => {
    const manual = manualScheduler();
    const clock = new SimulationClock(manual.scheduler);
    clock.play();
    manual.frame(0);
    manual.frame(MAX_FRAME_DELTA_MS + 1);
    expect(clock.getSnapshot().elapsedMs).toBe(0);
    manual.frame(MAX_FRAME_DELTA_MS + 17);
    expect(clock.getSnapshot().elapsedMs).toBe(16);
    clock.dispose();
    expect(manual.callbacks.size).toBe(0);
    expect(manual.cancelled.length).toBeGreaterThan(0);
    clock.play();
    expect(manual.callbacks.size).toBe(0);
  });
});

