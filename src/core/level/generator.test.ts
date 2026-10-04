import { describe, it, expect } from 'vitest';
import { generateEndlessLevel } from './generator';
import { validateLevel } from './validate';

describe('generateEndlessLevel', () => {
  it('produces valid levels for rounds 1-50 and seeds 1-3', () => {
    for (let round = 1; round <= 50; round++) {
      for (const seed of [1, 2, 3]) {
        const level = generateEndlessLevel(round, seed);
        expect(validateLevel(level), `round ${round} seed ${seed}`).toEqual([]);
      }
    }
  });
  it('is deterministic', () => {
    expect(generateEndlessLevel(7, 5)).toEqual(generateEndlessLevel(7, 5));
  });
  it('differs between seeds', () => {
    expect(generateEndlessLevel(3, 1)).not.toEqual(generateEndlessLevel(3, 2));
  });
  it('boss hp grows monotonically with the round', () => {
    let last = 0;
    for (let round = 1; round <= 30; round++) {
      const hp = generateEndlessLevel(round, 1).boss.hp;
      expect(hp).toBeGreaterThan(last);
      last = hp;
    }
  });
  it('every gate has a positive and a negative option', () => {
    for (let round = 1; round <= 20; round++) {
      for (const g of generateEndlessLevel(round, 4).gates ?? []) {
        expect(g.options.some((o) => o.op === 'add' || o.op === 'mul')).toBe(true);
        expect(g.options.some((o) => o.op === 'sub' || o.op === 'div')).toBe(true);
      }
    }
  });
  it('names and ids', () => {
    const l = generateEndlessLevel(4, 9);
    expect(l.id).toBe(1004);
    expect(l.name).toContain('Runde 4');
  });
});
