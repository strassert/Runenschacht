import { Bot } from '../core/bot';
import { CONFIG } from '../core/config';
import type { SimEvent } from '../core/events';
import type { LevelDef } from '../core/level/types';
import { Simulation } from '../core/simulation';
import type { RunModifiers, WorldState } from '../core/types';
import type { Quality } from '../render/quality';
import { WorldView } from '../render/views/WorldView';

export interface SessionOptions {
  level: LevelDef;
  modifiers: RunModifiers;
  autoplay: boolean;
  quality: Quality;
  shadows: boolean;
}

export type SessionListener = (event: SimEvent, world: WorldState) => void;

/** Ein laufender Level-Versuch (Simulation + Darstellung). */
export class Session {
  readonly sim: Simulation;
  readonly view: WorldView;
  readonly bot: Bot | null;
  readonly level: LevelDef;
  timeScale = 1;
  private acc = 0;
  private readonly listeners: SessionListener[] = [];

  constructor(opts: SessionOptions) {
    this.level = opts.level;
    this.sim = new Simulation(opts.level, opts.modifiers);
    this.view = new WorldView(opts.level, this.sim.world, { shadows: opts.shadows, quality: opts.quality });
    this.bot = opts.autoplay ? new Bot() : null;
  }

  get world(): WorldState {
    return this.sim.world;
  }

  addListener(fn: SessionListener): void {
    this.listeners.push(fn);
  }

  /** Feste Simulationsschritte (Akkumulator), danach Ereignisse verteilen und View synchronisieren. */
  update(frameDt: number, steerDeltaX: number): void {
    const dt = CONFIG.sim.dt;
    if (!this.bot) this.sim.nudgeTargetX(steerDeltaX);
    this.acc += frameDt * this.timeScale;
    const maxSteps = CONFIG.sim.maxStepsPerFrame * Math.max(1, this.timeScale);
    let steps = 0;
    while (this.acc >= dt && steps < maxSteps) {
      this.bot?.update(this.sim.world, dt);
      this.sim.step(dt);
      this.acc -= dt;
      steps++;
    }
    if (steps === maxSteps) this.acc = 0;
    this.flushEvents();
    this.view.sync(this.sim.world, frameDt);
  }

  /** Verteilt anstehende Ereignisse und leert die Liste. */
  flushEvents(): void {
    const w = this.sim.world;
    for (const e of w.events) {
      this.view.onEvent(e);
      for (const l of this.listeners) l(e, w);
    }
    this.sim.clearEvents();
  }

  dispose(): void {
    this.view.dispose();
  }
}
