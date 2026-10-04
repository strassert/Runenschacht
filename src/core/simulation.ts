import { CONFIG } from './config';
import type { LevelDef } from './level/types';
import { computeResult, type RunResult } from './scoring';
import { updateBoss } from './systems/boss';
import { updateBullets } from './systems/bullets';
import { updateCardWalls } from './systems/cards';
import { updateEnemies } from './systems/enemies';
import { updateGates } from './systems/gates';
import { updateHero } from './systems/hero';
import { updateOutcome } from './systems/outcome';
import { updatePickups } from './systems/pickups';
import { updateShooting } from './systems/shooting';
import { updateSquadMovement } from './systems/squadMovement';
import type { RunModifiers, WorldState } from './types';
import { DEFAULT_MODIFIERS, createWorld, setPhase } from './world';

export class Simulation {
  readonly world: WorldState;

  constructor(level: LevelDef, modifiers: RunModifiers = DEFAULT_MODIFIERS) {
    this.world = createWorld(level, modifiers);
  }

  /** ready → running */
  start(): void {
    if (this.world.phase === 'ready') setPhase(this.world, 'running');
  }

  setTargetX(x: number): void {
    this.world.squad.targetX = x;
  }

  nudgeTargetX(dx: number): void {
    this.world.squad.targetX += dx;
  }

  step(dt: number = CONFIG.sim.dt): void {
    const w = this.world;
    if (w.phase === 'ready') return;
    if (w.phase === 'victory' || w.phase === 'defeat') {
      w.outcomeTimer += dt;
      updateBullets(w, dt);
      w.time += dt;
      w.tick++;
      return;
    }
    updateSquadMovement(w, dt);
    updatePickups(w);
    updateGates(w);
    updateCardWalls(w);
    updateEnemies(w, dt);
    updateHero(w, dt);
    updateBoss(w, dt);
    updateShooting(w, dt);
    updateBullets(w, dt);
    updateOutcome(w);
    w.time += dt;
    w.tick++;
  }

  isFinished(): boolean {
    const w = this.world;
    if (w.phase === 'victory') return w.outcomeTimer >= CONFIG.outcome.victoryDelay;
    if (w.phase === 'defeat') return w.outcomeTimer >= CONFIG.outcome.defeatDelay;
    return false;
  }

  getResult(): RunResult {
    return computeResult(this.world);
  }

  clearEvents(): void {
    this.world.events.length = 0;
  }
}
