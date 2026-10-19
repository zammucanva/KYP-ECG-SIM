export type AnimationFrame = (timestampMs: number) => void;

export type AnimationFrameScheduler = {
  request: (callback: AnimationFrame) => number;
  cancel: (handle: number) => void;
};

export type ClockSnapshot = {
  elapsedMs: number;
  isPlaying: boolean;
  isSuspended: boolean;
};

/** Long visible-tab stalls are discarded instead of causing a giant paper jump. */
export const MAX_FRAME_DELTA_MS = 100;

export class SimulationClock {
  private elapsedMs = 0;
  private isPlaying = false;
  private isSuspended = false;
  private disposed = false;
  private lastTimestampMs: number | null = null;
  private frameHandle: number | null = null;
  private listeners = new Set<(snapshot: ClockSnapshot) => void>();

  constructor(private readonly scheduler: AnimationFrameScheduler) {}

  getSnapshot(): ClockSnapshot {
    return { elapsedMs: this.elapsedMs, isPlaying: this.isPlaying, isSuspended: this.isSuspended };
  }

  subscribe(listener: (snapshot: ClockSnapshot) => void): () => void {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  play(): void {
    if (this.disposed || this.isPlaying) return;
    this.isPlaying = true;
    this.isSuspended = false;
    this.lastTimestampMs = null;
    this.emit();
    this.schedule();
  }

  pause(): void {
    if (this.disposed || !this.isPlaying) return;
    this.isPlaying = false;
    this.isSuspended = false;
    this.lastTimestampMs = null;
    this.cancelScheduledFrame();
    this.emit();
  }

  reset(): void {
    if (this.disposed) return;
    this.elapsedMs = 0;
    this.lastTimestampMs = null;
    this.emit();
    this.schedule();
  }

  suspend(): void {
    if (this.disposed || !this.isPlaying || this.isSuspended) return;
    this.isSuspended = true;
    this.lastTimestampMs = null;
    this.cancelScheduledFrame();
    this.emit();
  }

  resumeFromSuspension(): void {
    if (this.disposed || !this.isPlaying || !this.isSuspended) return;
    this.isSuspended = false;
    this.lastTimestampMs = null;
    this.emit();
    this.schedule();
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancelScheduledFrame();
    this.disposed = true;
    this.isPlaying = false;
    this.isSuspended = false;
    this.lastTimestampMs = null;
    this.listeners.clear();
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }

  private schedule(): void {
    if (this.disposed || !this.isPlaying || this.isSuspended || this.frameHandle !== null) return;
    this.frameHandle = this.scheduler.request(timestampMs => this.onFrame(timestampMs));
  }

  private onFrame(timestampMs: number): void {
    this.frameHandle = null;
    if (this.disposed || !this.isPlaying || this.isSuspended) return;

    if (this.lastTimestampMs !== null) {
      const deltaMs = timestampMs - this.lastTimestampMs;
      if (Number.isFinite(deltaMs) && deltaMs >= 0 && deltaMs <= MAX_FRAME_DELTA_MS) {
        this.elapsedMs += deltaMs;
      }
    }
    this.lastTimestampMs = timestampMs;
    this.emit();
    this.schedule();
  }

  private cancelScheduledFrame(): void {
    if (this.frameHandle === null) return;
    this.scheduler.cancel(this.frameHandle);
    this.frameHandle = null;
  }
}

