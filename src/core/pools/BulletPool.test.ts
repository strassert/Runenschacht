import { describe, it, expect } from 'vitest';
import { BulletPool, OWNER_SQUAD } from './BulletPool';

describe('BulletPool', () => {
  it('spawns and stores values', () => {
    const p = new BulletPool(4);
    expect(p.spawn(1, 2, 30, 20, 1.5, OWNER_SQUAD, 2)).toBe(true);
    expect(p.count).toBe(1);
    expect(p.x[0]).toBe(1);
    expect(p.z[0]).toBe(2);
    expect(p.prevZ[0]).toBe(2);
    expect(p.damage[0]).toBeCloseTo(1.5);
    expect(p.tier[0]).toBe(2);
  });
  it('swap-removes', () => {
    const p = new BulletPool(4);
    for (let i = 0; i < 3; i++) p.spawn(i, i * 10, 1, 1, 1, 0, 0);
    p.remove(0);
    expect(p.count).toBe(2);
    expect(p.x[0]).toBe(2);
    expect(p.z[0]).toBe(20);
  });
  it('returns false when full', () => {
    const p = new BulletPool(1);
    expect(p.spawn(0, 0, 1, 1, 1, 0, 0)).toBe(true);
    expect(p.spawn(0, 0, 1, 1, 1, 0, 0)).toBe(false);
  });
  it('supports reverse iteration removal', () => {
    const p = new BulletPool(10);
    for (let i = 0; i < 6; i++) p.spawn(i, 0, 1, 1, 1, 0, 0);
    for (let i = p.count - 1; i >= 0; i--) if (p.x[i] % 2 === 0) p.remove(i);
    const left = Array.from({ length: p.count }, (_, i) => p.x[i]).sort();
    expect(left).toEqual([1, 3, 5]);
  });
});
