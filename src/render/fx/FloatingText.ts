import * as THREE from 'three';
import { easeOutBack, easeOutCubic } from '../../core/math';
import { disposeObject } from '../dispose';
import { BLOCK_LABEL, createLiveLabel, redrawLabel, type LabelStyle } from '../textures/labelTexture';

const POOL = 24;
const LIFE = 0.9;
const RISE = 1.2;
const FADE = 0.3;

interface Slot {
  sprite: THREE.Sprite;
  texture: THREE.CanvasTexture;
  mat: THREE.SpriteMaterial;
  age: number;
  active: boolean;
  baseScale: number;
  baseY: number;
}

/** Schwebende Kampf-Zahlen (gepoolte Sprites). */
export class FloatingText {
  readonly root = new THREE.Group();
  private readonly slots: Slot[] = [];
  private next = 0;

  constructor() {
    for (let i = 0; i < POOL; i++) {
      const texture = createLiveLabel('', BLOCK_LABEL);
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.root.add(sprite);
      this.slots.push({ sprite, texture, mat, age: 0, active: false, baseScale: 1, baseY: 0 });
    }
  }

  /** Startet einen Text bei (x, y, z) [Sim-x/z, three-y]. Gibt den Slot-Index zurück. */
  spawn(text: string, x: number, y: number, z: number, color: string, scale = 1): number {
    // Freien oder ältesten Slot nehmen
    let idx = -1;
    for (let k = 0; k < POOL; k++) {
      const j = (this.next + k) % POOL;
      if (!this.slots[j].active) {
        idx = j;
        break;
      }
    }
    if (idx < 0) idx = this.next;
    this.next = (idx + 1) % POOL;
    const s = this.slots[idx];
    const style: LabelStyle = { ...BLOCK_LABEL, fill: color };
    redrawLabel(s.texture, text, style);
    s.active = true;
    s.age = 0;
    s.baseScale = scale;
    s.baseY = y;
    s.sprite.position.set(x, y, -z);
    s.sprite.visible = true;
    s.mat.opacity = 1;
    return idx;
  }

  /** Ändert Text eines laufenden Slots (für zusammengefasste Kombos) und setzt die Alterung zurück. */
  retext(idx: number, text: string, color: string): boolean {
    const s = this.slots[idx];
    if (!s?.active) return false;
    redrawLabel(s.texture, text, { ...BLOCK_LABEL, fill: color });
    s.age = Math.min(s.age, 0.3);
    return true;
  }

  update(frameDt: number): void {
    for (const s of this.slots) {
      if (!s.active) continue;
      s.age += frameDt;
      const t = s.age / LIFE;
      if (t >= 1) {
        s.active = false;
        s.sprite.visible = false;
        continue;
      }
      s.sprite.position.y = s.baseY + RISE * easeOutCubic(t);
      const pop = 0.6 + 0.4 * easeOutBack(Math.min(1, s.age / 0.25));
      const k = s.baseScale * pop;
      s.sprite.scale.set(1.5 * k, 0.75 * k, 1);
      const left = LIFE - s.age;
      s.mat.opacity = left < FADE ? left / FADE : 1;
    }
  }

  dispose(): void {
    disposeObject(this.root);
    for (const s of this.slots) s.texture.dispose();
  }
}
