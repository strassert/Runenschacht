import { describe, it, expect } from 'vitest';
import { LEVELS, LEVEL_COUNT, getLevel } from './levels';
import { validateLevel } from './validate';

describe('levels', () => {
  for (const l of LEVELS) {
    it(`level ${l.id} is valid`, () => {
      expect(validateLevel(l)).toEqual([]);
    });
  }
  it('has unique ascending ids', () => {
    const ids = LEVELS.map((l) => l.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(1);
  });
  it('has ten levels', () => {
    expect(LEVEL_COUNT).toBe(10);
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it('looks levels up', () => {
    expect(getLevel(3)?.name).toBe('Wasserfall-Pass');
    expect(getLevel(99)).toBeUndefined();
  });
});
