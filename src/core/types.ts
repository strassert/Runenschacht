import type { Rng } from './rng';
import type { SimEvent } from './events';
import type { LevelDef } from './level/types';
import type { BulletPool } from './pools/BulletPool';
import type { EnemyPool } from './pools/EnemyPool';

export type WorldPhase = 'ready' | 'running' | 'bossFight' | 'victory' | 'defeat';
export type BlockColor = 'blue' | 'gold';
export type GateOp = 'add' | 'sub' | 'mul' | 'div';
export type CardKind = 'weapon' | 'hero' | 'soldiers';
export type CardState = 'locked' | 'unlocked' | 'smashed';
export type BossStateName = 'dormant' | 'walking' | 'attacking' | 'dead';

export interface SquadState {
  x: number;
  z: number;
  /** z vor dem aktuellen Schritt (für Tor-Überquerung) */
  prevZ: number;
  targetX: number;
  count: number;
  peakCount: number;
  /** R, siehe Game Design 4.1 */
  radius: number;
  /** c (nach Kompression) */
  slotSpacing: number;
  /** 0..3 */
  weaponTier: number;
  fireAccumulator: number;
  nextShooter: number;
  /** true in der Arena */
  stopped: boolean;
}

export interface HeroState {
  active: boolean;
  hp: number;
  maxHp: number;
  x: number;
  z: number;
  fireAccumulator: number;
}

export interface BonusBlock {
  id: number;
  x: number;
  z: number;
  value: number;
  color: BlockColor;
  collected: boolean;
}

export interface GateOption {
  xMin: number;
  xMax: number;
  op: GateOp;
  value: number;
}

export interface Gate {
  id: number;
  z: number;
  options: GateOption[];
  passed: boolean;
  /** -1 solange nicht passiert / keine Option getroffen */
  chosenOption: number;
}

export interface Card {
  id: number;
  kind: CardKind;
  x: number;
  z: number;
  width: number;
  hp: number;
  maxHp: number;
  /** nur für kind === 'soldiers' */
  reward: number;
  state: CardState;
}

export interface BossState {
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  radius: number;
  scale: number;
  speed: number;
  contactKillRate: number;
  killAccumulator: number;
  state: BossStateName;
}

export interface RunModifiers {
  /** aus Shop */
  startSoldierBonus: number;
  /** 1 + 0.06 * Stufe */
  fireRateMultiplier: number;
  /** 1 + 0.10 * Stufe */
  coinMultiplier: number;
}

export interface WorldStats {
  enemiesKilled: number;
  blocksCollected: number;
  soldiersLost: number;
  soldiersGained: number;
  damageDealt: number;
  shotsFired: number;
}

export interface WorldState {
  level: LevelDef;
  rng: Rng;
  time: number;
  tick: number;
  phase: WorldPhase;
  outcomeTimer: number;
  arenaZ: number;
  squad: SquadState;
  hero: HeroState;
  blocks: BonusBlock[];
  gates: Gate[];
  cards: Card[];
  enemies: EnemyPool;
  bullets: BulletPool;
  boss: BossState;
  modifiers: RunModifiers;
  stats: WorldStats;
  events: SimEvent[];
}
