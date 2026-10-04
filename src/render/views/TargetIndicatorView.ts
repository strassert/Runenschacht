import * as THREE from 'three';
import { damp } from '../../core/math';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';

/** Dezenter Pfeil am Boden, der zeigt, wohin der Trupp gleitet (nur sichtbar, solange gesteuert wird). */
export class TargetIndicatorView {
  readonly root = new THREE.Group();
  private readonly mat: THREE.MeshBasicMaterial;
  private readonly arrow: THREE.Mesh;
  private readonly line: THREE.Mesh;
  private opacity = 0;

  constructor() {
    this.mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    const tri = new THREE.Shape();
    tri.moveTo(0, 0.45);
    tri.lineTo(0.4, -0.3);
    tri.lineTo(0, -0.1);
    tri.lineTo(-0.4, -0.3);
    tri.closePath();
    this.arrow = new THREE.Mesh(new THREE.ShapeGeometry(tri), this.mat);
    this.arrow.rotation.x = -Math.PI / 2;
    this.line = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.12), this.mat);
    this.line.rotation.x = -Math.PI / 2;
    this.root.add(this.arrow, this.line);
    this.root.visible = false;
  }

  sync(world: WorldState, active: boolean, frameDt: number): void {
    this.opacity = damp(this.opacity, active ? 0.45 : 0, 18, frameDt);
    this.root.visible = this.opacity > 0.01;
    if (!this.root.visible) return;
    this.mat.opacity = this.opacity;
    const s = world.squad;
    const z = -(s.z + s.radius + 1.2);
    this.arrow.position.set(s.targetX, 0.08, z);
    const len = Math.abs(s.targetX - s.x);
    this.line.position.set((s.targetX + s.x) / 2, 0.07, z);
    this.line.scale.set(Math.max(0.01, len), 1, 1);
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
