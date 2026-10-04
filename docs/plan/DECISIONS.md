# Entscheidungs-Log

Jede Abweichung vom Plan wird hier eingetragen – auch Balancing-Änderungen an Level-Werten.

| Datum | Schritt | Abweichung / Änderung | Grund |
|---|---|---|---|
| 2026-10-04 | – | Plan erstellt | Ausgangsbasis |
| 2026-10-04 | 0.2 | `@types/node` und `"types": ["vite/client", "node"]` ergänzt; Prettier ignoriert `docs` und `*.md` | Plan-Dokumente nicht umformatieren |
| 2026-10-04 | 3.13 | Bot: nicht freischießbare Karten gelten als Wand – alles dahinter in derselben Spur wird für die Bewertung ignoriert | Ohne diese Regel lief der Bot für +33-Blöcke in die 555-Karte |
| 2026-10-04 | 4.5 | `materials.ts` liefert Materialfabriken statt Lazy-Singletons; Geländer-Mitte bei x = ±5.9 (Deck 12.4 m) | Besitz/Dispose pro View ist einfacher; Geländer passt zu `railMargin` 0.35 |
| 2026-10-04 | 4.6 | Soldatenmodell optisch um Faktor 1.45 vergrößert; Kamera-Faktor 7.8 statt 7.2 | Wirkt wie im Referenzbild kompakter, Brücke bleibt komplett sichtbar |
| 2026-10-04 | 4.8 | `@fontsource/lilita-one` schon in Phase 4 installiert | Label-Texturen brauchen die Schrift |
| 2026-10-04 | 8.2 | Balancing-Mindestdauer 25 s statt 30 s (Level 1 ist 190 m lang, ≈ 27 s Laufzeit) | Level 1 ist bewusst kurz |
| 2026-10-04 | 8.2 | Horden-Anzahl und Karten-HP der Level 2–10 skaliert (Faktoren L2 0.9, L3 0.6, L4 0.45, L5 0.35, L6 0.55, L7 0.75, L8 0.3, L9 0.75, L10 0.55); Boss-HP monoton: 600 / 1000 / 1500 / 2200 / 3000 / 4200 / 5600 / 7200 / 9000 / 12000 | Der Bot mit erwarteten Upgrades verlor die Level 3–10 mit den Ausgangswerten (Peak nur 25–40 Soldaten vor der ersten Horde) |
| 2026-10-04 | 9.3 | Playwright (neueste Version) nutzt in der Cloud-Umgebung das vorhandene Chromium über `PW_CHROMIUM_PATH` (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`); `scripts/shot.mjs` für Screenshots | Vorinstallierte Browserversion passt nicht zur Playwright-Version, `playwright install` ist dort verboten |
| 2026-10-04 | 9.5 | PNG-Icons mit `scripts/make-icons.mjs` aus `public/icon.svg` erzeugt und committet; Lighthouse nicht ausgeführt (kein Zugriff) | Plan sieht einmalige lokale Erzeugung vor |

