# Phase 8 – Inhalte und Balancing

Ziel: 10 handgebaute Level, ein Endlosmodus und ein reproduzierbares Balancing über die
headless Simulation.

---

## Schritt 8.1 – Level 6 bis 10

**Dateien:** `src/core/level/levels.ts`, `src/core/level/levels.test.ts`

**Umsetzung:** an `LEVELS` anhängen (Schreibweise wie Schritt 2.3):

**Level 6 – „Nebelsteg“** (`seed 606`, `arenaZ 280`)
- blockColumns: `{x:-4.6, zStart:10, zEnd:70, spacing:2.5, value:1}`, `{x:4.6, zStart:10, zEnd:70, spacing:5, value:3}`
- cards: `{weapon x:0 z:25 hp:50 w:3.6}`, `{hero x:0 z:120 hp:600 w:3.6}`, `{soldiers x:-4.2 z:160 hp:250 w:3.2 reward:100}`
- hordes: `{80–115, x −5.4…5.4, 380, hp 2}`, `{170–240, x −1.8…5.4, 400, hp 3}`
- gates: `z 75: [-6,0 mul 2][0,6 add 30]`, `z 130: [-6,-2 sub 30][-2,2 add 40][2,6 mul 2]`, `z 250: [-6,0 mul 2][0,6 sub 40]`
- boss: `{hp:9000, speed:2.6, contactKillRate:24, scale:3.8}`

**Level 7 – „Affenfelsen“** (`seed 707`, `arenaZ 300`)
- blockColumns: `{x:0, zStart:10, zEnd:30, spacing:2.5, value:2}`, `{x:-4.6, zStart:40, zEnd:100, spacing:4, value:5}`, `{x:4.6, zStart:190, zEnd:250, spacing:6, value:25}`
- cards: `{weapon x:-3.9 z:35 hp:70 w:3.2}`, `{weapon x:3.9 z:35 hp:70 w:3.2}`, `{hero x:0 z:140 hp:1000 w:3.6}`
- hordes: `{50–100, x −1.8…5.4, 350, hp 2}`, `{150–185, x −5.4…5.4, 400, hp 3}`, `{255–285, x −5.4…5.4, 300, hp 3}`
- gates: `z 110: [-6,-2 mul 2][-2,2 sub 50][2,6 add 50]`, `z 188: [-6,0 add 60][0,6 mul 2]`
- boss: `{hp:12000, speed:2.8, contactKillRate:26, scale:4}`

**Level 8 – „Lianenbrücke“** (`seed 808`, `arenaZ 320`)
- blockColumns: `{x:-4.6, zStart:10, zEnd:120, spacing:3, value:2}`, `{x:4.6, zStart:130, zEnd:250, spacing:8, value:40}`
- cards: `{soldiers x:0 z:30 hp:60 w:3.6 reward:40}`, `{weapon x:3.9 z:60 hp:150 w:3.2}`, `{hero x:-3.9 z:140 hp:1200 w:3.2}`, `{weapon x:0 z:260 hp:900 w:3.6}`
- hordes: `{40–120, x −1.8…5.4, 500, hp 2}`, `{150–230, x −5.4…1.8, 500, hp 3}`, `{270–300, x −5.4…5.4, 350, hp 4}`
- gates: `z 125: [-6,0 mul 2][0,6 sub 60]`, `z 245: [-6,-2 add 80][-2,2 div 2][2,6 mul 2]`, `z 305: [-6,0 mul 2][0,6 mul 3]`
- boss: `{hp:16000, speed:3, contactKillRate:30, scale:4}`

