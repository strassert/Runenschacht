# Phase 4 – Rendering mit three.js

Ziel: Level 1 sieht aus wie das Referenzbild und läuft (per Bot) im Browser ab.
Alle Dateien liegen in `src/render/`. Views **lesen** `WorldState`, ändern ihn nie.

Allgemeine Regeln für diese Phase:
- three.js-Imports: `import * as THREE from 'three'`; Addons über
  `import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'`.
- Farbraum: Canvas-Texturen mit `texture.colorSpace = THREE.SRGBColorSpace`.
- Keine Allokationen in `sync()`/`update()`: Hilfsobjekte als Modulkonstanten (`const _m = new THREE.Matrix4()`).
- `InstancedMesh`: `instanceMatrix.setUsage(THREE.DynamicDrawUsage)`, `frustumCulled = false`,
  sichtbare Anzahl über `mesh.count`, nach Änderungen `instanceMatrix.needsUpdate = true`.
- Jede View hat `readonly root: THREE.Object3D`, `sync(world: WorldState, frameDt: number): void`
  (falls dynamisch) und `dispose(): void` (Geometrien, Materialien, Texturen freigeben).
- Manuelle Prüfung erfolgt ab 4.1 über eine temporäre Vorschau in `src/main.ts`
  (Simulation Level 1 + Bot + Renderer). Diese Vorschau wird in Schritt 5.2 durch `App` ersetzt.

---

## Schritt 4.1 – Renderer, Koordinaten, Vorschau-Harness

**Dateien:** `src/render/Renderer.ts`, `src/render/coords.ts`, `src/main.ts` (ersetzen)

**Umsetzung `coords.ts`:**
```ts
import * as THREE from 'three';
/** Simulation (x, z) → three.js-Position (x, y, -z). Schreibt in out und gibt out zurück. */
export function simToThree(x: number, y: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(x, y, -z);
}
```

**Umsetzung `Renderer.ts`:**
```ts
export interface RendererOptions { canvas: HTMLCanvasElement; maxPixelRatio: number; shadows: boolean; antialias: boolean }
export class Renderer {
  readonly three: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  constructor(opts: RendererOptions);
  /** Passt Größe an das Elternelement des Canvas an. Ruft onResize-Listener auf. */
  resize(): void;
  onResize(cb: (width: number, height: number) => void): void;
  render(): void;
  dispose(): void;
}
```
- `WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' })`.
- `outputColorSpace = SRGBColorSpace`, `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 1.05`.
- `shadowMap.enabled = opts.shadows`, `shadowMap.type = PCFSoftShadowMap`.
- `setPixelRatio(Math.min(window.devicePixelRatio, opts.maxPixelRatio))`.
- Kamera: `PerspectiveCamera(55, aspect, 0.1, 400)`.
- `resize()` nutzt `canvas.parentElement.clientWidth/clientHeight`; `ResizeObserver` auf das Elternelement.

**Vorschau in `src/main.ts`:** Simulation Level 1 erzeugen, `start()`, Bot; in
`requestAnimationFrame` feste Schritte (Akkumulator, `CONFIG.sim.dt`), danach `render()`.
Szene vorerst: grauer Boden-Quader und ein Platzhalter-Würfel an der Truppposition.
Die Kamera schaut provisorisch von `(0, 10, -(z − 12))` auf `(0, 0, -(z + 10))`.

**Akzeptanzkriterien:**
- [ ] Würfel läuft im Browser über den Boden, wandert seitlich (Bot).
- [ ] Fenstergröße ändern → kein Verzerren.

**Commit:** `feat(render): renderer, coordinate mapping and preview harness`

---

## Schritt 4.2 – Kamera-Rig

**Dateien:** `src/render/CameraRig.ts`

