import { describe, it, expect } from 'vitest';
import { updateShooting } from './shooting';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';

function shoot(w: ReturnType<typeof createWorld>, seconds: number): void {
  for (let i = 0; i < Math.round(seconds * 60); i++) updateShooting(w, 1 / 60);
}

describe('shooting', () => {
  it('count 8 pistol fires ~17.8 per second', () => {
    const w = createWorld(makeTestLevel());
    shoot(w, 1);
    expect(w.bullets.count).toBeGreaterThanOrEqual(16);
    expect(w.bullets.count).toBeLessThanOrEqual(19);
  });
  it('count 200 is capped at 48 shooters with scaled damage', () => {
    const w = createWorld(makeTestLevel({ startSoldiers: 192 }));
    shoot(w, 1);
    expect(w.bullets.count).toBeGreaterThanOrEqual(100);
    expect(w.bullets.count).toBeLessThanOrEqual(112);
    expect(w.bullets.damage[0]).toBeCloseTo(200 / 48, 3);
  });
  it('fire rate multiplier increases rate', () => {
    const a = createWorld(makeTestLevel());
    const b = createWorld(makeTestLevel(), {
      startSoldierBonus: 0,
      fireRateMultiplier: 1.3,
      coinMultiplier: 1,
    });
    shoot(a, 2);
    shoot(b, 2);
    expect(b.bullets.count / a.bullets.count).toBeGreaterThan(1.2);
    expect(b.bullets.count / a.bullets.count).toBeLessThan(1.4);
  });
  it('bullets spawn inside the squad footprint', () => {
    const w = createWorld(makeTestLevel({ startSoldiers: 42 }));
    w.squad.x = 2;
    shoot(w, 1);
    for (let i = 0; i < w.bullets.count; i++) {
      expect(Math.abs(w.bullets.x[i] - 2)).toBeLessThanOrEqual(w.squad.radius + 1e-3);
    }
  });
  it('does not shoot without soldiers', () => {
    const w = createWorld(makeTestLevel());
    w.squad.count = 0;
    shoot(w, 1);
    expect(w.bullets.count).toBe(0);
  });
});
