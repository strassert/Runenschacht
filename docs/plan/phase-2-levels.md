# Phase 2 – Level-Daten

Level werden als TypeScript-Daten (`LevelDef`, siehe Schritt 1.4) beschrieben, vor dem Start
validiert und dann in einzelne Objekte „expandiert“ (Blockspalten → Einzelblöcke,
Horden → Gegnerpositionen).

---

## Schritt 2.1 – Level-Expansion

**Ziel:** Aus einem `LevelDef` werden konkrete, nach z sortierte Spawn-Listen.

**Dateien:** `src/core/level/expand.ts`, `src/core/level/expand.test.ts`

**Umsetzung:**

```ts
import { CONFIG } from '../config';
import type { Rng } from '../rng';
import type { BlockColor, CardKind } from '../types';
import type { GateDef, LevelDef } from './types';

export interface BlockSpawn { x: number; z: number; value: number; color: BlockColor }
export interface CardSpawn { kind: CardKind; x: number; z: number; hp: number; width: number; reward: number }
export interface EnemySpawn { x: number; z: number; hp: number; horde: number; animPhase: number }
export interface ExpandedLevel { blocks: BlockSpawn[]; gates: GateDef[]; cards: CardSpawn[]; enemies: EnemySpawn[] }

export function defaultBlockColor(value: number): BlockColor { return value >= 10 ? 'gold' : 'blue'; }

/** Expandiert ein Level deterministisch. rng wird nur für Gegner-Jitter/animPhase benutzt. */
export function expandLevel(level: LevelDef, rng: Rng): ExpandedLevel;
```

Regeln:
1. **Blöcke:** alle `level.blocks` + für jede `blockColumns`-Spalte Blöcke bei
   `z = zStart + k · spacing` für alle `k ≥ 0` mit `z ≤ zEnd + 1e-6`. Farbe: `color ?? defaultBlockColor(value)`.
   Ergebnis aufsteigend nach `z` sortieren (stabil; bei gleichem z nach x).
2. **Tore:** Kopie von `level.gates ?? []`, nach `z` sortiert, Optionen nach `xMin` sortiert.
3. **Karten:** `width ?? CONFIG.card.defaultWidth`, `reward ?? 0`, nach z sortiert.
4. **Gegner** je Horde `h` (Index `hi`):
   - `cols = max(1, floor((xMax − xMin) / gridSpacing) + 1)`
   - `rows = ceil(count / cols)`
   - `zStep = rows > 1 ? max(gridSpacing, (zEnd − zStart) / (rows − 1)) : 0`
   - `xStep = cols > 1 ? (xMax − xMin) / (cols − 1) : 0`; bei `cols === 1` liegt x in der Mitte.
   - Gegner `n` (0 … count−1): `row = floor(n / cols)`, `col = n % cols`,
     `x = xMin + col · xStep + rng.range(−jitter, jitter)`,
     `z = zStart + row · zStep + rng.range(−jitter, jitter)`,
     `hp = h.hp ?? 1`, `animPhase = rng.range(0, 2π)`.
   - Reihenfolge der rng-Aufrufe exakt so (x, z, animPhase) – Determinismus!

**Tests:**
- Spalte `{x:-4.6, zStart:12, zEnd:100, spacing:3.2, value:1}` → 28 Blöcke, erster z=12, letzter z≈98.4, alle `blue`.
- Wert 33 ohne Farbe → `gold`.
- Horde `{zStart:44, zEnd:120, xMin:-1.8, xMax:1.8, count:180}` → 180 Gegner, alle x in
  `[-1.8−0.12, 1.8+0.12]`, alle z in `[44−0.12, 120+0.12]`.
- Zweimal mit `new Rng(7)` expandiert → identische Ergebnisse (`toEqual`).

**Commit:** `feat(level): expand level definitions into spawn lists`

---

## Schritt 2.2 – Level-Validierung

**Dateien:** `src/core/level/validate.ts`, `src/core/level/validate.test.ts`