**Umsetzung:**
```ts
export class CameraRig {
  constructor(camera: THREE.PerspectiveCamera);
  /** Abstand so wählen, dass die Brückenbreite (14 m inkl. Rand) sichtbar ist. */
  setAspect(aspect: number): void;
  /** Folgt dem Trupp; snap=true springt ohne Dämpfung. */
  update(world: WorldState, frameDt: number, snap?: boolean): void;
  /** Zusätzlicher Versatz (Screenshake, Phase 7). */
  readonly shakeOffset: THREE.Vector3;
}
```
- Blickrichtung: von hinten-oben, Neigung **38°** nach unten.
- Abstandsberechnung in `setAspect`: `vfov = 55°`; `hfov = 2·atan(tan(vfov/2)·aspect)`;
  `distance = clamp(7.2 / tan(hfov/2), 14, 30)`.
- Fokuspunkt (Sim-Koordinaten): `fx = squad.x · 0.55`, `fz = squad.z + 7`; Kameraposition =
  Fokus − Blickrichtung · distance. In der Bossphase `fz = squad.z + 9`, `distance · 1.1`.
- Dämpfung: `damp(…, 6, frameDt)` für x und Distanz, z ohne Dämpfung (Trupp läuft gleichmäßig).
- `camera.lookAt(Fokus)`, danach `position.add(shakeOffset)`.

**Akzeptanzkriterien:** [ ] Hochformat (z. B. 390×844 in DevTools) zeigt die volle Brückenbreite;
Querformat ebenfalls ohne seitliches Abschneiden.

**Commit:** `feat(render): follow camera rig with aspect-aware framing`

---

## Schritt 4.3 – Licht, Himmel, Nebel

**Dateien:** `src/render/Lighting.ts`, `src/render/Sky.ts`

**Umsetzung `Lighting.ts`:**
```ts
export class Lighting {
  readonly root: THREE.Group;
  constructor(shadows: boolean);
  /** Schattenkamera folgt dem Trupp. */
  update(world: WorldState): void;
}
```
- `HemisphereLight(0xffe7c2, 0x3d5a35, 0.85)`.
- `DirectionalLight(0xffd29a, 2.4)`, Position relativ zum Ziel `(-8, 18, -30)` (Sonne vorne-links, Gegenlicht),
  Ziel = Truppposition. Schatten: `mapSize 1024`, Ortho-Kamera ±14 m, `near 1`, `far 80`, `bias −0.0005`, `normalBias 0.02`.
- Schwaches Fülllicht `DirectionalLight(0x9fc3ff, 0.35)` von hinten-rechts, ohne Schatten.

**Umsetzung `Sky.ts`:**
```ts
export function createSky(): THREE.Mesh; // Kugel r=350, BackSide, Shader-Verlauf
export function applyFog(scene: THREE.Scene): void; // scene.fog = new THREE.Fog(0xe9c99a, 45, 210)
```
Himmel-Shader (`ShaderMaterial`, `depthWrite false`, `fog false`): vertikaler Verlauf
oben `#7fa7c9` → Horizont `#f6d7a3` → unten `#c9a776`; zusätzlich Sonnenglanz in Richtung
der Sonne (`pow(max(dot(dir, sunDir),0), 64) · #fff1c8`). `sunDir` = normierte Lichtrichtung.

**Akzeptanzkriterien:** [ ] Warmes Gegenlicht, Horizont verschwimmt im Nebel.

**Commit:** `feat(render): lighting, sky dome and fog`

---

## Schritt 4.4 – Prozedurale Texturen (Canvas)

**Dateien:** `src/render/textures/canvas.ts`, `stoneTexture.ts`, `woodTexture.ts`, `waterTexture.ts`

**Umsetzung:**
- `canvas.ts`:
  ```ts
  export function createCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
  export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void; // nur Pfad
  export function toTexture(canvas: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture; // sRGB, Anisotropie 4, RepeatWrapping falls repeat
  /** Seeded Pseudozufall nur für Texturen */
  export function textureRng(seed: number): () => number;
  ```
