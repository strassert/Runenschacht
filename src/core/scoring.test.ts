import { describe, it, expect } from 'vitest';
import { computeResult } from './scoring';
import { createWorld } from './world';
import { makeTestLevel } from './testUtils';

describe('scoring', () => {
  it('victory with 100/150 survivors on level 2 => 170 coins, 3 stars', () => {
    const w = createWorld(makeTestLevel({ id: 2 }));
    w.phase = 'victory';
    w.squad.count = 100;
    w.squad.peakCount = 150;
    const r = computeResult(w);
    expect(r.coins).toBe(170);
    expect(r.stars).toBe(3);
    expect(r.victory).toBe(true);
  });
  it('stars thresholds', () => {
    const w = createWorld(makeTestLevel());
    w.phase = 'victory';
    w.squad.peakCount = 100;
    w.squad.count = 30;
    expect(computeResult(w).stars).toBe(2);
    w.squad.count = 10;
    expect(computeResult(w).stars).toBe(1);
  });
  it('defeat gives a consolation prize and no stars', () => {
    const w = createWorld(makeTestLevel());
    w.phase = 'defeat';
    w.stats.enemiesKilled = 95;
    const r = computeResult(w);
    expect(r.stars).toBe(0);
    expect(r.coins).toBe(9);
  });
  it('caps the level bonus for endless rounds', () => {
    const w = createWorld(makeTestLevel({ id: 1005 }));
    w.phase = 'victory';
    expect(computeResult(w).coins).toBe(8 + 50 + 10 * 20);
  });
  it('applies the coin multiplier', () => {
    const w = createWorld(makeTestLevel(), {
      startSoldierBonus: 0,
      fireRateMultiplier: 1,
      coinMultiplier: 1.5,
    });
    w.phase = 'victory';
    const r = computeResult(w);
    expect(r.coins).toBe(Math.floor((8 + 50 + 10) * 1.5));
  });
});
