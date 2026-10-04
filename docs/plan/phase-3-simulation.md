# Phase 3 – Simulation (headless)

Ziel: Die komplette Spiellogik läuft ohne Browser, deterministisch, mit fixem Zeitschritt
`dt = 1/60`. Jedes System ist eine reine Funktion `updateXyz(world, dt)` in
`src/core/systems/`. Am Ende (Schritt 3.13) gewinnt ein Bot Level 1 in einem Unit-Test.

Gemeinsame Test-Hilfe (in Schritt 3.1 anlegen): `src/core/testUtils.ts` mit
```ts
/** Minimales Level für Tests; overrides werden flach übernommen. */
export function makeTestLevel(overrides: Partial<LevelDef> = {}): LevelDef {
  return { id: 1, name: 'Test', seed: 1, arenaZ: 200, boss: { hp: 100 }, ...overrides };
}
/** Führt n Schritte aus. */
export function runSteps(world: WorldState, n: number, fn: (w: WorldState, dt: number) => void): void;
```
(`testUtils.ts` wird von ESLint nicht anders behandelt; es wird nur von Tests importiert.)

---

## Schritt 3.1 – Welt erzeugen und Welt-Helfer

**Dateien:** `src/core/world.ts`, `src/core/world.test.ts`, `src/core/testUtils.ts`

**Umsetzung:**
```ts
export const DEFAULT_MODIFIERS: RunModifiers = { startSoldierBonus: 0, fireRateMultiplier: 1, coinMultiplier: 1 };

/** Erzeugt den Startzustand für ein Level. */
export function createWorld(level: LevelDef, modifiers: RunModifiers = DEFAULT_MODIFIERS): WorldState;

/** Setzt die Phase und sendet phaseChanged, falls sie sich ändert. */
export function setPhase(world: WorldState, phase: WorldPhase): void;

/** Ändert die Truppgröße (begrenzt auf 0..maxSoldiers), aktualisiert Formation, Statistik
 *  und sendet soldiersChanged (nur wenn die tatsächliche Änderung ≠ 0). Gibt die tatsächliche Änderung zurück. */
export function changeSoldiers(world: WorldState, delta: number, reason: SoldierChangeReason): number;

/** Berechnet slotSpacing, radius und peakCount neu. */
export function refreshFormation(world: WorldState): void;
```

`createWorld` – genaue Belegung:
- `rng = new Rng(level.seed)`; `expanded = expandLevel(level, rng)`.
- `count = min(maxSoldiers, baseStartSoldiers + (level.startSoldiers ?? 0) + modifiers.startSoldierBonus)`.
- `squad = { x:0, z:0, prevZ:0, targetX:0, count, peakCount:count, radius, slotSpacing, weaponTier: level.startWeaponTier ?? 0, fireAccumulator:0, nextShooter:0, stopped:false }`
  (radius/slotSpacing über `refreshFormation`).
- `hero = { active:false, hp:0, maxHp: CONFIG.hero.hp, x:0, z:0, fireAccumulator:0 }`
- `blocks`: aus `expanded.blocks`, `id` = Index, `collected:false`.
- `gates`: aus `expanded.gates`, `id` = Index, `passed:false`, `chosenOption:-1`.
- `cards`: aus `expanded.cards`, `id` = Index, `maxHp = hp`, `state:'locked'`.
- `enemies = new EnemyPool(CONFIG.enemy.maxEnemies)`; alle `expanded.enemies` spawnen.
- `bullets = new BulletPool(CONFIG.shooting.maxBullets)`.
- `boss`: `scale = def.scale ?? defaultScale`, `radius = scale · radiusPerScale`,
  `x = 0`, `z = arenaZ + startOffset`, `hp = maxHp = def.hp`, `speed = def.speed ?? defaultSpeed`,
  `contactKillRate = def.contactKillRate ?? defaultContactKillRate`, `killAccumulator = 0`, `state = 'dormant'`.
- `phase = 'ready'`, `time = 0`, `tick = 0`, `outcomeTimer = 0`, `arenaZ = level.arenaZ`,
  `stats` alle 0, `events = []`.

