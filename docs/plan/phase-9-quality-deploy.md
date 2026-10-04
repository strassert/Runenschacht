# Phase 9 – Performance, Tests, Deployment, PWA

Ziel: Stabil 60 FPS auf Mittelklasse-Smartphones, E2E-Smoke-Test in CI, automatisches
Deployment auf GitHub Pages, installierbar als PWA.

---

## Schritt 9.1 – Qualitätsstufen und Auto-Qualität

**Dateien:** `src/render/quality.ts` (erweitern), `src/render/quality.test.ts` (reine Logik ohne three), `src/app/App.ts`

**Umsetzung:**
```ts
export type Quality = 'low' | 'medium' | 'high';
export interface QualityProfile { maxPixelRatio: number; shadows: boolean; antialias: boolean; maxRenderedSoldiers: number; environmentDensity: number; particlesScale: number }
export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  low:    { maxPixelRatio: 1,   shadows: false, antialias: false, maxRenderedSoldiers: 150, environmentDensity: 0.5, particlesScale: 0.5 },
  medium: { maxPixelRatio: 1.5, shadows: true,  antialias: false, maxRenderedSoldiers: 250, environmentDensity: 1,   particlesScale: 1 },
  high:   { maxPixelRatio: 2,   shadows: true,  antialias: true,  maxRenderedSoldiers: 300, environmentDensity: 1.3, particlesScale: 1 },
};
/** Startwert für 'auto': mobile (pointer: coarse) → medium, sonst high. */
export function initialAutoQuality(isCoarsePointer: boolean): Quality;
/** Bewertet gemessene Frame-Zeiten (ms) und schlägt eine Stufe vor (oder null = bleiben). */
export class AutoQualityGovernor {
  constructor(start: Quality);
  /** Nach je 3 s Messung: Median > 22 ms → eine Stufe runter; Median < 12 ms über 2 Messungen → eine Stufe hoch (max. 1× hoch pro Sitzung). */
  sample(frameMs: number): Quality | null;
}
```
- Wechsel der Stufe: Renderer-Pixelratio und Schatten sofort; Umgebungsdichte/Soldatenzahl erst beim nächsten Session-Start.
- Einstellung „Grafikqualität“ (6.8) wirkt jetzt: `auto` nutzt den Governor, sonst fest.

**Tests:** Governor mit synthetischen Frame-Zeiten: dauerhaft 30 ms → nach 3 s `low`; dauerhaft 8 ms → steigt höchstens einmal.

**Commit:** `perf: quality profiles and auto quality governor`

---

## Schritt 9.2 – Performance-Durchgang

**Dateien:** je nach Befund; Ergebnis in `docs/perf.md`

**Umsetzung (Checkliste abarbeiten und Messwerte in `docs/perf.md` eintragen):**
1. Mit `?debug=1` auf Level 10 messen: FPS, Draw Calls, Dreiecke (`renderer.info`), JS-Heap.
   Ziele: Draw Calls < 150, Dreiecke < 400 k, kein stetiges Heap-Wachstum über 60 s.
2. Allokationen in Hot Paths suchen (Chrome Performance → „Allocation sampling“): `sync()`, `step()`. Funde beheben.
3. Statische Geometrie zusammenführen: Geländer-Sockel/Handlauf je Seite zu einer Geometrie; Pfeiler als InstancedMesh.
4. Blöcke/Karten außerhalb des Sichtfensters `visible = false` (bereits in 4.9) – auch für Tore prüfen.
5. `Session.dispose()` gibt alle Geometrien/Materialien/Texturen frei: 10× Level neu starten → `renderer.info.memory` bleibt konstant.
6. Schattenkarte nur 1024 und nur Trupp/Held/Boss/Baluster werfen Schatten.
7. Shader-Warmup: nach Session-Erstellung `renderer.compile(scene, camera)` aufrufen (verhindert Ruckler beim ersten Treffer).

**Akzeptanzkriterien:** [ ] Alle Ziele aus Punkt 1 erreicht und dokumentiert.

**Commit:** `perf: optimize draw calls, allocations and disposal`

---

## Schritt 9.3 – E2E-Smoke-Test mit Playwright

