import { describe, it, expect } from 'vitest';
import { killEnemy, updateEnemies } from './enemies';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';
import { activateHero } from './hero';

function world(horde: {
  zStart: number;
  zEnd: number;
  xMin: number;
  xMax: number;
  count: number;
}): ReturnType<typeof createWorld> {
  return createWorld(makeTestLevel({ hordes: [horde] }));
}

describe('enemies', () => {
  it('stays idle when far away', () => {
    const w = world({ zStart: 30, zEnd: 31, xMin: 0, xMax: 0.1, count: 1 });
    const z0 = w.enemies.z[0];
    updateEnemies(w, 1 / 60);
    expect(w.enemies.charging[0]).toBe(0);
    expect(w.enemies.z[0]).toBe(z0);
  });
  it('charges when closer than 20 m', () => {
    const w = world({ zStart: 15, zEnd: 16, xMin: 0, xMax: 0.1, count: 1 });
    const z0 = w.enemies.z[0];
    updateEnemies(w, 1 / 60);
    expect(w.enemies.charging[0]).toBe(1);
    expect(w.enemies.z[0]).toBeLessThan(z0);
  });
  it('contact kills enemy and one soldier', () => {
    const w = world({ zStart: 0.2, zEnd: 0.3, xMin: 0, xMax: 0.1, count: 1 });
    updateEnemies(w, 1 / 60);
    expect(w.enemies.count).toBe(0);
    expect(w.squad.count).toBe(7);
    expect(w.stats.enemiesKilled).toBe(1);
  });
  it('hero absorbs contacts', () => {
    const w = world({ zStart: 3, zEnd: 3.1, xMin: 0, xMax: 0.1, count: 1 });
    activateHero(w);
    w.hero.z = 3;
    w.hero.x = w.enemies.x[0];
    updateEnemies(w, 1 / 60);
    expect(w.hero.hp).toBe(59);
    expect(w.squad.count).toBe(8);
  });
  it('removes enemies far behind', () => {
    const w = world({ zStart: 10, zEnd: 11, xMin: 0, xMax: 0.1, count: 1 });
    w.squad.z = 15;
    updateEnemies(w, 1 / 60);
    expect(w.enemies.count).toBe(0);
    expect(w.stats.enemiesKilled).toBe(0);
  });
  it('keeps x inside horde bounds plus spill', () => {
    const w = world({ zStart: 6, zEnd: 7, xMin: 0, xMax: 0.2, count: 1 });
    w.squad.x = 5;
    w.squad.z = 0;
    w.squad.count = 0;
    for (let i = 0; i < 120; i++) updateEnemies(w, 1 / 60);
    expect(w.enemies.x[0]).toBeLessThanOrEqual(0.2 + 1.2 + 1e-4);
  });
  it('killEnemy emits event', () => {
    const w = world({ zStart: 30, zEnd: 31, xMin: 0, xMax: 0.1, count: 1 });
    killEnemy(w, 0, true);
    expect(w.events.some((e) => e.type === 'enemyKilled' && e.byBullet)).toBe(true);
  });
});