- `stoneTexture.ts` → `createStoneTexture(): THREE.CanvasTexture` (512×512): Fugenraster
  unregelmäßiger Steinplatten (3 Reihen à 2–3 Platten, versetzt), Grundton `#7d7a70`, je Platte
  Helligkeit ±12 %, Rauschen (2000 Punkte, Alpha 0.06), Moos-Flecken an Fugen (`#5f7a3a`, Alpha 0.35),
  Fugen `#3e3b35` 6 px. Zusätzlich `createStoneNormalLike()` **nicht** nötig.
- `woodTexture.ts` → `createWoodTexture()` (512×256): 4 Planken längs, Grundton `#7a5536`,
  Maserung (sinusförmige Linien, Alpha 0.15), Nagelpunkte, dunkle Fugen.
- `waterTexture.ts` → `createWaterfallTexture()` (128×512): vertikale weiße/hellblaue Streifen mit Alpha-Verlauf;
  `wrapT = RepeatWrapping` (wird in EnvironmentView animiert über `offset.y`).

**Akzeptanzkriterien:** [ ] Funktionen liefern Texturen ohne Konsolenfehler (in Vorschau auf einen Testquader legen, danach entfernen).

**Commit:** `feat(render): procedural canvas textures`

---

## Schritt 4.5 – Brücke (TrackView)

**Dateien:** `src/render/views/TrackView.ts`, `src/render/materials.ts`

**Umsetzung `materials.ts`:** gemeinsam genutzte Materialien als Lazy-Singletons:
`getStoneMaterial()`, `getWoodMaterial()`, `getRailMaterial()` (Stein heller `#9a968a`, rauh 0.95),
`getMossMaterial()` (`#5d7d3b`), `getTrenchMaterial()` (`#4b463e`). Alle `MeshStandardMaterial`, `metalness 0`.

**Umsetzung `TrackView`:**
```ts
export class TrackView {
  readonly root: THREE.Group;
  constructor(level: LevelDef);
  dispose(): void;
}
```
Aufbau (statisch, einmalig, Sim-Länge `L = arenaZ + 60`):
1. **Holzplanken** `z −20 … 15`: Box `12 × 0.3 × 35`, Holztextur (`repeat [1, 35/4]`), Oberkante y = 0.
2. **Steinboden** `z 15 … L`: Box `12 × 0.6 × (L−15)`, Oberkante y = 0, Textur `repeat [3, (L−15)/4]`.
3. **Graben** je Horde: Für jede Horde ein dunkler, 0.25 m tiefer Kanal entlang `xMin−0.2 … xMax+0.2`,
   `zStart−3 … zEnd+3`: dazu den Steinboden **nicht** aufschneiden, sondern einen dunklen Quader
   (Höhe 0.02, `getTrenchMaterial`) knapp über dem Boden + zwei schmale Randleisten (0.2 breit, 0.25 hoch).
4. **Geländer** beidseitig bei `x = ±6.15`: Sockel-Box `0.5 × 0.35 × L`; Baluster als `InstancedMesh`
   (`LatheGeometry` mit Profil einer Vase, Höhe 0.9, alle 0.55 m, beide Seiten); Handlauf-Box
   `0.45 × 0.18 × L` auf Höhe 1.05. Pfeiler (`Box 0.7 × 1.4 × 0.7`) alle 12 m, mit Moos-Kappe.
5. **Unterbau**: dunkler Quader unter der Brücke (`12.6 × 3 × L`, y-Mitte −1.8), Stützbögen alle 24 m (Torus-Segment, optional).
6. Boden und Geländer `receiveShadow = true`; Baluster `castShadow = true`.

**Akzeptanzkriterien:** [ ] Brücke über die volle Levellänge, Planken am Anfang, Graben unter der Horde sichtbar.

**Commit:** `feat(render): bridge track with rails and trench`

---

## Schritt 4.6 – Soldatenmodell und SquadView

