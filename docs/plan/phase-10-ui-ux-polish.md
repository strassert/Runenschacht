# Phase 10 – UI- und Usability-Verbesserung

Voraussetzung: Phasen 0–9 abgeschlossen (M5). Das Spiel ist vollständig; jetzt wird es
**schöner, verständlicher und angenehmer bedienbar**. Jeder Schritt ist klein und für sich
prüfbar. Grundlage ist ein Audit mit Vorher-Screenshots (10.1); am Ende steht ein Vergleich (10.14).

Leitlinien (gelten für alle Schritte dieser Phase):
1. **Daumenzone:** Alle Bedienelemente im Spiel liegen oben (nicht primär) oder unten-mittig; die Spielfläche bleibt frei.
2. **Mindestgröße Touch-Ziele 48×48 px**, Abstand ≥ 8 px.
3. **Eine Primäraktion pro Bildschirm** (gold, groß, unten); Sekundäraktionen als Ghost-Buttons.
4. **Feedback innerhalb von 100 ms** auf jede Eingabe (visuell, optional Ton/Vibration).
5. **Kontrast:** Text ≥ 4.5:1 (WCAG AA), große Zahlen ≥ 3:1.
6. **Bewegung reduzieren** respektieren (Einstellung **und** `prefers-reduced-motion`).
7. Keine neuen Laufzeit-Abhängigkeiten.

---

## Schritt 10.1 – UX-Audit und Baseline-Screenshots

**Dateien:** `e2e/screenshots.spec.ts`, `docs/ux/AUDIT.md`, `docs/ux/baseline/*.png`

**Umsetzung:**
1. `e2e/screenshots.spec.ts` (nur bei `SCREENSHOTS=1` aktiv, `test.skip` sonst) erzeugt Screenshots in
   **zwei Viewports** (390×844 „Phone“, 1280×800 „Desktop“) von: Ladebildschirm, Menü, Levelauswahl, Shop,
   Einstellungen, HUD im Zustand `ready`, HUD mitten im Lauf (`?level=1&autoplay=1&speed=2`, nach 6 s),
   Bosskampf (`window.__game.skipTo(185)`), Pause, Sieg, Niederlage (`window.__game.lose()`).
   Ablage: `docs/ux/baseline/<viewport>-<name>.png`. Skript `"screenshots": "SCREENSHOTS=1 playwright test e2e/screenshots.spec.ts"`.
2. `docs/ux/AUDIT.md` anlegen mit Tabelle je Bildschirm: *Beobachtung · Problem · Schwere (hoch/mittel/niedrig) · Schritt, der es behebt*.
   Mindestens diese Punkte prüfen und eintragen:
   - Ist auf jedem Bildschirm klar, was die Primäraktion ist?
   - Verdeckt das HUD wichtige Spielobjekte (Karten, Zahlen auf Blöcken)?
   - Lesbarkeit der Zahlen auf Blöcken/Karten aus Spielerperspektive (Phone).
   - Versteht ein Erstspieler ohne Erklärung: Ziehen, Karten beschießen, Tore wählen?
   - Ist erkennbar, *warum* man verloren hat?
   - Desktop: Wirkt das Hochformat-Spiel im Querformat-Fenster verloren/gestreckt?
   - Tastaturbedienung der Menüs möglich? Fokus sichtbar?
   - Safe Areas (Notch, Home-Indikator) eingehalten?

**Akzeptanzkriterien:** [ ] 22 Baseline-Screenshots vorhanden; Audit mit ≥ 15 Einträgen.

**Commit:** `docs(ux): audit and baseline screenshots`

---

## Schritt 10.2 – Design-Tokens, Icons und Komponenten

**Dateien:** `src/ui/styles.css` (aufteilen in `src/ui/styles/tokens.css`, `base.css`, `components.css`, `screens.css`, Import über `styles.css`), `src/ui/components/Icon.ts`, `src/ui/components/Button.ts`, `src/ui/components/Panel.ts`, `src/ui/components/Toggle.ts`, `src/ui/components/Slider.ts`, `src/ui/components/Segmented.ts`

