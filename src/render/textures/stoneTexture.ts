import * as THREE from 'three';
import { createCanvas, textureRng, toTexture } from './canvas';

/** Steinplatten-Boden (512×512), kachelbar. */
export function createStoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const { canvas, ctx } = createCanvas(size, size);
  const rnd = textureRng(1234);
  ctx.fillStyle = '#3e3b35';
  ctx.fillRect(0, 0, size, size);

  const rows = 3;
  const rowH = size / rows;
  for (let r = 0; r < rows; r++) {
    const cols = rnd() < 0.5 ? 2 : 3;
    const offset = r % 2 === 0 ? 0 : rowH * 0.35;
    const colW = size / cols;
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const light = 1 + (rnd() - 0.5) * 0.24;
      const base = Math.round(125 * light);
      ctx.fillStyle = `rgb(${base},${Math.round(base * 0.975)},${Math.round(base * 0.9)})`;
      ctx.fillRect(x + 3, r * rowH + 3, colW - 6, rowH - 6);
    }
  }
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.06 * rnd()})`;
    ctx.fillRect(rnd() * size, rnd() * size, 2, 2);
  }
  for (let i = 0; i < 30; i++) {
    const y = Math.round(rnd() * rows) * rowH;
    const x = rnd() * size;
    const g = ctx.createRadialGradient(x, y, 2, x, y, 22 + rnd() * 20);
    g.addColorStop(0, 'rgba(95,122,58,0.35)');
    g.addColorStop(1, 'rgba(95,122,58,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 60, y - 60, 120, 120);
  }
  return toTexture(canvas, [1, 1]);
}
