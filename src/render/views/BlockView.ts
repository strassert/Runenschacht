import * as THREE from 'three';
import { CONFIG } from '../../core/config';
import { easeOutCubic } from '../../core/math';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { BLOCK_LABEL, getLabelTexture } from '../textures/labelTexture';

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.18, 0, 0));
const _scale = new THREE.Vector3();
const _body = new THREE.Matrix4();
const _label = new THREE.Matrix4();
const _labelLocal = new THREE.Matrix4().makeTranslation(0, 0.47, 0.35 + 0.012);
const BEHIND = 10;
const AHEAD = 110;
const COLLECT_TIME = 0.2;

function bodyGeometry(): THREE.BufferGeometry {
  const bevel = 0.06;
  const w = CONFIG.block.width - bevel * 2;
  const h = 0.9 - bevel * 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: CONFIG.block.depth - bevel * 2,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
  });
  g.translate(0, 0, -(CONFIG.block.depth - bevel * 2) / 2); // zentrieren in z
  g.translate(0, 0.45, 0); // Unterkante bei y = 0
  return g;
}

interface Slot {
  body: THREE.InstancedMesh;
  bodyIndex: number;
  label: THREE.InstancedMesh;
  labelIndex: number;
}

/** Bonus-Blöcke als Instanzen (zwei Körperfarben, ein Label-Mesh je Wert). */
export class BlockView {
  readonly root = new THREE.Group();
  private readonly slots: Slot[] = [];
  private readonly collectedAt: Float32Array;
  private readonly meshes: THREE.InstancedMesh[] = [];

  constructor(world: WorldState) {
    const blocks = world.blocks;
    this.collectedAt = new Float32Array(blocks.length).fill(-1);
    const geo = bodyGeometry();
    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x2f6bff,
      emissive: 0x0b2a8a,
      emissiveIntensity: 0.6,
      roughness: 0.5,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf2c230,
      emissive: 0x7a5200,
      emissiveIntensity: 0.5,
      roughness: 0.45,
    });
    const nBlue = blocks.filter((b) => b.color === 'blue').length;
    const nGold = blocks.length - nBlue;
    const blue = new THREE.InstancedMesh(geo, blueMat, Math.max(1, nBlue));
    const gold = new THREE.InstancedMesh(geo, goldMat, Math.max(1, nGold));
    blue.count = nBlue;
    gold.count = nGold;
    this.meshes.push(blue, gold);

    const labelGeo = new THREE.PlaneGeometry(1.5, 0.75);
    const labelMeshes = new Map<number, { mesh: THREE.InstancedMesh; used: number }>();
    const valueCounts = new Map<number, number>();
    for (const b of blocks) valueCounts.set(b.value, (valueCounts.get(b.value) ?? 0) + 1);
    for (const [value, count] of valueCounts) {
      const mat = new THREE.MeshBasicMaterial({
        map: getLabelTexture('+' + value, BLOCK_LABEL),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.InstancedMesh(labelGeo, mat, count);
      mesh.count = count;
      labelMeshes.set(value, { mesh, used: 0 });
      this.meshes.push(mesh);
    }

    let bi = 0;
    let gi = 0;
    for (const b of blocks) {
      const isBlue = b.color === 'blue';
      const lm = labelMeshes.get(b.value)!;
      this.slots.push({
        body: isBlue ? blue : gold,
        bodyIndex: isBlue ? bi++ : gi++,
        label: lm.mesh,
        labelIndex: lm.used++,
      });
    }
    for (const m of this.meshes) {
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.root.add(m);
    }
  }

  sync(world: WorldState): void {
    const sz = world.squad.z;
    const blocks = world.blocks;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const slot = this.slots[i];
      let scale = 1;
      let lift = 0;
      if (b.collected) {
        if (this.collectedAt[i] < 0) this.collectedAt[i] = world.time;
        const t = (world.time - this.collectedAt[i]) / COLLECT_TIME;
        if (t >= 1) scale = 0;
        else {
          scale = 1 - easeOutCubic(t);
          lift = Math.sin(Math.PI * t) * 0.5;
        }
      } else if (b.z < sz - BEHIND || b.z > sz + AHEAD) {
        scale = 0;
      }
      _pos.set(b.x, lift, -b.z);
      _quat.copy(_tilt);
      _scale.set(scale, scale, scale);
      _body.compose(_pos, _quat, _scale);
      slot.body.setMatrixAt(slot.bodyIndex, _body);
      _label.multiplyMatrices(_body, _labelLocal);
      slot.label.setMatrixAt(slot.labelIndex, _label);
    }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    disposeObject(this.root);
    for (const m of this.meshes) m.dispose();
  }
}