**Umsetzung:**
1. **Tokens** (`tokens.css`):
   - Farben: `--blue-500 #2f6bff`, `--blue-700 #1f45b0`, `--blue-900 #0b2a6b`, `--gold-400 #ffd84d`, `--gold-500 #f2c230`,
     `--gold-700 #b38600`, `--red-500 #e5383b`, `--red-700 #9b1c1f`, `--green-500 #2ec27e`, `--ink-900 #0e1420`,
     `--ink-700 #1d2638`, `--ink-500 #3a4660`, `--paper #f7f4ec`, `--white #fff`.
   - Abstände: `--sp-1 4px … --sp-8 48px` (4er-Raster). Radien: `--r-sm 10px`, `--r-md 16px`, `--r-lg 24px`, `--r-pill 999px`.
   - Schatten: `--elev-1 0 4px 0 rgba(0,0,0,.35)`, `--elev-2 0 8px 0 rgba(0,0,0,.35), 0 12px 24px rgba(0,0,0,.25)`.
   - Typo-Skala (mit `clamp()`): `--fs-xs 12px`, `--fs-sm 14px`, `--fs-md 17px`, `--fs-lg clamp(20px, 5vw, 24px)`, `--fs-xl clamp(28px, 8vw, 40px)`, `--fs-hero clamp(44px, 13vw, 84px)`.
   - Dauer: `--t-fast 120ms`, `--t-med 220ms`, `--t-slow 400ms`, Easing `--ease-out cubic-bezier(.2,.8,.2,1)`, `--ease-back cubic-bezier(.34,1.56,.64,1)`.
   - `@media (prefers-reduced-motion: reduce)` und Klasse `html.reduced-motion` → alle Dauern auf `0.01ms`.
2. **Icons** (`Icon.ts`): `icon(name, size = 24): SVGElement` mit Inline-SVG-Pfaden (stroke-basiert, `currentColor`, Strichstärke 2.5, runde Enden):
   `pause, play, retry, home, next, gear, cart, coin, star, starOutline, lock, skull, sword, shield, heart, soundOn, soundOff, music, musicOff, vibrate, close, check, chevronLeft, infinity, hand`.
3. **Button** überarbeiten: Varianten `primary | gold | ghost | danger | icon`; Größen `md | lg`;
   „Chunky-3D“-Look (Unterkante als `box-shadow` in dunklerer Farbe, oberer Glanz via `linear-gradient`),
   Zustände `:hover` (heller), `:active` (4 px nach unten, Schatten 2 px), `:focus-visible` (3 px Ring `--gold-400`, Abstand 3 px),
   `disabled` (entsättigt, Cursor not-allowed, `aria-disabled`). Optionales Icon links, optionales Badge (z. B. Preis).
   Beim Drücken: Klick-Sound und `navigator.vibrate?.(8)` (wenn erlaubt).
4. **Panel** (abgerundete Karte, `--ink-700` mit 1 px Innenrand `rgba(255,255,255,.08)`, Titelzeile optional mit Zurück-Button).
5. **Toggle** (Schalter 52×32, `role="switch"`, `aria-checked`), **Slider** (eigener Thumb 28 px, Wertanzeige),
   **Segmented** (Gruppe von Buttons, `role="radiogroup"`). Alle per Tastatur bedienbar.
6. Alle bestehenden Bildschirme auf die neuen Komponenten umstellen (noch ohne Layout-Änderungen).

**Akzeptanzkriterien:** [ ] Keine Inline-Farben mehr in TS-Dateien (`grep -rn "#[0-9a-f]\{6\}" src/ui` liefert nur `tokens.css`).

**Commit:** `feat(ui): design tokens, icon set and component library`

---

## Schritt 10.3 – Layout-Rahmen, Safe Areas, Desktop-Darstellung

**Dateien:** `index.html`, `src/ui/styles/base.css`, `src/app/App.ts`, `src/render/Renderer.ts`

**Umsetzung:**
1. **Spielrahmen:** `#app` wird zu einem zentrierten Rahmen: auf Bildschirmen mit Seitenverhältnis > 10:16
   (Desktop/Querformat) `height: 100dvh; aspect-ratio: 9 / 16; max-width: 100vw; margin: 0 auto`,
   abgerundete Ecken (`--r-lg`) und Schatten. Dahinter `body::before`: unscharfer, abgedunkelter Hintergrund
   (Verlauf in Dschungelfarben `#24402b → #0e1a12`). Auf Phones im Hochformat Vollbild ohne Rahmen.
   Der Renderer misst bereits das Elternelement (4.1) – prüfen, dass `ResizeObserver` den Rahmen nutzt.
