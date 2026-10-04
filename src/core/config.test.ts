import { describe, it, expect } from 'vitest';
import { WEAPONS, TRACK_INNER_HALF_WIDTH } from './config';

describe('config', () => {
  it('has four weapons with strictly falling fire intervals', () => {
    expect(WEAPONS.length).toBe(4);
    for (let i = 1; i < WEAPONS.length; i++) {
      expect(WEAPONS[i].fireInterval).toBeLessThan(WEAPONS[i - 1].fireInterval);
    }
  });

  it('computes inner track half width', () => {
    expect(TRACK_INNER_HALF_WIDTH).toBeCloseTo(5.65, 5);
  });
});
