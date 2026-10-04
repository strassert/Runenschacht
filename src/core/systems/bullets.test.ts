import { describe, it, expect } from 'vitest';
import { updateBullets } from './bullets';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';
import { OWNER_SQUAD } from '../pools/BulletPool';
import type { WorldState } from '../types';
import type { LevelDef } from '../level/types';

function fire(w: WorldState, x: number, z: number, dmg = 1, speed = 40, range = 30): void {
  w.bullets.spawn(x, z, speed, range, dmg, OWNER_SQUAD, 0);
}
function run(w: WorldState, steps: number): void {
  for (let i = 0; i < steps; i++) updateBullets(w, 1 / 60);
}
function level(over: Partial<LevelDef>): LevelDef {
  return makeTestLevel(over);
}
const horde = (z: number, count = 1) => ({ zStart: z, zEnd: z + 0.1, xMin: 0, xMax: 0.01, count });

describe('bullets', () => {
  it('kills an enemy straight ahead', () => {
    const w = createWorld(level({ hordes: [horde(10)] }));
    const ex = w.enemies.x[0];
    fire(w, ex, 5);
    run(w, 30);
    expect(w.enemies.count).toBe(0);
    expect(w.bullets.count).toBe(0);
    expect(w.events.some((e) => e.type === 'enemyKilled' && e.byBullet)).toBe(true);
  });
  it('only the front enemy dies', () => {
    const w = createWorld(level({ hordes: [{ zStart: 10, zEnd: 12, xMin: 0, xMax: 0.01, count: 2 }] }));
    const ex = w.enemies.x[0];
    fire(w, ex, 5);
    run(w, 30);
    expect(w.enemies.count).toBe(1);
    expect(w.enemies.z[0]).toBeGreaterThan(11);
  });
  it('card in front shields enemies behind it', () => {
    const w = createWorld(
      level({ cards: [{ kind: 'weapon', x: 0, z: 10, hp: 10, width: 3.6 }], hordes: [horde(12)] }),
    );
    fire(w, 0, 5);
    run(w, 30);
    expect(w.cards[0].hp).toBe(9);
    expect(w.enemies.count).toBe(1);
  });
  it('bullet beside a card misses it', () => {
    const w = createWorld(level({ cards: [{ kind: 'weapon', x: 3.9, z: 10, hp: 10, width: 3.2 }] }));
    fire(w, -4, 5);
    run(w, 40);
    expect(w.cards[0].hp).toBe(10);
  });
  it('23 hits unlock a 23-hp weapon card', () => {
    const w = createWorld(level({ cards: [{ kind: 'weapon', x: 0, z: 10, hp: 23, width: 3.6 }] }));
    for (let i = 0; i < 23; i++) fire(w, 0, 5 + i * 0.001);
    run(w, 30);
    expect(w.cards[0].state).toBe('unlocked');
    expect(w.squad.weaponTier).toBe(1);
  });
  it('bullets expire after their range', () => {
    const w = createWorld(level({}));
    fire(w, 0, 5, 1, 40, 10);
    run(w, 30);
    expect(w.bullets.count).toBe(0);
  });
  it('damages and kills the boss', () => {
    const w = createWorld(level({ boss: { hp: 3 } }));
    w.boss.z = 20;
    w.boss.x = 0;
    for (let i = 0; i < 3; i++) fire(w, 0, 10 + i * 0.001);
    run(w, 30);
    expect(w.boss.hp).toBe(0);
    expect(w.boss.state).toBe('dead');
    expect(w.events.some((e) => e.type === 'bossDefeated')).toBe(true);
  });
  it('does not tunnel through enemies at high speed', () => {
    const w = createWorld(level({ hordes: [horde(10)] }));
    const ex = w.enemies.x[0];
    // Schrittweite 55/60 = 0.917; Gegner liegt mittig zwischen zwei Schrittpositionen
    w.enemies.z[0] = 5.46 + 0.917;
    fire(w, ex, 5, 1, 55, 30);
    run(w, 3);
    expect(w.enemies.count).toBe(0);
  });
});
