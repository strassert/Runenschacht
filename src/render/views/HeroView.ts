import * as THREE from 'three';
import { easeOutCubic } from '../../core/math';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { createBruteGeometry } from '../models/brute';
import { HpBar } from './HpBar';

const DEATH_TIME = 0.5;

export class HeroView {
  readonly root = new THREE.Group();
  private readonly model: THREE.Mesh;
  private readonly bar = new HpBar(1.2, 0.14);
  private wasActive = false;
  private diedAt = -1;

  constructor(shadows: boolean) {
    this.model = new THREE.Mesh(
      createBruteGeometry(),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
    );
    this.model.castShadow = shadows;
    this.model.rotation.y = 0;
    this.root.add(this.model);
    this.bar.root.position.set(0, 2.6, 0);
    this.root.add(this.bar.root);
    this.root.visible = false;
  }

  sync(world: WorldState): void {
    const h = world.hero;
    const t = world.time;
    if (h.active) {
      this.wasActive = true;
      this.diedAt = -1;
      this.root.visible = true;
      this.root.position.set(h.x, 0, -h.z);
      const running = world.phase === 'running';
      this.model.position.y = running ? Math.abs(Math.sin(t * 9)) * 0.1 : 0;
      this.model.rotation.x = running ? 0.06 : 0;
      this.model.rotation.z = 0;
      this.bar.root.visible = h.hp < h.maxHp;
      this.bar.set(h.hp / h.maxHp);
      return;
    }
    if (this.wasActive && this.diedAt < 0) this.diedAt = t;
    if (this.diedAt >= 0) {
      const k = Math.min(1, (t - this.diedAt) / DEATH_TIME);
      this.model.rotation.x = -easeOutCubic(k) * 1.4;
      this.bar.root.visible = false;
      if (k >= 1) {
        this.root.visible = false;
        this.wasActive = false;
        this.diedAt = -1;
        this.model.rotation.x = 0;
      }
    }
  }

  dispose(): void {
    disposeObject(this.root);
    this.bar.dispose();
  }
}
