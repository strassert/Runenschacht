import type * as THREE from 'three';

const DECAY = 1.5;
const MAX_OFFSET = 0.35;

/** Trauma-basiertes Kamerawackeln (trauma² · Rauschen). */
export class ScreenShake {
  trauma = 0;
  private t = 0;

  /** trauma 0..1 wird addiert (max. 1). */
  add(trauma: number): void {
    this.trauma = Math.min(1, this.trauma + trauma);
  }

  /** Schreibt den aktuellen Versatz (Meter) nach out. */
  update(frameDt: number, out: THREE.Vector3): void {
    this.t += frameDt;
    this.trauma = Math.max(0, this.trauma - DECAY * frameDt);
    const k = this.trauma * this.trauma * MAX_OFFSET;
    out.set(
      k * Math.sin(this.t * 61.3 + 1.1) * Math.cos(this.t * 17.7),
      k * Math.sin(this.t * 53.9 + 2.3) * Math.cos(this.t * 23.1),
      k * 0.3 * Math.sin(this.t * 47.7 + 0.4),
    );
  }

  reset(): void {
    this.trauma = 0;
  }
}
