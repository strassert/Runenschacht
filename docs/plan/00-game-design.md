# 00 – Game Design

Referenz: `docs/reference/screenshot.jpg`. Alle Zahlen in diesem Dokument sind die
**verbindlichen Startwerte**; sie stehen später in `src/core/config.ts` und den Level-Dateien.

## 1. Spielidee in einem Satz

Der Spieler steuert einen automatisch vorwärts laufenden, automatisch feuernden Trupp blauer
Soldaten seitlich über eine schmale Brücke, vergrößert ihn durch Bonus-Blöcke und Tore,
schießt Upgrade-Karten frei, vernichtet eine rote Gegnerhorde und besiegt am Ende den Boss.

## 2. Kern-Loop (ein Level, 45–90 Sekunden)

1. Level startet im Zustand **Bereit**: Trupp steht, Hinweis „Ziehen zum Starten“.
2. Erste Ziehbewegung → Zustand **Läuft**: Trupp läuft mit konstanter Geschwindigkeit, feuert permanent.
3. Spieler weicht aus / wählt Spuren: links `+1`-Blöcke, Mitte Karten und Horde, rechts `+33`-Blöcke.
4. Tore verändern die Truppgröße (`×2`, `+20`, `−30`, `÷2`).
5. Am Ende stoppt der Trupp an der **Arena**, der Boss läuft auf ihn zu → **Bosskampf**.
6. Boss-HP = 0 → **Sieg** (Münzen, Sterne). Trupp = 0 und kein Held → **Niederlage**.

## 3. Koordinatensystem (Simulation)

- `x` = seitlich, Meter. Brücke von `x = -6` bis `x = +6` (Breite 12 m). Negativ = links.
- `z` = Laufrichtung, Meter, **steigt nach vorne**. Start bei `z = 0`.
- Die Simulation ist 2D (x/z). Höhe (`y`) existiert nur im Rendering.
- Rendering-Abbildung: Three.js-Position = `(x, y, -z)` (Three.js schaut entlang −Z).

Drei logische Spuren (nur für Level-Design und Bot, keine harte Grenze):

| Spur | x-Bereich | Mitte |
|---|---|---|
| Links | −6 … −2 | −4.5 |
| Mitte | −2 … +2 | 0 |
| Rechts | +2 … +6 | +4.5 |

## 4. Entitäten

### 4.1 Trupp (Squad, Spieler)

- Besteht aus `count` Soldaten (0 … 999). Start: `8` + Shop-Upgrade.
- Mittelpunkt `(x, z)`. Läuft mit `7 m/s` vorwärts. `x` folgt dem Steuerziel `targetX`
  gedämpft (`lateralResponse = 10 /s`, maximal `16 m/s`).
- **Formation:** Sonnenblumen-Spirale (Phyllotaxis). Slot `i` (0-basiert):
  `r = c · √(i + 0.5)`, `θ = i · 137.50776°`, Offset `(r·cos θ, r·sin θ)`.
  `c = 0.34 m`. Truppradius `R = c · √(count) + 0.22`.
- **Kompression:** Wenn `R > 5.65` (halbe Breite minus Geländer-Abstand 0.35), wird `c`
  verkleinert: `c = max(0.17, (5.65 - 0.22) / √count)`.
- `x` wird so begrenzt, dass der Trupp auf der Brücke bleibt:
  `|x| ≤ max(0, 5.65 − R)`.
- Kollisionen des Trupps mit der Welt nutzen einen **Kreis** (Mittelpunkt, Radius `R`).

### 4.2 Schießen

- Waffe abhängig von `weaponTier` (0–3):

| Tier | Name | Feuerintervall (s) | Schaden | Projektil m/s | Reichweite m | Leuchtfarbe |
|---|---|---|---|---|---|---|
| 0 | Pistole | 0.45 | 1 | 34 | 26 | `#ffc86b` |
| 1 | Sturmgewehr | 0.30 | 1 | 40 | 28 | `#ffe08a` |
| 2 | Lasergewehr | 0.22 | 1.5 | 55 | 30 | `#6fd8ff` |
| 3 | Plasmawerfer | 0.18 | 2 | 50 | 32 | `#c58bff` |

