# Phase 1 – Core-Grundlagen (reine Logik)

Alle Dateien dieser Phase liegen in `src/core/` und dürfen weder `three` noch DOM verwenden.
Jede Datei bekommt Unit-Tests (`*.test.ts` daneben).

---

## Schritt 1.1 – Zentrale Konfiguration

**Ziel:** Alle Spielkonstanten an einer Stelle.

**Dateien:** `src/core/config.ts`, `src/core/config.test.ts`

**Umsetzung:** Datei exakt so anlegen:

```ts
/** Alle Spielkonstanten. Werte siehe docs/plan/00-game-design.md. */
export interface WeaponDef {
  id: 'pistol' | 'rifle' | 'laser' | 'plasma';
  name: string;
  fireInterval: number;
  damage: number;
  bulletSpeed: number;
  range: number;
  tracerColor: number;
}

export const WEAPONS: readonly WeaponDef[] = [
  { id: 'pistol', name: 'Pistole', fireInterval: 0.45, damage: 1, bulletSpeed: 34, range: 26, tracerColor: 0xffc86b },
  { id: 'rifle', name: 'Sturmgewehr', fireInterval: 0.3, damage: 1, bulletSpeed: 40, range: 28, tracerColor: 0xffe08a },
  { id: 'laser', name: 'Lasergewehr', fireInterval: 0.22, damage: 1.5, bulletSpeed: 55, range: 30, tracerColor: 0x6fd8ff },
  { id: 'plasma', name: 'Plasmawerfer', fireInterval: 0.18, damage: 2, bulletSpeed: 50, range: 32, tracerColor: 0xc58bff },
];

export const CONFIG = {
  sim: { dt: 1 / 60, maxStepsPerFrame: 8 },
  track: { width: 12, halfWidth: 6, railMargin: 0.35, laneCenters: [-4.5, 0, 4.5] },
  squad: {
    baseStartSoldiers: 8,
    maxSoldiers: 999,
    forwardSpeed: 7,
    lateralResponse: 10,
    lateralMaxSpeed: 16,
    slotSpacing: 0.34,
    minSlotSpacing: 0.17,
    soldierRadius: 0.22,
    maxRenderedSoldiers: 300,
  },
  shooting: { maxShooters: 48, maxBullets: 1500, muzzleOffsetZ: 0.4 },
  enemy: {
    radius: 0.3,
    speed: 3.6,
    aggroDistance: 20,
    steerDistance: 8,
    steerGain: 1.5,
    spill: 1.2,
    despawnBehind: 4,
    gridSpacing: 0.55,
    jitter: 0.12,
    maxEnemies: 2000,
  },
  block: { width: 1.6, depth: 0.7 },
  card: { depth: 0.4, defaultWidth: 3.4, wallDamagePerSoldier: 1 },
  gate: { depth: 0.5 },
  boss: {
    defaultSpeed: 2.2,
    defaultContactKillRate: 12,
    defaultScale: 3,
    radiusPerScale: 0.5,
    startOffset: 24,
    activationDistance: 10,
  },
  hero: { hp: 60, fireInterval: 0.08, damage: 2, bulletSpeed: 45, range: 30, followOffsetZ: 1.0, radius: 0.8 },
  outcome: { victoryDelay: 1.5, defeatDelay: 1.0 },
  economy: { coinsPerSurvivor: 1, coinsBossBonus: 50, coinsPerLevel: 10 },
  stars: { twoStarRatio: 0.25, threeStarRatio: 0.5 },
} as const;

/** Maximale |x| der Truppmitte, damit ein Trupp mit Radius r auf der Brücke bleibt. */
export const TRACK_INNER_HALF_WIDTH = CONFIG.track.halfWidth - CONFIG.track.railMargin; // 5.65
```

Test `config.test.ts`:
- `WEAPONS.length === 4`, Feuerintervalle streng fallend.
- `TRACK_INNER_HALF_WIDTH` ≈ 5.65 (`toBeCloseTo`).

**Akzeptanzkriterien:** [ ] `npm run check` grün.

**Commit:** `feat(core): add central game config`

---

## Schritt 1.2 – Mathe-Helfer

**Dateien:** `src/core/math.ts`, `src/core/math.test.ts`; `src/core/sanity.test.ts` löschen.

