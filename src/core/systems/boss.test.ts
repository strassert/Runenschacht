import { describe, it, expect } from 'vitest';
import { updateBoss } from './boss';
import { activateHero } from './hero';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';

function arenaWorld(): ReturnType<typeof createWorld> {
  const w = createWorld(makeTestLevel({ startSoldiers: 92 }));
  w.squad.z = w.arenaZ;
  w.squad.stopped = true;
  return w;
}

describe('boss', () => {
  it('stays dormant when the squad is far away', () => {
    const w = createWorld(makeTestLevel());
    updateBoss(w, 1 / 60);
    expect(w.boss.state).toBe('dormant');
  });
  it('activates within 10 m of the arena', () => {
    const w = createWorld(makeTestLevel());
    w.squad.z = w.arenaZ - 10;
    updateBoss(w, 1 / 60);
    expect(w.boss.state).toBe('walking');
    expect(w.events.some((e) => e.type === 'bossActivated')).toBe(true);
  });
  it('reaches the squad and attacks', () => {
    const w = arenaWorld();
    for (let i = 0; i < 60 * 20 && w.boss.state !== 'attacking'; i++) updateBoss(w, 1 / 60);
    expect(w.boss.state).toBe('attacking');
  });
  it('kills about 12 soldiers per second', () => {
    const w = arenaWorld();
    for (let i = 0; i < 60 * 20 && w.boss.state !== 'attacking'; i++) updateBoss(w, 1 / 60);
    const before = w.squad.count;
    for (let i = 0; i < 60; i++) updateBoss(w, 1 / 60);
    const lost = before - w.squad.count;
    expect(lost).toBeGreaterThanOrEqual(11);
    expect(lost).toBeLessThanOrEqual(13);
  });
  it('hero soaks damage first', () => {
    const w = arenaWorld();
    activateHero(w);
    for (let i = 0; i < 60 * 20 && w.boss.state !== 'attacking'; i++) updateBoss(w, 1 / 60);
    const before = w.squad.count;
    for (let i = 0; i < 60; i++) updateBoss(w, 1 / 60);
    expect(w.squad.count).toBe(before);
    expect(w.hero.hp).toBeLessThan(60);
  });
});
