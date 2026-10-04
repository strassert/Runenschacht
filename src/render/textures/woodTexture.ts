import * as THREE from 'three';
import { createCanvas, textureRng, toTexture } from './canvas';

/** Holzplanken (512×256), kachelbar. */
export function createWoodTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const { canvas, ctx } = createCanvas(w, h);
  const rnd = textureRng(777);
  ctx.fillStyle = '#2a1c10';
  ctx.fillRect(0, 0, w, h);
  const planks = 4;
  const ph = h / planks;
  for (let p = 0; p < planks; p++) {
    const tone = 1 + (rnd() - 0.5) * 0.2;
    ctx.fillStyle = `rgb(${Math.round(122 * tone)},${Math.round(85 * tone)},${Math.round(54 * tone)})`;
    ctx.fillRect(0, p * ph + 2, w, ph - 4);
    for (let l = 0; l < 7; l++) {
      const y = p * ph + 6 + rnd() * (ph - 12);
      ctx.strokeStyle = `rgba(40,25,12,${0.15 * (0.5 + rnd())})`;
      ctx.lineWidth = 1 + rnd() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.03 + l + p) * 2.5);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,30,30,0.7)';
    for (const nx of [24, w - 24]) {
      ctx.beginPath();
      ctx.arc(nx, p * ph + ph / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(canvas, [1, 1]);
}
