# Phase 0 – Projekt-Setup

Ziel der Phase: leeres, lauffähiges Vite-+-TypeScript-+-three.js-Projekt mit Tests, Lint,
Format und CI. Am Ende zeigt der Browser einen drehenden Würfel (Rauchtest).

---

## Schritt 0.1 – Vite/TypeScript-Grundgerüst

**Ziel:** Projekt startet mit `npm run dev` und zeigt einen drehenden Würfel.

**Dateien:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`,
`src/vite-env.d.ts`, `.gitignore`

**Umsetzung:**

1. `package.json` anlegen:
   ```json
   {
     "name": "runenschacht",
     "private": true,
     "version": "0.1.0",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "tsc --noEmit && vite build",
       "preview": "vite preview",
       "typecheck": "tsc --noEmit"
     }
   }
   ```
2. Installieren:
   `npm install three@^0.170.0`
   `npm install -D typescript@~5.6 vite@^6 @types/three@^0.170.0`
3. `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "strict": true,
       "noUncheckedIndexedAccess": false,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "isolatedModules": true,
       "resolveJsonModule": true,
       "skipLibCheck": true,
       "types": ["vite/client"]
     },
     "include": ["src", "e2e", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
   }
   ```
4. `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite';

   export default defineConfig({
     base: './',
     server: { host: true, port: 5173 },
     build: { target: 'es2022', sourcemap: true, chunkSizeWarningLimit: 1500 },
   });
   ```
5. `index.html` (Hochformat-optimiert, kein Scrollen, kein Zoom):
   ```html
   <!doctype html>
   <html lang="de">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
       <meta name="theme-color" content="#1b2a1f" />
       <title>Runenschacht</title>
     </head>
     <body>
       <div id="app">
         <canvas id="game-canvas"></canvas>
         <div id="ui-root"></div>
       </div>
       <script type="module" src="/src/main.ts"></script>
     </body>
   </html>
   ```
6. `src/vite-env.d.ts`: `/// <reference types="vite/client" />`
7. `src/main.ts`: minimaler three.js-Rauchtest – `WebGLRenderer` auf `#game-canvas`,
   `PerspectiveCamera(60)`, grüner `BoxGeometry(1,1,1)` mit `MeshNormalMaterial`, dreht sich
   per `requestAnimationFrame`; bei `resize` Renderer-Größe und Kamera-Aspect anpassen.
   Inline-Styles in `main.ts` setzen: `html, body, #app` 100 % Höhe, `margin 0`,
   `overflow hidden`, Hintergrund `#1b2a1f`; Canvas `display:block; width:100%; height:100%`.
   (Wird in Schritt 6.1 durch `styles.css` ersetzt.)