`changeSoldiers`: `before = count`; `count = clamp(round(before + delta), 0, maxSoldiers)`;
`actual = count − before`; bei `actual > 0` → `stats.soldiersGained += actual`, bei `< 0` →
`stats.soldiersLost −= actual`; `refreshFormation`; Ereignis mit `x = squad.x`, `z = squad.z`.

**Tests:**
- `createWorld(getLevel(1)!)`: count 8, 28 + 10 = 38 Blöcke, 2 Karten, 2 Tore, 280 Gegner, Boss z = 214, Phase `ready`.
- Modifikator `startSoldierBonus: 6` → count 14.
- `changeSoldiers(w, -100, 'enemy')` bei count 8 → Rückgabe −8, count 0, `soldiersLost === 8`, genau ein Ereignis.
- `changeSoldiers(w, 0, 'block')` → kein Ereignis.
- `setPhase` zweimal mit gleicher Phase → nur ein Ereignis.

**Commit:** `feat(sim): create world state from level`

---

## Schritt 3.2 – Truppbewegung

**Dateien:** `src/core/systems/squadMovement.ts` (+ Test)

**Umsetzung:**
```ts
export function updateSquadMovement(world: WorldState, dt: number): void {
  const s = world.squad;
  const limit = maxSquadX(s.radius);
  s.targetX = clamp(s.targetX, -limit, limit);
  const desired = damp(s.x, s.targetX, CONFIG.squad.lateralResponse, dt);
  s.x = clamp(approach(s.x, desired, CONFIG.squad.lateralMaxSpeed * dt), -limit, limit);
  s.prevZ = s.z;
  if (!s.stopped) {
    s.z += CONFIG.squad.forwardSpeed * dt;
    if (s.z >= world.arenaZ) {
      s.z = world.arenaZ;
      s.stopped = true;
      setPhase(world, 'bossFight');
    }
  }
}
```

**Tests:**
- 60 Schritte → `z ≈ 7` (±0.01).
- `targetX = 4` → nach 60 Schritten `x > 3.9`; `x` steigt nie mehr als `16 · dt` pro Schritt.
- `targetX = 100` → wird auf `maxSquadX(radius)` begrenzt.
- Start bei `z = arenaZ − 0.05` → nach 1 Schritt `z === arenaZ`, `stopped`, Phase `bossFight`, Ereignis gesendet.

**Commit:** `feat(sim): squad movement`

---

## Schritt 3.3 – Bonus-Blöcke einsammeln

**Dateien:** `src/core/systems/pickups.ts` (+ Test)

**Umsetzung:**
```ts
export function updatePickups(world: WorldState): void
```
- Für jeden Block mit `collected === false`:
  - Schnelltest: `|b.z − s.z| > s.radius + depth/2` → überspringen.
  - `circleIntersectsRect(s.x, s.z, s.radius, b.x, b.z, width/2, depth/2)` → `collected = true`,
    `stats.blocksCollected++`, `emit blockCollected`, `changeSoldiers(world, b.value, 'block')`.
- Bei `count === 0` nichts einsammeln (Radius 0).
- Hinweis: Nach jedem Einsammeln ändert sich der Radius → das ist gewollt (größerer Trupp sammelt mehr).

**Tests:**
- Trupp bei x=−4.6 läuft 100 Schritte durch die Level-1-Spalte → ≥ 3 Blöcke gesammelt, count entsprechend erhöht.
- Trupp bei x=0 sammelt keinen Block der Spalte x=−4.6 (bei count 8).
- Ein Block wird nie doppelt gezählt.

**Commit:** `feat(sim): collect bonus blocks`

---

## Schritt 3.4 – Tore

**Dateien:** `src/core/systems/gates.ts` (+ Test)