**Umsetzung:** Folgende Funktionen exportieren (alle rein, ohne Allokation):

```ts
export function clamp(v: number, min: number, max: number): number;
export function lerp(a: number, b: number, t: number): number;
export function inverseLerp(a: number, b: number, v: number): number; // b===a → 0
/** Framerate-unabhängige Annäherung: a + (b - a) * (1 - exp(-lambda * dt)) */
export function damp(a: number, b: number, lambda: number, dt: number): number;
/** Bewegt a Richtung b um höchstens maxDelta. */
export function approach(a: number, b: number, maxDelta: number): number;
/** Kreis (cx,cz,r) schneidet Rechteck (Mitte rx,rz; halbe Ausdehnung hw,hd)? */
export function circleIntersectsRect(cx: number, cz: number, r: number, rx: number, rz: number, hw: number, hd: number): boolean;
export function distSq(ax: number, az: number, bx: number, bz: number): number;
export function easeOutCubic(t: number): number;
export function easeOutBack(t: number): number; // c1 = 1.70158
export function formatCount(n: number): string; // < 1000: ganzzahlig; sonst "1.2k"
```

`circleIntersectsRect`: nächsten Punkt im Rechteck berechnen (`clamp`), dann Distanz² ≤ r².

**Tests:** je Funktion ≥ 2 Fälle, u. a.:
- `damp(0, 10, 10, 1/60)` liegt zwischen 0 und 10; `damp(0,10,10,100)` ≈ 10.
- `approach(0, 5, 2) === 2`, `approach(4, 5, 2) === 5`, `approach(5, 0, 2) === 3`.
- `circleIntersectsRect(0,0,1, 1.5,0, 0.6,0.5) === true`, `(0,0,1, 3,0, 0.5,0.5) === false`.
- `formatCount(999) === '999'`, `formatCount(1234) === '1.2k'`.

**Commit:** `feat(core): add math helpers`

---

## Schritt 1.3 – Deterministischer Zufallsgenerator

**Dateien:** `src/core/rng.ts`, `src/core/rng.test.ts`

**Umsetzung:**

```ts
/** Seeded RNG (mulberry32). */
export class Rng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0 || 0x9e3779b9; }
  /** [0, 1) */
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  int(min: number, maxInclusive: number): number { return Math.floor(this.range(min, maxInclusive + 1)); }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p: number): boolean { return this.next() < p; }
  /** Für Speicher/Debug */
  getState(): number { return this.state; }
}
```

**Tests:**
- Gleicher Seed → identische Folge von 100 Zahlen.
- Verschiedene Seeds → unterschiedliche erste Zahl.
- 10 000 Werte von `next()` alle in `[0,1)`, Mittelwert zwischen 0.45 und 0.55.
- `int(1, 3)` liefert nur 1, 2, 3 und alle drei kommen vor (1000 Ziehungen).

**Commit:** `feat(core): add seeded rng`

---

## Schritt 1.4 – Level-Typen und Simulations-Ereignisse

**Dateien:** `src/core/level/types.ts`, `src/core/events.ts`, `src/core/types.ts` (nur die
String-Union-Typen vorerst, siehe unten)

**Umsetzung:**

1. `src/core/types.ts` **zunächst nur** mit den Union-Typen anlegen (der Rest folgt in 1.6):
   `WorldPhase`, `BlockColor`, `GateOp`, `CardKind`, `CardState`, `BossStateName`
   (Definitionen aus `01-architecture.md`, Abschnitt 4).

2. `src/core/level/types.ts`:
   ```ts
   import type { BlockColor, CardKind, GateOp } from '../types';

   export interface BlockDef { x: number; z: number; value: number; color?: BlockColor }
   /** Spalte gleichartiger Blöcke von zStart bis einschließlich zEnd (sofern auf dem Raster). */
   export interface BlockColumnDef { x: number; zStart: number; zEnd: number; spacing: number; value: number; color?: BlockColor }
   export interface GateOptionDef { xMin: number; xMax: number; op: GateOp; value: number }
   export interface GateDef { z: number; options: GateOptionDef[] }
   export interface CardDef { kind: CardKind; x: number; z: number; hp: number; width?: number; reward?: number }
   export interface HordeDef { zStart: number; zEnd: number; xMin: number; xMax: number; count: number; hp?: number }
   export interface BossDef { hp: number; speed?: number; contactKillRate?: number; scale?: number }

   export interface LevelDef {
     id: number;
     name: string;
     seed: number;
     /** z, an dem der Trupp stoppt und der Bosskampf beginnt */
     arenaZ: number;
     /** zusätzliche Startsoldaten (zu CONFIG.squad.baseStartSoldiers) */
     startSoldiers?: number;
     startWeaponTier?: number;
     blocks?: BlockDef[];
     blockColumns?: BlockColumnDef[];
     gates?: GateDef[];
     cards?: CardDef[];
     hordes?: HordeDef[];
     boss: BossDef;
   }
   ```
   Standardfarbe eines Blocks (wenn `color` fehlt): `value >= 10 ? 'gold' : 'blue'`.

