# 01 – Architektur & Konventionen

## 1. Tech-Stack (verbindlich)

| Bereich | Wahl | Version (Major festhalten) |
|---|---|---|
| Sprache | TypeScript, `strict: true` | `~5.6` |
| Build/Dev-Server | Vite | `^6` |
| 3D | three.js | `^0.170.0` (+ `@types/three ^0.170.0`) |
| Unit-Tests | Vitest | `^2.1` |
| E2E-Tests | Playwright (`@playwright/test`) | `^1.48` |
| Lint | ESLint 9 (Flat Config) + `typescript-eslint` | `^9` / `^8` |
| Format | Prettier | `^3` |
| Schrift | `@fontsource/lilita-one` (lokal gebündelt) | `^5` |

Keine weiteren Laufzeit-Abhängigkeiten. Kein UI-Framework (kein React/Vue) – die UI ist
schlankes DOM + CSS. Keine externen Assets: Geometrie, Texturen (Canvas) und Sounds (WebAudio)
werden im Code erzeugt.

## 2. Ordnerstruktur (Endzustand)

```
index.html
public/                     # icons, manifest (Phase 9)
src/
  main.ts                   # Einstiegspunkt: erstellt App
  app/
    App.ts                  # verdrahtet Simulation, Renderer, UI, Input, Audio
    GameLoop.ts             # requestAnimationFrame + Fixed-Timestep
    GameStateMachine.ts     # boot/menu/levelSelect/shop/settings/playing/paused/result
    Session.ts              # ein laufender Level-Versuch (Simulation + Views)
    debug.ts                # URL-Parameter, window.__game, FPS-Anzeige
  core/                     # REINE LOGIK – kein three, kein DOM
    config.ts
    math.ts
    rng.ts
    events.ts
    types.ts
    formation.ts
    world.ts                # createWorld()
    simulation.ts           # class Simulation
    bot.ts                  # Autoplay-Bot
    scoring.ts
    upgrades.ts             # Shop-Formeln
    spatial/ZBuckets.ts
    pools/BulletPool.ts
    pools/EnemyPool.ts
    systems/
      squadMovement.ts
      formationSystem.ts
      pickups.ts
      gates.ts
      cards.ts
      enemies.ts
      boss.ts
      hero.ts
      shooting.ts
      bullets.ts
      outcome.ts
    level/
      types.ts
      levels.ts
      validate.ts
      expand.ts             # BlockColumns -> einzelne Blöcke, Horden -> Positionen
      generator.ts          # Endlosmodus (Phase 8)
  render/
    Renderer.ts
    CameraRig.ts
    Lighting.ts
    Sky.ts
    coords.ts               # simToThree()
    materials.ts
    textures/
      canvas.ts             # Helfer: createCanvas, roundedRect, outlinedText
      stoneTexture.ts
      woodTexture.ts
      labelTexture.ts
      cardIcons.ts
      waterTexture.ts
    models/
      soldier.ts
      brute.ts
      boss.ts
      palm.ts
      rock.ts
    views/
      WorldView.ts          # Container aller Views, sync(world) pro Frame
      TrackView.ts
      EnvironmentView.ts
      SquadView.ts
      EnemyView.ts
      BlockView.ts
      GateView.ts
      CardView.ts
      BulletView.ts
      HeroView.ts
      BossView.ts
      CountLabelView.ts
    fx/
      Particles.ts
      FloatingText.ts
      ScreenShake.ts
  input/
    InputController.ts
  audio/
    AudioEngine.ts
    sfx.ts
    music.ts
  ui/
    dom.ts                  # h()-Helfer
    styles.css
    UIManager.ts
    components/ (Button.ts, ProgressBar.ts, Toast.ts, Icon.ts)
    screens/ (LoadingScreen.ts, MenuScreen.ts, LevelSelectScreen.ts, HudScreen.ts,
              PauseScreen.ts, ResultScreen.ts, ShopScreen.ts, SettingsScreen.ts,
              TutorialOverlay.ts)
  persistence/
    SaveManager.ts
e2e/
  smoke.spec.ts
```

Unit-Tests liegen **neben** der getesteten Datei: `src/core/formation.test.ts` usw.

## 3. Schichten und Datenfluss