**Umsetzung:**
```ts
/** Wendet eine Tor-Operation an (ohne Begrenzung). */
export function applyGateOp(count: number, op: GateOp, value: number): number {
  switch (op) {
    case 'add': return count + value;
    case 'sub': return count - value;
    case 'mul': return count * value;
    case 'div': return Math.floor(count / value);
  }
}
/** Index der Option, deren [xMin, xMax) x enthält (letzte Option inkl. xMax), sonst -1. */
export function findGateOption(gate: { options: GateOption[] }, x: number): number;
export function updateGates(world: WorldState): void;
```
`updateGates`: für jedes Tor mit `passed === false` und `s.prevZ < g.z && s.z >= g.z`:
`passed = true`; `idx = findGateOption(g, s.x)`; falls `idx ≥ 0`:
`before = count`, `target = clamp(applyGateOp(before, op, value), 0, maxSoldiers)`,
`changeSoldiers(world, target − before, 'gate')`, `chosenOption = idx`, `emit gatePassed`.

**Tests:** alle vier Operationen; Begrenzung auf 0 und 999; Trupp bei x=−1 durch Tor
`[-6,0 mul 2][0,6 add 20]` mit count 10 → 20; bei x=+1 → 30; ein Tor wirkt nur einmal.

**Commit:** `feat(sim): gates`

---

## Schritt 3.5 – Karten: Belohnung und Wand

**Dateien:** `src/core/systems/cards.ts` (+ Test), `src/core/systems/hero.ts` (nur `damageHero`, `activateHero`)

**Umsetzung `hero.ts` (Teil 1):**
```ts
export function activateHero(world: WorldState): void; // active=true, hp=maxHp, Position vor Trupp, emit heroJoined (nur wenn vorher inaktiv; sonst nur heilen)
export function damageHero(world: WorldState, amount: number): void; // hp -= amount; emit heroDamaged; bei hp<=0: hp=0, active=false, emit heroDied
```

**Umsetzung `cards.ts`:**
```ts
/** Schaltet eine Karte frei und vergibt die Belohnung. */
export function unlockCard(world: WorldState, card: Card): void;
/** Karten als Wand gegen den Trupp. */
export function updateCardWalls(world: WorldState): void;
```
`unlockCard`: `state = 'unlocked'`, `hp = 0`; je `kind`:
- `weapon` → `weaponTier = min(3, weaponTier + 1)`, `emit weaponUpgraded`
- `hero` → `activateHero(world)`
- `soldiers` → `changeSoldiers(world, card.reward, 'card')`

Danach `emit cardUnlocked`.

`updateCardWalls`: für jede Karte mit `state === 'locked'`:
- `front = c.z − depth/2`, `back = c.z + depth/2`.
- Überlappung in z: `s.z + s.radius ≥ front && s.z − s.radius ≤ back`. Sonst weiter.
- `lost = countSlotsInXRange(count, slotSpacing, s.x, c.x − width/2, c.x + width/2, soldierRadius)`.
- `lost === 0` → weiter (Trupp läuft vorbei).
- Sonst: `changeSoldiers(world, −lost, 'wall')`; `c.hp −= lost · wallDamagePerSoldier`;
  wenn `c.hp ≤ 0` → `unlockCard`, sonst `state = 'smashed'`, `emit cardSmashed`.

**Tests:**
- Waffenkarte freischalten → Tier 0 → 1; viermal → bleibt bei 3.
- Heldenkarte → `hero.active`, `hp 60`, Ereignis `heroJoined`.
- Soldatenkarte reward 25 → count +25.
- Trupp (count 20) läuft mittig gegen Karte (x 0, Breite 3.6, hp 555) → Soldaten verloren > 0, Karte `smashed`.
- Gleiches mit hp 3 → Karte `unlocked`, Belohnung erhalten.
- Trupp bei x=−4.6 läuft an Karte bei x=+3.9 vorbei → keine Verluste, Karte bleibt `locked`.

**Commit:** `feat(sim): upgrade cards with rewards and wall behaviour`

---

## Schritt 3.6 – Gegnerhorde

**Dateien:** `src/core/systems/enemies.ts` (+ Test)

