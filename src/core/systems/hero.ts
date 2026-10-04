import { CONFIG } from '../config';
import { emit } from '../events';
import { damp } from '../math';
import { OWNER_HERO } from '../pools/BulletPool';
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

/** Held folgt dem Trupp und feuert. */
export function updateHero(world: WorldState, dt: number): void {
  const h = world.hero;
  if (!h.active) return;
  const s = world.squad;
  const cfg = CONFIG.hero;
  h.x = damp(h.x, s.x, 12, dt);
  h.z = s.z + s.radius + cfg.followOffsetZ;

  h.fireAccumulator += dt / cfg.fireInterval;
  let fired = 0;
  while (h.fireAccumulator >= 1) {
    h.fireAccumulator -= 1;
    const side = (world.tick + fired) % 2 === 0 ? -0.25 : 0.25;
    if (world.bullets.spawn(h.x + side, h.z + 0.6, cfg.bulletSpeed, cfg.range, cfg.damage, OWNER_HERO, 255)) {
      fired++;
    }
  }
  if (fired > 0) {
    world.stats.shotsFired += fired;
    emit(world, { type: 'shotsFired', owner: 'hero', count: fired });
  }
}