2. **Safe Areas:** CSS-Variablen `--safe-top: env(safe-area-inset-top, 0px)` usw.; HUD-Oberkante `calc(var(--safe-top) + 10px)`,
   Unterkante `calc(var(--safe-bottom) + 12px)`.
3. **Dynamische Viewport-Höhe:** `100dvh` statt `100%`, Fallback `100vh`.
4. **Querformat auf Phones** (`(orientation: landscape) and (pointer: coarse) and (max-height: 500px)`):
   Overlay „Bitte Gerät drehen“ mit animiertem Telefon-Icon; Spiel pausiert automatisch, solange sichtbar.
5. **Kein Browser-Zoom/Scroll:** `touch-action: none` auf `#app`, `overscroll-behavior: none` auf `html, body`,
   `gesturestart`-Event `preventDefault` (iOS Pinch).

**Akzeptanzkriterien:** [ ] Desktop 1280×800: zentriertes 9:16-Spiel mit dekorativem Hintergrund; iPhone-Simulation mit Notch: nichts abgeschnitten.

**Commit:** `feat(ui): portrait frame, safe areas and orientation handling`

---

## Schritt 10.4 – HUD-Redesign

**Dateien:** `src/ui/screens/HudScreen.ts`, `src/ui/styles/screens.css`, `src/ui/components/ProgressBar.ts`

**Umsetzung:**
1. **Obere Leiste** (eine Zeile, Höhe 56 px, halbtransparenter Verlauf von oben `rgba(0,0,0,.45) → 0`):
   links Pause-Icon-Button (48 px), Mitte Fortschrittsbalken, rechts Münz-Pille (Icon + Zahl, `tabular-nums`).
   Level-Name wandert **in** den Fortschrittsbalken (kleine Beschriftung darüber: „Level 3 · Wasserfall-Pass“).
2. **Fortschrittsbalken mit Meilensteinen:** Kleine Marker an den z-Positionen von Karten (Kartensymbol),
   Toren (Torsymbol) und am Ende der Boss (Totenkopf). Erreichte Marker werden ausgegraut; freigeschaltete Karten zeigen einen Haken.
   Füllfarbe Verlauf `--blue-500 → --gold-400`. Fortschritt mit `transform: scaleX()` (GPU, kein Layout).
3. **Boss-Leiste:** Im Bosskampf gleitet ein breiter Boss-Balken unter die obere Leiste (Name „Wächter des Schachts“, HP-Zahl,
   rote Füllung mit verzögertem weißem „Schadens-Nachlauf“ wie in Kampfspielen: zweiter Balken folgt mit 400 ms Verzögerung).
4. **Waffen- und Held-Anzeige** unten links/rechts in kompakten Pillen (Icon + Tier-Pips / Herz + Balken), 70 % Deckkraft,
   bei Änderung kurzes `pop` (Skalierung 1 → 1.15 → 1, `--ease-back`).
5. **Truppgrößen-Plakette** (3D-Label über dem Trupp, Schritt 4.15) zusätzlich: bei Zunahme grün aufblitzen + Skalierungs-Puls,
   bei Abnahme rot + kurzes Wackeln (nur ohne reduzierte Bewegung).
6. **Nichts verdeckt die Spur:** Prüfen, dass im Phone-Viewport die Karten und Blockzahlen 20 m voraus nicht von HUD-Elementen
   überdeckt werden; ggf. Kamera-Fokus (`fz`) um 1–2 m anpassen und in `DECISIONS.md` notieren.

**Akzeptanzkriterien:** [ ] HUD belegt oben ≤ 12 % und unten ≤ 8 % der Bildschirmhöhe (Phone).

**Commit:** `feat(ui): redesigned hud with milestone progress and boss bar`

---

## Schritt 10.5 – Onboarding und kontextuelle Hinweise

**Dateien:** `src/ui/screens/TutorialOverlay.ts`, `src/app/TutorialDirector.ts`, `src/app/TutorialDirector.test.ts`, `src/app/App.ts`, `src/persistence/SaveManager.ts`

