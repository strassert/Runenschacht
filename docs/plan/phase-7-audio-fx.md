# Phase 7 – Audio und Effekte

Ziel: Das Spiel fühlt sich „saftig“ an: synthetisierte Sounds, Partikel, schwebende Zahlen,
Screenshake, Vibration. Alles respektiert die Einstellungen (Sound/Musik/Vibration/Bewegung reduzieren).

---

## Schritt 7.1 – AudioEngine

**Dateien:** `src/audio/AudioEngine.ts`

**Umsetzung:**
```ts
export type SfxName =
  | 'shoot' | 'pickup' | 'gateGood' | 'gateBad' | 'cardHit' | 'cardUnlock' | 'wallSmash'
  | 'enemyDie' | 'soldierLost' | 'heroJoin' | 'heroDie' | 'bossStep' | 'bossHit' | 'bossDie'
  | 'victory' | 'defeat' | 'uiClick' | 'coin';
export class AudioEngine {
  constructor();
  /** Beim ersten Nutzer-Klick/Touch aufrufen (AudioContext erzeugen/resume). Idempotent. */
  unlock(): void;
  setSoundEnabled(on: boolean): void;
  setMusicEnabled(on: boolean): void;
  /** Spielt einen Effekt. pitch ±, volume 0..1. Gedrosselt pro Name (siehe unten). */
  play(name: SfxName, opts?: { pitch?: number; volume?: number }): void;
  readonly musicBus: GainNode | null;
  get context(): AudioContext | null;
}
```
- Graph: `sfxGain (0.7)` und `musicGain (0.35)` → `masterGain (0.9)` → `DynamicsCompressor` → `destination`.
- Drosselung: `MIN_INTERVAL: Partial<Record<SfxName, number>>` = `{ shoot: 0.06, enemyDie: 0.03, cardHit: 0.05, soldierLost: 0.05, pickup: 0.04, bossHit: 0.08 }` (Sekunden).
  Zusätzlich max. 24 gleichzeitig laufende Stimmen; ältere werden nicht abgebrochen, neue verworfen.
- `unlock()` in App an `pointerdown`/`keydown` (einmalig, `{ once: true }`) hängen.

**Commit:** `feat(audio): web audio engine with buses and throttling`

---

## Schritt 7.2 – Synthetisierte Soundeffekte

**Dateien:** `src/audio/sfx.ts`, `src/audio/AudioEngine.ts`

**Umsetzung:** `export const SFX: Record<SfxName, (ctx: AudioContext, out: AudioNode, pitch: number, volume: number) => number>`
(Rückgabe = Dauer in s). Hilfsfunktionen `noiseBuffer(ctx)` (einmalig gecacht, 1 s weißes Rauschen),
`env(gain, t0, attack, hold, release, peak)`.

| Name | Rezept |
|---|---|
| shoot | Rauschen 40 ms, Bandpass 2500 Hz·pitch, Q 1.2, Peak 0.18 |
| pickup | Sinus 660→990 Hz·pitch in 80 ms, Peak 0.25 |
| gateGood | Dreieck-Arpeggio 523/659/784/1046 Hz, je 60 ms |
| gateBad | Sägezahn 300→120 Hz in 300 ms, Tiefpass 1200 Hz |
| cardHit | Rechteck 1800 Hz 25 ms, Peak 0.08 |
| cardUnlock | Akkord C-E-G-C (Dreieck) 400 ms + Rausch-Glitzer (Hochpass 6 kHz) |
| wallSmash | Rauschen 250 ms, Tiefpass 600 Hz, + Sinus 80 Hz |
| enemyDie | Sinus 420→180 Hz 70 ms, Peak 0.12 |
| soldierLost | Rechteck 220→110 Hz 90 ms, Peak 0.1 |
| heroJoin | Sägezahn-Powerchord 110/165/220 Hz 600 ms, Tiefpass-Sweep 400→3000 Hz |
| heroDie | Sägezahn 220→55 Hz 700 ms |
| bossStep | Sinus 55 Hz 180 ms + Rauschen-Tiefpass 200 Hz |
| bossHit | Rechteck 140 Hz 50 ms |
| bossDie | Rauschen 1.2 s Tiefpass-Sweep 2000→100 Hz + Sinus 60 Hz |
| victory | Fanfare: 523, 659, 784 (je 120 ms), dann 1046 (500 ms), Dreieck |
| defeat | 392, 349, 311, 262 (je 220 ms), Sinus |
| uiClick | Sinus 900 Hz 30 ms |
| coin | Sinus 1320 + 1760 Hz 120 ms |

Ereignis-Zuordnung (in App, Listener der Session): `shotsFired → shoot (pitch nach Waffenstufe 1 + 0.08·tier)`,
`blockCollected → pickup (pitch 1 + min(0.5, combo·0.04))` (combo = Blöcke innerhalb 0.6 s),
`gatePassed → gateGood/gateBad (after ≥ before)`, `cardDamaged → cardHit`, `cardUnlocked → cardUnlock`,
`cardSmashed → wallSmash`, `enemyKilled → enemyDie`, `soldiersChanged (delta<0, reason enemy/boss) → soldierLost`,
`heroJoined → heroJoin`, `heroDied → heroDie`, `bossDamaged → bossHit`, `bossDefeated → bossDie`,
`phaseChanged victory/defeat → victory/defeat`. Boss-Schritte: in `walking` alle 0.55 s `bossStep`.

