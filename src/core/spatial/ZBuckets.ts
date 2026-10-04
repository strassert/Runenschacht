/** Counting-Sort-Buckets entlang z (Broadphase). */
export class ZBuckets {
  private readonly cellStart: Int32Array;
  private readonly items: Int32Array;
  private readonly cellOf: Int32Array;
  private origin = 0;
  private cells = 0;

  constructor(
    capacity: number,
    readonly cellSize = 2,
    readonly maxCells = 1024,
  ) {
    this.cellStart = new Int32Array(maxCells + 2);
    this.items = new Int32Array(capacity);
    this.cellOf = new Int32Array(capacity);
  }

  /** Baut die Buckets aus z[0..count-1] neu auf. */
  rebuild(z: Float32Array, count: number): void {
    if (count <= 0) {
      this.cells = 0;
      return;
    }
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      const v = z[i];
      if (v < minZ) minZ = v;
      if (v > maxZ) maxZ = v;
    }
    this.origin = minZ;
    const cells = Math.min(this.maxCells, Math.floor((maxZ - minZ) / this.cellSize) + 1);
    this.cells = cells;
    const start = this.cellStart;
    start.fill(0, 0, cells + 1);
    for (let i = 0; i < count; i++) {
      let c = Math.floor((z[i] - minZ) / this.cellSize);
      if (c < 0) c = 0;
      else if (c > cells - 1) c = cells - 1;
      this.cellOf[i] = c;
      start[c + 1]++;
    }
    for (let c = 0; c < cells; c++) start[c + 1] += start[c];
    // items befüllen (stabile Reihenfolge); start[c] dient als Schreibzeiger, danach zurücksetzen
    for (let i = 0; i < count; i++) {
      const c = this.cellOf[i];
      this.items[start[c]++] = i;
    }
    for (let c = cells; c > 0; c--) start[c] = start[c - 1];
    start[0] = 0;
  }

  /** Schreibt alle Indizes mit Zelle in [zMin, zMax] nach out (ab Position 0); gibt Anzahl zurück. */
  query(zMin: number, zMax: number, out: Int32Array): number {
    if (this.cells === 0) return 0;
    let c0 = Math.floor((zMin - this.origin) / this.cellSize);
    let c1 = Math.floor((zMax - this.origin) / this.cellSize);
    if (c1 < 0 || c0 > this.cells - 1) return 0;
    if (c0 < 0) c0 = 0;
    if (c1 > this.cells - 1) c1 = this.cells - 1;
    const from = this.cellStart[c0];
    const to = this.cellStart[c1 + 1];
    let n = 0;
    for (let k = from; k < to; k++) out[n++] = this.items[k];
    return n;
  }
}