**Umsetzung:**
```ts
/** Entfernt Gegner i, zählt Statistik, sendet enemyKilled. */
export function killEnemy(world: WorldState, i: number, byBullet: boolean): void;
export function updateEnemies(world: WorldState, dt: number): void;
```
`updateEnemies` – **rückwärts** über alle Gegner `i = count−1 … 0`:
1. `dz = e.z[i] − s.z`. Wenn `charging[i] === 0` und `dz ≤ aggroDistance` → `charging[i] = 1`.
2. Wenn charging: `e.z[i] −= speed · dt`; wenn `|dz| < steerDistance`:
   `vx = clamp((s.x − e.x[i]) · steerGain, −speed, speed)`, `e.x[i] += vx · dt`;
   x auf `[horde.xMin − spill, horde.xMax + spill]` begrenzen (`horde = world.level.hordes![e.horde[i]]`).
3. `e.animPhase[i] += dt · (charging ? 14 : 4)` (modulo 2π).
4. Kontakt Held: `hero.active && distSq(e, hero) ≤ (CONFIG.hero.radius + CONFIG.enemy.radius)²` → `killEnemy(i, false)`, `damageHero(1)`, weiter.
5. Kontakt Trupp: `s.count > 0 && distSq(e, s) ≤ (s.radius + enemy.radius)²` → `killEnemy(i, false)`, `changeSoldiers(−1, 'enemy')`, weiter.
6. `e.z[i] < s.z − despawnBehind` → `e.remove(i)` (kein Ereignis).

**Tests:**
- Gegner 30 m voraus bleibt idle; 15 m voraus wird charging und bewegt sich auf den Trupp zu.
- Gegner direkt im Trupp → Gegner weg, count −1, `enemiesKilled === 1`.
- Mit aktivem Held vor dem Trupp: Held verliert HP, count unverändert.
- Gegner 5 m hinter dem Trupp wird entfernt.
- x bleibt innerhalb Hordengrenzen ± spill.

**Commit:** `feat(sim): enemy horde behaviour and contact trades`

---

## Schritt 3.7 – Held: Folgen und Schießen

**Dateien:** `src/core/systems/hero.ts` (erweitern, + Test)

**Umsetzung:**
```ts
export function updateHero(world: WorldState, dt: number): void
```
- Nur wenn `hero.active`.
- Position: `hero.x = damp(hero.x, s.x, 12, dt)`, `hero.z = s.z + s.radius + followOffsetZ`.
- Schießen: `fireAccumulator += dt / CONFIG.hero.fireInterval`; solange `≥ 1`: −1,
  Projektil bei `x = hero.x + (abwechselnd −0.25/+0.25 je nach Parität von world.tick + Schussnummer)`,
  `z = hero.z + 0.6`, `speed 45`, `range 30`, `damage 2`, `owner OWNER_HERO`, `tier 255`.
- Nach der Schleife (falls ≥ 1 Schuss): `stats.shotsFired += n`, `emit shotsFired {owner:'hero', count:n}`.

**Tests:** aktiver Held erzeugt in 1 s (60 Schritte) 12 ± 1 Projektile; inaktiver Held 0; Held steht vor dem Trupp.

**Commit:** `feat(sim): hero follows squad and fires minigun`

---

## Schritt 3.8 – Boss

**Dateien:** `src/core/systems/boss.ts` (+ Test)

**Umsetzung:**
```ts
export function updateBoss(world: WorldState, dt: number): void
```
1. `state === 'dead'` → return.
2. `dormant` und `s.z ≥ arenaZ − activationDistance` → `walking`, `emit bossActivated`.
3. `frontZ = hero.active ? max(s.z + s.radius, hero.z + CONFIG.hero.radius) : s.z + s.radius`.
4. `walking`: `b.z −= speed · dt`; `b.x = damp(b.x, s.x · 0.5, 1.5, dt)`;
   wenn `b.z − b.radius ≤ frontZ` → `b.z = frontZ + b.radius`, `state = 'attacking'`.
5. `attacking`: `b.z = approach(b.z, frontZ + b.radius, speed · dt)`;
   `killAccumulator += contactKillRate · dt`; `n = floor(killAccumulator)`; `killAccumulator −= n`;
   wenn `n > 0`: Held zuerst (`h = hero.active ? min(n, hero.hp) : 0` → `damageHero(h)`),
   Rest `changeSoldiers(−(n − h), 'boss')`.

