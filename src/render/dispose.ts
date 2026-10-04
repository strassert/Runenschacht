import * as THREE from 'three';

const TEXTURE_KEYS = ['map', 'alphaMap', 'emissiveMap', 'normalMap', 'roughnessMap'] as const;

function disposeMaterial(m: THREE.Material): void {
  const rec = m as unknown as Record<string, unknown>;
  for (const k of TEXTURE_KEYS) {
    const t = rec[k];
    if (t instanceof THREE.Texture) t.dispose();
  }
  m.dispose();
}

/** Gibt Geometrien, Materialien und deren Texturen aller Meshes unter root frei. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const anyObj = o as THREE.Mesh;
    if (anyObj.geometry) anyObj.geometry.dispose();
    const mat = anyObj.material;
    if (Array.isArray(mat)) mat.forEach(disposeMaterial);
    else if (mat) disposeMaterial(mat);
  });
}
