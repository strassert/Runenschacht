# Runenschacht

Ein 3D-Crowd-Runner-Shooter für Browser und Smartphone (three.js + TypeScript): Ein blauer Trupp läuft
automatisch über eine Dschungel-Hängebrücke und feuert nach vorne. Du steuerst ihn seitlich, sammelst
`+1`/`+33`-Blöcke, schießt Upgrade-Karten leer, wählst Tore, kämpfst dich durch eine rote Gegnerhorde und
besiegst am Ende den Boss.

<p align="center">
  <img src="docs/ux/after/phone-07-hud-run.png" alt="Spielszene auf dem Smartphone" width="260" />
  <img src="docs/ux/after/phone-02-menu.png" alt="Hauptmenü" width="260" />
</p>

Referenz für die Spielidee: [`docs/reference/screenshot.jpg`](docs/reference/screenshot.jpg).

## Funktionen

- 10 handgebaute Level mit Boss, dazu ein Endlosmodus mit wachsender Schwierigkeit
- Karten (Waffe, Held, Soldaten), Tore (+, −, ×, ÷), Horden, Held mit Minigun, Boss-Kampf
- Shop mit drei Upgrades, Sterne- und Münzsystem, Speicherstand im Browser
- Synthetisierter Sound und Musik (keine Audiodateien), Partikel, Screenshake, Vibration
- Einsteiger-Hinweise, Fortsetzen-Countdown, Levelkarte, Niederlage-Tipps
- Barrierefreiheit: Farbenblind-Modus, große Schrift, Tastaturbedienung, „Bewegung reduzieren“
- Installierbar als App (PWA), Hochformat mit Rahmen auf dem Desktop

## Steuerung

| Gerät | Eingabe |
|---|---|
| Touch / Maus | Halten und nach links/rechts ziehen (alternativ „Finger folgen“ in den Einstellungen) |
| Tastatur | `←` `→` oder `A` `D`; `Esc` / `P` = Pause |
| Zwei-Finger-Tipp | Pause |

## Entwicklung

```bash
npm install
npm run dev       # Entwicklungsserver
npm run check     # Typecheck, Lint, Format, Tests, Build
npm run e2e       # Playwright-Smoke-Tests (PW_CHROMIUM_PATH setzen, wenn ein Browser vorinstalliert ist)
npm run balance   # Balancing-Bericht (Bot spielt alle Level)
npm run screenshots   # UI-Screenshots nach docs/ux/<SHOT_DIR>
```

## Online spielen

Nach jedem Push auf `main` baut `.github/workflows/deploy.yml` das Spiel und veröffentlicht es auf GitHub Pages.
Dazu in den Repository-Einstellungen unter *Pages → Source* **„GitHub Actions“** auswählen.

## Debug-Parameter

URL-Parameter für Entwicklung und Tests:

| Parameter | Wirkung |
|---|---|
| `?level=3` | Level direkt starten |
| `?seed=42` | Seed des Levels überschreiben |
| `?autoplay=1` | Bot steuert den Trupp |
| `?speed=4` | Zeitraffer (1–8) |
| `?debug=1` | FPS-/Zustandsanzeige und `window.__game` |
| `?quality=low\|medium\|high` | Grafikqualität erzwingen |

`window.__game` (nur mit `debug=1` oder im Dev-Server): `getState()`, `renderInfo()`, `start(level)`, `skipTo(z)`, `win()`, `lose()`.

## Plan und Dokumentation

Der Umsetzungsplan liegt in [`docs/plan/`](docs/plan/README.md), Abweichungen in
[`docs/plan/DECISIONS.md`](docs/plan/DECISIONS.md), das UX-Audit samt Vorher/Nachher-Bildern in
[`docs/ux/AUDIT.md`](docs/ux/AUDIT.md), Performance-Messungen in [`docs/perf.md`](docs/perf.md).
Arbeitsregeln für das ausführende Modell: [`CLAUDE.md`](CLAUDE.md).