**Commit:** `feat(audio): synthesized sound effects mapped to sim events`

---

## Schritt 7.3 – Musik

**Dateien:** `src/audio/music.ts`

**Umsetzung:** `class MusicPlayer { constructor(engine); start(mode: 'menu' | 'run' | 'boss'); stop(); }`
- Lookahead-Scheduler (`setInterval` 25 ms, plant 0.1 s im Voraus), Tempo 112 BPM, 16tel-Raster.
- `menu`: weiches Pad (zwei Dreieck-Oszillatoren, Am–F–C–G, je 1 Takt) + leise Shaker-Rauschimpulse.
- `run`: zusätzlich Kick (Sinus 150→50 Hz) auf 1/5/9/13, Bass (Sägezahn, Tiefpass 500 Hz) Grundtöne in Achteln, Tom-Fills alle 4 Takte.
- `boss`: Tempo 124, Moll-Riff (A–C–D–Eb) im Bass, Kick auf allen Vierteln.
- Moduswechsel immer auf der nächsten Taktgrenze; bei `stop()` 0.5 s Fade-out.

**Commit:** `feat(audio): procedural background music with menu, run and boss modes`

---

## Schritt 7.4 – Partikel

**Dateien:** `src/render/fx/Particles.ts`, `src/render/views/WorldView.ts`

**Umsetzung:**
```ts
export class Particles {
  readonly root: THREE.Object3D;
  constructor(capacity = 1500);
  /** count Partikel an (x,y,z) [Sim-Koordinaten] mit Farbe, Geschwindigkeit, Lebensdauer. */
  burst(x: number, y: number, z: number, count: number, color: number, speed: number, life: number, opts?: { gravity?: number; size?: number; spread?: number; upward?: number }): void;
  update(frameDt: number, camera: THREE.Camera): void;
}
```
- SoA-Arrays (Position, Geschwindigkeit, Alter, Lebensdauer, Größe, Farbe); `InstancedMesh(PlaneGeometry(1,1))`,
  `MeshBasicMaterial({ transparent: true, depthWrite: false, vertexColors: false })` mit `instanceColor`;
  Billboard: Rotation = Kamera-Quaternion; Größe schrumpft linear; Schwerkraft −9.8·gravity.
- WorldView-Zuordnung (`onEvent`):
  `enemyKilled` → 6 rote Partikel (`0xff3b30`), speed 3, life 0.4 ·
  `blockCollected` → 14 Partikel in Blockfarbe, speed 4, upward 3 ·
  `cardDamaged` → jedes 3. Ereignis 3 weiße Funken an Kartenvorderseite ·
  `cardUnlocked` → 60 Konfetti (5 Farben), speed 6, life 1.2, gravity 0.6 ·
  `cardSmashed` → 30 weiße Splitter ·
  `bossDefeated` → 120 rote/orange Partikel, speed 9, life 1.4 ·
  `heroDied` → 40 blaue Partikel.

**Commit:** `feat(fx): pooled particle system`

---

## Schritt 7.5 – Schwebende Zahlen

**Dateien:** `src/render/fx/FloatingText.ts`

**Umsetzung:** Pool von 24 Sprites mit eigenen Canvas-Texturen (`redrawLabel`), `spawn(text, x, y, z, color, scale)`;
steigt 1.2 m in 0.9 s, skaliert mit `easeOutBack` von 0.6 auf 1, blendet in den letzten 0.3 s aus.
Zuordnung: `blockCollected` → `+value` (blau/gold) über dem Block · `gatePassed` → `×2`, `+20`, `−30`, `÷2` über dem Trupp (grün/rot, Skalierung 1.6) ·
`weaponUpgraded` → Waffenname (gelb) · `heroJoined` → „HELD!“ · Soldatenverlust durch Wand → `−N` (rot).
Aufeinanderfolgende `blockCollected` innerhalb 0.6 s werden zu einem Text zusammengefasst (`+1` → `+5`), der weiterläuft.

**Commit:** `feat(fx): floating combat text`

---

## Schritt 7.6 – Screenshake, Treffer-Vignette, Vibration

**Dateien:** `src/render/fx/ScreenShake.ts`, `src/ui/screens/HudScreen.ts`, `src/app/App.ts`, `src/ui/styles.css`

**Umsetzung:**
- `ScreenShake`: `add(trauma: number)` (0..1, addiert, max 1), `update(frameDt, out: THREE.Vector3)`;
  Versatz = `trauma² · 0.35 m · noise(t)` je Achse, Trauma fällt mit 1.5/s. Schreibt in `cameraRig.shakeOffset`.
  Auslöser: `cardSmashed` 0.4 · `bossDefeated` 0.8 · Boss `attacking` 0.15 pro Sekunde · Gate negativ 0.25 · `heroDied` 0.4.
- Vignette: `div.hit-vignette` (radialer roter Verlauf, `opacity` 0); bei Soldatenverlust ≥ 3 in 0.2 s → Opacity 0.5 und Fade in 300 ms.
- Vibration: `navigator.vibrate?.(…)` nur wenn Einstellung an: Wand 60 ms, Held tot `[40, 40, 80]`, Sieg `[30, 50, 30, 50, 120]`, Gate negativ 40 ms.
- „Bewegung reduzieren“ an → kein Screenshake, keine Vignette-Animation (nur kurz statisch), Partikelanzahl halbiert.

**Commit:** `feat(fx): screenshake, damage vignette and haptics`