**Umsetzung:**
1. `TutorialDirector` (reine Logik, testbar):
   ```ts
   export type TipId = 'drag' | 'blocks' | 'card' | 'horde' | 'gate' | 'boss' | 'wall';
   export class TutorialDirector {
     constructor(seen: Record<string, boolean>);
     /** Prüft pro Frame, ob ein Hinweis fällig ist. Gibt höchstens einen neuen Hinweis zurück. */
     check(world: WorldState): TipId | null;
     markSeen(id: TipId): void;
   }
   ```
   Auslöser (jeweils nur einmal pro Spielstand, nur in Level 1–3):
   - `drag`: Phase `ready`.
   - `blocks`: erster nicht gesammelter Block 8–14 m voraus.
   - `card`: erste gesperrte Karte 18–24 m voraus.
   - `horde`: erster Gegner wechselt zu `charging`.
   - `gate`: erstes Tor 14–20 m voraus.
   - `wall`: erstes `cardSmashed`-Ereignis (nachträglich erklärend).
   - `boss`: Boss wird `walking`.
2. `TutorialOverlay`: Sprechblase oben-mittig (unter dem HUD) mit Icon + max. 2 Zeilen Text; Pfeil zeigt in Richtung des Objekts
   (Weltposition → Bildschirmposition über `vector.project(camera)`). Texte:
   - drag: „Halte und ziehe nach links oder rechts, um deinen Trupp zu steuern.“ + animierte Hand (Wischgeste, Schleife)
   - blocks: „Lauf durch die Blöcke – jeder bringt dir neue Soldaten!“
   - card: „Schieß auf die Karte, bis die Zahl 0 erreicht. Dann gehört die Belohnung dir!“
   - horde: „Gegner! Jeder Gegner, der dich erreicht, kostet einen Soldaten. Abschießen oder ausweichen!“
   - gate: „Tore verändern deinen Trupp. Wähle die bessere Seite!“
   - wall: „Eine Karte, die noch nicht leer geschossen ist, wirkt wie eine Mauer.“
   - boss: „Der Boss! Halte durch und feuere mit allem, was du hast.“
3. Während ein Hinweis (außer `drag`) erscheint: **Zeitlupe** `timeScale = 0.35` für 1.4 s, dann sanft zurück auf 1 (über 0.3 s).
   Bei reduzierter Bewegung keine Zeitlupe, Hinweis bleibt 3 s stehen.
4. Hinweise in `save.tutorialSeen` speichern. Einstellungen: Button „Tipps zurücksetzen“.

**Tests:** Director gibt jeden Tipp genau einmal; in Level 4 keine Tipps; Reihenfolge bei gleichzeitigen Auslösern: `card` vor `blocks`.

**Akzeptanzkriterien:** [ ] Ein Erstspieler (frischer Spielstand) sieht in Level 1 nacheinander drag → blocks → card → horde → gate → boss.

**Commit:** `feat(ux): first-run onboarding with contextual tips`

---

## Schritt 10.6 – Spielgefühl und Rückmeldung („Juice“)

**Dateien:** `src/render/views/*`, `src/render/fx/*`, `src/ui/screens/HudScreen.ts`, `src/app/App.ts`

**Umsetzung:**
1. **Kombo-Zähler:** Blöcke, die innerhalb von 0.6 s nacheinander gesammelt werden, zählen eine Kombo hoch;
   ab 5 erscheint am Bildschirmrand „KOMBO ×N“ (gold, `pop`-Animation), Tonhöhe des Pickup-Sounds steigt (bereits 7.2).
2. **Karten-Treffer:** Zahl auf der Karte wackelt minimal (±2° Rotation, 60 ms) bei jedem Neuzeichnen; unter 20 % HP
   pulsiert ein goldener Rand („gleich geschafft“).
3. **Karten-Freischaltung:** Karte fliegt zum Trupp (4.11) **plus** Banner über der Spielfläche: Icon + „STURMGEWEHR!“ / „HELD SCHLIESST SICH AN!“ / „+60 SOLDATEN!“
   (0.9 s, `--ease-back`), Konfetti (7.4).
4. **Tor-Ergebnis:** großer Schriftzug in Bildschirmmitte („×2“ grün oder „−30“ rot), 0.6 s; Kamera-FOV-Puls +3° bei positiven Toren.
5. **Treffer an Gegnern:** getroffene Gegner blitzen 50 ms weiß auf (per-Instance-Farbe in `EnemyView`), dann Partikel.
6. **Boss-Kill:** Zeitlupe 0.25× für 0.8 s, weißer Bildschirmblitz (Opacity 0.6 → 0 in 250 ms), Kamera-Zoom 5 % zum Boss, danach Siegesbildschirm.
7. **Soldatenverlust-Klarheit:** Bei Verlusten durch Gegnerkontakt kleine rote „−1“-Partikel direkt am Trupprand (Richtung des Gegners).
8. Alles unter Punkt 1–7 bei „Bewegung reduzieren“: keine Zeitlupe, kein Blitz, keine Kamera-Effekte; Banner ohne Animation.