**Dateien:** `src/render/models/soldier.ts`, `src/render/views/SquadView.ts`

**Umsetzung `soldier.ts`:**
```ts
export interface SoldierPalette { body: number; dark: number; skin: number; gun: number }
export const BLUE_PALETTE: SoldierPalette = { body: 0x2f6bff, dark: 0x1f3fa8, skin: 0x2f6bff, gun: 0x1a1a1a };
export const RED_PALETTE: SoldierPalette = { body: 0xd8262b, dark: 0x8f1418, skin: 0xd8262b, gun: 0x2a2a2a };
/** Low-Poly-Soldat (~250 Dreiecke), Höhe ≈ 0.75 m, Füße bei y = 0, Blick nach −Z (three). Vertex-Farben. */
export function createSoldierGeometry(p: SoldierPalette): THREE.BufferGeometry;
```
Teile (jeweils Geometrie mit `color`-Attribut füllen, dann `mergeGeometries`):
Rumpf `CapsuleGeometry(0.14, 0.22, 3, 8)` y 0.42 (body) · Kopf `SphereGeometry(0.11, 10, 8)` y 0.68 (skin) ·
Helm `SphereGeometry(0.12, 10, 6, 0, 2π, 0, π/2)` y 0.7 (dark) · Beine 2× `CylinderGeometry(0.05, 0.05, 0.28, 6)` bei x ±0.07, y 0.14 (dark) ·
Gewehr `BoxGeometry(0.05, 0.06, 0.38)` bei (0.1, 0.45, −0.18) (gun) · Rucksack `BoxGeometry(0.18, 0.2, 0.1)` bei (0, 0.45, 0.12) (dark).
Hilfsfunktion `paint(geo, color)` setzt das Farbattribut. Material: `MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })`.

**Umsetzung `SquadView`:**
```ts
export class SquadView {
  readonly root: THREE.Group;
  constructor(shadows: boolean);
  sync(world: WorldState, frameDt: number): void;
  dispose(): void;
}
```
- `InstancedMesh(geometry, material, CONFIG.squad.maxRenderedSoldiers)`, `castShadow = shadows`.
- Pro sichtbarem Soldaten `i < min(count, maxRendered)` eine **geglättete** Position `px[i], pz[i]`
  (Float32Arrays), die per `damp(…, 10, frameDt)` zum Ziel-Slot läuft:
  `tx = s.x + UNIT_SLOT_X[i] · slotSpacing`, `tz = s.z + UNIT_SLOT_Z[i] · slotSpacing`.
  Neu hinzugekommene Soldaten (Index ≥ voriger Anzahl) starten an der Truppmitte (schöner „Aufblüh“-Effekt).
- Laufanimation (nur wenn Phase `running`): `y = |sin(time · 12 + i · 1.7)| · 0.07`,
  Neigung um X `0.12`, leichtes Wiegen um Z `sin(time · 12 + i) · 0.06`. In `bossFight` stehen sie (y = 0).
- Matrix: `compose(position, quaternion, scale 1)`; Rotation Y = 0 (das Modell blickt bereits nach −Z in three = Sim-Laufrichtung +z).
- Wenn `count > maxRendered`, werden nur die inneren `maxRendered` Slots gezeigt (Zahlen-Label zeigt die echte Zahl).

**Akzeptanzkriterien:** [ ] Blaue Soldatengruppe in Spiralformation, die beim Einsammeln von Blöcken sichtbar wächst.

**Commit:** `feat(render): soldier model and instanced squad view`

---

## Schritt 4.7 – Gegnerhorde (EnemyView)

**Dateien:** `src/render/views/EnemyView.ts`