Schaden **am** Boss passiert in Schritt 3.10 (Projektile).

**Tests:**
- Boss bleibt dormant, solange Trupp weit weg; wird bei `z ≥ arenaZ − 10` aktiv.
- Laufender Boss erreicht stehenden Trupp und wechselt zu `attacking`.
- `attacking` mit Rate 12 tötet in 1 s 12 Soldaten (±1).
- Mit Held (hp 60): erst Held-HP sinken, count unverändert, bis Held tot.

**Commit:** `feat(sim): boss approach and contact damage`

---

## Schritt 3.9 – Trupp schießt

**Dateien:** `src/core/systems/shooting.ts` (+ Test)

**Umsetzung:**
```ts
export function updateShooting(world: WorldState, dt: number): void {
  const s = world.squad;
  if (s.count <= 0) { s.fireAccumulator = 0; return; }
  const w = WEAPONS[s.weaponTier];
  const shooters = Math.min(s.count, CONFIG.shooting.maxShooters);
  s.fireAccumulator += (dt * shooters * world.modifiers.fireRateMultiplier) / w.fireInterval;
  const damage = (w.damage * s.count) / shooters;
  let fired = 0;
  while (s.fireAccumulator >= 1) {
    s.fireAccumulator -= 1;
    const k = s.nextShooter % shooters;
    s.nextShooter = (k + 1) % shooters;
    const slot = Math.floor((k * s.count) / shooters);
    const x = s.x + UNIT_SLOT_X[slot] * s.slotSpacing;
    const z = s.z + UNIT_SLOT_Z[slot] * s.slotSpacing + CONFIG.shooting.muzzleOffsetZ;
    if (world.bullets.spawn(x, z, w.bulletSpeed, w.range, damage, OWNER_SQUAD, s.weaponTier)) fired++;
  }
  if (fired > 0) { world.stats.shotsFired += fired; emit(world, { type: 'shotsFired', owner: 'squad', count: fired }); }
}
```

**Tests:**
- count 8, Pistole: in 1 s ≈ `8 / 0.45 ≈ 17.8` Projektile (16–19).
- count 200, Pistole: in 1 s ≈ `48 / 0.45 ≈ 106` Projektile, Schaden je Projektil `200/48`.
- `fireRateMultiplier 1.3` → ~30 % mehr Projektile.
- Alle Projektile-x liegen in `[s.x − R, s.x + R]`.

**Commit:** `feat(sim): squad shooting`

---

## Schritt 3.10 – Projektile: Flug, Treffer, Schaden

**Dateien:** `src/core/systems/bullets.ts` (+ Test)

**Umsetzung:**
```ts
export function updateBullets(world: WorldState, dt: number): void
```
Modul-Konstanten (einmalig): `const buckets = new ZBuckets(CONFIG.enemy.maxEnemies)`,
`const candidates = new Int32Array(CONFIG.enemy.maxEnemies)`, `const damagedCards: number[] = []`.

Ablauf:
1. `buckets.rebuild(enemies.z, enemies.count)`; `damagedCards.length = 0`; `bossHit = false`.
2. Für jedes Projektil `i = count−1 … 0`:
   - `z0 = b.z[i]`, `z1 = z0 + speed · dt`, `x = b.x[i]`; `bestZ = Infinity`, `hitKind = 0` (1 Gegner, 2 Karte, 3 Boss), `hitIndex = −1`.
   - **Gegner:** `n = buckets.query(z0 − r, z1 + r, candidates)`; für jeden Kandidaten mit `hp > 0`,
     `ez + r ≥ z0 && ez − r ≤ z1 && |ex − x| ≤ r` und `ez < bestZ` → merken. (`r = CONFIG.enemy.radius`)
   - **Karten** (`state === 'locked'`): `front = c.z − depth/2`, `back = c.z + depth/2`;
     wenn `|x − c.x| ≤ width/2 && front ≤ z1 && back ≥ z0 && front < bestZ` → merken.
   - **Boss** (`state !== 'dead'`): `front = boss.z − boss.radius`; wenn `|x − boss.x| ≤ boss.radius`
     und `front ≤ z1 && boss.z + boss.radius ≥ z0 && front < bestZ` → merken.
   - Treffer:
     - Gegner: `hp −= damage` (Entfernen erst in Schritt 3, Indizes bleiben stabil).
     - Karte: `hp −= damage`; Karten-ID in `damagedCards` (ohne Duplikate); wenn `hp ≤ 0` → `unlockCard`.
     - Boss: `hp = max(0, hp − damage)`; `bossHit = true`; wenn `hp === 0` → `state = 'dead'`, `emit bossDefeated`.
     - `stats.damageDealt += damage`; `bullets.remove(i)`.
   - Kein Treffer: `b.prevZ[i] = z0`, `b.z[i] = z1`, `b.traveled[i] += speed · dt`; bei `traveled ≥ range` → `remove(i)`.