**Commit:** `feat(ux): combo counter, unlock banners and impact feedback`

---

## Schritt 10.7 – Steuerungs-Feinschliff

**Dateien:** `src/input/InputController.ts`, `src/render/views/SquadView.ts` (oder neue `TargetIndicatorView.ts`), `src/ui/screens/SettingsScreen.ts`, `src/persistence/SaveManager.ts`

**Umsetzung:**
1. **Zwei Steuerungsarten** (Einstellung „Steuerung“): `relativ` (Standard, wie bisher) und `absolut`
   (Fingerposition x im Rahmen → `targetX = (x / Breite − 0.5) · 12 · 1.1`, begrenzt). `Settings.controlMode: 'relative' | 'absolute'` ergänzen (sanitize!).
2. **Glättung gegen Zittern:** Pointer-Deltas < 0.5 px ignorieren; bei sehr schnellen Wischern (> 80 px/Frame) auf 80 px begrenzen.
3. **Ziel-Indikator:** dezente, halbtransparente Linie/Pfeil am Boden unter dem Trupp bei `targetX`, sichtbar nur während der Finger gedrückt ist
   (blendet in 150 ms ein/aus). Hilft zu verstehen, wohin der Trupp gleitet.
4. **Empfindlichkeits-Vorschau:** im Einstellungsbildschirm ein Mini-Feld (Streifen) mit einem Punkt, der beim Ziehen im Feld
   der eingestellten Empfindlichkeit folgt.
5. **Linkshänder-/Einhand-Freundlich:** Pause auch per Zwei-Finger-Tipp irgendwo (`pointerdown` mit zweitem Pointer < 250 ms nach dem ersten).

**Commit:** `feat(ux): control modes, target indicator and input smoothing`

---

## Schritt 10.8 – Übergänge, Ladebildschirm, Fortsetzen-Countdown

**Dateien:** `src/ui/UIManager.ts`, `src/ui/screens/LoadingScreen.ts`, `src/ui/screens/PauseScreen.ts`, `src/app/App.ts`, `styles/screens.css`

**Umsetzung:**
1. **Bildschirmübergänge** im `UIManager`: Ein-/Ausblenden mit Opacity + 12 px Versatz nach oben, `--t-med`;
   Overlays (Pause, Ergebnis) skalieren von 0.96 auf 1. Während eines Übergangs `pointer-events: none` (kein Doppelklick-Chaos).
2. **Ladebildschirm** mit echtem Fortschritt (Schritte: Schrift geladen 30 %, Szene aufgebaut 60 %, Shader kompiliert 90 %, erster Frame 100 %);
   Fortschrittsbalken + wechselnde Tipps („Tipp: Goldene Blöcke geben viel mehr Soldaten“). Mindestens 400 ms zeigen (kein Flackern).
3. **Fortsetzen-Countdown:** „Weiter“ in der Pause → großer Countdown 3‑2‑1 (je 0.5 s, mit Ton), erst dann läuft die Simulation weiter.
   Ebenso nach automatischer Pause durch App-Wechsel.
4. **Level-Intro:** beim Start eines Levels 1.2 s Kamera-Flug von oben (Überblick über die Brücke) zur Startposition; danach „Ziehen zum Starten“.
   Überspringbar durch Tippen. Bei reduzierter Bewegung entfällt der Flug.

**Commit:** `feat(ux): screen transitions, loading progress and resume countdown`

---

## Schritt 10.9 – Ergebnisbildschirm verbessern

**Dateien:** `src/ui/screens/ResultScreen.ts`, `src/app/App.ts`, `src/core/scoring.ts` (Ursache)

**Umsetzung:**
1. **Sieg:** Sterne erscheinen nacheinander (je 250 ms, `pop` + Ton), Münzen zählen hoch (800 ms, `coin`-Ton alle 50 ms),
   Badge „NEUER REKORD“ bei `newBestStars`. Primärbutton „Weiter“ groß (gold, `lg`), darunter klein „Nochmal“ · „Menü“.