3. `src/core/events.ts`:
   ```ts
   import type { CardKind, GateOp, WorldPhase } from './types';

   export type SoldierChangeReason = 'block' | 'gate' | 'card' | 'enemy' | 'boss' | 'wall';

   export type SimEvent =
     | { type: 'phaseChanged'; phase: WorldPhase }
     | { type: 'soldiersChanged'; delta: number; count: number; reason: SoldierChangeReason; x: number; z: number }
     | { type: 'blockCollected'; id: number; value: number; x: number; z: number }
     | { type: 'gatePassed'; id: number; optionIndex: number; op: GateOp; value: number; before: number; after: number }
     | { type: 'cardDamaged'; id: number; hp: number; maxHp: number }
     | { type: 'cardUnlocked'; id: number; kind: CardKind; x: number; z: number }
     | { type: 'cardSmashed'; id: number; lost: number; x: number; z: number }
     | { type: 'weaponUpgraded'; tier: number }
     | { type: 'heroJoined' }
     | { type: 'heroDamaged'; hp: number; maxHp: number }
     | { type: 'heroDied'; x: number; z: number }
     | { type: 'enemyKilled'; x: number; z: number; byBullet: boolean }
     | { type: 'shotsFired'; owner: 'squad' | 'hero'; count: number }
     | { type: 'bossActivated' }
     | { type: 'bossDamaged'; hp: number; maxHp: number }
     | { type: 'bossDefeated'; x: number; z: number };

   export type SimEventType = SimEvent['type'];

   /** Hängt ein Ereignis an die Ereignisliste der Welt an. */
   export function emit(target: { events: SimEvent[] }, event: SimEvent): void {
     target.events.push(event);
   }
   ```
   Wichtig: `shotsFired` wird **höchstens einmal pro Besitzer und Schritt** gesendet (aggregiert).

**Tests:** `src/core/events.test.ts`: `emit` hängt an; Reihenfolge bleibt erhalten.

**Commit:** `feat(core): add level definition types and sim events`

---

## Schritt 1.5 – Objekt-Pools für Projektile und Gegner

**Ziel:** Allokationsfreie Speicherung vieler Projektile/Gegner (Struct-of-Arrays).

**Dateien:** `src/core/pools/BulletPool.ts`, `src/core/pools/EnemyPool.ts`, je `*.test.ts`

**Umsetzung `BulletPool.ts`:**
```ts
export const OWNER_SQUAD = 0;
export const OWNER_HERO = 1;

export class BulletPool {
  readonly capacity: number;
  count = 0;
  readonly x: Float32Array;
  readonly z: Float32Array;
  readonly prevZ: Float32Array;
  readonly traveled: Float32Array;
  readonly speed: Float32Array;
  readonly range: Float32Array;
  readonly damage: Float32Array;
  readonly owner: Uint8Array;
  readonly tier: Uint8Array;   // Waffenstufe (für Farbe), Held = 255

  constructor(capacity: number) { /* alle Arrays mit Länge capacity anlegen */ }

  /** Fügt ein Projektil hinzu. Gibt false zurück, wenn voll. */
  spawn(x: number, z: number, speed: number, range: number, damage: number, owner: number, tier: number): boolean;

  /** Entfernt Index i durch Tausch mit dem letzten Element. Beim Iterieren RÜCKWÄRTS laufen. */
  remove(i: number): void;

  clear(): void; // count = 0
}
```
`spawn` setzt `prevZ = z`, `traveled = 0`.

