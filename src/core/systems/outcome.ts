import type { WorldState } from '../types';
import { setPhase } from '../world';

export function updateOutcome(world: WorldState): void {
  if (world.phase === 'victory' || world.phase === 'defeat') return;
  if (world.boss.state === 'dead') setPhase(world, 'victory');
  else if (world.squad.count <= 0 && !world.hero.active) setPhase(world, 'defeat');
}
