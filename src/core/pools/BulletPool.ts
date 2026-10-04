export const OWNER_SQUAD = 0;
export const OWNER_HERO = 1;

export class BulletPool {
  readonly capacity: number;
  count = 0;
  readonly x: Float32Array;
  readonly z: Float32Array;
  readonly prevZ: Float32Array;
  readonly traveled: Float32Array;
  readonly speed: Float32Array;
  readonly range: Float32Array;
  readonly damage: Float32Array;
  readonly owner: Uint8Array;
  /** Waffenstufe (für Farbe), Held = 255 */
  readonly tier: Uint8Array;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.x = new Float32Array(capacity);
    this.z = new Float32Array(capacity);
    this.prevZ = new Float32Array(capacity);
    this.traveled = new Float32Array(capacity);
    this.speed = new Float32Array(capacity);
    this.range = new Float32Array(capacity);
    this.damage = new Float32Array(capacity);
    this.owner = new Uint8Array(capacity);
    this.tier = new Uint8Array(capacity);
  }

  /** Fügt ein Projektil hinzu. Gibt false zurück, wenn voll. */
  spawn(
    x: number,
    z: number,
    speed: number,
    range: number,
    damage: number,
    owner: number,
    tier: number,
  ): boolean {
    if (this.count >= this.capacity) return false;
    const i = this.count++;
    this.x[i] = x;
    this.z[i] = z;
    this.prevZ[i] = z;
    this.traveled[i] = 0;
    this.speed[i] = speed;
    this.range[i] = range;
    this.damage[i] = damage;
    this.owner[i] = owner;
    this.tier[i] = tier;
    return true;
  }

  /** Entfernt Index i durch Tausch mit dem letzten Element. Beim Iterieren RÜCKWÄRTS laufen. */
  remove(i: number): void {
    const last = this.count - 1;
    if (i !== last) {
      this.x[i] = this.x[last];
      this.z[i] = this.z[last];
      this.prevZ[i] = this.prevZ[last];
      this.traveled[i] = this.traveled[last];
      this.speed[i] = this.speed[last];
      this.range[i] = this.range[last];
      this.damage[i] = this.damage[last];
      this.owner[i] = this.owner[last];
      this.tier[i] = this.tier[last];
    }
    this.count--;
  }

  clear(): void {
    this.count = 0;
  }
}
