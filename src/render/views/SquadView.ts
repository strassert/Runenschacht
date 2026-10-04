import * as THREE from 'three';
import { CONFIG } from '../../core/config';
import { UNIT_SLOT_X, UNIT_SLOT_Z } from '../../core/formation';
import { damp } from '../../core/math';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { BLUE_PALETTE, createSoldierGeometry } from '../models/soldier';

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3(1, 1, 1);
const _mat = new THREE.Matrix4();

export class SquadView {
  readonly root = new THREE.Group();
  private readonly mesh: THREE.InstancedMesh;
  private readonly px: Float32Array;
  private readonly pz: Float32Array;
  private shown = 0;

  constructor(shadows: boolean, maxRendered: number = CONFIG.squad.maxRenderedSoldiers) {
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    this.mesh = new THREE.InstancedMesh(createSoldierGeometry(BLUE_PALETTE), material, maxRendered);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = shadows;
    this.mesh.count = 0;
    this.px = new Float32Array(maxRendered);
    this.pz = new Float32Array(maxRendered);
    this.root.add(this.mesh);
  }

  sync(world: WorldState, frameDt: number): void {
    const s = world.squad;
    const n = Math.min(s.count, this.mesh.instanceMatrix.count);
    // Neu hinzugekommene Soldaten starten an der Truppmitte.
    for (let i = this.shown; i < n; i++) {
      this.px[i] = s.x;
      this.pz[i] = s.z;
    }
    this.shown = n;

    const running = world.phase === 'running';
    const t = world.time;
    for (let i = 0; i < n; i++) {
      const tx = s.x + UNIT_SLOT_X[i] * s.slotSpacing;
      const tz = s.z + UNIT_SLOT_Z[i] * s.slotSpacing;
      this.px[i] = damp(this.px[i], tx, 10, frameDt);
      this.pz[i] = damp(this.pz[i], tz, 10, frameDt);
      const bob = running ? Math.abs(Math.sin(t * 12 + i * 1.7)) * 0.07 : 0;
      const tilt = running ? 0.12 : 0;
      const sway = running ? Math.sin(t * 12 + i) * 0.06 : 0;
      _pos.set(this.px[i], bob, -this.pz[i]);
      _euler.set(tilt, 0, sway);
      _quat.setFromEuler(_euler);
      _mat.compose(_pos, _quat, _scale);
      this.mesh.setMatrixAt(i, _mat);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    disposeObject(this.root);
    this.mesh.dispose();
  }
}
