import { test, expect, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Fehlendes Favicon o. Ä. ist kein Spielfehler
    if (text.includes('Failed to load resource')) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

test('Menü lädt', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RUNENSCHACHT' })).toBeVisible();
  await expect(page.locator('canvas#game-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: /Spielen/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Level 1 per Autoplay gewinnen', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/?level=1&autoplay=1&speed=8&debug=1');
  await expect(page.getByText('SIEG!')).toBeVisible({ timeout: 85_000 });
  await page.screenshot({ path: 'test-results/victory.png' });
  expect(errors).toEqual([]);
});

test('Steuerung bewegt den Trupp', async ({ page }) => {
  await page.goto('/?level=1&debug=1');
  await page.waitForFunction(() => (window as unknown as { __game?: unknown }).__game !== undefined);
  const box = await page.locator('canvas#game-canvas').boundingBox();
  if (!box) throw new Error('Canvas nicht gefunden');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height * 0.8;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx - 150, cy, { steps: 10 });
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() =>
    (window as unknown as { __game: { getState(): { x: number; z: number } } }).__game.getState(),
  );
  await page.mouse.up();
  expect(state.z).toBeGreaterThan(0);
  expect(state.x).toBeLessThan(-0.5);
});
