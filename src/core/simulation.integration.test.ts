import { describe, it, expect } from 'vitest';
import { Simulation } from './simulation';
import { Bot } from './bot';
import { getLevel } from './level/levels';
import type { RunResult } from './scoring';

function playLevel(
  levelId: number,
  useBot: boolean,
  maxSeconds = 200,
): { result: RunResult; tick: number; finished: boolean } {
  const sim = new Simulation(getLevel(levelId)!);
  const bot = new Bot();
  sim.start();
  const dt = 1 / 60;
  while (!sim.isFinished() && sim.world.time < maxSeconds) {
    if (useBot) bot.update(sim.world, dt);
    sim.step(dt);
    sim.clearEvents();
  }
  return { result: sim.getResult(), tick: sim.world.tick, finished: sim.isFinished() };
}

describe('simulation integration (level 1)', () => {
  it('bot wins level 1 within 200 s and under 3 s wall time', () => {
    const t0 = performance.now();
    const { result, finished } = playLevel(1, true);
    const wall = performance.now() - t0;
    expect(finished).toBe(true);
    expect(result.victory).toBe(true);
    expect(wall).toBeLessThan(3000);
  });
  it('idle play ends within 200 s', () => {
    const { finished } = playLevel(1, false);
    expect(finished).toBe(true);
  });
  it('is deterministic', () => {
    const a = playLevel(1, true);
    const b = playLevel(1, true);
    expect(a.result).toEqual(b.result);
    expect(a.tick).toBe(b.tick);
  });
});
