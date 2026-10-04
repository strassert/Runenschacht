import { describe, it, expect } from 'vitest';
import { activateHero, damageHero, updateHero } from './hero';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';

describe('hero', () => {
  it('fires about 12 bullets per second', () => {
    const w = createWorld(makeTestLevel());
    activateHero(w);
    for (let i = 0; i < 60; i++) updateHero(w, 1 / 60);
    expect(w.bullets.count).toBeGreaterThanOrEqual(11);
    expect(w.bullets.count).toBeLessThanOrEqual(13);
  });
  it('inactive hero does nothing', () => {
    const w = createWorld(makeTestLevel());
    for (let i = 0; i < 60; i++) updateHero(w, 1 / 60);
    expect(w.bullets.count).toBe(0);
  });
  it('stands in front of the squad', () => {
    const w = createWorld(makeTestLevel());
    activateHero(w);
    updateHero(w, 1 / 60);
    expect(w.hero.z).toBeGreaterThan(w.squad.z + w.squad.radius);
  });
  it('dies at 0 hp and emits events', () => {
    const w = createWorld(makeTestLevel());
    activateHero(w);
    damageHero(w, 100);
    expect(w.hero.active).toBe(false);
    expect(w.events.some((e) => e.type === 'heroDied')).toBe(true);
  });
});