```
 InputController ──targetX──▶ Simulation.setTargetX()
                                   │ step(dt) (fixe 1/60 s)
                                   ▼
                              WorldState  ──events[]──▶ App verteilt an:
                                   │                     - WorldView (Effekte)
                                   │                     - AudioEngine (Sounds)
                                   │                     - HudScreen (Zahlen)
                                   ▼
                       WorldView.sync(world, frameDt)  (jedes Render-Frame)
                                   ▼
                             Renderer.render()
```

Regeln:
1. **Die Simulation kennt keine Darstellung.** Sie schreibt nur `WorldState` und hängt
   Ereignisse an `world.events` an.
2. **Views lesen nur.** Sie verändern `WorldState` nie.
3. Die App leert `world.events` nach jedem `GameLoop`-Frame (nach allen Sim-Schritten),
   nachdem alle Abnehmer sie bekommen haben.
4. Zufall in der Simulation **nur** über `world.rng` (seeded). `Math.random()` ist in
   `src/core` verboten (ESLint-Regel `no-restricted-properties`). In `render/` für reine
   Optik erlaubt.

## 4. Zentrale Typen (`src/core/types.ts`)

Diese Typen werden in Schritt 1.4 exakt so angelegt (Erweiterungen nur per Plan-Schritt).

```ts
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
  prevZ: number;          // z vor dem aktuellen Schritt (für Tor-Überquerung)
  targetX: number;
  count: number;
  peakCount: number;
  radius: number;         // R, siehe Game Design 4.1
  slotSpacing: number;    // c (nach Kompression)
  weaponTier: number;     // 0..3
  fireAccumulator: number;
  nextShooter: number;
  stopped: boolean;       // true in der Arena
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
  chosenOption: number;   // -1 solange nicht passiert / keine Option getroffen
}

export interface Card {
  id: number;
  kind: CardKind;
  x: number;
  z: number;
  width: number;
  hp: number;
  maxHp: number;
  reward: number;         // nur für kind === 'soldiers'
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
  startSoldierBonus: number;   // aus Shop
  fireRateMultiplier: number;  // 1 + 0.06 * Stufe
  coinMultiplier: number;      // 1 + 0.10 * Stufe
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
```

## 5. Konventionen

- **Dateinamen:** Klassen in `PascalCase.ts`, Funktionsmodule in `camelCase.ts`.
- **Exports:** nur benannte Exporte (`export function`, `export class`), kein `default`.
- **Systeme** sind reine Funktionen: `export function updateXyz(world: WorldState, dt: number): void`.
- **Keine Allokationen pro Frame** in heißen Pfaden (Simulation-Step, `sync()` der Views):
  Vektoren/Matrizen als Modul-Konstanten wiederverwenden (`const _m = new THREE.Matrix4()`).
- **Einheiten:** Meter, Sekunden, Radiant. Farben als Hex-Zahl (`0xff0000`).
- **Kommentare:** knapp, Deutsch oder Englisch – aber innerhalb einer Datei einheitlich.
  Öffentliche Funktionen bekommen einen einzeiligen JSDoc-Kommentar.
- **Fehler:** Level-Daten werden vor dem Start validiert (`validateLevel`), danach keine
  defensiven Prüfungen in heißen Pfaden.
- **Tests:** jede Datei in `src/core` mit Logik bekommt Unit-Tests. Rendering/UI werden
  über den E2E-Smoke-Test und manuelle Prüfung abgedeckt.

## 6. npm-Skripte (ab Schritt 0.2)

| Skript | Befehl |
|---|---|
| `dev` | `vite` |
| `build` | `tsc --noEmit && vite build` |
| `preview` | `vite preview` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint .` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `e2e` | `playwright test` (ab Phase 9) |
| `check` | `npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build` |

## 7. Debug-Schnittstellen (ab Phase 5)

URL-Parameter: `?level=3` (direkt starten), `?seed=42`, `?autoplay=1` (Bot steuert),
`?speed=4` (Zeitraffer, 1–8), `?debug=1` (FPS/Zustandsanzeige), `?quality=low|medium|high`.

`window.__game` (nur wenn `debug=1` oder `import.meta.env.DEV`):
`{ getState(): {phase, count, z, bossHp, fps}, start(level), skipTo(z), win(), lose() }`.
