# Phase 6 – Funktionale UI, Speichern, Shop

Ziel: Vollständiger Spielablauf mit Menü, Levelauswahl, HUD, Pause, Ergebnis, Shop und
Einstellungen. Optik in dieser Phase **funktional und sauber**; der große Design-Feinschliff
folgt in Phase 10.

Allgemeine UI-Regeln:
- Kein Framework. Jeder Bildschirm ist eine Klasse mit `readonly el: HTMLElement`, `show()`, `hide()`, `destroy()`.
- Alle Texte deutsch. Zahlen mit `formatCount`.
- Interaktive Elemente bekommen `data-ui-interactive` (damit die Steuerung sie ignoriert, Schritt 5.1).
- `#ui-root` hat `pointer-events: none`; Bildschirme außer dem HUD haben `pointer-events: auto`;
  im HUD nur Buttons.

---

## Schritt 6.1 – Styles, DOM-Helfer, UIManager, Schrift

**Dateien:** `src/ui/styles.css`, `src/ui/dom.ts`, `src/ui/UIManager.ts`, `src/ui/components/Button.ts`, `src/main.ts`

**Umsetzung:**
1. `npm install @fontsource/lilita-one@^5`; in `main.ts`: `import '@fontsource/lilita-one';` und `import './ui/styles.css';`.
   Inline-Styles aus Schritt 0.1 entfernen.
2. `styles.css` – Grundgerüst:
   ```css
   :root {
     --c-bg: #1b2a1f; --c-panel: rgba(16, 24, 40, 0.86); --c-text: #ffffff; --c-muted: #b8c2d6;
     --c-primary: #2f6bff; --c-primary-dark: #1f45b0; --c-gold: #f2c230; --c-gold-dark: #b38600;
     --c-danger: #e5383b; --c-success: #2ec27e;
     --radius: 16px; --shadow: 0 6px 0 rgba(0,0,0,.35);
     --font-display: 'Lilita One', 'Arial Black', Impact, sans-serif;
     --font-body: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
   }
   html, body, #app { margin: 0; height: 100%; overflow: hidden; background: var(--c-bg); }
   body { font-family: var(--font-body); color: var(--c-text); user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
   #app { position: relative; }
   #game-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
   #ui-root { position: absolute; inset: 0; pointer-events: none; }
   .screen { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; pointer-events: auto; }
   .screen.hidden { display: none; }
   .screen--overlay { background: rgba(8, 12, 20, 0.6); backdrop-filter: blur(4px); }
   .panel { background: var(--c-panel); border-radius: var(--radius); padding: 20px; min-width: 260px; max-width: min(92vw, 420px); }
   .title { font-family: var(--font-display); font-size: clamp(40px, 11vw, 72px); letter-spacing: 1px; text-shadow: 0 4px 0 #0b2a6b; }
   .btn { font-family: var(--font-display); font-size: 22px; color: #fff; border: 0; border-radius: 14px; padding: 14px 28px; min-height: 52px; min-width: 200px; background: var(--c-primary); box-shadow: 0 6px 0 var(--c-primary-dark); cursor: pointer; }
   .btn:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--c-primary-dark); }
   .btn--gold { background: var(--c-gold); box-shadow: 0 6px 0 var(--c-gold-dark); color: #3b2a00; }
   .btn--ghost { background: transparent; box-shadow: none; border: 2px solid rgba(255,255,255,.4); }
   .btn:disabled { filter: grayscale(1); opacity: .6; cursor: not-allowed; }
   ```
3. `dom.ts`:
   ```ts
   type Props = Record<string, string | number | boolean | EventListener | undefined>;
   /** h('div', { class: 'panel', onclick: fn }, 'Text', child) – Props mit "on" werden Listener, true-Booleans Attribute. */
   export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | null, ...children: (Node | string | null | false)[]): HTMLElementTagNameMap[K];
   export function clear(el: HTMLElement): void;
   export function setText(el: HTMLElement, text: string): void; // nur schreiben, wenn anders (DOM-Schonung)
   ```
