import * as THREE from 'three';
import { easeOutCubic } from '../../core/math';
import type { Card, WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { createCanvas, toTexture } from '../textures/canvas';
import { drawCardFace } from '../textures/cardIcons';

const BEHIND = 10;
const AHEAD = 130;
const TILT = -0.12;
const REDRAW_INTERVAL = 0.05;
const PULSE_TIME = 0.08;
const FLY_TIME = 0.5;
const SMASH_TIME = 0.4;
const HIDE_AFTER_SMASH = 0.9;
const HEIGHT = 2.2;
/** Karten stehen im Gegenlicht → eigene Leuchtkraft, damit sie weiß wirken. */
const BASE_GLOW = 0.6;

interface CardNode {
  group: THREE.Group;
  body: THREE.Mesh;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  frontMat: THREE.MeshStandardMaterial;
  shown: number;
  lastDraw: number;
  pulseUntil: number;
  endedAt: number;
}

export class CardView {
  readonly root = new THREE.Group();
  private readonly nodes: CardNode[] = [];

  constructor(cards: readonly Card[]) {
    const side = new THREE.MeshStandardMaterial({ color: 0xe8ebf0, roughness: 0.6 });
    for (const card of cards) {
      const { canvas, ctx } = createCanvas(512, 384);
      const texture = toTexture(canvas);
      const shown = Math.ceil(card.hp);
      drawCardFace(ctx, card.kind, String(shown), 512, 384, card.reward);
      texture.needsUpdate = true;
      const frontMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.55,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity: BASE_GLOW,
        transparent: true,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(card.width, HEIGHT, 0.25), [
        side,
        side,
        side,
        side,
        frontMat,
        side,
      ]);
      body.position.y = HEIGHT / 2 + 0.1;
      body.castShadow = true;
      const group = new THREE.Group();
      group.add(body);
      group.position.set(card.x, 0, -card.z);
      group.rotation.x = TILT;
      this.root.add(group);
      this.nodes.push({
        group,
        body,
        ctx,
        texture,
        frontMat,
        shown,
        lastDraw: -1,
        pulseUntil: -1,
        endedAt: -1,
      });
    }
  }

  sync(world: WorldState): void {
    const sz = world.squad.z;
    const t = world.time;
    for (let i = 0; i < world.cards.length; i++) {
      const c = world.cards[i];
      const n = this.nodes[i];
      if (c.state === 'locked') {
        n.group.visible = c.z >= sz - BEHIND && c.z <= sz + AHEAD;
        if (!n.group.visible) continue;
        const hp = Math.max(0, Math.ceil(c.hp));
        if (hp !== n.shown) {
          n.pulseUntil = t + PULSE_TIME;
          if (t - n.lastDraw >= REDRAW_INTERVAL) {
            n.shown = hp;
            n.lastDraw = t;
            drawCardFace(n.ctx, c.kind, String(hp), 512, 384, c.reward);
            n.texture.needsUpdate = true;
          }
        }
        const pulsing = t < n.pulseUntil;
        const s = pulsing ? 1.04 : 1;
        n.group.scale.set(s, s, s);
        n.frontMat.emissiveIntensity = pulsing ? BASE_GLOW + 0.4 : BASE_GLOW;
        continue;
      }
      if (n.endedAt < 0) n.endedAt = t;
      const dt = t - n.endedAt;
      if (c.state === 'unlocked') {
        if (dt >= FLY_TIME) {
          n.group.visible = false;
          continue;
        }
        const k = easeOutCubic(dt / FLY_TIME);
        const s = world.squad;
        n.group.position.set(c.x + (s.x - c.x) * k, 1.2 * k, -(c.z + (s.z - c.z) * k));
        const sc = 1 - 0.7 * k;
        n.group.scale.set(sc, sc, sc);
        n.group.rotation.y = k * Math.PI * 2;
        n.frontMat.emissiveIntensity = BASE_GLOW + 0.5 * (1 - k);
        n.group.rotation.x = TILT;
      } else {
        // smashed
        if (dt >= HIDE_AFTER_SMASH) {
          n.group.visible = false;
          continue;
        }
        const k = Math.min(1, dt / SMASH_TIME);
        n.group.rotation.x = TILT - 1.3 * easeOutCubic(k);
        n.group.position.y = -0.3 * k;
      }
    }
  }

  dispose(): void {
    disposeObject(this.root);
    for (const n of this.nodes) n.texture.dispose();
  }
}
