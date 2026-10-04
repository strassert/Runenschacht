import { CONFIG } from '../config';
import { emit } from '../events';
import { clamp, distSq } from '../math';
import type { WorldState } from '../types';
import { changeSoldiers } from '../world';
import { damageHero } from './hero';

const TWO_PI = Math.PI * 2;

/** Entfernt Gegner i, zählt Statistik, sendet enemyKilled. */
export function killEnemy(world: WorldState, i: number, byBullet: boolean): void {
  const e = world.enemies;
  emit(world, { type: 'enemyKilled', x: e.x[i], z: e.z[i], byBullet });
  world.stats.enemiesKilled++;
  e.remove(i);
}

export function updateEnemies(world: WorldState, dt: number): void {
  const e = world.enemies;
  const s = world.squad;
  const h = world.hero;
  const cfg = CONFIG.enemy;
  const hordes = world.level.hordes ?? [];
  const heroReach = CONFIG.hero.radius + cfg.radius;

  for (let i = e.count - 1; i >= 0; i--) {
    const dz = e.z[i] - s.z;
    if (e.charging[i] === 0 && dz <= cfg.aggroDistance) e.charging[i] = 1;
    const charging = e.charging[i] === 1;

    if (charging) {
      e.z[i] -= cfg.speed * dt;
      if (Math.abs(dz) < cfg.steerDistance) {
        const vx = clamp((s.x - e.x[i]) * cfg.steerGain, -cfg.speed, cfg.speed);
        let nx = e.x[i] + vx * dt;
        const horde = hordes[e.horde[i]];
        if (horde) nx = clamp(nx, horde.xMin - cfg.spill, horde.xMax + cfg.spill);
        e.x[i] = nx;
      }
    }
    e.animPhase[i] = (e.animPhase[i] + dt * (charging ? 14 : 4)) % TWO_PI;

    if (h.active && distSq(e.x[i], e.z[i], h.x, h.z) <= heroReach * heroReach) {
      killEnemy(world, i, false);
      damageHero(world, 1);
      continue;
    }
    if (s.count > 0) {
      const reach = s.radius + cfg.radius;
      if (distSq(e.x[i], e.z[i], s.x, s.z) <= reach * reach) {
        killEnemy(world, i, false);
        changeSoldiers(world, -1, 'enemy');
        continue;
      }
    }
    if (e.z[i] < s.z - cfg.despawnBehind) e.remove(i);
  }
}