4. `components/Button.ts`: `button(label, onClick, variant?: 'primary' | 'gold' | 'ghost', opts?: { icon?: string; disabled?: boolean; ariaLabel?: string })`
   → `<button class="btn btn--…" data-ui-interactive>`; Klick ruft `onClick` (später Klick-Sound in Phase 7).
5. `UIManager`:
   ```ts
   export type ScreenName = 'loading' | 'menu' | 'levelSelect' | 'hud' | 'pause' | 'result' | 'shop' | 'settings';
   export interface Screen { readonly el: HTMLElement; show(): void; hide(): void; destroy(): void }
   export class UIManager {
     constructor(root: HTMLElement);
     register(name: ScreenName, screen: Screen): void; // hängt el an root, versteckt
     show(name: ScreenName): void;   // zeigt genau diesen (HUD bleibt optional sichtbar, siehe unten)
     showOverlay(name: ScreenName): void; // zusätzlich über dem aktuellen
     hide(name: ScreenName): void;
     hideAll(): void;
   }
   ```

**Commit:** `feat(ui): base styles, dom helper, ui manager and button`

---

## Schritt 6.2 – Speicherstand (SaveManager)

**Dateien:** `src/persistence/SaveManager.ts`, `src/persistence/SaveManager.test.ts`

**Umsetzung:**
```ts
export type QualitySetting = 'auto' | 'low' | 'medium' | 'high';
export interface Settings { sound: boolean; music: boolean; haptics: boolean; sensitivity: number; quality: QualitySetting; reducedMotion: boolean }
export interface SaveData {
  version: 1;
  coins: number;
  highestUnlockedLevel: number;
  levelStars: Record<string, number>; // "1" → 0..3 (beste)
  upgrades: UpgradeLevels;
  settings: Settings;
  tutorialSeen: Record<string, boolean>; // Phase 10
  stats: { runs: number; wins: number; enemiesKilled: number; bestEndlessRound: number };
}
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }
export const SAVE_KEY = 'runenschacht.save.v1';
export function defaultSave(): SaveData; // sensitivity 1.4, quality 'auto', sound/music/haptics true, reducedMotion false, highestUnlockedLevel 1
/** Fügt geladene (evtl. kaputte/alte) Daten mit Standardwerten zusammen und begrenzt Zahlen. */
export function sanitizeSave(raw: unknown): SaveData;
export class SaveManager {
  constructor(storage?: StorageLike); // Standard: localStorage, bei Fehler In-Memory-Ersatz
  get data(): Readonly<SaveData>;
  update(fn: (d: SaveData) => void): void; // ändert und speichert sofort (try/catch)
  /** Wendet ein Laufergebnis an: Münzen, Sterne, Freischaltung, Statistik. */
  applyResult(result: RunResult): { newBestStars: boolean; unlockedLevel: number | null };
  /** Kauft ein Upgrade, wenn genug Münzen. */
  buyUpgrade(id: UpgradeId): boolean;
  reset(): void;
}
```
`sanitizeSave`: Nicht-Objekte → `defaultSave()`; jede Zahl auf sinnvollen Bereich (`coins ≥ 0`,
`highestUnlockedLevel 1 … LEVEL_COUNT`, Upgrades `0 … maxLevel`, `sensitivity 0.5 … 3`).
`applyResult`: `runs++`; bei Sieg `wins++`, Sterne max, `highestUnlockedLevel = max(…, levelId + 1)` (begrenzt).
Münzen immer gutschreiben, `enemiesKilled` aufaddieren.

**Tests:** mit Fake-Storage (Map): Standardwerte, Kaputtes JSON → Standard, Teilweise Daten werden ergänzt,
`applyResult` (Sieg/Niederlage), `buyUpgrade` (genug/zu wenig Münzen/max. Stufe), `setItem` wirft → kein Absturz.

**Commit:** `feat(persistence): versioned save manager`

---

## Schritt 6.3 – HUD

**Dateien:** `src/ui/screens/HudScreen.ts`, `src/ui/components/ProgressBar.ts`, `styles.css`

