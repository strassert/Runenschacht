import type { RunModifiers } from './types';

export type UpgradeId = 'startSoldiers' | 'fireRate' | 'coinBonus';
export type UpgradeLevels = Record<UpgradeId, number>;

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  growth: number;
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  startSoldiers: {
    id: 'startSoldiers',
    name: 'Verstärkung',
    description: '+2 Soldaten zum Start',
    maxLevel: 10,
    baseCost: 40,
    growth: 1.45,
  },
  fireRate: {
    id: 'fireRate',
    name: 'Feuerrate',
    description: '+6 % Schüsse pro Sekunde',
    maxLevel: 10,
    baseCost: 60,
    growth: 1.5,
  },
  coinBonus: {
    id: 'coinBonus',
    name: 'Beute',
    description: '+10 % Münzen',
    maxLevel: 10,
    baseCost: 80,
    growth: 1.5,
  },
};

export const UPGRADE_IDS: readonly UpgradeId[] = ['startSoldiers', 'fireRate', 'coinBonus'];

export const DEFAULT_UPGRADE_LEVELS: UpgradeLevels = { startSoldiers: 0, fireRate: 0, coinBonus: 0 };

/** Preis für die nächste Stufe oder null, wenn ausgereizt. */
export function upgradeCost(id: UpgradeId, currentLevel: number): number | null {
  const def = UPGRADES[id];
  if (currentLevel >= def.maxLevel) return null;
  return Math.round(def.baseCost * Math.pow(def.growth, currentLevel));
}

export function modifiersFromUpgrades(levels: UpgradeLevels): RunModifiers {
  return {
    startSoldierBonus: levels.startSoldiers * 2,
    fireRateMultiplier: 1 + 0.06 * levels.fireRate,
    coinMultiplier: 1 + 0.1 * levels.coinBonus,
  };
}
