import { describe, it, expect } from 'vitest';
import { expandLevel, defaultBlockColor } from './expand';
import { Rng } from '../rng';
import type { LevelDef } from './types';

function lvl(over: Partial<LevelDef>): LevelDef {
  return { id: 1, name: 't', seed: 1, arenaZ: 200, boss: { hp: 10 }, ...over };
}

describe('expandLevel', () => {
  it('expands block columns', () => {
    const l = lvl({ blockColumns: [{ x: -4.6, zStart: 12, zEnd: 100, spacing: 3.2, value: 1 }] });
    const e = expandLevel(l, new Rng(1));
    expect(e.blocks.length).toBe(28);
    expect(e.blocks[0].z).toBe(12);
    expect(e.blocks[27].z).toBeCloseTo(98.4, 5);
    expect(e.blocks.every((b) => b.color === 'blue')).toBe(true);
  });
  it('colors big values gold', () => {
    expect(defaultBlockColor(33)).toBe('gold');
    const e = expandLevel(lvl({ blocks: [{ x: 0, z: 10, value: 33 }] }), new Rng(1));
    expect(e.blocks[0].color).toBe('gold');
  });
  it('expands hordes inside bounds', () => {
    const l = lvl({ hordes: [{ zStart: 44, zEnd: 120, xMin: -1.8, xMax: 1.8, count: 180 }] });
    const e = expandLevel(l, new Rng(1));
    expect(e.enemies.length).toBe(180);
    for (const en of e.enemies) {
      expect(en.x).toBeGreaterThanOrEqual(-1.8 - 0.12 - 1e-6);
      expect(en.x).toBeLessThanOrEqual(1.8 + 0.12 + 1e-6);
      expect(en.z).toBeGreaterThanOrEqual(44 - 0.12 - 1e-6);
      expect(en.z).toBeLessThanOrEqual(120 + 0.12 + 1e-6);
    }
  });
  it('is deterministic', () => {
    const l = lvl({ hordes: [{ zStart: 44, zEnd: 120, xMin: -1.8, xMax: 1.8, count: 50 }] });
    expect(expandLevel(l, new Rng(7))).toEqual(expandLevel(l, new Rng(7)));
  });
  it('sorts gates and cards', () => {
    const l = lvl({
      gates: [
        {
          z: 50,
          options: [
            { xMin: 0, xMax: 6, op: 'add', value: 5 },
            { xMin: -6, xMax: 0, op: 'mul', value: 2 },
          ],
        },
        { z: 20, options: [{ xMin: -6, xMax: 6, op: 'add', value: 1 }] },
      ],
      cards: [
        { kind: 'hero', x: 0, z: 40, hp: 5 },
        { kind: 'weapon', x: 0, z: 10, hp: 5 },
      ],
    });
    const e = expandLevel(l, new Rng(1));
    expect(e.gates.map((g) => g.z)).toEqual([20, 50]);
    expect(e.gates[1].options[0].xMin).toBe(-6);
    expect(e.cards.map((c) => c.z)).toEqual([10, 40]);
    expect(e.cards[0].width).toBe(3.4);
  });
});