**Dateien:** `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`, `.github/workflows/ci.yml`

**Umsetzung:**
1. `npm install -D @playwright/test@^1.48`; Skript `"e2e": "playwright test"`.
2. `playwright.config.ts`:
   ```ts
   import { defineConfig, devices } from '@playwright/test';
   export default defineConfig({
     testDir: 'e2e',
     timeout: 90_000,
     use: {
       baseURL: 'http://localhost:4173',
       ...devices['Pixel 7'],
       launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
     },
     webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120_000 },
   });
   ```
   (Lokal in dieser Cloud-Umgebung: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` bzw. ohne Variable, da `PLAYWRIGHT_BROWSERS_PATH` gesetzt ist. **Nie** `playwright install` ausführen, wenn Chromium vorhanden ist.)
3. `e2e/smoke.spec.ts`:
   - Test „Menü lädt“: Seite öffnen, Text „RUNENSCHACHT“ sichtbar, Canvas vorhanden, keine `console.error`/`pageerror`.
   - Test „Level 1 per Autoplay gewinnen“: `/?level=1&autoplay=1&speed=8&debug=1` öffnen,
     warten bis Text „SIEG!“ sichtbar (Timeout 60 s), Screenshot `test-results/victory.png`.
   - Test „Steuerung bewegt Trupp“: `/?level=1&debug=1`, Maus auf Canvas-Mitte drücken, 150 px nach links ziehen,
     500 ms warten, `window.__game.getState()` → `z > 0` und Trupp-x < 0 (dafür `getState` um `x` erweitern).
4. CI: neuer Job `e2e` nach `check`: `npx playwright install --with-deps chromium` (nur in CI!), dann `npm run e2e`;
   Artefakt `test-results` bei Fehlschlag hochladen.

**Commit:** `test(e2e): playwright smoke tests in ci`

---

## Schritt 9.4 – Deployment auf GitHub Pages

**Dateien:** `.github/workflows/deploy.yml`

**Umsetzung:**
```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
`vite.config.ts` hat bereits `base: './'` → funktioniert unter `/<repo>/`.
README: Abschnitt „Online spielen“ mit Hinweis, dass Pages in den Repo-Einstellungen auf „GitHub Actions“ gestellt werden muss.

**Commit:** `ci: deploy to github pages`

---

## Schritt 9.5 – PWA (Meilenstein M5)

**Dateien:** `public/manifest.webmanifest`, `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/sw.js`, `index.html`, `src/main.ts`, `scripts/make-icons.mjs`

**Umsetzung:**
1. `public/icon.svg`: blauer Kreis-Hintergrund `#2f6bff`, weiße Rune (stilisiertes „ᚱ“ als Pfad) + kleiner Soldatenhelm. Quadratisch 512.
2. PNG-Icons: `scripts/make-icons.mjs` rendert das SVG mit Playwright-Chromium (`page.setContent`, `screenshot`) in 192/512 px.
   Einmal lokal ausführen, PNGs committen (kein Build-Schritt).
3. Manifest: `name "Runenschacht"`, `short_name "Runenschacht"`, `display "fullscreen"`, `orientation "portrait"`,
   `background_color "#1b2a1f"`, `theme_color "#1b2a1f"`, `start_url "./"`, Icons (inkl. `purpose: "any maskable"`).
4. `index.html`: `<link rel="manifest" href="./manifest.webmanifest">`, `<link rel="icon" href="./icon.svg">`, `apple-touch-icon`.
5. `public/sw.js`: Netzwerk-zuerst für Navigation, Cache-zuerst für `/assets/*` (gehashte Dateien), Cache-Name `runenschacht-v1`;
   alte Caches in `activate` löschen.
6. `main.ts`: Service Worker nur in Produktion registrieren (`import.meta.env.PROD && 'serviceWorker' in navigator`).

**Akzeptanzkriterien (M5):**
- [ ] Lighthouse (mobil): Performance ≥ 80, PWA installierbar, Best Practices ≥ 90.
- [ ] Offline nach erstem Laden spielbar.
- [ ] CI (check + e2e) grün, Deployment erreichbar.

**Commit:** `feat(pwa): manifest, icons and offline service worker`
