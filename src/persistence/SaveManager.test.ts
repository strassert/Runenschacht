import { describe, it, expect } from 'vitest';
import { SAVE_KEY, SaveManager, defaultSave, sanitizeSave, type StorageLike } from './SaveManager';
import type { RunResult } from '../core/scoring';

function fakeStorage(initial?: string): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(SAVE_KEY, initial);
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const win = (over: Partial<RunResult> = {}): RunResult => ({
  levelId: 1,
  victory: true,
  survivors: 50,
  peak: 60,
  stars: 3,
  coins: 100,
  enemiesKilled: 200,
  blocksCollected: 10,
  timeSeconds: 40,
  ...over,
});

describe('SaveManager', () => {
  it('uses defaults for an empty storage', () => {
    const m = new SaveManager(fakeStorage());
    expect(m.data).toEqual(defaultSave());
    expect(m.data.settings.sensitivity).toBe(1.4);
    expect(m.data.highestUnlockedLevel).toBe(1);
  });
  it('falls back to defaults for broken json', () => {
    const m = new SaveManager(fakeStorage('{not json'));
    expect(m.data).toEqual(defaultSave());
  });
  it('fills in partial data and clamps numbers', () => {
    const d = sanitizeSave({ coins: -50, settings: { sensitivity: 99 }, upgrades: { fireRate: 99 } });
    expect(d.coins).toBe(0);
    expect(d.settings.sensitivity).toBe(3);
    expect(d.upgrades.fireRate).toBe(10);
    expect(d.settings.sound).toBe(true);
  });
  it('rejects non-objects', () => {
    expect(sanitizeSave(42)).toEqual(defaultSave());
    expect(sanitizeSave(null)).toEqual(defaultSave());
  });
  it('applies a victory: coins, stars, unlock, stats', () => {
    const s = fakeStorage();
    const m = new SaveManager(s);
    const r = m.applyResult(win());
    expect(r).toEqual({ newBestStars: true, unlockedLevel: 2 });
    expect(m.data.coins).toBe(100);
    expect(m.data.levelStars['1']).toBe(3);
    expect(m.data.highestUnlockedLevel).toBe(2);
    expect(m.data.stats.wins).toBe(1);
    expect(JSON.parse(s.map.get(SAVE_KEY)!).coins).toBe(100);
  });
  it('keeps the best stars', () => {
    const m = new SaveManager(fakeStorage());
    m.applyResult(win({ stars: 3 }));
    const r = m.applyResult(win({ stars: 1 }));
    expect(r.newBestStars).toBe(false);
    expect(m.data.levelStars['1']).toBe(3);
  });
  it('applies a defeat: coins but no unlock', () => {
    const m = new SaveManager(fakeStorage());
    m.applyResult(win({ victory: false, stars: 0, coins: 7 }));
    expect(m.data.coins).toBe(7);
    expect(m.data.highestUnlockedLevel).toBe(1);
    expect(m.data.stats.wins).toBe(0);
    expect(m.data.stats.runs).toBe(1);
  });
  it('buys upgrades only with enough coins and below max', () => {
    const m = new SaveManager(fakeStorage());
    expect(m.buyUpgrade('startSoldiers')).toBe(false);
    m.update((d) => {
      d.coins = 100;
    });
    expect(m.buyUpgrade('startSoldiers')).toBe(true);
    expect(m.data.coins).toBe(60);
    expect(m.data.upgrades.startSoldiers).toBe(1);
    m.update((d) => {
      d.coins = 1_000_000;
      d.upgrades.coinBonus = 10;
    });
    expect(m.buyUpgrade('coinBonus')).toBe(false);
  });
  it('does not crash when setItem throws', () => {
    const bad: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const m = new SaveManager(bad);
    expect(() => m.update((d) => (d.coins = 5))).not.toThrow();
    expect(m.data.coins).toBe(5);
  });
  it('reset restores defaults', () => {
    const m = new SaveManager(fakeStorage());
    m.update((d) => (d.coins = 50));
    m.reset();
    expect(m.data).toEqual(defaultSave());
  });
});
