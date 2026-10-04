import * as THREE from 'three';
import type { LevelDef } from '../../core/level/types';
import { disposeObject } from '../dispose';
import { createPalmGeometry } from '../models/palm';
import { createRockGeometry } from '../models/rock';
import { paint } from '../models/soldier';
import { QUALITY_PROFILES, type Quality } from '../quality';
import { textureRng } from '../textures/canvas';
import { createWaterfallTexture } from '../textures/waterTexture';

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

function setInstance(
  mesh: THREE.InstancedMesh,
  i: number,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  rotY: number,
): void {
  _p.set(x, y, z);
  _e.set(0, rotY, 0);
  _q.setFromEuler(_e);
  _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s);
  mesh.setMatrixAt(i, _m);
}

/** Dschungelschlucht rund um die Brücke: Baumkronen, Palmen, Klippen, Wasserfälle, Berge. */
export class EnvironmentView {
  readonly root = new THREE.Group();
  private readonly waterTexture: THREE.CanvasTexture;
  private readonly waterMat: THREE.MeshBasicMaterial;

  constructor(level: LevelDef, quality: Quality) {
    const rnd = textureRng(level.seed * 7 + 13);
    const length = level.arenaZ + 140;
    const zFrom = -40;
    const density = QUALITY_PROFILES[quality].environmentDensity;

    // 1) Dschungelboden tief unten
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(700, length + 700),
      new THREE.MeshStandardMaterial({ color: 0x2f4f2a, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -28, -(length / 2) + zFrom / 2);
    this.root.add(ground);

    // 2) Baumkronen-Blöcke + Palmen
    const blobGeo = paint(createRockGeometry(5), 0xffffff);
    const clusterStep = 5 / density;
    const clusters: { x: number; y: number; z: number; r: number }[] = [];
    for (const side of [-1, 1]) {
      for (let z = zFrom; z < length; z += clusterStep) {
        const r = 3 + rnd() * 3.5;
        clusters.push({ x: side * (12 + rnd() * 14), y: -10 + rnd() * 5, z: z + rnd() * clusterStep, r });
      }
    }
    const blobs = new THREE.InstancedMesh(
      blobGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }),
      clusters.length,
    );
    clusters.forEach((c, i) => {
      setInstance(blobs, i, c.x, c.y, -c.z, c.r, c.r * 0.8, c.r, rnd() * Math.PI * 2);
      blobs.setColorAt(i, _c.setHSL(0.27 + rnd() * 0.06, 0.45, 0.2 + rnd() * 0.1));
    });
    blobs.instanceMatrix.needsUpdate = true;
    if (blobs.instanceColor) blobs.instanceColor.needsUpdate = true;
    this.root.add(blobs);

    const palms = new THREE.InstancedMesh(
      createPalmGeometry(),
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
      clusters.length,
    );
    clusters.forEach((c, i) => {
      const sc = 0.9 + rnd() * 0.6;
      setInstance(
        palms,
        i,
        c.x + (rnd() - 0.5) * c.r,
        c.y + c.r * 0.7,
        -c.z,
        sc,
        sc,
        sc,
        rnd() * Math.PI * 2,
      );
    });
    palms.instanceMatrix.needsUpdate = true;
    this.root.add(palms);