**Umsetzung:**
```ts
export class HudScreen implements Screen {
  onPause: (() => void) | null = null;
  constructor();
  /** Pro Frame aufrufen; schreibt nur geänderte Werte ins DOM. */
  update(world: WorldState, coins: number): void;
  onEvent(event: SimEvent): void;
}
```
Layout (mobil zuerst, `padding: max(12px, env(safe-area-inset-top))`):
- **Oben links:** Level-Plakette „Level 1“ (bzw. „Runde 3“ im Endlosmodus, per `setLabel(text)`).
- **Oben Mitte:** Fortschrittsbalken (`squad.z / arenaZ`), Breite 50 vw (max 280 px), rechts Totenkopf-Symbol (Boss).
- **Oben rechts:** Münzen (Symbol + Zahl) und Pause-Button (`⏸`, 48×48, `data-ui-interactive`).
- **Unter dem Balken (nur `bossFight`):** Boss-HP-Balken rot mit Text „BOSS“ und `ceil(hp)`.
- **Unten links:** Waffen-Plakette: Name + 4 Pips (gefüllt bis `weaponTier`).
- **Unten rechts (nur wenn Held aktiv):** Held-HP-Balken.
- **Unten Mitte (nur Phase `ready`):** pulsierender Hinweis „☝ Ziehen zum Starten“.
- `onEvent('weaponUpgraded')` → Waffen-Plakette kurz hervorheben (CSS-Klasse `pulse` 600 ms).

**Commit:** `feat(ui): in-game hud`

---

## Schritt 6.4 – Hauptmenü und Levelauswahl

**Dateien:** `src/ui/screens/MenuScreen.ts`, `src/ui/screens/LevelSelectScreen.ts`, `src/ui/screens/LoadingScreen.ts`

**Umsetzung:**
- `LoadingScreen`: Titel + Text „Lädt…“; wird gezeigt, bis `document.fonts.ready` erfüllt ist und der erste Frame gerendert wurde.
- `MenuScreen(callbacks: { play, levels, shop, settings })`, `setCoins(n)`, `setNextLevel(n)`:
  Titel „RUNENSCHACHT“, Untertitel „Brückensturm“, großer Button „Spielen – Level n“ (gold),
  darunter „Level“, „Shop“, „Einstellungen“ (ghost). Münzanzeige oben rechts.
  Hintergrund: Spielszene bleibt sichtbar (Kamera zeigt Level `n` im Zustand `ready`, Trupp wartet) – das Menü ist halbtransparent.
- `LevelSelectScreen(callbacks: { select(levelId | 'endless'), back })`, `refresh(save)`:
  Raster 3 Spalten, je Level eine Kachel: Nummer, Name (klein), 0–3 Sterne; gesperrte Level ausgegraut mit 🔒
  (nicht klickbar). Letzte Kachel „∞ Endlos“ – freigeschaltet, wenn `highestUnlockedLevel > LEVEL_COUNT`.

**Commit:** `feat(ui): loading, main menu and level select screens`

---

## Schritt 6.5 – Pause

**Dateien:** `src/ui/screens/PauseScreen.ts`

**Umsetzung:** Overlay-Panel „Pause“ mit Buttons „Weiter“ (primary), „Neustart“, „Einstellungen“, „Menü“ (ghost).
Callbacks `{ resume, restart, settings, menu }`. `Escape`/`P` während Pause → `resume`.

**Commit:** `feat(ui): pause overlay`

---

## Schritt 6.6 – Ergebnisbildschirm

**Dateien:** `src/ui/screens/ResultScreen.ts`

**Umsetzung:**
```ts
export class ResultScreen implements Screen {
  constructor(cb: { next: () => void; retry: () => void; menu: () => void; shop: () => void });
  showResult(r: RunResult, info: { hasNextLevel: boolean; newBestStars: boolean; totalCoins: number; progress: number }): void; // progress = squad.z / arenaZ (0..1)
}
```
- **Sieg:** Überschrift „SIEG!“ (gold), drei Sterne (gefüllt nach `r.stars`), Zeilen: „Überlebende“, „Besiegte Gegner“,
  „Münzen +X“. Buttons: „Weiter“ (gold, nur wenn `hasNextLevel`), „Nochmal“, „Menü“.
