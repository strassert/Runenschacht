# Fortschritt

Nach jedem Schritt den Haken setzen (`- [x]`) und im selben Commit committen.
Reihenfolge strikt von oben nach unten.
Gesamt: **86 Schritte**.


## Phase 0 – Projekt-Setup  ([phase-0-setup.md](phase-0-setup.md))

- [x] 0.1 – Vite/TypeScript-Grundgerüst
- [x] 0.2 – Tests, Lint, Format, `check`-Skript
- [x] 0.3 – Ordnerstruktur, README, Editor-Settings
- [x] 0.4 – GitHub Actions CI

## Phase 1 – Core-Grundlagen  ([phase-1-core.md](phase-1-core.md))

- [x] 1.1 – Zentrale Konfiguration
- [x] 1.2 – Mathe-Helfer
- [x] 1.3 – Deterministischer Zufallsgenerator
- [x] 1.4 – Level-Typen und Simulations-Ereignisse
- [x] 1.5 – Objekt-Pools für Projektile und Gegner
- [x] 1.6 – Welt-Typen vervollständigen
- [x] 1.7 – Formation (Phyllotaxis-Spirale)
- [x] 1.8 – Räumliche Z-Buckets (Broadphase)
- [x] 1.9 – Shop-Formeln und Laufzeit-Modifikatoren

## Phase 2 – Level-Daten  ([phase-2-levels.md](phase-2-levels.md))

- [x] 2.1 – Level-Expansion
- [x] 2.2 – Level-Validierung
- [x] 2.3 – Level 1 bis 5

## Phase 3 – Simulation (M1)  ([phase-3-simulation.md](phase-3-simulation.md))

- [x] 3.1 – Welt erzeugen und Welt-Helfer
- [x] 3.2 – Truppbewegung
- [x] 3.3 – Bonus-Blöcke einsammeln
- [x] 3.4 – Tore
- [x] 3.5 – Karten: Belohnung und Wand
- [x] 3.6 – Gegnerhorde
- [x] 3.7 – Held: Folgen und Schießen
- [x] 3.8 – Boss
- [x] 3.9 – Trupp schießt
- [x] 3.10 – Projektile: Flug, Treffer, Schaden
- [x] 3.11 – Sieg/Niederlage
- [x] 3.12 – `Simulation`-Klasse und Wertung
- [x] 3.13 – Autoplay-Bot und Integrationstests (Meilenstein M1)

## Phase 4 – Rendering (M2)  ([phase-4-rendering.md](phase-4-rendering.md))

- [x] 4.1 – Renderer, Koordinaten, Vorschau-Harness
- [x] 4.2 – Kamera-Rig
- [x] 4.3 – Licht, Himmel, Nebel
- [x] 4.4 – Prozedurale Texturen (Canvas)
- [x] 4.5 – Brücke (TrackView)
- [x] 4.6 – Soldatenmodell und SquadView
- [x] 4.7 – Gegnerhorde (EnemyView)
- [x] 4.8 – Zahlen-Labels
- [x] 4.9 – Bonus-Blöcke (BlockView)
- [x] 4.10 – Tore (GateView)
- [x] 4.11 – Upgrade-Karten (CardView)
- [x] 4.12 – Projektile (BulletView)
- [x] 4.13 – Held und Boss
- [x] 4.14 – Umgebung (Dschungel, Klippen, Wasserfälle, Berge)
- [x] 4.15 – WorldView, Zahlen-Label über dem Trupp, Meilenstein M2

## Phase 5 – Eingabe & Game-Loop (M3)  ([phase-5-input-loop.md](phase-5-input-loop.md))

- [x] 5.1 – InputController
- [x] 5.2 – GameLoop, Session und App (ersetzt Vorschau)
- [x] 5.3 – Zustandsmaschine
- [x] 5.4 – Debug-Werkzeuge (Meilenstein M3)

## Phase 6 – Funktionale UI  ([phase-6-ui.md](phase-6-ui.md))

- [x] 6.1 – Styles, DOM-Helfer, UIManager, Schrift
- [x] 6.2 – Speicherstand (SaveManager)
- [x] 6.3 – HUD
- [x] 6.4 – Hauptmenü und Levelauswahl
- [x] 6.5 – Pause
- [x] 6.6 – Ergebnisbildschirm
- [x] 6.7 – Shop
- [x] 6.8 – Einstellungen
- [x] 6.9 – Kompletter Ablauf verdrahten

## Phase 7 – Audio & Effekte  ([phase-7-audio-fx.md](phase-7-audio-fx.md))

- [x] 7.1 – AudioEngine
- [x] 7.2 – Synthetisierte Soundeffekte
- [x] 7.3 – Musik
- [x] 7.4 – Partikel
- [x] 7.5 – Schwebende Zahlen
- [x] 7.6 – Screenshake, Treffer-Vignette, Vibration

## Phase 8 – Inhalte & Balancing (M4)  ([phase-8-content-balancing.md](phase-8-content-balancing.md))

- [x] 8.1 – Level 6 bis 10
- [x] 8.2 – Balancing-Harness
- [x] 8.3 – Endlos-Generator
- [x] 8.4 – Endlosmodus im Spiel (Meilenstein M4)

## Phase 9 – Qualität & Deployment (M5)  ([phase-9-quality-deploy.md](phase-9-quality-deploy.md))

- [x] 9.1 – Qualitätsstufen und Auto-Qualität
- [x] 9.2 – Performance-Durchgang
- [x] 9.3 – E2E-Smoke-Test mit Playwright
- [x] 9.4 – Deployment auf GitHub Pages
- [ ] 9.5 – PWA (Meilenstein M5)

## Phase 10 – UI/UX-Verbesserung (M6)  ([phase-10-ui-ux-polish.md](phase-10-ui-ux-polish.md))

- [ ] 10.1 – UX-Audit und Baseline-Screenshots
- [ ] 10.2 – Design-Tokens, Icons und Komponenten
- [ ] 10.3 – Layout-Rahmen, Safe Areas, Desktop-Darstellung
- [ ] 10.4 – HUD-Redesign
- [ ] 10.5 – Onboarding und kontextuelle Hinweise
- [ ] 10.6 – Spielgefühl und Rückmeldung („Juice“)
- [ ] 10.7 – Steuerungs-Feinschliff
- [ ] 10.8 – Übergänge, Ladebildschirm, Fortsetzen-Countdown
- [ ] 10.9 – Ergebnisbildschirm verbessern
- [ ] 10.10 – Menü, Levelkarte und Shop verbessern
- [ ] 10.11 – Barrierefreiheit
- [ ] 10.12 – Audio-UX
- [ ] 10.13 – Mobile-Feinschliff
- [ ] 10.14 – Abschluss-Review (Meilenstein M6)