**Umsetzung:**
- `InstancedMesh(createSoldierGeometry(RED_PALETTE), …, CONFIG.enemy.maxEnemies)`.
- `sync`: `mesh.count = enemies.count`; für jeden Gegner Position aus Pool, `y = |sin(animPhase)| · (charging ? 0.08 : 0.02)`;
  Gegner, die in einer Horde liegen, stehen im Graben: `y −= 0.15`, solange `charging === 0`.
  Rotation: Gegner schauen **zum Trupp**, also in Sim-Richtung −z = three +Z → Rotation Y = π
  (das Modell blickt standardmäßig nach −Z).
- Gegner weiter als 120 m vor dem Trupp nicht zeichnen (Schleife früher abbrechen ist nicht möglich,
  da Pool unsortiert → stattdessen Skalierung 0 setzen). `castShadow = false` (Performance).

**Akzeptanzkriterien:** [ ] Rote Horde steht im Graben, stürmt bei Annäherung los, verschwindet bei Treffern.

**Commit:** `feat(render): instanced enemy horde view`

---

## Schritt 4.8 – Zahlen-Labels

**Dateien:** `src/render/textures/labelTexture.ts`

**Umsetzung:**
```ts
export interface LabelStyle { fontPx: number; fill: string; stroke: string; strokePx: number; width: number; height: number }
export const BLOCK_LABEL: LabelStyle = { fontPx: 96, fill: '#ffffff', stroke: '#14213d', strokePx: 14, width: 256, height: 128 };
export const CARD_LABEL: LabelStyle = { fontPx: 120, fill: '#ffffff', stroke: '#1b1b1b', strokePx: 16, width: 384, height: 160 };
export const COUNT_LABEL: LabelStyle = { fontPx: 88, fill: '#ffffff', stroke: '#0b2a6b', strokePx: 14, width: 256, height: 128 };
export const FONT_FAMILY = '"Lilita One", "Arial Black", Impact, sans-serif';
/** Zeichnet Text mittig mit Kontur; Texturen werden pro (Stil, Text) gecacht. */
export function getLabelTexture(text: string, style: LabelStyle): THREE.CanvasTexture;
/** Zeichnet in eine bestehende Textur neu (für sich ändernde Zähler, ohne neue Textur). */
export function redrawLabel(texture: THREE.CanvasTexture, text: string, style: LabelStyle): void;
export function disposeLabelCache(): void;
```
Zeichnen: `ctx.font = \`${fontPx}px ${FONT_FAMILY}\``, `textAlign center`, `textBaseline middle`,
`lineJoin round`, zuerst `strokeText` (lineWidth `strokePx`), dann `fillText`. Wenn der Text breiter als
`width − 16` ist, Schriftgröße proportional verkleinern.

**Commit:** `feat(render): cached canvas number labels`

---

## Schritt 4.9 – Bonus-Blöcke (BlockView)

**Dateien:** `src/render/views/BlockView.ts`

**Umsetzung:**
- Geometrie: abgeschrägter Quader `1.6 × 0.9 × 0.7` (`ExtrudeGeometry` aus einem Rechteck mit
  `bevelEnabled`, `bevelSize 0.06`, `bevelThickness 0.06`, `bevelSegments 2`), Unterkante y = 0,
  leicht nach hinten geneigt (`rotation.x = −0.18`), wie im Bild.
- Materialien: blau `#2f6bff` (emissive `#0b2a8a` · 0.25), gold `#f2c230` (emissive `#7a5200` · 0.2).
- Je Block ein `Group`: Mesh + Label-Plane (`PlaneGeometry(1.5, 0.75)`, `MeshBasicMaterial({ map: getLabelTexture('+' + value, BLOCK_LABEL), transparent: true, depthWrite: false })`)
  auf der Vorderseite (three +Z-Seite, 0.01 vor der Fläche).
- Nur Blöcke im Sichtbereich `s.z − 10 … s.z + 110` sind `visible`.
- Eingesammelt → Block schrumpft in 0.2 s auf 0 (Skalierung, `easeOutCubic`), springt dabei 0.5 m hoch, dann `visible = false`.
  Dafür `collectedAt: number[]` (Weltzeit) je Block-ID führen.

