import { CONFIG } from './config';
import type { WorldState } from './types';

export interface RunResult {
  levelId: number;
  victory: boolean;
  survivors: number;
  peak: number;
  stars: 0 | 1 | 2 | 3;
  coins: number;
  enemiesKilled: number;
  blocksCollected: number;
  timeSeconds: number;
}

export function computeResult(world: WorldState): RunResult {
  const victory = world.phase === 'victory';
  const survivors = world.squad.count;
  const peak = world.squad.peakCount;
  const eco = CONFIG.economy;
  const mult = world.modifiers.coinMultiplier;
  const levelId = world.level.id;

  let coins: number;
  let stars: 0 | 1 | 2 | 3 = 0;
  if (victory) {
    coins = Math.floor(
      (survivors * eco.coinsPerSurvivor + eco.coinsBossBonus + eco.coinsPerLevel * levelId) * mult,
    );
    const ratio = peak > 0 ? survivors / peak : 0;
    stars = 1;
    if (ratio >= CONFIG.stars.twoStarRatio) stars = 2;
    if (ratio >= CONFIG.stars.threeStarRatio) stars = 3;
  } else {
    coins = Math.floor((world.stats.enemiesKilled / 10) * mult);
  }

  return {
    levelId,
    victory,
    survivors,
    peak,
    stars,
    coins,
    enemiesKilled: world.stats.enemiesKilled,
    blocksCollected: world.stats.blocksCollected,
    timeSeconds: world.time,
  };
}
