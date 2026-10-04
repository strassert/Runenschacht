import type { LevelDef } from './level/types';
import type { WorldState } from './types';
import { CONFIG } from './config';

/** Minimales Level für Tests; overrides werden flach übernommen. */
export function makeTestLevel(overrides: Partial<LevelDef> = {}): LevelDef {
  return { id: 1, name: 'Test', seed: 1, arenaZ: 200, boss: { hp: 100 }, ...overrides };
}

/** Führt n Schritte aus. */
export function runSteps(world: WorldState, n: number, fn: (w: WorldState, dt: number) => void): void {
  for (let i = 0; i < n; i++) {
    fn(world, CONFIG.sim.dt);
    world.tick++;
    world.time += CONFIG.sim.dt;
  }
}
