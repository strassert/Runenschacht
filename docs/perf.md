# Performance-Messungen

Messumgebung: Headless-Chromium mit Software-Rendering (SwiftShader). **FPS-Werte sind dort nicht
aussagekräftig**; Draw Calls, Dreiecke und GPU-Speicher (`renderer.info`) dagegen schon.
Abruf im Browser: `?debug=1` → `window.__game.renderInfo()`.

| Messpunkt | Draw Calls | Dreiecke | Geometrien | Texturen |
|---|---|---|---|---|
| Level 10, Autoplay, nach ~6 s (vor Optimierung) | 41 | 971 000 | 26 | 11 |
| Level 10, Autoplay, nach ~6 s (nach Optimierung) | 48 | 260 000 | 28 | 14 |
| Nach 10× Level-Neustart (Level 1–3) | 54 | 200 000 | 27 | 10 |
| Danach Level 10 neu | 42 | 240 000 | 26 | 10 |

Ziele: Draw Calls < 150 ✔, Dreiecke < 400 k ✔, Speicher bleibt über Neustarts konstant ✔.

## Durchgeführte Optimierungen

1. **Baluster** (größter Posten, ~250 k Dreiecke): Profil von 11 auf 8 Punkte, 6 statt 8 Segmente,
   Abstand 0.7 m statt 0.55 m und Aufteilung in 48-m-Abschnitte, damit das Frustum-Culling greift.
2. **Gegner**: eigenes Low-Poly-Modell (`createSoldierGeometry(…, 'low')`), Instanzen werden verdichtet
   (nur Gegner bis 100 m Entfernung werden geschrieben statt auf Skalierung 0 zu setzen).
3. **Shader-Vorwärmung**: `renderer.compile(scene, camera)` nach jedem Session-Aufbau.
4. **Dispose**: `Session.dispose()` gibt Views, Geometrien, Materialien und Texturen frei
   (`disposeObject`); `renderer.info.memory` bleibt bei Neustarts konstant.
5. Schatten: Nur Trupp, Held, Boss, Baluster, Pfeiler und Handlauf werfen Schatten, Shadow-Map 1024.

## Offen / manuell zu prüfen

- Allokationsprofil (Chrome „Allocation sampling“) auf echter Hardware.
- JS-Heap-Verlauf über 60 s auf einem Gerät mit GPU.
