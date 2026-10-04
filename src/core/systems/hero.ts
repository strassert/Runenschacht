import { CONFIG } from '../config';
import { emit } from '../events';
import type { WorldState } from '../types';

/** Aktiviert den Helden (oder heilt ihn, falls schon aktiv). */
export function activateHero(world: WorldState): void {
  const h = world.hero;
  const s = world.squad;
  const wasActive = h.active;
  h.active = true;
  h.hp = h.maxHp;
  if (!wasActive) {
    h.x = s.x;
    h.z = s.z + s.radius + CONFIG.hero.followOffsetZ;
    h.fireAccumulator = 0;
    emit(world, { type: 'heroJoined' });
  }
}

export function damageHero(world: WorldState, amount: number): void {
  const h = world.hero;
  if (!h.active || amount <= 0) return;
  h.hp -= amount;
  if (h.hp <= 0) {
    h.hp = 0;
    h.active = false;
    emit(world, { type: 'heroDamaged', hp: 0, maxHp: h.maxHp });
    emit(world, { type: 'heroDied', x: h.x, z: h.z });
  } else {
    emit(world, { type: 'heroDamaged', hp: h.hp, maxHp: h.maxHp });
  }
}
