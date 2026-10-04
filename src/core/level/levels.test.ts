import { describe, it, expect } from 'vitest';
import { LEVELS, getLevel } from './levels';
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
  it('looks levels up', () => {
    expect(getLevel(3)?.name).toBe('Wasserfall-Pass');
    expect(getLevel(99)).toBeUndefined();
  });
});
