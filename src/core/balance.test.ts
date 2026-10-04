import { describe, it, expect } from 'vitest';
import { Simulation } from './simulation';
import { Bot } from './bot';
import { LEVELS } from './level/levels';
import type { LevelDef } from './level/types';
import type { RunResult } from './scoring';
import type { RunModifiers } from './types';
import { modifiersFromUpgrades } from './upgrades';

interface Outcome extends RunResult {
  endZ: number;
  simTime: number;
}

function runLevel(level: LevelDef, modifiers: RunModifiers, mode: 'bot' | 'idle'): Outcome {
  const sim = new Simulation(level, modifiers);
  const bot = new Bot();
  sim.start();
  const dt = 1 / 60;
  while (!sim.isFinished() && sim.world.time < 300) {
    if (mode === 'bot') bot.update(sim.world, dt);
    sim.step(dt);
    sim.clearEvents();
  }
  return { ...sim.getResult(), endZ: sim.world.squad.z, simTime: sim.world.time };
}

/** Realistischer Spielerstand: Upgrades wachsen mit dem Level. */
function expectedModifiers(levelId: number): RunModifiers {
  const lv = Math.min(10, Math.floor((levelId - 1) * 1.2));
  return modifiersFromUpgrades({ startSoldiers: lv, fireRate: lv, coinBonus: lv });
}

const NO_UPGRADES = modifiersFromUpgrades({ startSoldiers: 0, fireRate: 0, coinBonus: 0 });

const rows: string[] = [];

describe('balance', () => {
  for (const level of LEVELS) {
    it(`level ${level.id} (${level.name})`, () => {
      const bot = runLevel(level, expectedModifiers(level.id), 'bot');
      const idle = runLevel(level, NO_UPGRADES, 'idle');
      rows.push(
        `L${level.id} bot=${bot.victory ? 'WIN ' : 'LOSE'} surv=${bot.survivors}/${bot.peak} stars=${bot.stars} coins=${bot.coins} t=${bot.simTime.toFixed(0)}s | idle=${idle.victory ? 'WIN' : 'lose'} z=${idle.endZ.toFixed(0)}`,
      );
      expect(bot.victory).toBe(true);
      expect(bot.stars).toBeGreaterThanOrEqual(level.id <= 3 ? 2 : 1);
      if (level.id >= 2) expect(idle.victory).toBe(false);
      expect(bot.simTime).toBeGreaterThanOrEqual(25);
      expect(bot.simTime).toBeLessThanOrEqual(110);
    });
  }

  it('prints a report', () => {
    if (process.env.BALANCE_REPORT === '1') {
      console.info('\n' + rows.sort().join('\n'));
    }
    expect(rows.length).toBeGreaterThan(0);
  });
});