**Umsetzung:**
```ts
/** Liefert eine Liste lesbarer Fehlermeldungen (leer = gültig). */
export function validateLevel(level: LevelDef): string[];
```
Prüfungen (Meldung beginnt immer mit `Level ${id}: `):
1. `id ≥ 1`, `name` nicht leer, `100 ≤ arenaZ ≤ 2000`.
2. Blöcke (nach Expansion ohne rng – dafür die Block-Expansion aus 2.1 als eigene exportierte
   Funktion `expandBlocks(level)` herausziehen): `|x| + 0.8 ≤ 6`, `5 ≤ z ≤ arenaZ − 5`, `value ≥ 1` (ganzzahlig).
3. Spalten: `spacing ≥ CONFIG.block.depth`, `zStart ≤ zEnd`.
4. Tore: `5 ≤ z ≤ arenaZ − 5`; 1–3 Optionen; je Option `-6 ≤ xMin < xMax ≤ 6`;
   Optionen überlappen nicht; `add/sub`: ganzzahlig ≥ 1; `mul/div`: ganzzahlig ≥ 2.
5. Karten: `hp ≥ 1`; `|x| + width/2 ≤ 6`; `5 ≤ z ≤ arenaZ − 5`; `kind === 'soldiers'` ⇒ `reward ≥ 1`;
   zwei Karten mit `|Δz| < 1` dürfen sich in x nicht überlappen.
6. Horden: `zStart < zEnd`, `xMin < xMax`, `-6 ≤ xMin`, `xMax ≤ 6`, `count ≥ 1`, `hp ≥ 1`,
   `zEnd ≤ arenaZ − 5`; Summe aller `count` ≤ `CONFIG.enemy.maxEnemies`.
7. Boss: `hp ≥ 1`; optionale Werte > 0.
8. `startWeaponTier` (falls gesetzt) ∈ {0,1,2,3}.

**Tests:** ein minimales gültiges Level → `[]`; je Regel ein absichtlich kaputtes Level →
genau die erwartete Meldung ist enthalten (`toContainEqual(expect.stringContaining(...))`).

**Commit:** `feat(level): add level validation`

---

## Schritt 2.3 – Level 1 bis 5

**Dateien:** `src/core/level/levels.ts`, `src/core/level/levels.test.ts`

**Umsetzung:**
```ts
import type { LevelDef } from './types';

export const LEVELS: readonly LevelDef[] = [ /* siehe unten */ ];
export function getLevel(id: number): LevelDef | undefined { return LEVELS.find((l) => l.id === id); }
export const LEVEL_COUNT = LEVELS.length;
```

Level-Daten **exakt** übernehmen (Gate-Optionen schreiben als `{ xMin, xMax, op, value }`):

**Level 1 – „Die Hängebrücke“** (`seed 101`, `arenaZ 190`)
- blockColumns: `{x:-4.6, zStart:12, zEnd:100, spacing:3.2, value:1}`, `{x:4.6, zStart:52, zEnd:130, spacing:8, value:33}`
- cards: `{kind:'weapon', x:0, z:34, hp:23, width:3.6}`, `{kind:'hero', x:3.9, z:34, hp:555, width:3.2}`
- hordes: `{zStart:46, zEnd:120, xMin:-1.8, xMax:1.8, count:280}`
- gates: `z 150: [-6,0 mul 2] [0,6 add 20]`, `z 170: [-6,0 sub 30] [0,6 add 15]`
- boss: `{hp:600}`

**Level 2 – „Moosgraben“** (`seed 202`, `arenaZ 220`)
- blockColumns: `{x:-4.6, zStart:10, zEnd:58, spacing:3, value:1}`, `{x:4.6, zStart:70, zEnd:126, spacing:7, value:20}`
- cards: `{kind:'soldiers', x:-4.2, z:28, hp:40, width:3.2, reward:25}`, `{kind:'weapon', x:0, z:40, hp:60, width:3.6}`
- hordes: `{zStart:50, zEnd:110, xMin:-1.8, xMax:1.8, count:220}`, `{zStart:140, zEnd:170, xMin:-5.4, xMax:5.4, count:200}`
- gates: `z 128: [-6,0 mul 2] [0,6 sub 10]`, `z 190: [-6,-2 add 30] [-2,2 div 2] [2,6 add 10]`
- boss: `{hp:1200}`

