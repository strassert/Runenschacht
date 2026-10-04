import * as THREE from 'three';
import { mergeParts, paint } from './soldier';

const BLUE = 0x3a74ff;
const DARK = 0x2a4fc4;
const SKIN = 0xf1c27d;
const BELT = 0xd9a628;
const GUN = 0x3a3a3a;

/** Muskelprotz (Held), Höhe ≈ 2 m, Füße bei y = 0, Blick/Waffe nach −Z. */
export function createBruteGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(paint(new THREE.CylinderGeometry(0.2, 0.18, 0.8, 8), DARK).translate(-0.27, 0.4, 0));
  parts.push(paint(new THREE.CylinderGeometry(0.2, 0.18, 0.8, 8), DARK).translate(0.27, 0.4, 0));
  parts.push(paint(new THREE.BoxGeometry(1.0, 0.8, 0.6), BLUE).translate(0, 1.2, 0));
  parts.push(paint(new THREE.SphereGeometry(0.3, 10, 8), BLUE).translate(-0.58, 1.5, 0));
  parts.push(paint(new THREE.SphereGeometry(0.3, 10, 8), BLUE).translate(0.58, 1.5, 0));
  parts.push(paint(new THREE.CapsuleGeometry(0.17, 0.5, 3, 8), SKIN).translate(-0.72, 1.05, -0.05));
  parts.push(paint(new THREE.CapsuleGeometry(0.17, 0.5, 3, 8), SKIN).translate(0.72, 1.05, -0.05));
  parts.push(paint(new THREE.SphereGeometry(0.22, 10, 8), SKIN).translate(0, 1.88, 0));
  parts.push(
    paint(new THREE.SphereGeometry(0.235, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), DARK).translate(0, 1.92, 0),
  );
  // Patronengurt (diagonale gelbe Kästchen auf der Brust)
  for (let i = 0; i < 6; i++) {
    parts.push(
      paint(new THREE.BoxGeometry(0.13, 0.12, 0.05), BELT).translate(-0.4 + i * 0.16, 1.5 - i * 0.12, -0.32),
    );
  }
  // Minigun: Gehäuse + 6 Läufe
  parts.push(paint(new THREE.BoxGeometry(0.22, 0.22, 0.5), GUN).translate(0.62, 1.1, -0.45));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const barrel = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 5).rotateX(Math.PI / 2);
    barrel.translate(0.62 + Math.cos(a) * 0.07, 1.1 + Math.sin(a) * 0.07, -0.95);
    parts.push(paint(barrel, GUN));
  }
  return mergeParts(parts);
}
