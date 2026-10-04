import type { SimEvent } from '../core/events';
import type { WorldState } from '../core/types';
import { ScreenShake } from '../render/fx/ScreenShake';

export interface FeedbackSettings {
  haptics: boolean;
  reducedMotion: boolean;
}

/** Verknüpft Ereignisse mit Screenshake, Treffer-Vignette und Vibration. */
export class FeedbackDirector {
  readonly shake = new ScreenShake();
  private lossSum = 0;
  private lossStart = -10;

  constructor(
    private readonly vignette: HTMLElement,
    private readonly getSettings: () => FeedbackSettings,
  ) {}

  private vibrate(pattern: number | number[]): void {
    if (!this.getSettings().haptics) return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* nicht unterstützt */
    }
  }

  private addShake(trauma: number): void {
    if (!this.getSettings().reducedMotion) this.shake.add(trauma);
  }

  private flashVignette(strength: number): void {
    const v = this.vignette;
    const reduced = this.getSettings().reducedMotion;
    v.style.transition = 'none';
    v.style.opacity = String(reduced ? strength * 0.6 : strength);
    // Reflow, damit die Transition neu startet
    void v.offsetWidth;
    v.style.transition = reduced ? 'opacity 0.01s' : 'opacity 0.3s ease-out';
    window.setTimeout(
      () => {
        v.style.opacity = '0';
      },
      reduced ? 150 : 16,
    );
  }

  onEvent(e: SimEvent, world: WorldState): void {
    switch (e.type) {
      case 'cardSmashed':
        this.addShake(0.4);
        this.vibrate(60);
        break;
      case 'bossDefeated':
        this.addShake(0.8);
        this.vibrate([30, 50, 30, 50, 120]);
        break;
      case 'heroDied':
        this.addShake(0.4);
        this.vibrate([40, 40, 80]);
        break;
      case 'gatePassed':
        if (e.after < e.before) {
          this.addShake(0.25);
          this.vibrate(40);
        }
        break;
      case 'soldiersChanged':
        if (e.delta < 0 && e.reason !== 'wall') {
          if (world.time - this.lossStart > 0.2) {
            this.lossStart = world.time;
            this.lossSum = 0;
          }
          this.lossSum -= e.delta;
          if (this.lossSum >= 3) {
            this.lossSum = -1e9; // nur einmal pro Fenster auslösen
            this.flashVignette(0.5);
          }
        }
        break;
      default:
        break;
    }
  }

  /** Pro Frame: dauerhafte Effekte (Boss schlägt zu). */
  update(world: WorldState, frameDt: number): void {
    if (world.boss.state === 'attacking') this.addShake(0.15 * frameDt);
  }

  reset(): void {
    this.shake.reset();
    this.lossSum = 0;
  }
}
