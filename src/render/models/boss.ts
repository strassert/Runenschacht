import * as THREE from 'three';
import { mergeParts, paint } from './soldier';

const RED = 0xc41f1f;
const DARK = 0x6e0f0f;
const EYE = 0xffde59;
const WOOD = 0x6b4a2b;

/** Gigant (Boss), Höhe ≈ 2 m bei Skalierung 1, Füße bei y = 0, Blick nach −Z. */
export function createBossGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(paint(new THREE.CylinderGeometry(0.2, 0.17, 0.75, 8), DARK).translate(-0.25, 0.375, 0));
  parts.push(paint(new THREE.CylinderGeometry(0.2, 0.17, 0.75, 8), DARK).translate(0.25, 0.375, 0));
  parts.push(
    paint(new THREE.SphereGeometry(0.62, 12, 10), RED)
      .scale(1, 0.95, 0.8)
      .translate(0, 1.15, 0),
  );
  parts.push(paint(new THREE.SphereGeometry(0.3, 10, 8), DARK).translate(-0.62, 1.55, 0));
  parts.push(paint(new THREE.SphereGeometry(0.3, 10, 8), DARK).translate(0.62, 1.55, 0));
  parts.push(paint(new THREE.CapsuleGeometry(0.17, 0.55, 3, 8), RED).translate(-0.74, 1.1, -0.1));
  parts.push(paint(new THREE.CapsuleGeometry(0.17, 0.55, 3, 8), RED).translate(0.74, 1.1, -0.1));
  parts.push(paint(new THREE.SphereGeometry(0.3, 12, 10), RED).translate(0, 1.82, -0.04));
  // Hörner
  parts.push(
    paint(new THREE.ConeGeometry(0.07, 0.3, 6), DARK)
      .rotateZ(0.5)
      .translate(-0.26, 2.05, -0.04),
  );
  parts.push(
    paint(new THREE.ConeGeometry(0.07, 0.3, 6), DARK)
      .rotateZ(-0.5)
      .translate(0.26, 2.05, -0.04),
  );
  // Leuchtende Augen
  parts.push(paint(new THREE.SphereGeometry(0.06, 6, 6), EYE).translate(-0.11, 1.86, -0.3));
  parts.push(paint(new THREE.SphereGeometry(0.06, 6, 6), EYE).translate(0.11, 1.86, -0.3));
  // Keule
  parts.push(paint(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 6), WOOD).translate(0.8, 1.05, -0.35));
  parts.push(paint(new THREE.SphereGeometry(0.2, 8, 6), WOOD).translate(0.8, 1.55, -0.35));
  return mergeParts(parts);
}
