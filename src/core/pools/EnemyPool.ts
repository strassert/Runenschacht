export class EnemyPool {
  readonly capacity: number;
  count = 0;
  readonly x: Float32Array;
  readonly z: Float32Array;
  readonly hp: Float32Array;
  /** 0..2π, nur Optik */
  readonly animPhase: Float32Array;
  /** 0 = idle, 1 = charging */
  readonly charging: Uint8Array;
  /** Index in level.hordes */
  readonly horde: Uint16Array;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.x = new Float32Array(capacity);
    this.z = new Float32Array(capacity);
    this.hp = new Float32Array(capacity);
    this.animPhase = new Float32Array(capacity);
    this.charging = new Uint8Array(capacity);
    this.horde = new Uint16Array(capacity);
  }

  /** Gibt neuen Index zurück oder -1, wenn voll. */
  spawn(x: number, z: number, hp: number, horde: number, animPhase: number): number {
    if (this.count >= this.capacity) return -1;
    const i = this.count++;
    this.x[i] = x;
    this.z[i] = z;
    this.hp[i] = hp;
    this.animPhase[i] = animPhase;
    this.charging[i] = 0;
    this.horde[i] = horde;
    return i;
  }

  /** Swap-Remove, alle Arrays mittauschen. */
  remove(i: number): void {
    const last = this.count - 1;
    if (i !== last) {
      this.x[i] = this.x[last];
      this.z[i] = this.z[last];
      this.hp[i] = this.hp[last];
      this.animPhase[i] = this.animPhase[last];
      this.charging[i] = this.charging[last];
      this.horde[i] = this.horde[last];
    }
    this.count--;
  }

  clear(): void {
    this.count = 0;
  }
}
