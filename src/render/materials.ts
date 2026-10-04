import * as THREE from 'three';
import { createStoneTexture } from './textures/stoneTexture';
import { createWoodTexture } from './textures/woodTexture';

/** Materialfabriken. Jede Ansicht besitzt und entsorgt ihre Instanzen selbst (kein globaler Zustand). */
export function makeStoneMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map: createStoneTexture(), roughness: 0.92, metalness: 0 });
}

export function makeWoodMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.85, metalness: 0 });
}

export function makeRailMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.95, metalness: 0 });
}

export function makeMossMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x5d7d3b, roughness: 1, metalness: 0 });
}

export function makeTrenchMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x4b463e, roughness: 1, metalness: 0 });
}