    // 3) Büsche direkt am Geländer
    if (quality !== 'low') {
      const bushGeo = paint(new THREE.IcosahedronGeometry(0.6, 0), 0xffffff);
      const nb = Math.floor((length / 3.2) * 2);
      const bushes = new THREE.InstancedMesh(
        bushGeo,
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }),
        nb,
      );
      for (let i = 0; i < nb; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const z = zFrom + (i >> 1) * 3.2 + rnd() * 2;
        const sc = 0.8 + rnd() * 1.1;
        setInstance(
          bushes,
          i,
          side * (6.5 + rnd() * 1.2),
          -0.5 + rnd() * 0.5,
          -z,
          sc * 1.3,
          sc,
          sc * 1.3,
          rnd() * 6,
        );
        bushes.setColorAt(i, _c.setHSL(0.25 + rnd() * 0.08, 0.55, 0.28 + rnd() * 0.12));
      }
      bushes.instanceMatrix.needsUpdate = true;
      if (bushes.instanceColor) bushes.instanceColor.needsUpdate = true;
      this.root.add(bushes);
    }

    // 4) Felsklippen mit Wasserfällen
    const cliffGeo = createRockGeometry(11);
    const cliffs: { x: number; y: number; z: number; r: number; h: number }[] = [];
    for (const side of [-1, 1]) {
      for (let z = zFrom; z < length + 60; z += 24 / density) {
        const r = 5 + rnd() * 5;
        cliffs.push({
          x: side * (28 + rnd() * 24),
          y: -12 + rnd() * 4,
          z: z + rnd() * 10,
          r,
          h: r * (1.5 + rnd()),
        });
      }
    }
    const cliffMesh = new THREE.InstancedMesh(
      cliffGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }),
      cliffs.length,
    );
    cliffs.forEach((c, i) => {
      setInstance(cliffMesh, i, c.x, c.y, -c.z, c.r, c.h, c.r, rnd() * Math.PI * 2);
    });
    cliffMesh.instanceMatrix.needsUpdate = true;
    this.root.add(cliffMesh);

    this.waterTexture = createWaterfallTexture();
    this.waterTexture.wrapS = THREE.RepeatWrapping;
    this.waterTexture.wrapT = THREE.RepeatWrapping;
    this.waterTexture.repeat.set(1, 3);
    this.waterMat = new THREE.MeshBasicMaterial({
      map: this.waterTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const waterGeo = new THREE.PlaneGeometry(1, 1);
    const falls = quality === 'low' ? 2 : quality === 'high' ? 7 : 5;
    const picks = cliffs
      .filter((_, i) => i % Math.max(1, Math.floor(cliffs.length / falls)) === 2)
      .slice(0, falls);
    for (const c of picks) {
      const w = new THREE.Mesh(waterGeo, this.waterMat);
      const side = Math.sign(c.x);
      const width = 3 + rnd() * 3;
      const height = 34 + rnd() * 8;
      w.scale.set(width, height, 1);
      w.position.set(c.x - side * (c.r * 0.9), c.y + c.h * 0.4 - height / 2 + 14, -c.z);
      w.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      w.renderOrder = 2;
      this.root.add(w);
    }

    // 5) Berge im Dunst
    const mountainGeo = paint(new THREE.ConeGeometry(1, 1, 7), 0xffffff);
    const mountains: { x: number; z: number; r: number; h: number }[] = [];
    for (let z = zFrom - 40; z < length + 300; z += 42) {
      for (const side of [-1, 1]) {
        mountains.push({
          x: side * (80 + rnd() * 70),
          z: z + rnd() * 20,
          r: 28 + rnd() * 26,
          h: 45 + rnd() * 50,
        });
      }
    }
    for (let i = 0; i < 8; i++) {
      mountains.push({
        x: -160 + i * 46 + rnd() * 20,
        z: length + 140 + rnd() * 80,
        r: 40 + rnd() * 40,
        h: 70 + rnd() * 50,
      });
    }
    const mountainMesh = new THREE.InstancedMesh(
      mountainGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }),
      mountains.length,
    );
    mountains.forEach((m, i) => {
      setInstance(mountainMesh, i, m.x, -30 + m.h / 2, -m.z, m.r, m.h, m.r, rnd() * 6);
      mountainMesh.setColorAt(i, _c.setHSL(0.3 + rnd() * 0.05, 0.25, 0.3 + rnd() * 0.08));
    });
    mountainMesh.instanceMatrix.needsUpdate = true;
    if (mountainMesh.instanceColor) mountainMesh.instanceColor.needsUpdate = true;
    this.root.add(mountainMesh);

    // 6) Lianen (nur hohe Qualität)
    if (quality === 'high') {
      const vineGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 4);
      const nv = 40;
      const vines = new THREE.InstancedMesh(
        vineGeo,
        new THREE.MeshStandardMaterial({ color: 0x2c5a2a, roughness: 1 }),
        nv,
      );
      for (let i = 0; i < nv; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const len = 4 + rnd() * 8;
        setInstance(
          vines,
          i,
          side * (7.5 + rnd() * 3),
          12 - len / 2,
          -(zFrom + (i >> 1) * (length / 20) + rnd() * 6),
          1,
          len,
          1,
          0,
        );
      }
      vines.instanceMatrix.needsUpdate = true;
      this.root.add(vines);
    }
  }

  update(frameDt: number): void {
    this.waterTexture.offset.y -= frameDt * 0.5;
  }

  dispose(): void {
    disposeObject(this.root);
    this.waterTexture.dispose();
    this.waterMat.dispose();
  }
}
