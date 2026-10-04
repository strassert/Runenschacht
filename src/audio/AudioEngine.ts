import { SFX } from './sfx';

export type SfxName =
  | 'shoot'
  | 'pickup'
  | 'gateGood'
  | 'gateBad'
  | 'cardHit'
  | 'cardUnlock'
  | 'wallSmash'
  | 'enemyDie'
  | 'soldierLost'
  | 'heroJoin'
  | 'heroDie'
  | 'bossStep'
  | 'bossHit'
  | 'bossDie'
  | 'victory'
  | 'defeat'
  | 'uiClick'
  | 'coin';

/** Mindestabstand zwischen zwei Abspielungen desselben Effekts (Sekunden). */
const MIN_INTERVAL: Partial<Record<SfxName, number>> = {
  shoot: 0.06,
  enemyDie: 0.03,
  cardHit: 0.05,
  soldierLost: 0.05,
  pickup: 0.04,
  bossHit: 0.08,
};
const MAX_VOICES = 24;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private soundEnabled = true;
  private musicEnabled = true;
  private sfxVolume = 1;
  private musicVolume = 1;
  private readonly lastPlayed = new Map<SfxName, number>();
  private activeVoices = 0;

  get context(): AudioContext | null {
    return this.ctx;
  }

  get musicBus(): GainNode | null {
    return this.musicGain;
  }

  /** Beim ersten Nutzer-Klick/Touch aufrufen (AudioContext erzeugen/resume). Idempotent. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      this.sfxGain = ctx.createGain();
      this.musicGain = ctx.createGain();
      this.sfxGain.connect(master);
      this.musicGain.connect(master);
      this.ctx = ctx;
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** true, wenn der Kontext existiert, aber noch nicht läuft (iOS). */
  isSuspended(): boolean {
    return this.ctx !== null && this.ctx.state !== 'running';
  }

  setSoundEnabled(on: boolean): void {
    this.soundEnabled = on;
    this.applyVolumes();
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    this.applyVolumes();
  }

  setVolumes(sfx: number, music: number): void {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    this.applyVolumes();
  }

  /** Senkt die Musik kurz auf 30 % (z. B. unter dem Sieg-/Niederlage-Jingle). */
  duckMusic(seconds = 1): void {
    const ctx = this.ctx;
    const g = this.musicGain;
    if (!ctx || !g || !this.musicEnabled) return;
    const base = 0.35 * this.musicVolume;
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(base * 0.3, t + 0.1);
    g.gain.setValueAtTime(base * 0.3, t + seconds);
    g.gain.linearRampToValueAtTime(base, t + seconds + 0.5);
  }

  private applyVolumes(): void {
    if (this.sfxGain) this.sfxGain.gain.value = this.soundEnabled ? 0.7 * this.sfxVolume : 0;
    if (this.musicGain) this.musicGain.gain.value = this.musicEnabled ? 0.35 * this.musicVolume : 0;
  }

  /** Spielt einen Effekt. pitch ±, volume 0..1. Gedrosselt pro Name. */
  play(name: SfxName, opts: { pitch?: number; volume?: number } = {}): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.soundEnabled || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const gap = MIN_INTERVAL[name];
    if (gap !== undefined) {
      const last = this.lastPlayed.get(name) ?? -Infinity;
      if (now - last < gap) return;
    }
    if (this.activeVoices >= MAX_VOICES) return;
    this.lastPlayed.set(name, now);
    this.activeVoices++;
    const duration = SFX[name](ctx, this.sfxGain, opts.pitch ?? 1, opts.volume ?? 1);
    window.setTimeout(
      () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      },
      Math.max(30, duration * 1000 + 50),
    );
  }
}
