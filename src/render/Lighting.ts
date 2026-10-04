import * as THREE from 'three';
import type { WorldState } from '../core/types';

const SUN_OFFSET = new THREE.Vector3(-8, 18, -30);

export class Lighting {
  readonly root = new THREE.Group();
  readonly sunDirection = SUN_OFFSET.clone().normalize();
  private readonly sun: THREE.DirectionalLight;

  constructor(shadows: boolean) {
    const hemi = new THREE.HemisphereLight(0xffe7c2, 0x3d5a35, 0.85);
    this.root.add(hemi);

    this.sun = new THREE.DirectionalLight(0xffd29a, 2.4);
    this.sun.castShadow = shadows;
    if (shadows) {
      const sh = this.sun.shadow;
      sh.mapSize.set(1024, 1024);
      const cam = sh.camera;
      cam.left = -14;
      cam.right = 14;
      cam.top = 14;
      cam.bottom = -14;
      cam.near = 1;
      cam.far = 80;
      sh.bias = -0.0005;
      sh.normalBias = 0.02;
    }
    this.root.add(this.sun);
    this.root.add(this.sun.target);

    const fill = new THREE.DirectionalLight(0x9fc3ff, 0.35);
    fill.position.set(8, 10, 12);
    this.root.add(fill);
  }

  /** Schattenkamera folgt dem Trupp. */
  update(world: WorldState): void {
    const z = -world.squad.z;
    const x = world.squad.x;
    this.sun.target.position.set(x, 0, z);
    this.sun.position.set(x + SUN_OFFSET.x, SUN_OFFSET.y, z + SUN_OFFSET.z);
  }
}
