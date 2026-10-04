import { CONFIG } from './config';
import { emit, type SoldierChangeReason } from './events';
import { computeSlotSpacing, computeSquadRadius } from './formation';
import { expandLevel } from './level/expand';
import type { LevelDef } from './level/types';
import { clamp } from './math';
import { BulletPool } from './pools/BulletPool';
import { EnemyPool } from './pools/EnemyPool';
import { Rng } from './rng';
import type { RunModifiers, WorldPhase, WorldState } from './types';

export const DEFAULT_MODIFIERS: RunModifiers = {
  startSoldierBonus: 0,
  fireRateMultiplier: 1,
  coinMultiplier: 1,
};

/** Erzeugt den Startzustand für ein Level. */
export function createWorld(level: LevelDef, modifiers: RunModifiers = DEFAULT_MODIFIERS): WorldState {
  const rng = new Rng(level.seed);
  const expanded = expandLevel(level, rng);
  const count = Math.min(
    CONFIG.squad.maxSoldiers,
    CONFIG.squad.baseStartSoldiers + (level.startSoldiers ?? 0) + modifiers.startSoldierBonus,
  );

  const enemies = new EnemyPool(CONFIG.enemy.maxEnemies);
  for (const e of expanded.enemies) enemies.spawn(e.x, e.z, e.hp, e.horde, e.animPhase);

  const bossDef = level.boss;
  const scale = bossDef.scale ?? CONFIG.boss.defaultScale;

  const world: WorldState = {
    level,
    rng,
    time: 0,
    tick: 0,
    phase: 'ready',
    outcomeTimer: 0,
    arenaZ: level.arenaZ,
    squad: {
      x: 0,
      z: 0,
      prevZ: 0,
      targetX: 0,
      count,
      peakCount: count,
      radius: 0,
      slotSpacing: CONFIG.squad.slotSpacing,
      weaponTier: level.startWeaponTier ?? 0,
      fireAccumulator: 0,
      nextShooter: 0,
      stopped: false,
    },
    hero: { active: false, hp: 0, maxHp: CONFIG.hero.hp, x: 0, z: 0, fireAccumulator: 0 },
    blocks: expanded.blocks.map((b, id) => ({
      id,
      x: b.x,
      z: b.z,
      value: b.value,
      color: b.color,
      collected: false,
    })),
    gates: expanded.gates.map((g, id) => ({
      id,
      z: g.z,
      options: g.options.map((o) => ({ ...o })),
      passed: false,
      chosenOption: -1,
    })),
    cards: expanded.cards.map((c, id) => ({
      id,
      kind: c.kind,
      x: c.x,
      z: c.z,
      width: c.width,
      hp: c.hp,
      maxHp: c.hp,
      reward: c.reward,
      state: 'locked',
    })),
    enemies,
    bullets: new BulletPool(CONFIG.shooting.maxBullets),
    boss: {
      x: 0,
      z: level.arenaZ + CONFIG.boss.startOffset,
      hp: bossDef.hp,
      maxHp: bossDef.hp,
      radius: scale * CONFIG.boss.radiusPerScale,
      scale,
      speed: bossDef.speed ?? CONFIG.boss.defaultSpeed,
      contactKillRate: bossDef.contactKillRate ?? CONFIG.boss.defaultContactKillRate,
      killAccumulator: 0,
      state: 'dormant',
    },
    modifiers,
    stats: {
      enemiesKilled: 0,
      blocksCollected: 0,
      soldiersLost: 0,
      soldiersGained: 0,
      damageDealt: 0,
      shotsFired: 0,
      lastLossReason: null,
    },
    events: [],
  };
  refreshFormation(world);
  return world;
}

/** Setzt die Phase und sendet phaseChanged, falls sie sich ändert. */
export function setPhase(world: WorldState, phase: WorldPhase): void {
  if (world.phase === phase) return;
  world.phase = phase;
  emit(world, { type: 'phaseChanged', phase });
}

/** Berechnet slotSpacing, radius und peakCount neu. */
export function refreshFormation(world: WorldState): void {
  const s = world.squad;
  s.slotSpacing = computeSlotSpacing(s.count);
  s.radius = computeSquadRadius(s.count, s.slotSpacing);
  if (s.count > s.peakCount) s.peakCount = s.count;
}

/**
 * Ändert die Truppgröße (begrenzt auf 0..maxSoldiers), aktualisiert Formation, Statistik
 * und sendet soldiersChanged. Gibt die tatsächliche Änderung zurück.
 */
export function changeSoldiers(world: WorldState, delta: number, reason: SoldierChangeReason): number {
  const s = world.squad;
  const before = s.count;
  s.count = clamp(Math.round(before + delta), 0, CONFIG.squad.maxSoldiers);
  const actual = s.count - before;
  if (actual === 0) return 0;
  if (actual > 0) world.stats.soldiersGained += actual;
  else {
    world.stats.soldiersLost -= actual;
    world.stats.lastLossReason = reason;
  }
  refreshFormation(world);
  emit(world, { type: 'soldiersChanged', delta: actual, count: s.count, reason, x: s.x, z: s.z });
  return actual;
}