**Akzeptanzkriterien:** [ ] Linke blaue `+1`-Reihe und rechte goldene `+33`-Reihe wie im Referenzbild.

**Commit:** `feat(render): bonus block view with labels and collect animation`

---

## Schritt 4.10 – Tore (GateView)

**Dateien:** `src/render/views/GateView.ts`

**Umsetzung:**
- Je Option: Rahmen aus zwei Pfosten (`Box 0.2 × 2.6 × 0.2`) und Querbalken; Füllfläche
  (`PlaneGeometry(breite − 0.3, 2.2)`) halbtransparent: positiv (`add`, `mul`) `#27c4ff` Alpha 0.35,
  negativ (`sub`, `div`) `#ff3b3b` Alpha 0.35, `side DoubleSide`, `depthWrite false`.
- Label mittig oben: Text `+20`, `−30`, `×2`, `÷2` (echte Minus-/Mal-/Geteilt-Zeichen), Stil `BLOCK_LABEL`.
- Nach Passieren: gewählte Option blitzt weiß auf (Opacity 0.8 → 0 in 0.3 s), andere Optionen faden aus.

**Commit:** `feat(render): gate view`

---

## Schritt 4.11 – Upgrade-Karten (CardView)

**Dateien:** `src/render/textures/cardIcons.ts`, `src/render/views/CardView.ts`

**Umsetzung `cardIcons.ts`:** `drawCardFace(ctx, kind, hpText, w=512, h=384)`:
weiße abgerundete Tafel (Radius 36, Rand `#d9dde3` 10 px, leichter Verlauf nach unten),
oberes 60 %: Symbol, unteres 40 %: Zahl (`CARD_LABEL`-Optik, dunkle Kontur).
Symbole als Canvas-Pfade (schwarz-weiß Comic-Stil mit 6-px-Kontur):
- `weapon`: Sturmgewehr-Silhouette (Lauf, Magazin, Kolben, Zielfernrohr) mit **blauem** Leuchtstreifen (`#3fa9ff`).
- `hero`: Muskelprotz-Silhouette (breite Schultern, Patronengurt, Minigun).
- `soldiers`: drei kleine Soldatenköpfe + `+N` (N = reward).

**Umsetzung `CardView`:**
- Je Karte: `Group` mit Tafel-Mesh (`BoxGeometry(width, 2.2, 0.25)`, Rückseite/Seiten weiß, Vorderseite
  Canvas-Textur 512×384 → eigene `CanvasTexture` je Karte), Unterkante y = 0.1, leicht zurückgekippt (−0.12 rad).
- Zähleranzeige: `Math.ceil(hp)`; Neuzeichnen **höchstens alle 50 ms** und nur, wenn sich die Zahl geändert hat.
- Treffer-Feedback: bei `hp`-Änderung kurz (0.08 s) Skalierung 1.04 und Emissive-Aufhellung.
- `unlocked`: Karte fliegt in 0.5 s zum Trupp (Position lerpen, dabei Skalierung → 0.3, Drehung um Y),
  danach unsichtbar. `smashed`: Karte kippt in 0.4 s nach hinten um und sinkt, danach unsichtbar.

**Akzeptanzkriterien:** [ ] Karten „23“ (Gewehr) und „555“ (Muskelprotz) wie im Referenzbild; Zahl zählt beim Beschuss runter.

**Commit:** `feat(render): upgrade card view with live counters`

---

## Schritt 4.12 – Projektile (BulletView)

**Dateien:** `src/render/views/BulletView.ts`

**Umsetzung:**
- `InstancedMesh(BoxGeometry(0.06, 0.06, 0.9), MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), CONFIG.shooting.maxBullets)`.
- Farbe pro Instanz via `setColorAt`: Tier 0–3 → `WEAPONS[tier].tracerColor`, Held (255) → `0xfff3b0`.
  `instanceColor.needsUpdate = true`.