**Level 9 – „Sonnentor“** (`seed 909`, `arenaZ 340`)
- blockColumns: `{x:-4.6, zStart:10, zEnd:60, spacing:2.5, value:2}`, `{x:4.6, zStart:10, zEnd:60, spacing:2.5, value:2}`, `{x:0, zStart:180, zEnd:240, spacing:5, value:30}`
- cards: `{weapon x:0 z:25 hp:50 w:3.6}`, `{hero x:0 z:70 hp:800 w:3.6}`, `{weapon x:-3.9 z:150 hp:400 w:3.2}`, `{soldiers x:3.9 z:150 hp:500 w:3.2 reward:150}`
- hordes: `{80–140, x −5.4…5.4, 600, hp 3}`, `{190–250, x −5.4…−1.5, 300, hp 3}`, `{190–250, x 1.5…5.4, 300, hp 3}`, `{280–320, x −5.4…5.4, 400, hp 4}`
- gates: `z 160: [-6,0 mul 2][0,6 add 100]`, `z 265: [-6,-2 sub 100][-2,2 mul 2][2,6 sub 100]`
- boss: `{hp:22000, speed:3, contactKillRate:34, scale:4.2}`

**Level 10 – „Herz des Schachts“** (`seed 1010`, `arenaZ 380`)
- blockColumns: `{x:-4.6, zStart:10, zEnd:100, spacing:2.5, value:2}`, `{x:4.6, zStart:110, zEnd:200, spacing:6, value:33}`, `{x:0, zStart:260, zEnd:300, spacing:4, value:10}`
- cards: `{weapon x:0 z:20 hp:40 w:3.6}`, `{weapon x:0 z:105 hp:300 w:3.6}`, `{hero x:-3.9 z:105 hp:1100 w:3.2}`, `{soldiers x:3.9 z:250 hp:700 w:3.2 reward:200}`, `{weapon x:0 z:330 hp:1500 w:3.6}`
- hordes: `{30–95, x −1.8…1.8, 300, hp 2}`, `{120–200, x −5.4…1.8, 600, hp 3}`, `{215–250, x −5.4…5.4, 400, hp 4}`, `{300–360, x −5.4…5.4, 600, hp 5}`
- gates: `z 205: [-6,0 mul 2][0,6 add 120]`, `z 255: [-6,-2 add 50][-2,2 mul 3][2,6 sub 80]`, `z 365: [-6,0 mul 2][0,6 mul 2]`
- boss: `{hp:30000, speed:3.2, contactKillRate:40, scale:4.5}`

**Tests:** alle 10 Level validieren fehlerfrei; IDs 1…10.

**Commit:** `feat(level): add levels 6-10`

---

## Schritt 8.2 – Balancing-Harness

**Dateien:** `src/core/balance.test.ts`, `package.json` (Skript `balance`)

**Umsetzung:**
- Funktion `runLevel(level, modifiers, mode: 'bot' | 'idle'): RunResult & { endZ: number; simTime: number }` (in der Testdatei).
- „Erwartete Upgrades“ für Level n (realistischer Spielerstand): `startSoldiers = fireRate = coinBonus = min(10, floor((n − 1) · 1.2))`.
- Assertions je Level n:
  1. Bot mit erwarteten Upgrades **gewinnt**.
  2. Bot gewinnt mit mindestens 1 Stern; Level 1–3 mit ≥ 2 Sternen.
  3. Untätiger Spieler (x = 0, ohne Upgrades) **verliert** für n ≥ 2.
  4. Simulationsdauer zwischen 30 s und 110 s.
- Wenn `process.env.BALANCE_REPORT === '1'`: Tabelle mit `console.info` ausgeben
  (Level, Ergebnis Bot, Überlebende, Peak, Sterne, Münzen, Dauer, Ergebnis Idle).
- `package.json`: `"balance": "BALANCE_REPORT=1 vitest run src/core/balance.test.ts"`.
- **Vorgehen bei roten Tests:** Level-Werte anpassen (nicht die Systeme): zuerst Boss-HP, dann Horden-HP/-Anzahl,
  dann Karten-HP. Jede Änderung in `DECISIONS.md` mit alter/neuer Zahl festhalten. Ziel: Schwierigkeit steigt
  monoton (Bot-Überlebende/Peak-Verhältnis fällt grob von Level 1 bis 10).

**Commit:** `test(balance): automated level balancing harness`

---

