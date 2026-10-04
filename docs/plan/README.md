# Runenschacht – Umsetzungsplan

Dieser Ordner enthält den vollständigen, schrittweisen Plan für **Runenschacht**, ein
3D-Crowd-Runner-Shooter im Stil des Referenzbildes (`docs/reference/screenshot.jpg`):
Ein blauer Trupp läuft automatisch über eine Dschungel-Hängebrücke, schießt nach vorne,
sammelt `+1`/`+33`-Blöcke, schießt Upgrade-Karten frei (`23` → Waffe, `555` → Held),
kämpft sich durch eine rote Gegnerhorde und besiegt am Ende einen Boss.

Der Plan ist so geschrieben, dass ein Coding-Modell (z. B. Claude Sonnet) **jeden Schritt
ohne Rückfragen** umsetzen kann. Jeder Schritt nennt Dateien, Schnittstellen, Konstanten,
Tests, Akzeptanzkriterien und die Commit-Nachricht.

## Dokumente (in dieser Reihenfolge lesen)

| Datei | Inhalt |
|---|---|
| [`00-game-design.md`](00-game-design.md) | Spielregeln, Entitäten, Zahlen, Level-Aufbau, Meta-Progression |
| [`01-architecture.md`](01-architecture.md) | Tech-Stack, Ordnerstruktur, Datenfluss, zentrale Typen, Konventionen |
| [`phase-0-setup.md`](phase-0-setup.md) | Projekt-Scaffold, Tooling, CI |
| [`phase-1-core.md`](phase-1-core.md) | Reine Logik-Grundlagen (Config, Mathe, RNG, Events, Formation) |
| [`phase-2-levels.md`](phase-2-levels.md) | Level-Schema, Level 1–5, Validierung, Aufbau der Welt |
| [`phase-3-simulation.md`](phase-3-simulation.md) | Komplette Spielsimulation (headless, testbar) + Autoplay-Bot |
| [`phase-4-rendering.md`](phase-4-rendering.md) | Three.js-Darstellung: Brücke, Trupp, Horde, Blöcke, Karten, Boss, Umgebung |
| [`phase-5-input-loop.md`](phase-5-input-loop.md) | Eingabe, Game-Loop, Zustandsmaschine, Debug-Werkzeuge |
| [`phase-6-ui.md`](phase-6-ui.md) | Funktionale UI: HUD, Menüs, Ergebnis, Shop, Einstellungen, Speichern |
| [`phase-7-audio-fx.md`](phase-7-audio-fx.md) | Synthetisierte Sounds, Partikel, schwebende Zahlen, Screenshake |
| [`phase-8-content-balancing.md`](phase-8-content-balancing.md) | Level 6–10, Endlos-Generator, Balancing per Simulation |
| [`phase-9-quality-deploy.md`](phase-9-quality-deploy.md) | Performance, Qualitätsstufen, E2E-Smoke-Test, Deployment, PWA |
| [`phase-10-ui-ux-polish.md`](phase-10-ui-ux-polish.md) | **UI- und Usability-Verbesserung** nach vollständiger Implementierung |
| [`PROGRESS.md`](PROGRESS.md) | Abhak-Liste aller Schritte (wird nach jedem Schritt aktualisiert) |
| [`DECISIONS.md`](DECISIONS.md) | Log für Abweichungen vom Plan |

## Arbeitsweise für das ausführende Modell

1. **Genau einen Schritt pro Durchgang** umsetzen, in der Reihenfolge von `PROGRESS.md`.
2. Vor dem Schritt lesen: `00-game-design.md`, `01-architecture.md` und die jeweilige Phasendatei.
   Die dort definierten Typnamen, Dateipfade und Konstanten **exakt** übernehmen.
3. Nach dem Schritt **immer** ausführen: `npm run check` (ab Schritt 0.2 vorhanden).
   Der Schritt gilt erst als fertig, wenn der Befehl ohne Fehler durchläuft.
4. In `PROGRESS.md` den Haken setzen (`- [x]`) und im selben Commit committen.
   Commit-Nachricht = die im Schritt angegebene Nachricht.
5. Wenn eine Vorgabe technisch nicht umsetzbar ist: minimal abweichen, Grund in
   `DECISIONS.md` eintragen (Datum, Schritt, Abweichung, Grund). Nie stillschweigend abweichen.
6. Keine Schritte zusammenlegen, keine Features vorziehen, keine nicht geforderten
   Abhängigkeiten installieren.
7. `src/core/**` darf **niemals** `three`, DOM-APIs (`window`, `document`) oder Dateien
   außerhalb von `src/core` importieren. Das wird ab Schritt 0.2 per ESLint erzwungen.

### Vorlage für einen Arbeitsauftrag

```
Lies docs/plan/README.md, docs/plan/00-game-design.md, docs/plan/01-architecture.md
und docs/plan/phase-3-simulation.md. Setze ausschließlich Schritt 3.4 um.
Führe danach `npm run check` aus, setze den Haken in docs/plan/PROGRESS.md
und committe mit der im Schritt angegebenen Commit-Nachricht.
```

## Meilensteine

| Meilenstein | Nach Schritt | Ergebnis |
|---|---|---|
| M1 – Läuft headless | 3.13 | Komplette Level-Simulation in Tests spielbar, Bot gewinnt Level 1 |
| M2 – Erstes Bild | 4.15 | Level 1 ist im Browser sichtbar und läuft automatisch ab (Autoplay) |
| M3 – Spielbar | 5.4 | Mit Finger/Maus steuerbar, Sieg/Niederlage funktionieren |
| M4 – Vollständiges Spiel | 8.4 | Menüs, Shop, Sound, Effekte, 10 Level + Endlosmodus |
| M5 – Release-fähig | 9.5 | Performant, getestet, auf GitHub Pages deployt, als PWA installierbar |
| M6 – Poliert | 10.14 | Überarbeitete UI, Onboarding, Barrierefreiheit, Feinschliff |
