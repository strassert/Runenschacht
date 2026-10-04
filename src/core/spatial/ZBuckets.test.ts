import { describe, it, expect } from 'vitest';
import { ZBuckets } from './ZBuckets';
import { Rng } from '../rng';

describe('ZBuckets', () => {
  it('finds every item in range (vs brute force)', () => {
    const rng = new Rng(1);
    const n = 1000;
    const z = new Float32Array(n);
    for (let i = 0; i < n; i++) z[i] = rng.range(0, 300);
    const b = new ZBuckets(n);
    b.rebuild(z, n);
    const out = new Int32Array(n);
    for (let q = 0; q < 50; q++) {
      const lo = rng.range(-10, 300);
      const hi = lo + rng.range(0, 30);
      const cnt = b.query(lo, hi, out);
      const found = new Set(Array.from(out.subarray(0, cnt)));
      for (let i = 0; i < n; i++) {
        if (z[i] >= lo && z[i] <= hi) expect(found.has(i)).toBe(true);
      }
    }
  });
  it('handles empty build', () => {
    const b = new ZBuckets(10);
    b.rebuild(new Float32Array(10), 0);
    expect(b.query(0, 100, new Int32Array(10))).toBe(0);
  });
  it('handles single item', () => {
    const b = new ZBuckets(10);
    const z = new Float32Array(10);
    z[0] = 5;
    b.rebuild(z, 1);
    const out = new Int32Array(10);
    expect(b.query(4, 6, out)).toBe(1);
    expect(out[0]).toBe(0);
    expect(b.query(50, 60, out)).toBe(0);
  });
});