3. Gegner mit `hp ≤ 0` rückwärts entfernen über `killEnemy(world, i, true)`.
4. Für jede ID in `damagedCards` mit `state === 'locked'`: `emit cardDamaged {hp: max(0,hp), maxHp}`.
5. `bossHit && boss.state !== 'dead'` → `emit bossDamaged`.

**Tests:**
- Projektil trifft Gegner direkt voraus → Gegner tot, Projektil weg, Ereignis `enemyKilled byBullet:true`.
- Zwei Gegner hintereinander, ein Projektil → nur der vordere stirbt.
- Gegner hinter Karte: Karte nimmt Schaden, Gegner nicht.
- Projektil seitlich neben Karte → kein Schaden.
- 23 Treffer à 1 auf Waffenkarte hp 23 → `unlocked`, Waffe Tier 1.
- Projektil verschwindet nach `range` Metern ohne Treffer.
- Boss-hp sinkt; bei 0 → `dead` + Ereignis.
- Tunneling-Test: Projektil mit `speed 55`, Gegner genau zwischen zwei Schritt-Positionen → wird getroffen.

**Commit:** `feat(sim): bullet flight, hit detection and damage`

---

## Schritt 3.11 – Sieg/Niederlage

**Dateien:** `src/core/systems/outcome.ts` (+ Test)

**Umsetzung:**
```ts
export function updateOutcome(world: WorldState): void {
  if (world.phase === 'victory' || world.phase === 'defeat') return;
  if (world.boss.state === 'dead') setPhase(world, 'victory');
  else if (world.squad.count <= 0 && !world.hero.active) setPhase(world, 'defeat');
}
```

**Tests:** Boss tot → `victory`; count 0 ohne Held → `defeat`; count 0 mit aktivem Held → weiter.

**Commit:** `feat(sim): victory and defeat detection`

---

## Schritt 3.12 – `Simulation`-Klasse und Wertung

**Dateien:** `src/core/simulation.ts`, `src/core/scoring.ts`, je `*.test.ts`

**Umsetzung `scoring.ts`:**
```ts
export interface RunResult {
  levelId: number; victory: boolean; survivors: number; peak: number;
  stars: 0 | 1 | 2 | 3; coins: number; enemiesKilled: number; blocksCollected: number; timeSeconds: number;
}
export function computeResult(world: WorldState): RunResult;
```
- `survivors = world.squad.count`, `peak = world.squad.peakCount`.
- Sieg: `coins = floor((survivors · coinsPerSurvivor + coinsBossBonus + coinsPerLevel · levelId) · coinMultiplier)`.
- Niederlage: `coins = floor(enemiesKilled / 10 · coinMultiplier)` (Trostpreis).
- Sterne: Niederlage 0; Sieg 1; `survivors/peak ≥ 0.25` → 2; `≥ 0.5` → 3.

