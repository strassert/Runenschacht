import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface SoldierPalette {
  body: number;
  dark: number;
  skin: number;
  gun: number;
}

export const BLUE_PALETTE: SoldierPalette = { body: 0x3f7bff, dark: 0x2a4fc4, skin: 0x3f7bff, gun: 0x1a1a1a };
export const RED_PALETTE: SoldierPalette = { body: 0xd8262b, dark: 0x8f1418, skin: 0xd8262b, gun: 0x2a2a2a };

/** Setzt ein einheitliches Vertex-Farbattribut. */
export function paint(geo: THREE.BufferGeometry, color: number): THREE.BufferGeometry {
  const c = new THREE.Color(color);
  const n = geo.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/** Fügt gefärbte Teile zusammen und gibt die Geometrie frei. */
export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Optische Vergrößerung gegenüber den Simulationsmaßen (Soldaten wirken kompakter/größer wie im Referenzbild). */
const MODEL_SCALE = 1.45;

/** Low-Poly-Soldat (~250 Dreiecke), Höhe ≈ 0.75 m, Füße bei y = 0, Blick nach −Z (three). */
export function createSoldierGeometry(
  p: SoldierPalette,
  detail: 'normal' | 'low' = 'normal',
): THREE.BufferGeometry {
  const low = detail === 'low';
  const torso = paint(new THREE.CapsuleGeometry(0.14, 0.22, low ? 1 : 3, low ? 6 : 8), p.body).translate(
    0,
    0.42,
    0,
  );
  const head = paint(new THREE.SphereGeometry(0.11, low ? 6 : 10, low ? 5 : 8), p.skin).translate(0, 0.68, 0);
  const helmet = paint(
    new THREE.SphereGeometry(0.12, low ? 6 : 10, low ? 3 : 6, 0, Math.PI * 2, 0, Math.PI / 2),
    p.dark,
  ).translate(0, 0.7, 0);
  const legL = paint(new THREE.CylinderGeometry(0.05, 0.05, 0.28, low ? 4 : 6), p.dark).translate(
    -0.07,
    0.14,
    0,
  );
  const legR = paint(new THREE.CylinderGeometry(0.05, 0.05, 0.28, low ? 4 : 6), p.dark).translate(
    0.07,
    0.14,
    0,
  );
  const gun = paint(new THREE.BoxGeometry(0.05, 0.06, 0.38), p.gun).translate(0.1, 0.45, -0.18);
  const pack = paint(new THREE.BoxGeometry(0.18, 0.2, 0.1), p.dark).translate(0, 0.45, 0.12);
  const merged = mergeParts([torso, head, helmet, legL, legR, gun, pack]);
  merged.scale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
  return merged;
}
