// Entwickler-Hilfe: macht einen Screenshot einer laufenden Seite (Dev-/Preview-Server muss laufen).
// Aufruf: node scripts/shot.mjs "/?level=1&autoplay=1" out.png [--w 390] [--h 844] [--wait 3000] [--base http://localhost:5173]
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const url = args[0] ?? '/';
const out = args[1] ?? 'shot.png';
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const width = Number(opt('w', 390));
const height = Number(opt('h', 844));
const wait = Number(opt('wait', 3000));
const base = opt('base', 'http://localhost:5173');
const exe = process.env.PW_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: exe,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
  ],
});
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(base + url);
await page.waitForTimeout(wait);
await page.screenshot({ path: out });
await browser.close();
const bad = logs.filter((l) => !l.startsWith('[log]') && !l.startsWith('[info]') && !l.startsWith('[debug]'));
if (bad.length) console.info(bad.join('\n'));
console.info('saved', out);