- Position: `(x, 0.45, −(z − 0.45))` (Leuchtspur hängt hinter dem Projektil her), keine Rotation.
- Zusätzlich **Mündungsfeuer**: kleines additives Sprite (`SpriteMaterial` mit radialer Canvas-Textur)
  über dem Trupp-Zentrum, Deckkraft pulsiert mit `shotsFired`-Ereignissen (in `onEvent`, siehe 4.15).

**Commit:** `feat(render): bullet tracers`

---

## Schritt 4.13 – Held und Boss

**Dateien:** `src/render/models/brute.ts`, `src/render/models/boss.ts`, `src/render/views/HeroView.ts`, `src/render/views/BossView.ts`

**Umsetzung Modelle** (Vertex-Farben, `mergeGeometries`, Füße bei y = 0):
- `createBruteGeometry()`: Höhe 2.0 m, breiter Oberkörper (`Box 1.0 × 0.8 × 0.6` mit abgerundeten Kanten via `CapsuleGeometry` für Arme),
  kleiner Kopf, Patronengurt (gelbe Kästchen diagonal), Minigun (Zylinderbündel, 6 Läufe) rechts. Farbe Blau `#3a74ff`, Haut `#f1c27d`, Gurt `#d9a628`.
- `createBossGeometry()`: Gigant Höhe 2.0 bei scale 1 (wird mit `boss.scale` skaliert), rot `#c41f1f`,
  dunkle Schultern `#6e0f0f`, glühende Augen (`#ffde59`, emissive separat über zweites Material nicht nötig – helle Vertex-Farbe reicht), Keule.
- **HeroView:** Position aus `hero`, Laufanimation (Wippen), `visible = hero.active`, beim Tod Umkippen 0.5 s.
  HP-Balken (Plane, grün→rot) 0.4 m über dem Kopf, nur sichtbar wenn `hp < maxHp`.
- **BossView:** Position/Skalierung aus `boss`; `dormant` Atmen, `walking` stampfendes Wippen,
  `attacking` Schlag-Animation (Rotation X des ganzen Modells, 2 Hz). HP-Balken über dem Kopf (Breite 2.5 m,
  Billboard zur Kamera). `dead`: kippt nach hinten, sinkt in 1 s.

**Akzeptanzkriterien:** [ ] Am Levelende steht ein großer roter Boss (wie hinten im Referenzbild), Held erscheint nach Freischalten der 555-Karte.

**Commit:** `feat(render): hero and boss models and views`

---

## Schritt 4.14 – Umgebung (Dschungel, Klippen, Wasserfälle, Berge)

**Dateien:** `src/render/quality.ts`, `src/render/models/palm.ts`, `src/render/models/rock.ts`, `src/render/views/EnvironmentView.ts`

**Umsetzung:**
- `createPalmGeometry()`: gebogener Stamm (8 gestapelte, leicht versetzte Zylindersegmente, braun `#7b5a3a`),
  Krone aus 7 Wedeln (gebogene `PlaneGeometry`-Streifen, grün `#3f7d32`/`#5a9a3c`, `DoubleSide`). Höhe ≈ 7 m.
