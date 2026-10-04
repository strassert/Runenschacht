import { describe, it, expect } from 'vitest';
import { EnemyPool } from './EnemyPool';

describe('EnemyPool', () => {
  it('spawns and stores values', () => {
    const p = new EnemyPool(4);
    const i = p.spawn(1, 2, 3, 1, 0.5);
    expect(i).toBe(0);
    expect(p.count).toBe(1);
    expect(p.hp[0]).toBe(3);
    expect(p.horde[0]).toBe(1);
    expect(p.charging[0]).toBe(0);
  });
  it('swap-removes all arrays', () => {
    const p = new EnemyPool(4);
    p.spawn(0, 0, 1, 0, 0);
    p.spawn(1, 10, 2, 0, 0);
    p.spawn(2, 20, 3, 1, 0);
    p.charging[2] = 1;
    p.remove(0);
    expect(p.count).toBe(2);
    expect(p.x[0]).toBe(2);
    expect(p.hp[0]).toBe(3);
    expect(p.horde[0]).toBe(1);
    expect(p.charging[0]).toBe(1);
  });
  it('returns -1 when full', () => {
    const p = new EnemyPool(1);
    expect(p.spawn(0, 0, 1, 0, 0)).toBe(0);
    expect(p.spawn(0, 0, 1, 0, 0)).toBe(-1);
  });
  it('supports reverse iteration removal', () => {
    const p = new EnemyPool(10);
    for (let i = 0; i < 6; i++) p.spawn(i, 0, 1, 0, 0);
    for (let i = p.count - 1; i >= 0; i--) if (p.x[i] % 2 === 0) p.remove(i);
    const left = Array.from({ length: p.count }, (_, i) => p.x[i]).sort();
    expect(left).toEqual([1, 3, 5]);
  });
});
