import { CONFIG, WEAPONS } from '../config';
import { emit } from '../events';
import { UNIT_SLOT_X, UNIT_SLOT_Z } from '../formation';
import { OWNER_SQUAD } from '../pools/BulletPool';
import type { WorldState } from '../types';

export function updateShooting(world: WorldState, dt: number): void {
  const s = world.squad;
  if (s.count <= 0) {
    s.fireAccumulator = 0;
    return;
  }
  const w = WEAPONS[s.weaponTier];
  const shooters = Math.min(s.count, CONFIG.shooting.maxShooters);
  s.fireAccumulator += (dt * shooters * world.modifiers.fireRateMultiplier) / w.fireInterval;
  const damage = (w.damage * s.count) / shooters;
  let fired = 0;
  while (s.fireAccumulator >= 1) {
    s.fireAccumulator -= 1;
    const k = s.nextShooter % shooters;
    s.nextShooter = (k + 1) % shooters;
    const slot = Math.floor((k * s.count) / shooters);
    const x = s.x + UNIT_SLOT_X[slot] * s.slotSpacing;
    const z = s.z + UNIT_SLOT_Z[slot] * s.slotSpacing + CONFIG.shooting.muzzleOffsetZ;
    if (world.bullets.spawn(x, z, w.bulletSpeed, w.range, damage, OWNER_SQUAD, s.weaponTier)) fired++;
  }
  if (fired > 0) {
    world.stats.shotsFired += fired;
    emit(world, { type: 'shotsFired', owner: 'squad', count: fired });
  }
}
