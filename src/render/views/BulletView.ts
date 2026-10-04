import * as THREE from 'three';
import { CONFIG, WEAPONS } from '../../core/config';
import type { SimEvent } from '../../core/events';
import type { WorldState } from '../../core/types';
import { disposeObject } from '../dispose';
import { createCanvas } from '../textures/canvas';

const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const HERO_COLOR = 0xfff3b0;

function flashTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,240,190,1)');
  g.addColorStop(0.4, 'rgba(255,190,90,0.6)');
  g.addColorStop(1, 'rgba(255,150,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BulletView {
  readonly root = new THREE.Group();
  private readonly mesh: THREE.InstancedMesh;
  private readonly tierColors: THREE.Color[];
  private readonly heroColor = new THREE.Color(HERO_COLOR);
  private readonly flash: THREE.Sprite;
  private flashLevel = 0;

  constructor() {
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.9),
      material,
      CONFIG.shooting.maxBullets,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.setColorAt(0, new THREE.Color(1, 1, 1));
    this.tierColors = WEAPONS.map((w) => new THREE.Color(w.tracerColor));
    this.root.add(this.mesh);

    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flashTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        opacity: 0,
      }),
    );
    this.flash.scale.set(1.6, 1.6, 1);
    this.root.add(this.flash);
  }

  onEvent(e: SimEvent): void {
    if (e.type === 'shotsFired' && e.owner === 'squad') this.flashLevel = 1;
  }

  sync(world: WorldState, frameDt: number): void {
    const b = world.bullets;
    for (let i = 0; i < b.count; i++) {
      _pos.set(b.x[i], 0.45, -(b.z[i] - 0.45));
      _mat.compose(_pos, _quat, _scale);
      this.mesh.setMatrixAt(i, _mat);
      const tier = b.tier[i];
      this.mesh.setColorAt(i, tier === 255 ? this.heroColor : this.tierColors[tier]);
    }
    this.mesh.count = b.count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    this.flashLevel = Math.max(0, this.flashLevel - frameDt * 10);
    const s = world.squad;
    const mat = this.flash.material as THREE.SpriteMaterial;
    mat.opacity = s.count > 0 ? this.flashLevel * 0.8 : 0;
    this.flash.position.set(s.x, 0.7, -(s.z + 0.8));
  }

  dispose(): void {
    disposeObject(this.root);
    this.mesh.dispose();
    (this.flash.material as THREE.SpriteMaterial).dispose();
  }
}