- Maximal `48` „Schützen“ werden simuliert: `shooters = min(count, 48)`.
- Schüsse pro Sekunde = `shooters / fireInterval × fireRateMultiplier` (Shop).
- Schaden pro Projektil = `damage × count / shooters` (so bleibt der Gesamt-DPS proportional zur Truppgröße).
- Schütze `k` (0 … shooters−1) feuert vom Formations-Slot `floor(k · count / shooters)` aus;
  Schützen werden reihum (Round-Robin) benutzt. Projektile fliegen gerade in +z.
- Projektile treffen: **Gegner, gesperrte Karten, Boss**. Sie fliegen durch Bonus-Blöcke und Tore.
- Ein Projektil trifft das **nächstgelegene** Ziel auf seinem Flugsegment und verschwindet.

### 4.3 Bonus-Blöcke (`+N`)

- Quader `1.6 m (x) × 0.7 m (z)`, Wert `N`, Farbe `blue` (kleine Werte) oder `gold` (große Werte).
- Einsammeln durch Berührung (Truppkreis ∩ Block-Rechteck) → `count += N`. Block verschwindet.
- Werden durch Projektile **nicht** beeinflusst.
- Typische Anordnung: Spalten entlang der Seiten (links `+1` dicht, rechts `+33` locker).

### 4.4 Tore (Gates)

- Ein Tor liegt bei `z` und hat 1–3 Optionen, jede mit `xMin`, `xMax`, Operation und Wert.
- Operationen: `add` (+v), `sub` (−v), `mul` (×v), `div` (÷v, abrunden).
- Überquert der Trupp-Mittelpunkt `z` des Tores, wird die Option angewendet, in deren
  x-Bereich `squad.x` liegt (keine passende Option → nichts passiert).
- Ergebnis wird auf `0 … 999` begrenzt.
- Darstellung: halbtransparente Torflächen; `add`/`mul` blau-grün, `sub`/`div` rot.

### 4.5 Upgrade-Karten

- Stehende Tafel (Breite `width`, Standard `3.4 m`, Tiefe `0.4 m`) mit Symbol und Zähler (`hp`).
- Arten:
  - `weapon` (Gewehr-Symbol): bei Freischaltung `weaponTier += 1` (max. 3).
  - `hero` (Muskelprotz-Symbol): bei Freischaltung schließt sich der **Held** an.
  - `soldiers` (Soldaten-Symbol, Wert `reward`): bei Freischaltung `count += reward`.
- Projektile reduzieren `hp`. Bei `hp ≤ 0` → **freigeschaltet**: Belohnung sofort, Karte verschwindet.
- Erreicht der Trupp eine noch **gesperrte** Karte, wirkt sie als **Wand**:
  Alle Soldaten, deren Slot-x im Kartenbereich (± Soldatenradius 0.22) liegt, gehen verloren.
  Jeder verlorene Soldat reduziert `hp` um 1; erreicht `hp` dabei 0, gibt es die Belohnung trotzdem.
  Danach ist die Karte **zerschlagen** und verschwindet.

### 4.6 Gegnerhorde

- Eine Horde ist ein Rechteck (`zStart … zEnd`, `xMin … xMax`) mit `count` roten Gegnern (HP `hp`, Standard 1).
- Startaufstellung: Raster, Abstand `0.55 m`, deterministischer Zufallsversatz ±0.12 m.
- Zustand `idle`, bis der Abstand in z zum Trupp ≤ `20 m` ist, dann `charging`:
  `vz = −3.6 m/s`, `vx = clamp((squad.x − x) · 1.5, −3.6, 3.6)` (nur wenn `|dz| < 8`),
  `x` bleibt in `[xMin − 1.2, xMax + 1.2]`.
- **Kontakt:** Abstand zum Truppmittelpunkt ≤ `R + 0.3` → Gegner stirbt **und** ein Soldat stirbt
  (hat der Held HP, verliert stattdessen der Held 1 HP).
- Gegner mehr als 4 m hinter dem Trupp werden entfernt.

### 4.7 Boss

- Großer roter Gigant am Levelende. Werte je Level: `hp`, `speed` (Standard 2.2 m/s),
  `contactKillRate` (Soldaten pro Sekunde, Standard 12), `scale` (Standard 3). Radius = `0.5 · scale`.
- Arena: Der Trupp stoppt bei `z = arenaZ`. Boss startet bei `arenaZ + 24`.
- Boss ist `dormant`, bis `squad.z ≥ arenaZ − 10`, dann `walking` Richtung Trupp.
- Kontakt (`boss.z − radius ≤ squad.z + R`) → `attacking`: Boss bleibt stehen und tötet
  `contactKillRate` Soldaten pro Sekunde (Held zuerst).