8. `.gitignore`: `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `.DS_Store`, `*.log`.

**Akzeptanzkriterien:**
- [ ] `npm run build` läuft fehlerfrei.
- [ ] `npm run dev` → Browser zeigt drehenden Würfel, Größe passt sich dem Fenster an.

**Commit:** `chore: scaffold vite + typescript + three.js project`

---

## Schritt 0.2 – Tests, Lint, Format, `check`-Skript

**Ziel:** Qualitäts-Tooling einsatzbereit; `npm run check` ist die einzige Prüfung, die
nach jedem Schritt ausgeführt wird.

**Dateien:** `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`,
`package.json`, `src/core/sanity.test.ts`

**Umsetzung:**

1. Installieren:
   `npm install -D vitest@^2.1 eslint@^9 @eslint/js@^9 typescript-eslint@^8 prettier@^3 globals@^15 @types/node@^20`
   In `tsconfig.json` danach `"types": ["vite/client", "node"]` setzen (für `process.env` in Tests/Skripten).
2. `vitest.config.ts`:
   ```ts
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       include: ['src/**/*.test.ts'],
       environment: 'node',
     },
   });
   ```
3. `eslint.config.js`:
   ```js
   import js from '@eslint/js';
   import tseslint from 'typescript-eslint';
   import globals from 'globals';

   export default tseslint.config(
     { ignores: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results'] },
     js.configs.recommended,
     ...tseslint.configs.recommended,
     {
       languageOptions: { globals: { ...globals.browser, ...globals.node } },
       rules: {
         '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
         'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
       },
     },
     {
       files: ['src/core/**/*.ts'],
       rules: {
         'no-restricted-imports': ['error', {
           patterns: [
             { group: ['three', 'three/*'], message: 'core darf three nicht importieren' },
             { group: ['../render/*', '../ui/*', '../app/*', '../audio/*', '../input/*', '../persistence/*',
                       '../../render/*', '../../ui/*', '../../app/*', '../../audio/*', '../../input/*', '../../persistence/*'],
               message: 'core darf nur core importieren' },
           ],
         }],
         'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'navigator'],
         'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'world.rng benutzen' }],
       },
     },
   );
   ```
4. `.prettierrc.json`: `{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 110 }`
5. `.prettierignore`: `dist`, `node_modules`, `coverage`, `package-lock.json`, `docs`, `*.md`, `playwright-report`, `test-results`
   (Markdown wird nicht von Prettier geprüft, damit die Plan-Dokumente unverändert bleiben.)
6. `package.json`-Skripte ergänzen (siehe `01-architecture.md`, Abschnitt 6, ohne `e2e`).
7. `src/core/sanity.test.ts`: ein Test `expect(1 + 1).toBe(2)` (wird in Schritt 1.2 gelöscht).
   Konvention für alle Tests: `import { describe, it, expect } from 'vitest';` explizit importieren (keine Globals).
8. `npm run format` einmal ausführen, damit alle Dateien formatiert sind.

**Akzeptanzkriterien:**
- [ ] `npm run check` läuft vollständig grün.
- [ ] Eine testweise Zeile `import * as THREE from 'three'` in einer Datei unter `src/core/`
      erzeugt einen ESLint-Fehler (danach wieder entfernen).

**Commit:** `chore: add vitest, eslint, prettier and check script`

---

## Schritt 0.3 – Ordnerstruktur, README, Editor-Settings

**Ziel:** Alle Ordner aus `01-architecture.md` existieren; README erklärt das Projekt.

**Dateien:** `README.md` (erweitern, Referenzbild und Plan-Link behalten), `.editorconfig`, `.nvmrc`, Ordner mit `.gitkeep`

**Umsetzung:**
1. Leere Ordner mit `.gitkeep` anlegen: `src/app`, `src/core/systems`, `src/core/level`,
   `src/core/spatial`, `src/core/pools`, `src/render/textures`, `src/render/models`,
   `src/render/views`, `src/render/fx`, `src/input`, `src/audio`, `src/ui/components`,
   `src/ui/screens`, `src/persistence`, `public`, `e2e`.
   (`.gitkeep` löschen, sobald der Ordner echte Dateien enthält.)
2. `.editorconfig`: UTF-8, LF, 2 Leerzeichen, finale Newline.
3. `.nvmrc`: `20`
4. `README.md`: Titel, ein Absatz Spielbeschreibung (aus `00-game-design.md` Abschnitt 1),
   Abschnitt „Entwicklung“ (`npm install`, `npm run dev`, `npm run check`), Abschnitt
   „Plan“ mit Link auf `docs/plan/README.md`, Abschnitt „Debug-Parameter“ (Platzhalter,
   wird in Schritt 5.4 gefüllt).

**Akzeptanzkriterien:**
- [ ] `npm run check` grün.

**Commit:** `chore: add folder structure, readme and editor config`

---

## Schritt 0.4 – GitHub Actions CI

**Ziel:** Jeder Push und jeder PR führt `npm run check` aus.

**Dateien:** `.github/workflows/ci.yml`

**Umsetzung:**
```yaml
name: CI
on:
  push:
    branches: ['**']
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check
```

**Akzeptanzkriterien:**
- [ ] YAML ist gültig (`npx --yes yaml-lint` nicht nötig – Prettier prüft das Format).
- [ ] `npm run check` lokal grün.

**Commit:** `ci: run check on push and pull request`
