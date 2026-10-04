# Phase 5 – Eingabe, Game-Loop, Zustandsmaschine, Debug

Ziel: Das Spiel ist mit Finger, Maus und Tastatur steuerbar; ein sauberer Game-Loop mit
festem Simulationsschritt ersetzt die Vorschau aus Phase 4.

---

## Schritt 5.1 – InputController

**Dateien:** `src/input/InputController.ts`

**Umsetzung:**
```ts
export class InputController {
  enabled = false;
  sensitivity = 1.4;
  /** Wird bei der ersten Bewegung (Drag oder Taste) nach enable() einmal aufgerufen. */
  onFirstInput: (() => void) | null = null;
  onPauseRequest: (() => void) | null = null;

  constructor(private readonly target: HTMLElement);
  /** Aufgelaufene seitliche Verschiebung in METERN seit dem letzten Aufruf; setzt auf 0 zurück. */
  consumeDeltaX(): number;
  /** Tastaturachse −1 … +1 (links/rechts). */
  getKeyAxis(): number;
  /** Ob gerade ein Finger/Maustaste gedrückt ist (für UI-Hinweise). */
  isPointerDown(): boolean;
  dispose(): void;
}
```
Details:
- `target.style.touchAction = 'none'`.
- Pointer-Events: `pointerdown` → nur wenn `enabled` und kein anderer Pointer aktiv; `pointerId` merken,
  `setPointerCapture`; `lastX = e.clientX`.
  `pointermove` (gleicher Pointer) → `deltaPx += e.clientX − lastX`; `lastX = e.clientX`;
  wenn `|deltaPx gesamt seit Down| > 2` und `onFirstInput` gesetzt → aufrufen und auf `null` setzen.
  `pointerup` / `pointercancel` / `lostpointercapture` → Pointer freigeben.
- Umrechnung in Meter in `consumeDeltaX`: `deltaPx · (CONFIG.track.width / target.clientWidth) · sensitivity`.
- Tastatur (`window`): `ArrowLeft`/`KeyA` → −1, `ArrowRight`/`KeyD` → +1 (gedrückt halten);
  erste Tastenbewegung löst ebenfalls `onFirstInput` aus. `Escape`/`KeyP` → `onPauseRequest`.
- Klicks auf Elemente mit `data-ui-interactive` (Buttons im HUD) dürfen **keine** Steuerung auslösen:
  in `pointerdown` prüfen `(e.target as HTMLElement).closest('[data-ui-interactive]')` → ignorieren.
- `dispose` entfernt alle Listener.

**Commit:** `feat(input): pointer, touch and keyboard steering`

---

## Schritt 5.2 – GameLoop, Session und App (ersetzt Vorschau)

**Dateien:** `src/app/GameLoop.ts`, `src/app/Session.ts`, `src/app/App.ts`, `src/main.ts`

**Umsetzung `GameLoop`:**
```ts
export class GameLoop {
  constructor(private readonly onFrame: (frameDt: number) => void);
  start(): void;  // requestAnimationFrame-Schleife; frameDt in Sekunden, auf max 0.1 begrenzt
  stop(): void;
  get running(): boolean;
}
```

**Umsetzung `Session`** (ein Level-Versuch):
```ts
export interface SessionOptions { level: LevelDef; modifiers: RunModifiers; autoplay: boolean; quality: Quality; shadows: boolean }
export type SessionListener = (event: SimEvent, world: WorldState) => void;
export class Session {
  readonly sim: Simulation;
  readonly view: WorldView;
  readonly bot: Bot | null;
  timeScale = 1;
  constructor(opts: SessionOptions);
  addListener(fn: SessionListener): void;
  /** Feste Simulationsschritte (Akkumulator), danach Ereignisse verteilen und View synchronisieren. */
  update(frameDt: number, steerDeltaX: number): void;
  dispose(): void;
}
```
`update`:
1. `sim.nudgeTargetX(steerDeltaX)` (nur wenn `!bot`).
2. `acc += frameDt · timeScale`; `maxSteps = CONFIG.sim.maxStepsPerFrame · max(1, timeScale)`;
   `while (acc ≥ dt && steps < maxSteps) { bot?.update(world, dt); sim.step(dt); acc −= dt; steps++ }`;
   wenn `steps === maxSteps` → `acc = 0` (Spirale des Todes verhindern).
3. Für jedes Ereignis in `world.events`: `view.onEvent(e)` und alle Listener; danach `sim.clearEvents()`.
4. `view.sync(world, frameDt)`.

**Umsetzung `App`:**
```ts
export class App {
  constructor(root: HTMLElement);
  /** Startet Level (in Phase 5 direkt aus main.ts mit Level 1). */
  startLevel(levelId: number): void;
}
```
- Besitzt: `Renderer`, `CameraRig`, `Lighting`, Himmel/Nebel (einmalig), `InputController` (Target = `#app`),
  `GameLoop`, aktuelle `Session | null`.
