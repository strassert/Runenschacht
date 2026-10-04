import { LEVEL_COUNT } from '../core/level/levels';
import type { RunResult } from '../core/scoring';
import {
  DEFAULT_UPGRADE_LEVELS,
  UPGRADES,
  UPGRADE_IDS,
  upgradeCost,
  type UpgradeId,
  type UpgradeLevels,
} from '../core/upgrades';

export type QualitySetting = 'auto' | 'low' | 'medium' | 'high';

export type ControlMode = 'relative' | 'absolute';

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  sensitivity: number;
  quality: QualitySetting;
  reducedMotion: boolean;
  controlMode: ControlMode;
}

export interface SaveData {
  version: 1;
  coins: number;
  highestUnlockedLevel: number;
  /** "1" → 0..3 (beste) */
  levelStars: Record<string, number>;
  /** "1" → 0..1 (bester Fortschritt je Level) */
  levelBestProgress: Record<string, number>;
  upgrades: UpgradeLevels;
  settings: Settings;
  tutorialSeen: Record<string, boolean>;
  stats: { runs: number; wins: number; enemiesKilled: number; bestEndlessRound: number };
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export const SAVE_KEY = 'runenschacht.save.v1';

export function defaultSave(): SaveData {
  return {
    version: 1,
    coins: 0,
    highestUnlockedLevel: 1,
    levelStars: {},
    levelBestProgress: {},
    upgrades: { ...DEFAULT_UPGRADE_LEVELS },
    settings: {
      sound: true,
      music: true,
      haptics: true,
      sensitivity: 1.4,
      quality: 'auto',
      reducedMotion: false,
      controlMode: 'relative',
    },
    tutorialSeen: {},
    stats: { runs: 0, wins: 0, enemiesKilled: 0, bestEndlessRound: 0 },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

function int(v: unknown, min: number, max: number, fallback: number): number {
  return Math.round(num(v, min, max, fallback));
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Fügt geladene (evtl. kaputte/alte) Daten mit Standardwerten zusammen und begrenzt Zahlen. */
export function sanitizeSave(raw: unknown): SaveData {
  const d = defaultSave();
  if (!isObj(raw)) return d;

  d.coins = int(raw.coins, 0, 999_999_999, d.coins);
  d.highestUnlockedLevel = int(raw.highestUnlockedLevel, 1, LEVEL_COUNT + 1, 1);

  if (isObj(raw.levelStars)) {
    for (const [k, v] of Object.entries(raw.levelStars)) {
      if (/^\d+$/.test(k)) d.levelStars[k] = int(v, 0, 3, 0);
    }
  }
  if (isObj(raw.levelBestProgress)) {
    for (const [k, v] of Object.entries(raw.levelBestProgress)) {
      if (/^\d+$/.test(k)) d.levelBestProgress[k] = num(v, 0, 1, 0);
    }
  }
  if (isObj(raw.upgrades)) {
    for (const id of UPGRADE_IDS) d.upgrades[id] = int(raw.upgrades[id], 0, UPGRADES[id].maxLevel, 0);
  }
  if (isObj(raw.settings)) {
    const s = raw.settings;
    d.settings.sound = bool(s.sound, d.settings.sound);
    d.settings.music = bool(s.music, d.settings.music);
    d.settings.haptics = bool(s.haptics, d.settings.haptics);
    d.settings.reducedMotion = bool(s.reducedMotion, d.settings.reducedMotion);
    d.settings.sensitivity = num(s.sensitivity, 0.5, 3, d.settings.sensitivity);
    if (s.controlMode === 'relative' || s.controlMode === 'absolute') d.settings.controlMode = s.controlMode;
    if (s.quality === 'auto' || s.quality === 'low' || s.quality === 'medium' || s.quality === 'high') {
      d.settings.quality = s.quality;
    }
  }
  if (isObj(raw.tutorialSeen)) {
    for (const [k, v] of Object.entries(raw.tutorialSeen)) if (v === true) d.tutorialSeen[k] = true;
  }
  if (isObj(raw.stats)) {
    d.stats.runs = int(raw.stats.runs, 0, 1e9, 0);
    d.stats.wins = int(raw.stats.wins, 0, 1e9, 0);
    d.stats.enemiesKilled = int(raw.stats.enemiesKilled, 0, 1e12, 0);
    d.stats.bestEndlessRound = int(raw.stats.bestEndlessRound, 0, 1e6, 0);
  }
  return d;
}

function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v);
    },
  };
}

export class SaveManager {
  private save: SaveData;
  private readonly storage: StorageLike;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? SaveManager.defaultStorage();
    this.save = this.load();
  }

  private static defaultStorage(): StorageLike {
    try {
      const ls = globalThis.localStorage as Storage | undefined;
      if (ls) {
        ls.setItem('__probe__', '1');
        ls.removeItem('__probe__');
        return ls;
      }
    } catch {
      /* z. B. privater Modus */
    }
    return memoryStorage();
  }

  private load(): SaveData {
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      return sanitizeSave(JSON.parse(raw));
    } catch {
      return defaultSave();
    }
  }

  private persist(): void {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.save));
    } catch {
      /* Speicher voll/gesperrt: Spiel läuft weiter */
    }
  }

  get data(): Readonly<SaveData> {
    return this.save;
  }

  /** Ändert und speichert sofort. */
  update(fn: (d: SaveData) => void): void {
    fn(this.save);
    this.save = sanitizeSave(this.save);
    this.persist();
  }

  /** Wendet ein Laufergebnis an: Münzen, Sterne, Freischaltung, Statistik. */
  applyResult(result: RunResult): { newBestStars: boolean; unlockedLevel: number | null } {
    let newBestStars = false;
    let unlockedLevel: number | null = null;
    this.update((d) => {
      d.stats.runs++;
      d.stats.enemiesKilled += result.enemiesKilled;
      d.coins += result.coins;
      if (result.victory) d.stats.wins++;
      if (result.levelId <= LEVEL_COUNT) {
        const k = String(result.levelId);
        d.levelBestProgress[k] = Math.max(d.levelBestProgress[k] ?? 0, result.victory ? 1 : result.progress);
      }
      if (result.levelId > 1000) {
        const round = result.levelId - 1000;
        d.stats.bestEndlessRound = Math.max(d.stats.bestEndlessRound, result.victory ? round : round - 1);
      }
      if (result.victory && result.levelId <= LEVEL_COUNT) {
        const key = String(result.levelId);
        const prev = d.levelStars[key] ?? 0;
        if (result.stars > prev) {
          d.levelStars[key] = result.stars;
          newBestStars = true;
        }
        const next = Math.min(LEVEL_COUNT + 1, result.levelId + 1);
        if (next > d.highestUnlockedLevel) {
          d.highestUnlockedLevel = next;
          unlockedLevel = next;
        }
      }
    });
    return { newBestStars, unlockedLevel };
  }

  /** Kauft ein Upgrade, wenn genug Münzen vorhanden und nicht am Maximum. */
  buyUpgrade(id: UpgradeId): boolean {
    const cost = upgradeCost(id, this.save.upgrades[id]);
    if (cost === null || this.save.coins < cost) return false;
    this.update((d) => {
      d.coins -= cost;
      d.upgrades[id]++;
    });
    return true;
  }

  reset(): void {
    this.save = defaultSave();
    this.persist();
  }
}
