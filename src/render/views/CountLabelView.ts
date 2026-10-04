import * as THREE from 'three';
import type { WorldState } from '../../core/types';
import { createCanvas, roundedRect, toTexture } from '../textures/canvas';
import { COUNT_LABEL, FONT_FAMILY } from '../textures/labelTexture';

type Theme = 'normal' | 'gain' | 'loss';
const PLATE: Record<Theme, string> = { normal: '#2f6bff', gain: '#2ec27e', loss: '#e5383b' };

function draw(ctx: CanvasRenderingContext2D, text: string, theme: Theme): void {
  const w = COUNT_LABEL.width;
  const h = COUNT_LABEL.height;
  ctx.clearRect(0, 0, w, h);
  roundedRect(ctx, 10, 14, w - 20, h - 28, 36);
  ctx.fillStyle = PLATE[theme];
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  let px = COUNT_LABEL.fontPx;
  ctx.font = `${px}px ${FONT_FAMILY}`;
  const m = ctx.measureText(text).width;
  if (m > w - 60) {
    px = Math.floor((px * (w - 60)) / m);
    ctx.font = `${px}px ${FONT_FAMILY}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 10;
  ctx.strokeStyle = COUNT_LABEL.stroke;
  ctx.strokeText(text, w / 2, h / 2 + 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, h / 2 + 4);
}

/** Zahl der Soldaten als Plakette über dem Trupp. */
export class CountLabelView {
  readonly root = new THREE.Group();
  private readonly sprite: THREE.Sprite;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private shown = -1;
  private theme: Theme = 'normal';
  private themeTimer = 0;
  private lastCount = -1;
  private drawnTheme: Theme = 'normal';
  /** Bei reduzierter Bewegung kein Wackeln. */
  reducedMotion = false;
  private shakeT = 0;
  /** Zusätzlicher Skalierungs-Puls (0..1), wird von außen angestoßen. */
  pulse = 0;

  constructor() {
    const { canvas, ctx } = createCanvas(COUNT_LABEL.width, COUNT_LABEL.height);
    this.ctx = ctx;
    this.texture = toTexture(canvas);
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.sprite.scale.set(1.6, 0.8, 1);
    this.root.add(this.sprite);
  }

  sync(world: WorldState, frameDt: number): void {
    const s = world.squad;
    this.sprite.visible = s.count > 0;
    if (this.lastCount >= 0 && s.count !== this.lastCount) {
      this.theme = s.count > this.lastCount ? 'gain' : 'loss';
      this.themeTimer = 0.3;
    }
    this.lastCount = s.count;
    if (this.themeTimer > 0) {
      this.themeTimer -= frameDt;
      if (this.themeTimer <= 0) this.theme = 'normal';
    }
    if (s.count !== this.shown || this.theme !== this.drawnTheme) {
      this.shown = s.count;
      this.drawnTheme = this.theme;
      draw(this.ctx, String(s.count), this.theme);
      this.texture.needsUpdate = true;
    }
    this.pulse = Math.max(0, this.pulse - frameDt * 4);
    const k = 1 + this.pulse * 0.35;
    this.sprite.scale.set(1.6 * k, 0.8 * k, 1);
    let shake = 0;
    if (this.theme === 'loss' && !this.reducedMotion) {
      this.shakeT += frameDt;
      shake = Math.sin(this.shakeT * 70) * 0.1 * (this.themeTimer / 0.3);
    }
    this.sprite.position.set(s.x + shake, 1.6 + s.radius * 0.15, -(s.z + s.radius * 0.3));
  }

  dispose(): void {
    this.texture.dispose();
    (this.sprite.material as THREE.SpriteMaterial).dispose();
  }
}
