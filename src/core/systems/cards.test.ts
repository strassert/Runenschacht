import { describe, it, expect } from 'vitest';
import { unlockCard, updateCardWalls } from './cards';
import { updateSquadMovement } from './squadMovement';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';
import type { CardDef } from '../level/types';

function worldWith(card: CardDef, startSoldiers = 0): ReturnType<typeof createWorld> {
  return createWorld(makeTestLevel({ cards: [card], startSoldiers }));
}

describe('cards', () => {
  it('weapon card upgrades tier up to 3', () => {
    const w = worldWith({ kind: 'weapon', x: 0, z: 30, hp: 5 });
    for (let i = 0; i < 4; i++) {
      w.cards[0].state = 'locked';
      unlockCard(w, w.cards[0]);
    }
    expect(w.squad.weaponTier).toBe(3);
  });
  it('first unlock goes tier 0 -> 1', () => {
    const w = worldWith({ kind: 'weapon', x: 0, z: 30, hp: 5 });
    unlockCard(w, w.cards[0]);
    expect(w.squad.weaponTier).toBe(1);
    expect(w.events.some((e) => e.type === 'weaponUpgraded')).toBe(true);
  });
  it('hero card activates the hero', () => {
    const w = worldWith({ kind: 'hero', x: 0, z: 30, hp: 5 });
    unlockCard(w, w.cards[0]);
    expect(w.hero.active).toBe(true);
    expect(w.hero.hp).toBe(60);
    expect(w.events.some((e) => e.type === 'heroJoined')).toBe(true);
  });
  it('soldier card adds soldiers', () => {
    const w = worldWith({ kind: 'soldiers', x: 0, z: 30, hp: 5, reward: 25 });
    unlockCard(w, w.cards[0]);
    expect(w.squad.count).toBe(8 + 25);
  });
  it('walking into a locked card costs soldiers and smashes it', () => {
    const w = worldWith({ kind: 'hero', x: 0, z: 10, hp: 555, width: 3.6 }, 12);
    for (let i = 0; i < 300 && w.cards[0].state === 'locked'; i++) {
      updateSquadMovement(w, 1 / 60);
      updateCardWalls(w);
    }
    expect(w.cards[0].state).toBe('smashed');
    expect(w.stats.soldiersLost).toBeGreaterThan(0);
  });
  it('a nearly empty card is unlocked by the wall hit', () => {
    const w = worldWith({ kind: 'weapon', x: 0, z: 10, hp: 3, width: 3.6 }, 12);
    for (let i = 0; i < 300 && w.cards[0].state === 'locked'; i++) {
      updateSquadMovement(w, 1 / 60);
      updateCardWalls(w);
    }
    expect(w.cards[0].state).toBe('unlocked');
    expect(w.squad.weaponTier).toBe(1);
  });
  it('passing beside a card costs nothing', () => {
    const w = worldWith({ kind: 'weapon', x: 3.9, z: 10, hp: 50, width: 3.2 }, 0);
    w.squad.x = -4.6;
    w.squad.targetX = -4.6;
    for (let i = 0; i < 300; i++) {
      updateSquadMovement(w, 1 / 60);
      updateCardWalls(w);
    }
    expect(w.cards[0].state).toBe('locked');
    expect(w.stats.soldiersLost).toBe(0);
  });
});
