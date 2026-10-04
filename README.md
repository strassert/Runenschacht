# Runenschacht

Ein 3D-Crowd-Runner-Shooter für Browser und Smartphone (three.js + TypeScript):
Ein blauer Trupp läuft automatisch über eine Dschungel-Hängebrücke, feuert nach vorne,
sammelt `+1`/`+33`-Blöcke, schießt Upgrade-Karten frei, wählt Tore, kämpft sich durch eine
rote Gegnerhorde und besiegt am Ende den Boss.

![Referenzbild](docs/reference/screenshot.jpg)

## Status

Planungsphase. Der vollständige Umsetzungsplan (86 Schritte in 11 Phasen, inklusive
abschließender UI/UX-Überarbeitung) liegt in [`docs/plan/`](docs/plan/README.md).
Arbeitsregeln für das ausführende Modell stehen in [`CLAUDE.md`](CLAUDE.md).

## Entwicklung (ab Schritt 0.1)

```bash
npm install
npm run dev     # Entwicklungsserver
npm run check   # Typecheck, Lint, Format, Tests, Build
```
