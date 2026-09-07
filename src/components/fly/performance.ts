import type { DetailTier } from './terrain-stream';

export type QualityMode = 'auto' | 'high' | 'balanced';

export class FlightPerformance {
  private samples = new Float32Array(240);
  private cursor = 0;
  private count = 0;
  private elapsed = 0;
  private cooldown = 8;
  private sampleTime = 0;
  private tier: DetailTier = 0;
  mode: QualityMode = 'auto';
  fps = 0;
  p95 = 0;

  setMode(mode: QualityMode) {
    this.mode = mode;
    this.tier = mode === 'balanced' ? 1 : 0;
    this.reset();
    return this.tier;
  }

  get detail() {
    return this.tier;
  }

  get resolutionScale() {
    return [1, 0.82, 0.66][this.tier];
  }

  /** Resume measuring after a pause without undoing the session's stable quality. */
  reset() {
    this.count = 0;
    this.cursor = 0;
    this.elapsed = 0;
    this.sampleTime = 0;
    this.cooldown = 8;
    this.fps = 0;
    this.p95 = 0;
  }

  record(milliseconds: number): boolean {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return false;
    // The engine resets measurement on visibility/pause changes. Cap isolated
    // foreground stalls, but keep repeated stalls as evidence to reduce load.
    const sample = Math.min(milliseconds, 250);
    const dt = sample / 1000;
    this.elapsed += dt;
    this.cooldown -= dt;
    this.sampleTime += dt;
    if (this.elapsed < 2) return false;
    this.samples[this.cursor] = sample;
    this.cursor = (this.cursor + 1) % this.samples.length;
    this.count = Math.min(this.count + 1, this.samples.length);
    if (this.sampleTime < 1 || this.count < 30) return false;
    this.sampleTime = 0;
    const sorted = Array.from(this.samples.subarray(0, this.count)).sort((a, b) => a - b);
    this.fps = 1000 / (sorted.reduce((sum, value) => sum + value, 0) / sorted.length);
    this.p95 = sorted[Math.floor((sorted.length - 1) * 0.95)];
    if (this.mode !== 'auto' || this.cooldown > 0) return false;
    // A display-capped 60 fps cannot establish headroom for higher quality.
    // Keep successful reductions for this session rather than repeatedly
    // promoting, slowing down, and reducing resolution again. Selecting a
    // graphics mode explicitly starts a fresh quality assessment.
    if (this.p95 > 24 && this.tier < 2) {
      this.tier = (this.tier + 1) as DetailTier;
      this.cooldown = 12;
      this.count = 0;
      this.cursor = 0;
      return true;
    }
    return false;
  }
}
