import * as THREE from 'three';

/** Simulation (x, z) → three.js-Position (x, y, -z). Schreibt in out und gibt out zurück. */
export function simToThree(x: number, y: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(x, y, -z);
}
