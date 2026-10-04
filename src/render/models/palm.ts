import * as THREE from 'three';
import { mergeParts, paint } from './soldier';

const TRUNK = 0x7b5a3a;
const LEAF_A = 0x3f7d32;
const LEAF_B = 0x5a9a3c;

/** Palme (Höhe ≈ 7 m), Fuß bei y = 0, gebogener Stamm und 7 Wedel. */
export function createPalmGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const segments = 8;
  let ox = 0;
  for (let i = 0; i < segments; i++) {
    const h = 0.8;
    const r0 = 0.28 - i * 0.015;
    const seg = new THREE.CylinderGeometry(r0 - 0.015, r0, h, 6);
    seg.translate(ox, i * h + h / 2, 0);
    parts.push(paint(seg, TRUNK));
    ox += 0.06 + i * 0.012;
  }
  const topY = segments * 0.8;
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.PlaneGeometry(0.9, 3.4, 1, 6);
    const pos = frond.getAttribute('position');
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v) + 1.7; // 0..3.4
      const k = y / 3.4;
      // Wedel krümmen sich nach unten und laufen spitz zu
      pos.setZ(v, -k * k * 1.6);
      pos.setX(v, pos.getX(v) * (1 - k * 0.85));
    }
    frond.translate(0, -1.7, 0);
    frond.rotateX(-Math.PI / 2 + 0.5); // nach vorne/oben neigen
    frond.rotateY((i / 7) * Math.PI * 2);
    frond.translate(ox, topY, 0);
    parts.push(paint(frond, i % 2 === 0 ? LEAF_A : LEAF_B));
  }
  const merged = mergeParts(parts);
  return merged;
}