- `hp ≤ 0` → `dead` → **Sieg** nach 1.5 s.

### 4.8 Held (Brute, aus Karte `hero`)

- Großer blauer Muskelprotz mit Minigun. `hp = 60`.
- Läuft vor dem Trupp: `x = squad.x`, `z = squad.z + R + 1.0`.
- Feuert eigene Projektile: Intervall `0.08 s`, Schaden `2`, `45 m/s`, Reichweite `30 m`.
- Fängt Gegnerkontakte und Boss-Schaden ab, solange `hp > 0`. Danach stirbt er.

### 4.9 Sieg/Niederlage und Wertung

- **Niederlage:** `count == 0` und Held nicht aktiv → nach 1.0 s Ergebnisbildschirm.
- **Sieg:** Boss tot → nach 1.5 s Ergebnisbildschirm.
- **Münzen bei Sieg:** `survivors × 1 + 50 (Boss) + 10 × levelId`, multipliziert mit `coinMultiplier` (Shop), abgerundet.
- **Münzen bei Niederlage (Trostpreis):** `floor(enemiesKilled / 10 × coinMultiplier)`.
- **Sterne:** 1 = Sieg; 2 = Überlebende ≥ 25 % des Maximalbestands; 3 = ≥ 50 %.

## 5. Meta-Progression (Shop, gespeichert)

| Upgrade | Wirkung pro Stufe | Max. Stufe | Preis Stufe n (n = aktuelle Stufe) |
|---|---|---|---|
| Startsoldaten | +2 Soldaten | 10 | `round(40 × 1.45^n)` |
| Feuerrate | +6 % Schüsse/s | 10 | `round(60 × 1.5^n)` |
| Münzbonus | +10 % Münzen | 10 | `round(80 × 1.5^n)` |

Level werden linear freigeschaltet (Sieg in Level n → Level n+1 spielbar). Nach Level 10
ist der **Endlosmodus** verfügbar (prozedural, Schwierigkeit steigt mit jeder Runde).

## 6. Level 1 („Die Hängebrücke“) – entspricht dem Referenzbild

| Element | Werte |
|---|---|
| Länge | `arenaZ = 190` |
| Links | `+1`-Block-Spalte bei `x = −4.6`, `z = 12 … 100`, Abstand 3.2 m (blau) |
| Karten bei z = 34 | `weapon` bei `x = 0`, Breite 3.6, `hp 23` · `hero` bei `x = 3.9`, Breite 3.2, `hp 555` |
| Mitte | Horde `z = 44 … 120`, `x = −1.8 … 1.8`, 180 Gegner, HP 1 |
| Rechts | `+33`-Block-Spalte bei `x = 4.6`, `z = 52 … 130`, Abstand 8 m (gold) |
| Tor z = 150 | links (`−6…0`) `×2`, rechts (`0…6`) `+20` |
| Tor z = 170 | links `−30`, rechts `+15` |
| Boss | `hp 600`, `speed 2.2`, `contactKillRate 12`, `scale 3` |

## 7. Steuerung

- **Touch/Maus:** Irgendwo auf dem Bildschirm drücken und horizontal ziehen. Relative Steuerung:
  `targetX += Δpx × (12 / Bildschirmbreite) × sensitivity` (Standard `sensitivity = 1.4`).
- **Tastatur:** `←/→` oder `A/D` bewegt `targetX` mit 10 m/s. `Esc`/`P` = Pause.
- Erste Eingabe startet das Level.

## 8. Darstellung (Zielbild)

- Low-Poly-Stil, prozedural erzeugt (keine externen 3D-Modelle oder Bilddateien nötig).
- Goldene-Stunde-Licht von vorne oben (Gegenlicht), warmer Nebel, Dschungel mit Palmen,
  Felsklippen, Wasserfällen und Bergen im Dunst.
- Brücke: Holzplanken am Anfang, danach Steinplatten, moosige Steingeländer mit Balustern.
- Mittlere Spur der Horde ist als vertiefter Graben dargestellt.
- Blöcke: abgeschrägte Quader mit großen weißen Zahlen mit dunkler Kontur.
- Karten: weiße abgerundete Tafeln mit Symbol und großer Zahl.
- Projektile: kurze leuchtende Leuchtspuren (additiv).
- Hochformat ist primär (Smartphone). Am Desktop wird ein 9:16-Rahmen zentriert.