- `startLevel`: alte Session `dispose()` und aus Szene entfernen; neue Session; `view.root` zur Szene;
  `cameraRig.update(world, 0, true)`; `input.enabled = true`; `input.onFirstInput = () => session.sim.start()`.
- Frame: `dx = input.consumeDeltaX() + input.getKeyAxis() · 10 · frameDt`; `session.update(frameDt, dx)`;
  `cameraRig.update`, `lighting.update`; `renderer.render()`.
- Bei Autoplay sofort `sim.start()`.
- `main.ts`: nur noch `new App(document.getElementById('app')!).startLevel(1)`.

**Akzeptanzkriterien:**
- [ ] Level 1 wartet, bis man zieht; danach läuft der Trupp und folgt dem Finger/der Maus.
- [ ] Pfeiltasten steuern ebenfalls.
- [ ] Bei 30-FPS-Drosselung (DevTools CPU 4×) läuft das Spiel gleich schnell (fester Zeitschritt).

**Commit:** `feat(app): game loop, session and app wiring`

---

## Schritt 5.3 – Zustandsmaschine

**Dateien:** `src/app/GameStateMachine.ts`, `src/app/GameStateMachine.test.ts`, `src/app/App.ts`

**Umsetzung:**
```ts
export type AppState = 'boot' | 'menu' | 'levelSelect' | 'shop' | 'settings' | 'playing' | 'paused' | 'result';
const TRANSITIONS: Record<AppState, readonly AppState[]> = {
  boot: ['menu', 'playing'],
  menu: ['levelSelect', 'shop', 'settings', 'playing'],
  levelSelect: ['menu', 'playing'],
  shop: ['menu', 'result'],
  settings: ['menu', 'paused'],
  playing: ['paused', 'result', 'menu'],
  paused: ['playing', 'menu', 'settings', 'result'],
  result: ['playing', 'menu', 'shop', 'levelSelect'],
};
export class GameStateMachine {
  get state(): AppState;
  get previous(): AppState | null;
  canGo(to: AppState): boolean;
  /** Wechselt den Zustand oder wirft Error bei ungültigem Übergang. */
  go(to: AppState): void;
  onChange(fn: (to: AppState, from: AppState) => void): () => void; // gibt Unsubscribe zurück
}
```
App-Integration (vorerst ohne UI): `boot → playing` beim Start; `Session.sim.isFinished()` → `result`
und nach 2 s automatisch neues Level 1 (`result → playing`) – Platzhalter bis Phase 6.
`onPauseRequest` → `paused` (Simulation wird dann nicht aktualisiert, nur gerendert); nochmal → `playing`.
`document.visibilitychange` (hidden) während `playing` → `paused`.

**Tests:** gültige/ungültige Übergänge, Listener werden mit (to, from) aufgerufen, Unsubscribe wirkt.

**Commit:** `feat(app): game state machine with pause and result states`

---

## Schritt 5.4 – Debug-Werkzeuge (Meilenstein M3)

**Dateien:** `src/app/debug.ts`, `src/app/debug.test.ts`, `src/app/App.ts`, `README.md`

**Umsetzung:**
```ts
export interface DebugParams { level: number | null; seed: number | null; autoplay: boolean; speed: number; debug: boolean; quality: Quality | null }
/** Parst location.search. speed auf 1..8 begrenzt; ungültige Werte → Standard. */
export function parseDebugParams(search: string): DebugParams;
export class FpsMeter { constructor(parent: HTMLElement); update(frameDt: number, info: string): void; dispose(): void }
export function installDebugApi(app: App): void; // window.__game, siehe 01-architecture.md Abschnitt 7
```
- `seed` überschreibt `level.seed` (Kopie des Levels anlegen, Original nicht ändern).
- `speed` setzt `session.timeScale`.
- `FpsMeter`: kleines `div` oben links (monospace, 11 px, halbtransparent), aktualisiert alle 0.5 s:
  `FPS | Phase | Soldaten | z | Gegner | Projektile | Draw Calls (renderer.info.render.calls)`.
- `window.__game.skipTo(z)`: setzt `squad.z = squad.prevZ = z` (nur Debug).
- `win()`: `boss.hp = 0; boss.state = 'dead'`; `lose()`: `changeSoldiers(−count)`, Held deaktivieren.
- README-Abschnitt „Debug-Parameter“ ausfüllen.

**Tests:** `parseDebugParams('?level=3&autoplay=1&speed=20')` → level 3, autoplay true, speed 8;
leerer String → Standardwerte; `quality=ultra` → null.

**Akzeptanzkriterien (M3):**
- [ ] `?autoplay=1&speed=4` spielt Level 1 im Zeitraffer durch.
- [ ] Manuell spielbar: Sieg und Niederlage sind erreichbar und führen zum Neustart.

**Commit:** `feat(app): debug params, fps meter and window.__game api`