- `createRockGeometry(seed)`: `DodecahedronGeometry(1, 1)` mit zufällig verschobenen Vertices (±18 %), Grauton `#6f6a5f`, flat shading.
- `src/render/quality.ts` anlegen mit `export type Quality = 'low' | 'medium' | 'high';` (wird in Schritt 9.1 erweitert).
- **EnvironmentView** (`constructor(level, quality: Quality)`), deterministische Platzierung mit `textureRng(level.seed)`:
  1. **Dschungelboden** weit unten: großer grüner Plane bei y = −28 (`#2f4f2a`), mit Nebel versinkend.
  2. **Palmen** (`InstancedMesh`): je Seite alle ~6 m eine Palme bei `|x| ∈ [8.5, 22]`, y zufällig −6 … −1
     (stehen tiefer als die Brücke), Rotation/Skalierung zufällig (0.8–1.4). Anzahl ≈ `(arenaZ+80)/6 · 2`.
  3. **Büsche/Farne** direkt neben dem Geländer (`|x| ∈ [6.6, 8]`): kleine grüne Kegel-/Ikosaeder-Instanzen mit roten Blüten-Punkten (`#d6402e`).
  4. **Felsklippen** links und rechts (`|x| ∈ [14, 40]`): große Felsinstanzen (Skalierung 4–10), y −30 … 0.
  5. **Wasserfälle**: 4–6 Planes (Breite 3–6, Höhe 25–40) an Klippen, `createWaterfallTexture`, `transparent`, Alpha 0.8,
     in `update(frameDt)` `texture.offset.y −= frameDt · 0.6`. Unten Gischt-Sprites (weiß, Alpha 0.3).
  6. **Berge** im Hintergrund: 10 große Kegel (`ConeGeometry(r 40–80, h 60–120, 7)`) bei `z = arenaZ + 120 … +260`,
     seitlich verteilt, Farbe `#5d7a5a` – der Nebel lässt sie dunstig erscheinen.
  7. **Hängende Lianen** (optional, Qualität `high`): dünne grüne Zylinder vom oberen Bildrand an den Seiten.
- Qualität `low`: Palmen halbieren, keine Büsche, 2 Wasserfälle. `medium`: Standard. `high`: + Lianen.

**Akzeptanzkriterien:** [ ] Gesamtbild erinnert deutlich an das Referenzbild (Dschungelschlucht, Wasserfälle, dunstige Berge).

**Commit:** `feat(render): jungle environment with palms, cliffs and waterfalls`

---

## Schritt 4.15 – WorldView, Zahlen-Label über dem Trupp, Meilenstein M2

**Dateien:** `src/render/views/CountLabelView.ts`, `src/render/views/WorldView.ts`, `src/main.ts` (Vorschau anpassen)

**Umsetzung `CountLabelView`:** `Sprite` mit `getLabelTexture`-ähnlicher eigener Canvas-Textur
(`COUNT_LABEL`-Stil, blaue abgerundete Plakette `#2f6bff` mit weißem Rand) über dem Trupp:
Position `(s.x, 1.6 + R · 0.15, −(s.z + R · 0.3))`, Skalierung `1.6 × 0.8`. Neuzeichnen nur bei Zahländerung.
Bei `count === 0` ausblenden.

**Umsetzung `WorldView`:**
```ts
export class WorldView {
  readonly root: THREE.Group;
  constructor(level: LevelDef, opts: { shadows: boolean; quality: Quality });
  /** Ereignisse der Simulation (für Animationen/Effekte). */
  onEvent(event: SimEvent): void;
  sync(world: WorldState, frameDt: number): void;
  dispose(): void;
}
```
`Quality` wird aus `src/render/quality.ts` importiert.
Enthält Track, Environment, Blocks, Gates, Cards, Enemies, Squad, Bullets, Hero, Boss, CountLabel
und ruft deren `sync` in genau dieser Reihenfolge auf. `onEvent` leitet an die Views weiter, die es brauchen.

**Vorschau (`main.ts`):** Renderer + CameraRig + Lighting + Sky + WorldView; Simulation Level 1 mit Bot; Ereignisse
nach jedem Frame an `worldView.onEvent` geben und dann `sim.clearEvents()`.

**Akzeptanzkriterien (Meilenstein M2):**
- [ ] `npm run dev` zeigt Level 1, der Bot spielt es bis zum Bosskampf und gewinnt.
- [ ] Mindestens 50 FPS auf einem Mittelklasse-Laptop (Chrome-DevTools-Performance-Overlay).
- [ ] Keine Fehler/Warnungen in der Konsole.

**Commit:** `feat(render): world view composition and squad count label`