2. **Niederlage mit Ursache:** `RunResult.defeatCause: 'horde' | 'boss' | 'wall' | 'gate' | null` ergänzen
   (= Grund der letzten Soldatenverlust-Ereignisse; in `Simulation` den letzten `reason` mit delta < 0 merken; Test ergänzen).
   Text je Ursache + konkreter Tipp:
   - horde: „Von der Horde überrannt. Tipp: Ziele früher auf die Gegner oder weiche in eine freie Spur aus.“
   - boss: „Der Boss war zu stark. Tipp: Sammle mehr Soldaten und verbessere die Feuerrate im Shop.“
   - wall: „In eine Karte gelaufen. Tipp: Schieß Karten erst frei, bevor du sie erreichst.“
   - gate: „Falsches Tor erwischt. Tipp: Achte auf rote Tore.“
3. **Fortschritt sichtbar:** Mini-Fortschrittsbalken mit Markierung, wie weit man kam (und bisheriger Bestwert pro Level → `save.levelBestProgress` ergänzen).
4. **Shop-Hinweis:** Wenn ein Upgrade bezahlbar ist, zeigt der Shop-Button einen pulsierenden Punkt + „Upgrade verfügbar“.

**Commit:** `feat(ux): richer result screen with defeat causes and tips`

---

## Schritt 10.10 – Menü, Levelkarte und Shop verbessern

**Dateien:** `src/ui/screens/MenuScreen.ts`, `src/ui/screens/LevelSelectScreen.ts`, `src/ui/screens/ShopScreen.ts`, `styles/screens.css`

**Umsetzung:**
1. **Hauptmenü:** Logo-Schriftzug mit leichtem Schwebe-Effekt; ein großer Button „SPIELEN“ (zeigt darunter „Level 4 · Schlangentempel“);
   Icon-Buttons unten in einer Leiste: Level (Karte), Shop (Wagen, mit Punkt wenn bezahlbar), Einstellungen (Zahnrad).
   Im Hintergrund kreist die Kamera langsam um den wartenden Trupp (Menü-Kamera-Modus in `CameraRig`: Orbit 0.08 rad/s).
2. **Levelkarte statt Raster:** vertikal scrollbarer Pfad (SVG-Kurve) mit runden Level-Knoten (Nummer, Sterne darunter),
   aktueller Knoten pulsiert und ist beim Öffnen ins Bild gescrollt; gesperrte Knoten mit Schloss; Endlos-Knoten am Ende (∞).
   Tippen auf einen Knoten öffnet eine kleine Vorschau-Karte (Name, beste Sterne, Bestfortschritt, Button „Start“).
3. **Shop:** Karten zeigen Vorher → Nachher deutlich („Feuerrate +24 % → +30 %“), Stufenbalken aus 10 Segmenten,
   Kaufbutton zeigt Preis; bei zu wenig Münzen: deaktiviert + Text „Dir fehlen 35 🪙“. Kauf-Animation: Münzen fliegen vom Zähler zur Karte (CSS-Animation),
   Segment füllt sich, `coin`-Ton.
4. Alle Listen per Tastatur (Pfeiltasten in Levelkarte, Tab im Shop) bedienbar.

**Commit:** `feat(ux): animated main menu, level map and improved shop`

---

## Schritt 10.11 – Barrierefreiheit

**Dateien:** `src/ui/**`, `src/render/views/GateView.ts`, `src/render/views/BlockView.ts`, `src/persistence/SaveManager.ts`

**Umsetzung:**
1. **Farbsehschwäche:** Tore tragen zusätzlich Symbole (positiv: Pfeil nach oben + Rahmen durchgezogen; negativ: Pfeil nach unten + gestrichelter Rahmen).
   Einstellung „Farbenblind-Modus“ (`Settings.colorblind: boolean`): Positiv-Farbe Blau `#3b82f6`, Negativ Orange `#f97316` statt Grün/Rot.
2. **Textgröße:** Einstellung „Große Schrift“ (`Settings.largeText`) → `html { font-size: 112.5% }` und alle UI-Größen in `rem`.
3. **Tastatur:** Jeder Bildschirm setzt beim Öffnen den Fokus auf die Primäraktion; `Escape` = Zurück/Pause; Fokus-Falle in Overlays;
   sichtbarer Fokusring (10.2).
