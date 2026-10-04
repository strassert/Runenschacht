import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Nur aktiv mit SCREENSHOTS=1 (npm run screenshots). Ziel: SHOT_DIR (Standard: baseline).
const dir = `docs/ux/${process.env.SHOT_DIR ?? 'baseline'}`;
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1280, height: 800, mobile: false },
];

type Game = {
  win(): void;
  start?(level: number): void;
  lose(): void;
  skipTo(z: number): void;
  getState(): { phase: string; state: string };
};

async function game<T>(page: Page, fn: (g: Game) => T): Promise<T> {
  return page.evaluate(fn as never, undefined as never) as Promise<T>;
}
void game;

async function waitReady(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as unknown as { __game?: unknown }).__game !== undefined);
}

test.describe('Screenshots', () => {
  test.skip(!process.env.SCREENSHOTS, 'nur mit SCREENSHOTS=1');
  test.setTimeout(240_000);

  for (const vp of VIEWPORTS) {
    test(`Bildschirme (${vp.name})`, async ({ browser }) => {
      mkdirSync(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        deviceScaleFactor: 1,
      });
      await context.addInitScript(() => {
        // Etwas Fortschritt, damit Levelkarte und Shop gefüllt aussehen
        if (!localStorage.getItem('runenschacht.save.v1') && !sessionStorage.getItem('shots-seeded')) {
          sessionStorage.setItem('shots-seeded', '1');
          localStorage.setItem(
            'runenschacht.save.v1',
            JSON.stringify({
              version: 1,
              coins: 170,
              highestUnlockedLevel: 4,
              levelStars: { '1': 3, '2': 2, '3': 1 },
              upgrades: { startSoldiers: 2, fireRate: 1, coinBonus: 0 },
            }),
          );
        }
      });
      const page = await context.newPage();
      const shot = async (name: string): Promise<void> => {
        await page.screenshot({ path: `${dir}/${vp.name}-${name}.png` });
      };

      // 1) Ladebildschirm (Schrift künstlich verzögern)
      await page.route('**/*.woff2', async (route) => {
        await new Promise((r) => setTimeout(r, 2500));
        await route.continue();
      });
      await page.goto('/?debug=1');
      await page.waitForTimeout(700);
      await shot('01-loading');
      await page.unroute('**/*.woff2');

      // 2) Menü
      await page.getByRole('heading', { name: 'RUNENSCHACHT' }).waitFor({ timeout: 30_000 });
      await page.waitForTimeout(1500);
      await shot('02-menu');

      // 3) Levelauswahl
      await page.getByRole('button', { name: 'Level', exact: true }).click();
      await page.waitForTimeout(800);
      await shot('03-levelselect');
      await page.getByRole('button', { name: 'Zurück', exact: true }).click();

      // 4) Shop
      await page.getByRole('button', { name: 'Shop' }).click();
      await page.waitForTimeout(800);
      await shot('04-shop');
      await page.getByRole('button', { name: 'Zurück', exact: true }).click();

      // 5) Einstellungen
      await page.getByRole('button', { name: 'Einstellungen' }).click();
      await page.waitForTimeout(800);
      await shot('05-settings');
      await page.getByRole('button', { name: 'Zurück', exact: true }).click();

      // 6) HUD im Zustand "bereit"
      await page.getByRole('button', { name: /Spielen/ }).click();
      await waitReady(page);
      await page.waitForTimeout(1500);
      await shot('06-hud-ready');

      // 7) HUD mitten im Lauf (Autoplay-Level über Debug-API nicht möglich → manuell ziehen)
      const cx = vp.width / 2;
      const cy = vp.height * 0.8;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx - 100, cy, { steps: 6 });
      await page.waitForTimeout(5000);
      await shot('07-hud-run');
      await page.mouse.up();

      // 8) Bosskampf
      await page.evaluate(() => (window as unknown as { __game: Game }).__game.skipTo(182));
      await page.waitForTimeout(3500);
      await shot('08-boss');

      // 9) Pause
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      await shot('09-pause');
      await page.getByRole('button', { name: 'Weiter' }).click();

      // 10) Sieg
      await page.evaluate(() => (window as unknown as { __game: Game }).__game.win());
      await page.getByText('SIEG!').waitFor({ timeout: 60_000 });
      await page.waitForTimeout(500);
      await shot('10-victory');

      // 11) Niederlage
      await page.evaluate(() => (window as unknown as { __game: Game }).__game.start?.(1));
      await page.waitForTimeout(1500);
      await page.evaluate(() => (window as unknown as { __game: Game }).__game.lose());
      await page.getByText('NIEDERLAGE').waitFor({ timeout: 60_000 });
      await page.waitForTimeout(500);
      await shot('11-defeat');
      await context.close();
    });
  }
});
