import { clamp } from './world';

// A small, fully synthesized soundscape: no downloaded tracks or audio permissions.
export class FlightAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private tones: OscillatorNode[] = [];
  private noise: AudioBufferSourceNode | null = null;
  private enabled = false;
  private paused = false;
  private disposed = false;

  async enable(value: boolean) {
    if (this.disposed) return false;
    if (value && !this.context) {
      this.context = new AudioContext();
      const ctx = this.context;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0.055;
      this.engineGain.connect(this.master);
      for (const frequency of [55, 82.41, 110]) {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        oscillator.connect(this.engineGain);
        oscillator.start();
        this.tones.push(oscillator);
      }
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < channel.length; i++) {
        last = (last + Math.random() * 0.04 - 0.02) / 1.025;
        channel[i] = last * 3.5;
      }
      this.noise = ctx.createBufferSource();
      this.noise.buffer = buffer;
      this.noise.loop = true;
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 650;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.14;
      this.noise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.master);
      this.noise.start();
    }
    if (value && this.context?.state === 'suspended') await this.context.resume();
    if (this.disposed) return false;
    this.enabled = value;
    this.updateVolume();
    return value;
  }

  private updateVolume() {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled && !this.paused ? 0.6 : 0,
        this.context.currentTime,
        0.16,
      );
  }
  setPaused(value: boolean) {
    this.paused = value;
    this.updateVolume();
  }
  update(speed: number, altitude: number, warp: boolean, time: number) {
    const ctx = this.context;
    if (!ctx || !this.enabled || this.disposed) return;
    const energy = clamp(speed / 1300);
    this.windGain!.gain.setTargetAtTime(
      (1 - clamp(altitude / 5200)) * (0.08 + energy * 0.3) + (warp ? 0.11 : 0),
      ctx.currentTime,
      0.25,
    );
    this.windFilter!.frequency.setTargetAtTime(
      450 + energy * 1700 + (warp ? 1800 : 0),
      ctx.currentTime,
      0.25,
    );
    this.engineGain!.gain.setTargetAtTime(
      warp ? 0.065 : 0.035 + energy * 0.025,
      ctx.currentTime,
      0.25,
    );
    this.tones.forEach((tone, i) =>
      tone.frequency.setTargetAtTime(
        [55, 82.41, 110][i] * (1 + energy * 0.22) + Math.sin(time * 0.12 + i) * 0.8,
        ctx.currentTime,
        0.15,
      ),
    );
  }
  chime(index: number) {
    const ctx = this.context;
    if (!ctx || !this.enabled || this.paused || this.disposed) return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.frequency.value = [220, 293.66, 329.63, 440, 493.88, 587.33, 659.25][index % 7];
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    oscillator.connect(gain);
    gain.connect(this.master!);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 2);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  dispose() {
    this.disposed = true;
    this.tones.forEach((tone) => tone.stop());
    this.noise?.stop();
    void this.context?.close();
  }
}
