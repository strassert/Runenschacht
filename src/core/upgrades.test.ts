import { describe, it, expect } from 'vitest';
import { canAffordAny, modifiersFromUpgrades, upgradeCost } from './upgrades';

describe('upgrades', () => {
  it('costs', () => {
    expect(upgradeCost('startSoldiers', 0)).toBe(40);
    expect(upgradeCost('fireRate', 2)).toBe(135);
    expect(upgradeCost('coinBonus', 10)).toBeNull();
  });
  it('modifiers', () => {
    const m = modifiersFromUpgrades({ startSoldiers: 3, fireRate: 5, coinBonus: 0 });
    expect(m.startSoldierBonus).toBe(6);
    expect(m.fireRateMultiplier).toBeCloseTo(1.3, 5);
    expect(m.coinMultiplier).toBeCloseTo(1, 5);
  });
  it('detects affordable upgrades', () => {
    const levels = { startSoldiers: 0, fireRate: 0, coinBonus: 0 };
    expect(canAffordAny(39, levels)).toBe(false);
    expect(canAffordAny(40, levels)).toBe(true);
  });
});