**Umsetzung `EnemyPool.ts`:**
```ts
export class EnemyPool {
  readonly capacity: number;
  count = 0;
  readonly x: Float32Array;
  readonly z: Float32Array;
  readonly hp: Float32Array;
  readonly animPhase: Float32Array; // 0..2π, nur Optik
  readonly charging: Uint8Array;    // 0 = idle, 1 = charging
  readonly horde: Uint16Array;      // Index in level.hordes

  constructor(capacity: number);
  /** Gibt neuen Index zurück oder -1, wenn voll. */
  spawn(x: number, z: number, hp: number, horde: number, animPhase: number): number;
  remove(i: number): void; // Swap-Remove, alle Arrays mittauschen
  clear(): void;
}
```

**Tests (je Pool):**
- `spawn` erhöht `count`, Werte stehen am Index.
- `remove(0)` bei 3 Elementen: `count === 2`, Index 0 enthält jetzt die Werte des alten Index 2.
- Volle Kapazität → `spawn` liefert `false` bzw. `-1`.
- Rückwärts-Iteration mit Entfernen jedes zweiten Elements entfernt genau die richtigen (Werte prüfen).

**Commit:** `feat(core): add struct-of-arrays pools for bullets and enemies`

---

## Schritt 1.6 – Welt-Typen vervollständigen

**Dateien:** `src/core/types.ts`

**Umsetzung:** Alle Interfaces aus `01-architecture.md`, Abschnitt 4, ergänzen
(`SquadState`, `HeroState`, `BonusBlock`, `GateOption`, `Gate`, `Card`, `BossState`,
`RunModifiers`, `WorldStats`, `WorldState`). Imports ausschließlich als `import type`.

**Tests:** keine (nur Typen). `npm run typecheck` muss grün sein.

**Commit:** `feat(core): add world state types`

---

## Schritt 1.7 – Formation (Phyllotaxis-Spirale)

**Dateien:** `src/core/formation.ts`, `src/core/formation.test.ts`

**Umsetzung:**

```ts
import { CONFIG, TRACK_INNER_HALF_WIDTH } from './config';

export const GOLDEN_ANGLE = (137.50776 * Math.PI) / 180;
const MAX = CONFIG.squad.maxSoldiers;

/** Einheits-Slots (c = 1), einmalig vorberechnet. */
export const UNIT_SLOT_X = new Float32Array(MAX);
export const UNIT_SLOT_Z = new Float32Array(MAX);
for (let i = 0; i < MAX; i++) {
  const r = Math.sqrt(i + 0.5);
  const a = i * GOLDEN_ANGLE;
  UNIT_SLOT_X[i] = r * Math.cos(a);
  UNIT_SLOT_Z[i] = r * Math.sin(a);
}

/** Slot-Abstand c nach Kompression (Game Design 4.1). */
export function computeSlotSpacing(count: number): number {
  if (count <= 0) return CONFIG.squad.slotSpacing;
  const maxC = (TRACK_INNER_HALF_WIDTH - CONFIG.squad.soldierRadius) / Math.sqrt(count);
  return Math.max(CONFIG.squad.minSlotSpacing, Math.min(CONFIG.squad.slotSpacing, maxC));
}

/** Truppradius R. Bei count 0: 0. */
export function computeSquadRadius(count: number, spacing: number): number {
  return count <= 0 ? 0 : spacing * Math.sqrt(count) + CONFIG.squad.soldierRadius;
}

/** Maximal erlaubtes |x| der Truppmitte. */
export function maxSquadX(radius: number): number {
  return Math.max(0, TRACK_INNER_HALF_WIDTH - radius);
}

/** Zählt Slots 0..count-1, deren Welt-x in [xMin - margin, xMax + margin] liegt. */
export function countSlotsInXRange(count: number, spacing: number, squadX: number, xMin: number, xMax: number, margin: number): number;
```

**Tests:**
- `computeSlotSpacing(10) === 0.34`; `computeSlotSpacing(999)` ≥ 0.17 und < 0.34.
- `computeSquadRadius(0, 0.34) === 0`; `computeSquadRadius(100, 0.34)` ≈ 3.62.
- Für count ∈ {1, 50, 300, 999}: `computeSquadRadius(count, computeSlotSpacing(count))` ≤ 5.65 + 0.5.
- Keine zwei der ersten 300 Einheits-Slots haben Abstand < 0.5 (Spirale ist gleichmäßig).
- `countSlotsInXRange(50, 0.34, 0, -100, 100, 0) === 50`; mit Bereich `[10, 20]` → `0`.

