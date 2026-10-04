// Rendert public/icon.svg zu PNGs (192, 512, 180). Einmal lokal ausführen und die PNGs committen.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const exe = process.env.PW_CHROMIUM_PATH ?? undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
for (const [size, name] of [
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
  [180, 'apple-touch-icon.png'],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0;overflow:hidden">${svg.replace('<svg ', `<svg style="width:${size}px;height:${size}px;display:block" `)}</body></html>`,
  );
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname });
  await page.close();
  console.info('erzeugt', name);
}
await browser.close();
