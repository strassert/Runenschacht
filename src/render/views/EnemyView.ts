import * as THREE from 'three';
import { CONFIG } from '../../core/config';
import type { LevelDef } from '../../core/level/types';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { RED_PALETTE, createSoldierGeometry } from '../models/soldier';

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const TRENCH_DEPTH = 0.25;
const DRAW_DISTANCE = 100;

export class EnemyView {
  readonly root = new THREE.Group();
  private readonly mesh: THREE.InstancedMesh;
  /** Pro Horde: z-Bereich des Grabens (inkl. 3 m Rand). */
  private readonly trenchZ: Float32Array;
  private readonly maxHp: Float32Array;
  private readonly tint = new THREE.Color();

  constructor(level: LevelDef) {
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });
    this.mesh = new THREE.InstancedMesh(
      createSoldierGeometry(RED_PALETTE, 'low'),
      material,
      CONFIG.enemy.maxEnemies,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.setColorAt(0, this.tint.setRGB(1, 1, 1));
    this.root.add(this.mesh);
    const hordes = level.hordes ?? [];
    this.trenchZ = new Float32Array(hordes.length * 2);
    this.maxHp = new Float32Array(hordes.length);
    hordes.forEach((h, i) => {
      this.maxHp[i] = h.hp ?? 1;
      this.trenchZ[i * 2] = h.zStart - 3;
      this.trenchZ[i * 2 + 1] = h.zEnd + 3;
    });
  }

  sync(world: WorldState): void {
    const e = world.enemies;
    const sz = world.squad.z;
    let n = 0;
    for (let i = 0; i < e.count; i++) {
      const z = e.z[i];
      if (z - sz > DRAW_DISTANCE) continue;
      const h = e.horde[i];
      const inTrench = z >= this.trenchZ[h * 2] && z <= this.trenchZ[h * 2 + 1];
      const charging = e.charging[i] === 1;
      const bob = Math.abs(Math.sin(e.animPhase[i])) * (charging ? 0.08 : 0.02);
      _pos.set(e.x[i], (inTrench ? -TRENCH_DEPTH : 0) + bob, -z);
      _euler.set(charging ? 0.12 : 0, Math.PI, charging ? Math.sin(e.animPhase[i]) * 0.08 : 0);
      _quat.setFromEuler(_euler);
      _scale.set(1, 1, 1);
      _mat.compose(_pos, _quat, _scale);
      this.mesh.setMatrixAt(n, _mat);
      const damaged = e.hp[i] < this.maxHp[h];
      this.mesh.setColorAt(n, damaged ? this.tint.setRGB(2.4, 1.8, 1.8) : this.tint.setRGB(1, 1, 1));
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  dispose(): void {
    disposeObject(this.root);
    this.mesh.dispose();
  }
}