**Level 3 – „Wasserfall-Pass“** (`seed 303`, `arenaZ 240`)
- blockColumns: `{x:-4.6, zStart:12, zEnd:72, spacing:3, value:1}`, `{x:4.6, zStart:12, zEnd:72, spacing:3, value:2}`
- cards: `{kind:'hero', x:0, z:45, hp:300, width:3.6}`, `{kind:'weapon', x:-3.9, z:95, hp:120, width:3.2}`, `{kind:'soldiers', x:3.9, z:95, hp:150, width:3.2, reward:60}`
- hordes: `{zStart:55, zEnd:85, xMin:-1.8, xMax:1.8, count:150}`, `{zStart:110, zEnd:160, xMin:-5.4, xMax:5.4, count:320, hp:2}`
- gates: `z 175: [-6,0 mul 2] [0,6 add 40]`, `z 205: [-6,-2 sub 40] [-2,2 mul 2] [2,6 sub 20]`
- boss: `{hp:2500, contactKillRate:15}`

**Level 4 – „Schlangentempel“** (`seed 404`, `arenaZ 260`)
- blockColumns: `{x:0, zStart:10, zEnd:40, spacing:2.5, value:1}`, `{x:-4.6, zStart:120, zEnd:180, spacing:6, value:15}`
- cards: `{kind:'weapon', x:-3.9, z:50, hp:80, width:3.2}`, `{kind:'weapon', x:3.9, z:50, hp:250, width:3.2}`, `{kind:'hero', x:0, z:130, hp:700, width:3.6}`
- hordes: `{zStart:60, zEnd:110, xMin:-5.4, xMax:5.4, count:400}`, `{zStart:140, zEnd:200, xMin:1, xMax:5.4, count:250, hp:2}`
- gates: `z 115: [-6,-2 add 25] [-2,2 mul 3] [2,6 sub 25]`, `z 215: [-6,0 div 2] [0,6 add 50]`, `z 238: [-6,0 mul 2] [0,6 add 80]`
- boss: `{hp:4000, speed:2.4, contactKillRate:18, scale:3.3}`

**Level 5 – „Der Runenschacht“** (`seed 505`, `arenaZ 300`)
- blockColumns: `{x:-4.6, zStart:10, zEnd:90, spacing:2.5, value:1}`, `{x:4.6, zStart:150, zEnd:230, spacing:10, value:33}`
- cards: `{kind:'weapon', x:0, z:30, hp:40, width:3.6}`, `{kind:'soldiers', x:-4.2, z:100, hp:200, width:3.2, reward:80}`, `{kind:'hero', x:3.9, z:100, hp:900, width:3.2}`, `{kind:'weapon', x:0, z:240, hp:600, width:3.6}`
- hordes: `{zStart:40, zEnd:95, xMin:-1.8, xMax:1.8, count:250}`, `{zStart:110, zEnd:170, xMin:-5.4, xMax:5.4, count:450, hp:2}`, `{zStart:200, zEnd:260, xMin:-5.4, xMax:1.5, count:300, hp:3}`
- gates: `z 178: [-6,0 mul 2] [0,6 add 60]`, `z 275: [-6,-2 sub 50] [-2,2 mul 2] [2,6 sub 50]`
- boss: `{hp:7000, speed:2.6, contactKillRate:22, scale:3.8}`

**Tests (`levels.test.ts`):**
- Für jedes Level: `validateLevel(level)` liefert `[]`.
- IDs sind 1…5, eindeutig, aufsteigend.
- `getLevel(3)?.name === 'Wasserfall-Pass'`, `getLevel(99) === undefined`.

**Commit:** `feat(level): add levels 1-5`
