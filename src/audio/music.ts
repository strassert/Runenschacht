import type { AudioEngine } from './AudioEngine';

export type MusicMode = 'menu' | 'run' | 'boss';

const LOOKAHEAD = 0.1;
const TICK_MS = 25;
// Am – F – C – G (Grundtöne in Hz, Oktave 2/3)
const ROOTS = [110, 87.31, 130.81, 98];
const BOSS_RIFF = [110, 130.81, 146.83, 155.56]; // A C D Eb
const SEMITONE_FIFTH = 1.4983;

/** Prozedurale Hintergrundmusik mit Lookahead-Scheduler. */
export class MusicPlayer {
  private mode: MusicMode | null = null;
  private pending: MusicMode | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private out: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  constructor(private readonly engine: AudioEngine) {}

  /** Gewünschten Modus setzen (null = Stille). Startet, sobald der AudioContext existiert. */
  setMode(mode: MusicMode | null): void {
    if (mode === null) {
      this.stop();
      return;
    }
    if (this.mode === mode || this.pending === mode) return;
    if (this.mode === null) this.pending = mode;
    else this.pending = mode; // Wechsel erst an der nächsten Taktgrenze
  }

  /** Pro Frame aufrufen (startet verzögert nach dem Unlock). */
  update(): void {
    if (this.timer === 0 && this.pending && this.engine.context && this.engine.musicBus) this.begin();
  }

  private begin(): void {
    const ctx = this.engine.context!;
    this.out = ctx.createGain();
    this.out.gain.value = 1;
    this.out.connect(this.engine.musicBus!);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.nextTime = ctx.currentTime + 0.05;
    this.step = 0;
    this.mode = this.pending;
    this.pending = null;
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  stop(): void {
    this.pending = null;
    const ctx = this.engine.context;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    if (ctx && this.out) {
      const out = this.out;
      out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
      out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      window.setTimeout(() => out.disconnect(), 600);
    }
    this.out = null;
    this.mode = null;
  }

  private schedule(): void {
    const ctx = this.engine.context;
    if (!ctx || !this.out) return;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      if (this.step % 16 === 0 && this.pending) {
        this.mode = this.pending;
        this.pending = null;
      }
      this.playStep(ctx, this.nextTime, this.step);
      const bpm = this.mode === 'boss' ? 124 : 112;
      this.nextTime += 60 / bpm / 4;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(ctx: AudioContext, t: number, step: number): void {
    const mode = this.mode;
    if (!mode || !this.out) return;
    const bar = Math.floor(step / 16) % 4;
    const pos = step % 16;
    const beat16 = 60 / (mode === 'boss' ? 124 : 112) / 4;

    if (pos === 0) {
      const root = mode === 'boss' ? BOSS_RIFF[bar] : ROOTS[bar];
      this.pad(ctx, t, root * 2, beat16 * 16);
      this.pad(ctx, t, root * 2 * SEMITONE_FIFTH, beat16 * 16);
    }
    if (mode === 'menu') {
      if (pos % 4 === 2) this.shaker(ctx, t, 0.03);
      return;
    }
    // run + boss
    const kickEvery = mode === 'boss' ? 4 : 4;
    if (pos % kickEvery === 0) this.kick(ctx, t);
    if (pos % 2 === 0) {
      const root = mode === 'boss' ? BOSS_RIFF[(bar + (pos >= 8 ? 1 : 0)) % 4] : ROOTS[bar];
      this.bass(ctx, t, root, beat16 * 1.6);
    }
    if (pos % 4 === 2) this.shaker(ctx, t, 0.04);
    if (bar === 3 && pos >= 12 && mode === 'run') this.tom(ctx, t, 180 - (pos - 12) * 20);
  }

  private pad(ctx: AudioContext, t: number, freq: number, dur: number): void {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.15);
    g.gain.setValueAtTime(0.06, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(this.out!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private kick(ctx: AudioContext, t: number): void {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g);
    g.connect(this.out!);
    o.start(t);
    o.stop(t + 0.2);
  }

  private bass(ctx: AudioContext, t: number, freq: number, dur: number): void {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(this.out!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private shaker(ctx: AudioContext, t: number, peak: number): void {
    if (!this.noise) return;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f);
    f.connect(g);
    g.connect(this.out!);
    s.start(t);
    s.stop(t + 0.08);
  }

  private tom(ctx: AudioContext, t: number, freq: number): void {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(this.out!);
    o.start(t);
    o.stop(t + 0.22);
  }
}