**Umsetzung `simulation.ts`:**
```ts
export class Simulation {
  readonly world: WorldState;
  constructor(level: LevelDef, modifiers: RunModifiers = DEFAULT_MODIFIERS);
  /** ready → running */
  start(): void;
  setTargetX(x: number): void;      // world.squad.targetX = x
  nudgeTargetX(dx: number): void;   // targetX += dx (Begrenzung passiert in squadMovement)
  step(dt: number = CONFIG.sim.dt): void;
  isFinished(): boolean;            // victory && outcomeTimer ≥ victoryDelay || defeat && ≥ defeatDelay
  getResult(): RunResult;
  clearEvents(): void;              // world.events.length = 0
}
```
`step(dt)` – Reihenfolge exakt:
```
if phase === 'ready' → return
if phase === 'victory' || 'defeat' → outcomeTimer += dt; updateBullets(world, dt); time += dt; tick++; return
updateSquadMovement → updatePickups → updateGates → updateCardWalls → updateEnemies
→ updateHero → updateBoss → updateShooting → updateBullets → updateOutcome
time += dt; tick++
```
`start()`: nur wenn Phase `ready` → `setPhase('running')`.

**Tests:**
- Neue Simulation ist `ready`; `step` bewegt nichts; nach `start()` bewegt sich der Trupp.
- `isFinished()` erst nach Verzögerung.
- `computeResult`: Beispielwerte (Sieg, survivors 100, peak 150, Level 2, Multiplikator 1) → coins 170, stars 3.

**Commit:** `feat(sim): simulation orchestrator and scoring`

---

## Schritt 3.13 – Autoplay-Bot und Integrationstests (Meilenstein M1)

**Dateien:** `src/core/bot.ts`, `src/core/bot.test.ts`, `src/core/simulation.integration.test.ts`

**Umsetzung `bot.ts`:**
```ts
export class Bot {
  private timer = 0;
  constructor(private readonly interval = 0.25) {}
  /** Setzt alle `interval` Sekunden world.squad.targetX auf die beste Kandidaten-Position. */
  update(world: WorldState, dt: number): void;
}
export function scoreCandidate(world: WorldState, cx: number): number; // exportiert für Tests
```
Kandidaten: `[-4.5, -3, -1.5, 0, 1.5, 3, 4.5]`, jeweils auf `±maxSquadX(R)` begrenzt.
Vorausschau-Fenster: `z ∈ [s.z, s.z + 30]`. `scoreCandidate`:
- **Blöcke** (nicht gesammelt, im Fenster, `|b.x − cx| ≤ R + 0.8`): `+ value`.
- **Tore** (nicht passiert, im Fenster): Option bei `cx` → `+ (clamp(applyGateOp(count)) − count)`.
- **Gesperrte Karten** (im Fenster, `|c.x − cx| ≤ width/2 + R`):
  `t = max(0.1, (c.z − s.z) / forwardSpeed)`; `dps = count · WEAPONS[tier].damage / WEAPONS[tier].fireInterval · fireRateMultiplier`;
  wenn `dps · t · 0.6 ≥ c.hp` → `+ reward` mit `reward = weapon: 40, hero: 80, soldiers: card.reward`;
  sonst `− countSlotsInXRange(count, spacing, cx, c.x − w/2, c.x + w/2, 0.22)`.
- **Gegner** (im Fenster, `|e.x − cx| ≤ R + 1.5`): `− 0.6` je Gegner.
- **Bewegung:** `− 0.5 · |cx − s.x|`.
Bester Score gewinnt; bei Gleichstand der Kandidat näher an `s.x`.

**Integrationstests (`simulation.integration.test.ts`):**
1. Level 1 + Bot, Standard-Modifikatoren: `start()`, Schleife `bot.update; sim.step` bis
   `isFinished()` oder 200 s Simulationszeit → **Sieg**.
2. Level 1 ohne Eingabe (x bleibt 0): endet innerhalb 200 s (Sieg oder Niederlage, aber endet).
3. Determinismus: zwei Läufe Level 1 + Bot → identische `RunResult`-Objekte und gleiche `world.tick`.
4. Laufzeit: Test 1 dauert < 3 s Wandzeit (`performance.now()`).

Falls Test 1 scheitert: **nicht** die Systeme verbiegen, sondern Level-1-Werte
in kleinen Schritten anpassen (zuerst Boss-HP senken, dann Horde verkleinern) und in
`DECISIONS.md` dokumentieren.

**Commit:** `feat(sim): autoplay bot and level integration tests`
