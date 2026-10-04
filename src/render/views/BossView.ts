import * as THREE from 'three';
import { easeOutCubic } from '../../core/math';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { createBossGeometry } from '../models/boss';
import { HpBar } from './HpBar';

export class BossView {
  readonly root = new THREE.Group();
  private readonly model: THREE.Mesh;
  private readonly bar = new HpBar(3.5, 0.26);
  private deadAt = -1;

  constructor(shadows: boolean) {
    this.model = new THREE.Mesh(
      createBossGeometry(),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
    );
    this.model.castShadow = shadows;
    this.model.rotation.y = Math.PI; // Modell blickt nach −Z, der Boss soll zur Kamera (+Z) schauen
    this.root.add(this.model);
    this.root.add(this.bar.root);
  }

  sync(world: WorldState): void {
    const b = world.boss;
    const t = world.time;
    this.root.position.set(b.x, 0, -b.z);
    this.root.scale.setScalar(b.scale);
    this.bar.root.position.set(0, 2.4, 0);
    this.bar.root.scale.setScalar(1 / b.scale);
    this.model.position.y = 0;
    this.model.rotation.x = 0;
    this.model.scale.set(1, 1, 1);

    switch (b.state) {
      case 'dormant':
        this.model.scale.y = 1 + Math.sin(t * 2) * 0.02;
        break;
      case 'walking':
        this.model.position.y = Math.abs(Math.sin(t * 5)) * 0.15;
        this.model.rotation.z = Math.sin(t * 5) * 0.05;
        break;
      case 'attacking':
        this.model.rotation.x = -0.12 * Math.abs(Math.sin(t * Math.PI * 2 * 2));
        break;
      case 'dead': {
        if (this.deadAt < 0) this.deadAt = t;
        const k = Math.min(1, (t - this.deadAt) / 1);
        this.model.rotation.x = easeOutCubic(k) * 1.5;
        this.model.position.y = -0.8 * k;
        break;
      }
    }
    this.bar.root.visible = b.state !== 'dead' && b.state !== 'dormant';
    this.bar.set(b.hp / b.maxHp);
  }

  dispose(): void {
    disposeObject(this.root);
    this.bar.dispose();
  }
}
