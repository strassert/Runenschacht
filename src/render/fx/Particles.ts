import * as THREE from 'three';
import { disposeObject } from '../dispose';

const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const _col = new THREE.Color();
const GRAVITY = 9.8;

export interface BurstOptions {
  gravity?: number;
  size?: number;
  spread?: number;
  upward?: number;
}

/** Gepoolte Billboard-Partikel (eine InstancedMesh). */
export class Particles {
  readonly root = new THREE.Group();
  /** Multiplikator für die Anzahl neuer Partikel (z. B. 0.5 bei reduzierter Bewegung). */
  countScale = 1;
  private readonly mesh: THREE.InstancedMesh;
  private readonly capacity: number;
  private n = 0;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly pz: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly vz: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly size: Float32Array;
  private readonly grav: Float32Array;
  private readonly col: Float32Array;

  constructor(capacity = 1500) {
    this.capacity = capacity;
    this.px = new Float32Array(capacity);
    this.py = new Float32Array(capacity);
    this.pz = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.vz = new Float32Array(capacity);
    this.age = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.grav = new Float32Array(capacity);
    this.col = new Float32Array(capacity * 3);
    this.mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }),
      capacity,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.setColorAt(0, _col.set(0xffffff));
    this.root.add(this.mesh);
  }

  get alive(): number {
    return this.n;
  }

  /** count Partikel an (x,y,z) [Sim-Koordinaten] mit Farbe, Geschwindigkeit, Lebensdauer. */
  burst(
    x: number,
    y: number,
    z: number,
    count: number,
    color: number,
    speed: number,
    life: number,
    opts: BurstOptions = {},
  ): void {
    const total = Math.max(1, Math.round(count * this.countScale));
    _col.set(color);
    const spread = opts.spread ?? 1;
    for (let k = 0; k < total && this.n < this.capacity; k++) {
      const i = this.n++;
      const a = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const r = Math.sqrt(1 - u * u);
      const sp = speed * (0.4 + Math.random() * 0.6);
      this.px[i] = x;
      this.py[i] = y;
      this.pz[i] = -z;
      this.vx[i] = Math.cos(a) * r * sp * spread;
      this.vy[i] = u * sp * spread * 0.6 + (opts.upward ?? 0) * (0.5 + Math.random() * 0.5);
      this.vz[i] = Math.sin(a) * r * sp * spread;
      this.age[i] = 0;
      this.life[i] = life * (0.7 + Math.random() * 0.3);
      this.size[i] = (opts.size ?? 0.18) * (0.7 + Math.random() * 0.6);
      this.grav[i] = opts.gravity ?? 1;
      this.col[i * 3] = _col.r;
      this.col[i * 3 + 1] = _col.g;
      this.col[i * 3 + 2] = _col.b;
    }
  }

  update(frameDt: number, camera: THREE.Camera): void {
    for (let i = this.n - 1; i >= 0; i--) {
      this.age[i] += frameDt;
      if (this.age[i] >= this.life[i]) {
        this.removeAt(i);
        continue;
      }
      this.vy[i] -= GRAVITY * this.grav[i] * frameDt;
      this.px[i] += this.vx[i] * frameDt;
      this.py[i] += this.vy[i] * frameDt;
      this.pz[i] += this.vz[i] * frameDt;
    }
    for (let i = 0; i < this.n; i++) {
      const k = 1 - this.age[i] / this.life[i];
      _pos.set(this.px[i], this.py[i], this.pz[i]);
      const s = this.size[i] * k;
      _scale.set(s, s, s);
      _mat.compose(_pos, camera.quaternion, _scale);
      this.mesh.setMatrixAt(i, _mat);
      _col.setRGB(this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]);
      this.mesh.setColorAt(i, _col);
    }
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private removeAt(i: number): void {
    const last = this.n - 1;
    if (i !== last) {
      this.px[i] = this.px[last];
      this.py[i] = this.py[last];
      this.pz[i] = this.pz[last];
      this.vx[i] = this.vx[last];
      this.vy[i] = this.vy[last];
      this.vz[i] = this.vz[last];
      this.age[i] = this.age[last];
      this.life[i] = this.life[last];
      this.size[i] = this.size[last];
      this.grav[i] = this.grav[last];
      this.col.copyWithin(i * 3, last * 3, last * 3 + 3);
    }
    this.n--;
  }

  dispose(): void {
    disposeObject(this.root);
    this.mesh.dispose();
  }
}
