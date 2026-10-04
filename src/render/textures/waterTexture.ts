import * as THREE from 'three';
import { createCanvas, textureRng, toTexture } from './canvas';

/** Wasserfall (128×512): vertikale Streifen mit Alpha-Verlauf, vertikal kachelbar. */
export function createWaterfallTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 512;
  const { canvas, ctx } = createCanvas(w, h);
  const rnd = textureRng(99);
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * w;
    const sw = 2 + rnd() * 7;
    const y0 = rnd() * h;
    const len = 120 + rnd() * 300;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
    const light = rnd() < 0.5 ? '255,255,255' : '190,225,245';
    g.addColorStop(0, `rgba(${light},0)`);
    g.addColorStop(0.3, `rgba(${light},${0.5 + rnd() * 0.4})`);
    g.addColorStop(1, `rgba(${light},0)`);
    ctx.fillStyle = g;
    // Wrap-around, damit die Textur vertikal nahtlos kachelt
    ctx.fillRect(x, y0, sw, len);
    ctx.fillRect(x, y0 - h, sw, len);
  }
  ctx.fillStyle = 'rgba(200,230,245,0.25)';
  ctx.fillRect(0, 0, w, h);
  return toTexture(canvas, [1, 1]);
}
