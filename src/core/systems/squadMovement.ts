import { CONFIG } from '../config';
import { maxSquadX } from '../formation';
import { approach, clamp, damp } from '../math';
import type { WorldState } from '../types';
import { setPhase } from '../world';

export function updateSquadMovement(world: WorldState, dt: number): void {
  const s = world.squad;
  const limit = maxSquadX(s.radius);
  s.targetX = clamp(s.targetX, -limit, limit);
  const desired = damp(s.x, s.targetX, CONFIG.squad.lateralResponse, dt);
  s.x = clamp(approach(s.x, desired, CONFIG.squad.lateralMaxSpeed * dt), -limit, limit);
  s.prevZ = s.z;
  if (!s.stopped) {
    s.z += CONFIG.squad.forwardSpeed * dt;
    if (s.z >= world.arenaZ) {
      s.z = world.arenaZ;
      s.stopped = true;
      setPhase(world, 'bossFight');
    }
  }
}
