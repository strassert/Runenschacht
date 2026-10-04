import { CONFIG } from '../config';
import { emit } from '../events';
import { approach, damp } from '../math';
import type { WorldState } from '../types';
import { changeSoldiers } from '../world';
import { damageHero } from './hero';

export function updateBoss(world: WorldState, dt: number): void {
  const b = world.boss;
  if (b.state === 'dead') return;
  const s = world.squad;
  const h = world.hero;

  if (b.state === 'dormant' && s.z >= world.arenaZ - CONFIG.boss.activationDistance) {
    b.state = 'walking';
    emit(world, { type: 'bossActivated' });
  }
  if (b.state === 'dormant') return;

  const squadFront = s.z + s.radius;
  const frontZ = h.active ? Math.max(squadFront, h.z + CONFIG.hero.radius) : squadFront;

  if (b.state === 'walking') {
    b.z -= b.speed * dt;
    b.x = damp(b.x, s.x * 0.5, 1.5, dt);
    if (b.z - b.radius <= frontZ) {
      b.z = frontZ + b.radius;
      b.state = 'attacking';
    }
    return;
  }

  // attacking
  b.z = approach(b.z, frontZ + b.radius, b.speed * dt);
  b.killAccumulator += b.contactKillRate * dt;
  const n = Math.floor(b.killAccumulator);
  b.killAccumulator -= n;
  if (n > 0) {
    const heroHits = h.active ? Math.min(n, h.hp) : 0;
    if (heroHits > 0) damageHero(world, heroHits);
    const rest = n - heroHits;
    if (rest > 0) changeSoldiers(world, -rest, 'boss');
  }
}
