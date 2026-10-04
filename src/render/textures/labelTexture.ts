import * as THREE from 'three';
import { createCanvas, toTexture } from './canvas';

export interface LabelStyle {
  fontPx: number;
  fill: string;
  stroke: string;
  strokePx: number;
  width: number;
  height: number;
}

export const BLOCK_LABEL: LabelStyle = {
  fontPx: 96,
  fill: '#ffffff',
  stroke: '#14213d',
  strokePx: 14,
  width: 256,
  height: 128,
};
export const CARD_LABEL: LabelStyle = {
  fontPx: 120,
  fill: '#ffffff',
  stroke: '#1b1b1b',
  strokePx: 16,
  width: 384,
  height: 160,
};
export const COUNT_LABEL: LabelStyle = {
  fontPx: 88,
  fill: '#ffffff',
  stroke: '#0b2a6b',
  strokePx: 14,
  width: 256,
  height: 128,
};
export const FONT_FAMILY = '"Lilita One", "Arial Black", Impact, sans-serif';

const cache = new Map<string, THREE.CanvasTexture>();

function draw(canvas: HTMLCanvasElement, text: string, style: LabelStyle): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let px = style.fontPx;
  ctx.font = `${px}px ${FONT_FAMILY}`;
  const maxW = style.width - 16;
  const measured = ctx.measureText(text).width;
  if (measured > maxW) {
    px = Math.floor((px * maxW) / measured);
    ctx.font = `${px}px ${FONT_FAMILY}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = style.strokePx;
  ctx.strokeStyle = style.stroke;
  ctx.strokeText(text, style.width / 2, style.height / 2 + px * 0.04);
  ctx.fillStyle = style.fill;
  ctx.fillText(text, style.width / 2, style.height / 2 + px * 0.04);
}

/** Zeichnet Text mittig mit Kontur; Texturen werden pro (Stil, Text) gecacht. */
export function getLabelTexture(text: string, style: LabelStyle): THREE.CanvasTexture {
  const key = `${style.width}x${style.height}|${style.fill}|${style.stroke}|${style.fontPx}|${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { canvas } = createCanvas(style.width, style.height);
  draw(canvas, text, style);
  const tex = toTexture(canvas);
  cache.set(key, tex);
  return tex;
}

/** Eigene (nicht gecachte) Textur für sich ändernde Zähler. */
export function createLiveLabel(text: string, style: LabelStyle): THREE.CanvasTexture {
  const { canvas } = createCanvas(style.width, style.height);
  draw(canvas, text, style);
  return toTexture(canvas);
}

/** Zeichnet in eine bestehende Textur neu (für sich ändernde Zähler, ohne neue Textur). */
export function redrawLabel(texture: THREE.CanvasTexture, text: string, style: LabelStyle): void {
  draw(texture.image as HTMLCanvasElement, text, style);
  texture.needsUpdate = true;
}

export function disposeLabelCache(): void {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
