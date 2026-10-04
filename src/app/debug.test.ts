import { describe, it, expect } from 'vitest';
import { parseDebugParams } from './debug';

describe('parseDebugParams', () => {
  it('parses known params', () => {
    const p = parseDebugParams('?level=3&autoplay=1&speed=20&debug=1&seed=42&quality=low');
    expect(p).toEqual({ level: 3, seed: 42, autoplay: true, speed: 8, debug: true, quality: 'low' });
  });
  it('returns defaults for an empty string', () => {
    expect(parseDebugParams('')).toEqual({
      level: null,
      seed: null,
      autoplay: false,
      speed: 1,
      debug: false,
      quality: null,
    });
  });
  it('rejects invalid values', () => {
    const p = parseDebugParams('?quality=ultra&level=abc&speed=0');
    expect(p.quality).toBeNull();
    expect(p.level).toBeNull();
    expect(p.speed).toBe(1);
  });
});
