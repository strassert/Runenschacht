import type { SfxName } from './AudioEngine';

type SfxFn = (ctx: AudioContext, out: AudioNode, pitch: number, volume: number) => number;

let noiseCache: AudioBuffer | null = null;
let noiseCtx: AudioContext | null = null;

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseCache && noiseCtx === ctx) return noiseCache;
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[i] = (seed / 4294967296) * 2 - 1;
  }
  noiseCache = buf;
  noiseCtx = ctx;
  return buf;
}

/** Hüllkurve: Attack, Halten, Release (alles in Sekunden ab t0). */
function env(gain: GainNode, t0: number, attack: number, hold: number, release: number, peak: number): void {
  const g = gain.gain;
  g.setValueAtTime(0.0001, t0);
  g.linearRampToValueAtTime(peak, t0 + attack);
  g.setValueAtTime(peak, t0 + attack + hold);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
}

function tone(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  f0: number,
  f1: number,
  t0: number,
  dur: number,
  peak: number,
  filter?: { type: BiquadFilterType; freq: number; q?: number },
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  const g = ctx.createGain();
  env(g, t0, Math.min(0.005, dur / 4), Math.max(0, dur * 0.2), dur * 0.8, peak);
  let node: AudioNode = osc;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = filter.type;
    f.frequency.value = filter.freq;
    f.Q.value = filter.q ?? 1;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(
  ctx: AudioContext,
  out: AudioNode,
  t0: number,
  dur: number,
  peak: number,
  filter: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number },
): void {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filter.type;
  f.frequency.setValueAtTime(filter.freq, t0);
  if (filter.freqEnd) f.frequency.exponentialRampToValueAtTime(filter.freqEnd, t0 + dur);
  f.Q.value = filter.q ?? 1;
  const g = ctx.createGain();
  env(g, t0, 0.003, dur * 0.15, dur * 0.85, peak);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

export const SFX: Record<SfxName, SfxFn> = {
  shoot(ctx, out, pitch, v) {
    noise(ctx, out, ctx.currentTime, 0.04, 0.18 * v, { type: 'bandpass', freq: 2500 * pitch, q: 1.2 });
    return 0.05;
  },
  pickup(ctx, out, pitch, v) {
    tone(ctx, out, 'sine', 660 * pitch, 990 * pitch, ctx.currentTime, 0.08, 0.25 * v);
    return 0.1;
  },
  gateGood(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(ctx, out, 'triangle', f * pitch, f * pitch, t + i * 0.06, 0.08, 0.22 * v),
    );
    return 0.34;
  },
  gateBad(ctx, out, pitch, v) {
    tone(ctx, out, 'sawtooth', 300 * pitch, 120 * pitch, ctx.currentTime, 0.3, 0.22 * v, {
      type: 'lowpass',
      freq: 1200,
    });
    return 0.32;
  },
  cardHit(ctx, out, pitch, v) {
    tone(ctx, out, 'square', 1800 * pitch, 1800 * pitch, ctx.currentTime, 0.025, 0.08 * v);
    return 0.04;
  },
  cardUnlock(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f) => tone(ctx, out, 'triangle', f * pitch, f * pitch, t, 0.4, 0.14 * v));
    noise(ctx, out, t, 0.35, 0.1 * v, { type: 'highpass', freq: 6000 });
    return 0.45;
  },
  wallSmash(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    noise(ctx, out, t, 0.25, 0.3 * v, { type: 'lowpass', freq: 600 * pitch });
    tone(ctx, out, 'sine', 80, 50, t, 0.25, 0.4 * v);
    return 0.3;
  },
  enemyDie(ctx, out, pitch, v) {
    tone(ctx, out, 'sine', 420 * pitch, 180 * pitch, ctx.currentTime, 0.07, 0.12 * v);
    return 0.09;
  },
  soldierLost(ctx, out, pitch, v) {
    tone(ctx, out, 'square', 220 * pitch, 110 * pitch, ctx.currentTime, 0.09, 0.1 * v);
    return 0.11;
  },
  heroJoin(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    [110, 165, 220].forEach((f) =>
      tone(ctx, out, 'sawtooth', f * pitch, f * pitch, t, 0.6, 0.12 * v, {
        type: 'lowpass',
        freq: 1800,
        q: 2,
      }),
    );
    return 0.65;
  },
  heroDie(ctx, out, pitch, v) {
    tone(ctx, out, 'sawtooth', 220 * pitch, 55 * pitch, ctx.currentTime, 0.7, 0.2 * v, {
      type: 'lowpass',
      freq: 900,
    });
    return 0.75;
  },
  bossStep(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    tone(ctx, out, 'sine', 55 * pitch, 45 * pitch, t, 0.18, 0.4 * v);
    noise(ctx, out, t, 0.15, 0.15 * v, { type: 'lowpass', freq: 200 });
    return 0.2;
  },
  bossHit(ctx, out, pitch, v) {
    tone(ctx, out, 'square', 140 * pitch, 120 * pitch, ctx.currentTime, 0.05, 0.1 * v);
    return 0.07;
  },
  bossDie(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    noise(ctx, out, t, 1.2, 0.4 * v, { type: 'lowpass', freq: 2000, freqEnd: 100 });
    tone(ctx, out, 'sine', 60 * pitch, 40 * pitch, t, 1.2, 0.4 * v);
    return 1.3;
  },
  victory(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    [523, 659, 784].forEach((f, i) =>
      tone(ctx, out, 'triangle', f * pitch, f * pitch, t + i * 0.12, 0.12, 0.25 * v),
    );
    tone(ctx, out, 'triangle', 1046 * pitch, 1046 * pitch, t + 0.36, 0.5, 0.28 * v);
    return 0.9;
  },
  defeat(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    [392, 349, 311, 262].forEach((f, i) =>
      tone(ctx, out, 'sine', f * pitch, f * pitch, t + i * 0.22, 0.22, 0.25 * v),
    );
    return 0.95;
  },
  uiClick(ctx, out, pitch, v) {
    tone(ctx, out, 'sine', 900 * pitch, 900 * pitch, ctx.currentTime, 0.03, 0.2 * v);
    return 0.05;
  },
  coin(ctx, out, pitch, v) {
    const t = ctx.currentTime;
    tone(ctx, out, 'sine', 1320 * pitch, 1320 * pitch, t, 0.12, 0.2 * v);
    tone(ctx, out, 'sine', 1760 * pitch, 1760 * pitch, t, 0.12, 0.15 * v);
    return 0.15;
  },
};
