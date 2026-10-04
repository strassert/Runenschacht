import * as THREE from 'three';
import { paint } from './soldier';
import { textureRng } from '../textures/canvas';

/** Unregelmäßiger Felsen (Einheitsgröße), flat shading. */
export function createRockGeometry(seed: number): THREE.BufferGeometry {
  const rnd = textureRng(seed);
  const geo = new THREE.DodecahedronGeometry(1, 1);
  const pos = geo.getAttribute('position');
  const jitter = new Map<string, THREE.Vector3>();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let d = jitter.get(key);
    if (!d) {
      d = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.36);
      jitter.set(key, d);
    }
    pos.setXYZ(i, v.x * (1 + d.x), v.y * (1 + d.y), v.z * (1 + d.z));
  }
  geo.computeVertexNormals();
  return paint(geo, 0x6f6a5f);
}