4. **Screenreader:** `aria-label` für alle Icon-Buttons; `role="dialog"` + `aria-modal` für Overlays; Ergebnis als `aria-live="polite"`-Region;
   HUD-Zahlen `aria-hidden` (zu viele Updates), stattdessen alle 5 s ein zusammenfassender Live-Text nur im Pausenmenü („87 Soldaten, 64 % geschafft“).
5. **Bewegung reduzieren:** `prefers-reduced-motion` setzt den Standardwert beim ersten Start.
6. **Kontrastprüfung:** Skript `scripts/contrast-check.mjs`, das die Token-Paare (Text/Hintergrund) gegen 4.5:1 prüft; im `check`-Skript **nicht** nötig, einmal ausführen und Ergebnis in `docs/ux/AUDIT.md` eintragen.

**Commit:** `feat(a11y): colorblind mode, large text, keyboard and screen reader support`

---

## Schritt 10.12 – Audio-UX

**Dateien:** `src/audio/*`, `src/ui/screens/PauseScreen.ts`, `src/ui/screens/HudScreen.ts`

**Umsetzung:**
1. Mix: Schüsse −6 dB gegenüber Pickups; Musik wird bei Sieg/Niederlage 1 s lang auf 30 % „geduckt“, Jingle darüber.
2. Getrennte Lautstärkeregler (0–100 %) für Effekte und Musik in den Einstellungen (Schalter bleiben als Mute).
3. Stummschalt-Icon-Button im Pausenmenü (ein Tipp für alles).
4. iOS: Wenn der AudioContext nach 1 s Spielzeit noch `suspended` ist, kleiner Hinweis „Tippe für Ton 🔊“ unten (verschwindet beim Tippen).
5. Musikwechsel `run → boss` mit 1-Takt-Übergang (Tom-Fill), nicht abrupt.

**Commit:** `feat(audio): volume sliders, ducking and mute shortcut`

---

## Schritt 10.13 – Mobile-Feinschliff

**Dateien:** `src/app/App.ts`, `src/input/InputController.ts`, `index.html`

**Umsetzung:**
1. **Wake Lock** während `playing`: `navigator.wakeLock?.request('screen')`, bei Pause/Verlassen freigeben; Fehler ignorieren.
2. **Haptik-Feinschliff:** Pickups 5 ms (gedrosselt auf max. 10/s), Tor positiv 15 ms, negativ `[30, 30, 30]`, Karte frei `[20, 40, 60]`.
3. **Vollbild:** Menüpunkt/Option „Vollbild“ (`requestFullscreen` auf `#app`), nur anzeigen, wenn unterstützt und nicht als PWA gestartet.
4. **Auto-Pause:** `visibilitychange`, `blur` und `pagehide` → Pause (mit Countdown beim Fortsetzen, 10.8).
5. **Langes Drücken/Kontextmenü** auf dem Canvas unterbinden (`contextmenu` → `preventDefault`), Textauswahl aus.
6. **Akku-Schonung:** Im Menü Renderer auf 30 FPS drosseln (jeder zweite Frame), im Spiel volle Rate.

**Commit:** `feat(mobile): wake lock, haptics tuning, fullscreen and auto pause`

---

## Schritt 10.14 – Abschluss-Review (Meilenstein M6)

**Dateien:** `docs/ux/after/*.png`, `docs/ux/AUDIT.md`, `README.md`

**Umsetzung:**
1. Screenshot-Skript aus 10.1 erneut ausführen, Ausgabe nach `docs/ux/after/`.
2. In `docs/ux/AUDIT.md` jede Zeile abhaken oder begründen, warum offen; Abschnitt „Vorher/Nachher“ mit Bildpaaren.
3. Performance-Regression prüfen: Messung aus 9.2 wiederholen; FPS-Verlust ≤ 5 %, sonst optimieren (z. B. Banner per `transform`, keine Layout-Thrashes).
4. `npm run check`, `npm run e2e`, `npm run balance` – alles grün.
5. README: Screenshot (Phone) oben, Feature-Liste, Steuerung, Debug-Parameter, Link zur gehosteten Version.

**Akzeptanzkriterien (M6):**
- [ ] Alle „hoch“-Punkte im Audit erledigt, alle „mittel“-Punkte erledigt oder begründet.
- [ ] Ein frischer Spieler versteht Level 1 ohne externe Erklärung (Selbsttest mit gelöschtem Spielstand).
- [ ] CI grün, Deployment aktualisiert.

**Commit:** `docs(ux): final ux review with before/after screenshots`