- **Niederlage:** Überschrift „NIEDERLAGE“ (rot), „Fortschritt X %“ (aus `info.progress`),
  „Münzen +X“, Buttons „Nochmal“ (primary), „Shop“ (gold), „Menü“.

**Commit:** `feat(ui): result screen for victory and defeat`

---

## Schritt 6.7 – Shop

**Dateien:** `src/ui/screens/ShopScreen.ts`

**Umsetzung:** `ShopScreen(cb: { buy(id): boolean; back() })`, `refresh(save)`.
Je Upgrade (`UPGRADES`) eine Karte: Name, Beschreibung, Stufe `n/10` (Balken), aktueller → nächster Wert
(z. B. „Startsoldaten 14 → 16“), Kauf-Button mit Preis (gold) oder „MAX“. Button deaktiviert, wenn
Münzen < Preis. Münzstand oben. Nach Kauf `refresh`.

**Commit:** `feat(ui): upgrade shop`

---

## Schritt 6.8 – Einstellungen

**Dateien:** `src/ui/screens/SettingsScreen.ts`

**Umsetzung:** `SettingsScreen(cb: { change(patch: Partial<Settings>): void; back(): void; resetProgress(): void })`, `refresh(settings)`.
Elemente: Schalter „Soundeffekte“, „Musik“, „Vibration“, „Bewegung reduzieren“; Schieberegler „Steuerempfindlichkeit“
(0.5–3, Schritt 0.1, Wert anzeigen); Auswahl „Grafikqualität“ (Auto/Niedrig/Mittel/Hoch, Segment-Buttons);
ganz unten „Fortschritt zurücksetzen“ (rot, mit `confirm()`-Abfrage). Änderungen sofort anwenden und speichern.
App wendet an: `input.sensitivity`, Audio (Phase 7), Qualität (Phase 9: bis dahin nur speichern).

**Commit:** `feat(ui): settings screen`

---

## Schritt 6.9 – Kompletter Ablauf verdrahten

**Dateien:** `src/app/App.ts`

**Umsetzung:** Ersetzt den Platzhalter aus 5.3:
- Start: `boot` → LoadingScreen → `menu` (Session für nächstes Level im Zustand `ready` als Hintergrund, `input.enabled = false`).
- `menu.play` → `playing` (Menü ausblenden, HUD zeigen, `input.enabled = true`).
- `levelSelect.select(id)` → neue Session für `id` → `playing`.
- Pause-Button/Escape → `paused` (PauseScreen-Overlay); `resume` → `playing`; `restart` → neue Session gleiches Level;
  `menu` → `menu`; `settings` → `settings` (zurück führt zu `paused`).
- `sim.isFinished()` → `save.applyResult(result)` → `result` (ResultScreen).
  `next` → nächstes Level; `retry` → gleiches Level; `shop` → `shop` (zurück → `result`… zurück-Button im Shop führt zum vorherigen Zustand).
- Session-Modifikatoren immer aus `modifiersFromUpgrades(save.data.upgrades)`.
- Debug-Parameter `?level=` überspringt das Menü.
- Endlosmodus: Kachel vorhanden, startet vorerst Level 5 mit Hinweis-Toast „Kommt in Phase 8“ – wird in 8.4 ersetzt.

**Akzeptanzkriterien:**
- [ ] Kompletter Durchlauf Menü → Level 1 → Sieg → Weiter → Level 2 → Pause → Menü funktioniert.
- [ ] Münzen und Freischaltungen bleiben nach Neuladen der Seite erhalten.
- [ ] Shop-Kauf wirkt sich im nächsten Level aus (mehr Startsoldaten sichtbar).

**Commit:** `feat(app): wire complete game flow with menus, results and shop`
