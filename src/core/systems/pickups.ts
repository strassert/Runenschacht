import { CONFIG } from '../config';
import { emit } from '../events';
import { circleIntersectsRect } from '../math';
import type { WorldState } from '../types';
import { changeSoldiers } from '../world';

export function updatePickups(world: WorldState): void {
  const s = world.squad;
  if (s.count <= 0) return;
  const hw = CONFIG.block.width / 2;
  const hd = CONFIG.block.depth / 2;
  for (const b of world.blocks) {
    if (b.collected) continue;
    if (Math.abs(b.z - s.z) > s.radius + hd) continue;
    if (!circleIntersectsRect(s.x, s.z, s.radius, b.x, b.z, hw, hd)) continue;
    b.collected = true;
    world.stats.blocksCollected++;
    emit(world, { type: 'blockCollected', id: b.id, value: b.value, x: b.x, z: b.z });
    changeSoldiers(world, b.value, 'block');
  }
}