## Schritt 8.3 – Endlos-Generator

**Dateien:** `src/core/level/generator.ts`, `src/core/level/generator.test.ts`

**Umsetzung:**
```ts
/** Erzeugt Runde `round` (≥ 1) des Endlosmodus deterministisch aus seed. */
export function generateEndlessLevel(round: number, seed: number): LevelDef;
```
- `rng = new Rng(seed · 7919 + round)`; `difficulty = 1 + 0.35 · (round − 1)`.
- Level setzt sich aus **Segmenten** zusammen, beginnend bei `z = 10`; jedes Segment hat eine Länge und schreibt in die LevelDef-Listen:
  | Segment | Länge | Inhalt |
  |---|---|---|
  | `blockLane` | 40 | Spalte `+1…+3` auf zufälliger Seite (x ±4.6), Abstand 2.5 |
  | `goldLane` | 50 | Spalte `+round(10·difficulty)` gold, Abstand 8, zufällige Seite |
  | `cardPair` | 20 | Zwei Karten bei Segmentmitte, x −3.9 und +3.9, Breite 3.2: eine Waffe (hp `round(40·difficulty)`), die andere zufällig Held oder Soldaten (hp `round(250·difficulty)`, Soldaten-reward `round(30·difficulty)`); Seiten zufällig |
  | `horde` | 50 | Horde, Breite zufällig (Mitte / volle Breite / eine Seite), `count = round(150 + 60·difficulty)`, `hp = min(6, 1 + floor(difficulty/1.5))` |
  | `gate` | 15 | Tor mit 2–3 Optionen, mind. eine positive (`mul 2` oder `add round(20·difficulty)`), mind. eine negative |
- Reihenfolge: `blockLane`, dann `4 + min(6, round)` zufällige Segmente aus `[goldLane, cardPair, horde, gate]`
  (nie zwei `gate` hintereinander), danach `gate`; `arenaZ = Ende + 20`.
- Boss: `hp = round(800 · difficulty²)`, `speed = min(3.6, 2.2 + 0.1 · round)`, `contactKillRate = round(12 + 3 · round)`, `scale = min(5, 3 + 0.15 · round)`.
- `id = 1000 + round`, `name = 'Endlos – Runde ' + round`, `seed = seed + round`.
- Summe der Gegner auf `CONFIG.enemy.maxEnemies` begrenzen (Horden proportional kürzen).

**Tests:** Runden 1…50 mit Seeds 1…3 → `validateLevel` leer; gleiche Eingaben → identisches Level;
Boss-HP steigt monoton mit der Runde.

**Commit:** `feat(level): procedural endless level generator`

---

## Schritt 8.4 – Endlosmodus im Spiel (Meilenstein M4)

**Dateien:** `src/app/App.ts`, `src/ui/screens/HudScreen.ts`, `src/ui/screens/ResultScreen.ts`, `src/persistence/SaveManager.ts`

**Umsetzung:**
- Endlos-Kachel startet Runde 1 mit `seed = Date.now() % 100000` (Seed für die Sitzung merken).
- HUD-Label „Runde n“.
- Sieg → Ergebnisbildschirm mit Button „Nächste Runde“ (statt „Weiter“), die Truppgröße wird **nicht** übernommen (jede Runde startet frisch, Schwierigkeit über den Generator).
- Niederlage → `stats.bestEndlessRound = max(…, round − 1)`; Ergebnis zeigt „Erreichte Runde n · Rekord m“.
- Münzen wie bei normalen Leveln (levelId = 1000 + round → Formel deckelt `coinsPerLevel · min(levelId, 20)` – dafür in `computeResult` `Math.min(levelId, 20)` verwenden und Test ergänzen).

**Akzeptanzkriterien (M4):**
- [ ] Alle 10 Level + Endlosmodus spielbar, mit Sound, Effekten, Menüs, Shop.
- [ ] `npm run balance` zeigt eine plausible, steigende Schwierigkeitskurve.

**Commit:** `feat(app): endless mode`
