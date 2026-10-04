import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LevelDef } from '../../core/level/types';
import { disposeObject } from '../dispose';
import {
  makeMossMaterial,
  makeRailMaterial,
  makeStoneMaterial,
  makeTrenchMaterial,
  makeWoodMaterial,
} from '../materials';

/** Box-Geometrie in Sim-Koordinaten (x, y, z-Sim) mit planarer Welt-UV-Projektion (Kachelgröße in Metern). */
function box(
  cx: number,
  cy: number,
  zMin: number,
  zMax: number,
  w: number,
  h: number,
  tile: number,
): THREE.BufferGeometry {
  const d = zMax - zMin;
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(cx, cy, -(zMin + zMax) / 2);
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(nor.getX(i));
    const ay = Math.abs(nor.getY(i));
    if (ay >= ax && ay >= Math.abs(nor.getZ(i))) uv.setXY(i, x / tile, z / tile);
    else if (ax >= Math.abs(nor.getZ(i))) uv.setXY(i, z / tile, y / tile);
    else uv.setXY(i, x / tile, y / tile);
  }
  return g;
}

function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (list.length === 0) return null;
  const merged = mergeGeometries(list, false);
  list.forEach((g) => g.dispose());
  return merged;
}

interface Interval {
  a: number;
  b: number;
}

/** Vereinigung überlappender Intervalle, sortiert. */
function unionIntervals(list: Interval[]): Interval[] {
  const sorted = [...list].sort((p, q) => p.a - q.a);
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv.a <= last.b) last.b = Math.max(last.b, iv.b);
    else out.push({ ...iv });
  }
  return out;
}

export class TrackView {
  readonly root = new THREE.Group();

  constructor(level: LevelDef) {
    const L = level.arenaZ + 60;
    const half = 6.2;

    // --- Boden ---------------------------------------------------------------------------------
    const wood = box(0, -0.15, -20, 15, 12.4, 0.3, 4);
    const woodMesh = new THREE.Mesh(wood, makeWoodMaterial());
    woodMesh.receiveShadow = true;
    this.root.add(woodMesh);

    // Steinboden mit Gräben unter den Horden (Scheiben entlang z).
    const hordes = (level.hordes ?? []).map((h) => ({
      zA: Math.max(15, h.zStart - 3),
      zB: Math.min(L, h.zEnd + 3),
      xA: Math.max(-half, h.xMin - 0.2),
      xB: Math.min(half, h.xMax + 0.2),
    }));
    const breaks = new Set<number>([15, L]);
    for (const h of hordes) {
      breaks.add(h.zA);
      breaks.add(h.zB);
    }
    const zs = [...breaks].filter((z) => z >= 15 && z <= L).sort((a, b) => a - b);
    const stone: THREE.BufferGeometry[] = [];
    const trench: THREE.BufferGeometry[] = [];
    for (let i = 0; i < zs.length - 1; i++) {
      const a = zs[i];
      const b = zs[i + 1];
      if (b - a < 1e-6) continue;
      const covered = unionIntervals(
        hordes.filter((h) => h.zA <= a + 1e-6 && h.zB >= b - 1e-6).map((h) => ({ a: h.xA, b: h.xB })),
      );
      let cursor = -half;
      for (const iv of covered) {
        if (iv.a > cursor + 1e-6) stone.push(box((cursor + iv.a) / 2, -0.3, a, b, iv.a - cursor, 0.6, 5));
        trench.push(box((iv.a + iv.b) / 2, -0.5, a, b, iv.b - iv.a, 0.5, 5));
        cursor = iv.b;
      }
      if (cursor < half - 1e-6) stone.push(box((cursor + half) / 2, -0.3, a, b, half - cursor, 0.6, 5));
    }
    const stoneGeo = merge(stone);
    if (stoneGeo) {
      const m = new THREE.Mesh(stoneGeo, makeStoneMaterial());
      m.receiveShadow = true;
      this.root.add(m);
    }
    const trenchGeo = merge(trench);
    if (trenchGeo) {
      const m = new THREE.Mesh(trenchGeo, makeTrenchMaterial());
      m.receiveShadow = true;
      this.root.add(m);
    }

    // --- Unterbau ------------------------------------------------------------------------------
    const under = new THREE.Mesh(
      box(0, -2.1, -20, L, 12.4, 3, 5),
      new THREE.MeshStandardMaterial({ color: 0x2b2a27, roughness: 1 }),
    );
    this.root.add(under);

    // --- Geländer ------------------------------------------------------------------------------
    const railMat = makeRailMaterial();
    const mossMat = makeMossMaterial();
    const zStart = -20;
    const railBase: THREE.BufferGeometry[] = [];
    const handRail: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      railBase.push(box(side * 5.9, 0.15, zStart, L, 0.5, 0.3, 5));
      handRail.push(box(side * 5.9, 1.14, zStart, L, 0.45, 0.18, 5));
    }
    const baseGeo = merge(railBase);
    if (baseGeo) {
      const m = new THREE.Mesh(baseGeo, railMat);
      m.receiveShadow = true;
      this.root.add(m);
    }
    const handGeo = merge(handRail);
    if (handGeo) {
      const m = new THREE.Mesh(handGeo, railMat);
      m.castShadow = true;
      this.root.add(m);
    }

    // Baluster (Instanzen)
    const profile = [
      [0.001, 0],
      [0.09, 0],
      [0.09, 0.06],
      [0.06, 0.12],
      [0.05, 0.2],
      [0.1, 0.35],
      [0.12, 0.45],
      [0.06, 0.55],
      [0.06, 0.68],
      [0.1, 0.75],
      [0.001, 0.75],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const balGeo = new THREE.LatheGeometry(profile, 8);
    const step = 0.55;
    const perSide = Math.floor((L - zStart) / step);
    const balusters = new THREE.InstancedMesh(balGeo, railMat, perSide * 2);
    balusters.castShadow = true;
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < perSide; i++) {
        m4.makeTranslation(side * 5.9, 0.3, -(zStart + i * step));
        balusters.setMatrixAt(n++, m4);
      }
    }
    balusters.instanceMatrix.needsUpdate = true;
    this.root.add(balusters);

    // Pfeiler + Moos-Kappen alle 12 m
    const pillarCount = Math.floor((L - zStart) / 12) + 1;
    const pillars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), railMat, pillarCount * 2);
    const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.82, 0.12, 0.82), mossMat, pillarCount * 2);
    pillars.castShadow = true;
    n = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < pillarCount; i++) {
        const z = -(zStart + i * 12);
        m4.makeTranslation(side * 5.9, 0.7, z);
        pillars.setMatrixAt(n, m4);
        m4.makeTranslation(side * 5.9, 1.46, z);
        caps.setMatrixAt(n, m4);
        n++;
      }
    }
    pillars.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
    this.root.add(pillars, caps);
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
