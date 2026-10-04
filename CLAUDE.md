# CLAUDE.md – Arbeitsregeln für dieses Repository

Dieses Repository wird schrittweise nach dem Plan in `docs/plan/` gebaut.

## Bevor du Code schreibst
1. Lies `docs/plan/README.md`, `docs/plan/00-game-design.md`, `docs/plan/01-architecture.md`.
2. Öffne `docs/plan/PROGRESS.md` und nimm den **ersten nicht abgehakten** Schritt
   (oder den Schritt, den der Auftrag nennt).
3. Lies die zugehörige Phasendatei vollständig.

## Während der Umsetzung
- Setze **genau einen** Schritt um. Keine Features vorziehen, keine Schritte zusammenlegen.
- Übernimm Dateipfade, Typ- und Funktionsnamen, Konstanten und Signaturen **exakt** aus dem Plan.
- `src/core/**` ist reine Logik: kein `three`, kein DOM, kein `Math.random()` (nutze `world.rng`).
- Keine Allokationen in Hot Paths (`Simulation.step`, `*.sync()`, `update()` pro Frame).
- Nur benannte Exporte. Tests liegen neben der Datei (`foo.ts` → `foo.test.ts`) und importieren
  `describe/it/expect` explizit aus `vitest`.
- Installiere nur Abhängigkeiten, die der Schritt nennt.

## Nach der Umsetzung
1. `npm run check` muss grün sein (Typecheck, Lint, Format, Tests, Build).
2. Haken in `docs/plan/PROGRESS.md` setzen.
3. Abweichungen vom Plan in `docs/plan/DECISIONS.md` dokumentieren (Datum, Schritt, Was, Warum).
4. Commit mit der im Schritt angegebenen Commit-Nachricht.

## Umgebung
- Node 20. Chromium für Playwright liegt in der Cloud-Umgebung unter `/opt/pw-browsers`;
  dort **nie** `playwright install` ausführen.
- Debug im Browser: `?level=1&autoplay=1&speed=4&debug=1` (ab Schritt 5.4).
