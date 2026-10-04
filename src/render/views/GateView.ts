import * as THREE from 'three';
import type { Gate, GateOp, WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { BLOCK_LABEL, getLabelTexture } from '../textures/labelTexture';

const BEHIND = 12;
const AHEAD = 160;
const FLASH_TIME = 0.3;
const POSITIVE = 0x27c4ff;
const NEGATIVE = 0xff3b3b;
const _tint = new THREE.Color();

export function gateLabel(op: GateOp, value: number): string {
  switch (op) {
    case 'add':
      return `+${value}`;
    case 'sub':
      return `−${value}`;
    case 'mul':
      return `×${value}`;
    case 'div':
      return `÷${value}`;
  }
}

interface OptionView {
  fill: THREE.Mesh;
  fillMat: THREE.MeshBasicMaterial;
  positive: boolean;
}

interface GateGroup {
  group: THREE.Group;
  options: OptionView[];
  passedAt: number;
}

export class GateView {
  readonly root = new THREE.Group();
  private readonly groups: GateGroup[] = [];
  private readonly shared: THREE.BufferGeometry[] = [];

  constructor(gates: readonly Gate[]) {
    const post = new THREE.BoxGeometry(0.2, 2.6, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xdfe6f0, roughness: 0.4, metalness: 0.2 });
    this.shared.push(post);
    const unitPlane = new THREE.PlaneGeometry(1, 1);
    this.shared.push(unitPlane);
    for (const gate of gates) {
      const group = new THREE.Group();
      group.position.set(0, 0, -gate.z);
      const options: OptionView[] = [];
      for (const o of gate.options) {
        const positive = o.op === 'add' || o.op === 'mul';
        const width = o.xMax - o.xMin;
        const cx = (o.xMin + o.xMax) / 2;
        const fillMat = new THREE.MeshBasicMaterial({
          color: positive ? POSITIVE : NEGATIVE,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        });
        const fill = new THREE.Mesh(unitPlane, fillMat);
        fill.scale.set(width - 0.3, 2.2, 1);
        fill.position.set(cx, 1.3, 0);
        group.add(fill);

        const left = new THREE.Mesh(post, frameMat);
        left.position.set(o.xMin + 0.1, 1.3, 0);
        const right = new THREE.Mesh(post, frameMat);
        right.position.set(o.xMax - 0.1, 1.3, 0);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 0.2), frameMat);
        bar.position.set(cx, 2.55, 0);
        group.add(left, right, bar);

        const labelMat = new THREE.MeshBasicMaterial({
          map: getLabelTexture(gateLabel(o.op, o.value), BLOCK_LABEL),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        });
        const label = new THREE.Mesh(unitPlane, labelMat);
        const lw = Math.min(2.6, width * 0.7);
        label.scale.set(lw, lw / 2, 1);
        label.position.set(cx, 1.3, 0.02);
        group.add(label);
        options.push({ fill, fillMat, positive });
      }
      this.root.add(group);
      this.groups.push({ group, options, passedAt: -1 });
    }
  }

  sync(world: WorldState): void {
    const sz = world.squad.z;
    for (let i = 0; i < world.gates.length; i++) {
      const g = world.gates[i];
      const gg = this.groups[i];
      gg.group.visible = g.z >= sz - BEHIND && g.z <= sz + AHEAD;
      if (!gg.group.visible) continue;
      if (g.passed && gg.passedAt < 0) gg.passedAt = world.time;
      const t = gg.passedAt < 0 ? -1 : Math.min(1, (world.time - gg.passedAt) / FLASH_TIME);
      gg.options.forEach((ov, k) => {
        if (t < 0) {
          ov.fillMat.opacity = 0.35;
        } else if (k === g.chosenOption) {
          ov.fillMat.opacity = 0.8 - 0.45 * t;
          ov.fillMat.color.setHex(0xffffff).lerp(_tint.setHex(ov.positive ? POSITIVE : NEGATIVE), t);
        } else {
          ov.fillMat.opacity = 0.35 * (1 - t) + 0.08 * t;
        }
      });
    }
  }

  dispose(): void {
    disposeObject(this.root);
    this.shared.forEach((g) => g.dispose());
  }
}