**Commit:** `feat(core): add phyllotaxis formation helpers`

---

## Schritt 1.8 – Räumliche Z-Buckets (Broadphase)

**Ziel:** Projektil-gegen-Gegner-Kollision ohne O(n·m).

**Dateien:** `src/core/spatial/ZBuckets.ts`, `src/core/spatial/ZBuckets.test.ts`

**Umsetzung:** Counting-Sort-Buckets entlang z:
```ts
export class ZBuckets {
  private readonly cellStart: Int32Array;   // Länge maxCells + 1
  private readonly items: Int32Array;       // Länge capacity
  private readonly cellOf: Int32Array;      // Länge capacity (temporär)
  private origin = 0;
  private cells = 0;

  constructor(capacity: number, readonly cellSize = 2, readonly maxCells = 1024);

  /** Baut die Buckets aus z[0..count-1] neu auf. */
  rebuild(z: Float32Array, count: number): void;
  // 1. minZ/maxZ bestimmen; origin = minZ; cells = min(maxCells, floor((maxZ-minZ)/cellSize)+1)
  // 2. cellOf[i] = clamp(floor((z[i]-origin)/cellSize), 0, cells-1); Zähler in cellStart
  // 3. Präfixsumme, dann items befüllen (stabile Reihenfolge)

  /** Schreibt alle Indizes mit Zelle in [zMin, zMax] nach out (ab Position 0); gibt Anzahl zurück. */
  query(zMin: number, zMax: number, out: Int32Array): number;
}
```
`query` darf mehr Kandidaten liefern als exakt nötig (Zellgranularität), aber nie zu wenige.

**Tests:**
- 1000 zufällige z-Werte (Rng mit Seed 1) in [0, 300]: für 50 zufällige Abfragen enthält das
  Ergebnis **alle** Indizes, deren z im Bereich liegt (Vergleich mit Brute-Force).
- Leerer Aufbau (`count = 0`) → `query` liefert 0.

**Commit:** `feat(core): add z-bucket broadphase`

---

## Schritt 1.9 – Shop-Formeln und Laufzeit-Modifikatoren

**Dateien:** `src/core/upgrades.ts`, `src/core/upgrades.test.ts`

**Umsetzung:**
```ts
import type { RunModifiers } from './types';

export type UpgradeId = 'startSoldiers' | 'fireRate' | 'coinBonus';
export type UpgradeLevels = Record<UpgradeId, number>;

export interface UpgradeDef { id: UpgradeId; name: string; description: string; maxLevel: number; baseCost: number; growth: number }

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  startSoldiers: { id: 'startSoldiers', name: 'Verstärkung', description: '+2 Soldaten zum Start', maxLevel: 10, baseCost: 40, growth: 1.45 },
  fireRate: { id: 'fireRate', name: 'Feuerrate', description: '+6 % Schüsse pro Sekunde', maxLevel: 10, baseCost: 60, growth: 1.5 },
  coinBonus: { id: 'coinBonus', name: 'Beute', description: '+10 % Münzen', maxLevel: 10, baseCost: 80, growth: 1.5 },
};

export const DEFAULT_UPGRADE_LEVELS: UpgradeLevels = { startSoldiers: 0, fireRate: 0, coinBonus: 0 };

/** Preis für die nächste Stufe oder null, wenn ausgereizt. */
export function upgradeCost(id: UpgradeId, currentLevel: number): number | null;

export function modifiersFromUpgrades(levels: UpgradeLevels): RunModifiers {
  return {
    startSoldierBonus: levels.startSoldiers * 2,
    fireRateMultiplier: 1 + 0.06 * levels.fireRate,
    coinMultiplier: 1 + 0.1 * levels.coinBonus,
  };
}
```

**Tests:** `upgradeCost('startSoldiers', 0) === 40`, `upgradeCost('fireRate', 2) === 135`,
`upgradeCost('coinBonus', 10) === null`, `modifiersFromUpgrades({startSoldiers:3,fireRate:5,coinBonus:0})`
→ `{6, 1.3, 1}` (mit `toBeCloseTo`).

**Commit:** `feat(core): add upgrade cost formulas and run modifiers`
