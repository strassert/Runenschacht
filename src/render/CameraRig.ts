import * as THREE from 'three';
import { clamp, damp, easeOutCubic } from '../core/math';
import type { WorldState } from '../core/types';

const VFOV = 55;
const TILT = (38 * Math.PI) / 180;

export class CameraRig {
  /** Zusätzlicher Versatz (Screenshake, Phase 7). */
  readonly shakeOffset = new THREE.Vector3();
  /** Zusätzlicher Skalierungsfaktor für die Distanz (Zoom-Effekte). */
  distanceScale = 1;
  /** 0..1, wird pro Frame abgebaut; erhöht das Sichtfeld kurz (Tor-Puls). */
  fovPulse = 0;
  private appliedFov = VFOV;
  /** Menü: Kamera schwenkt langsam um den wartenden Trupp. */
  menuMode = false;
  private clock = 0;
  private intro = 1;
  private static readonly INTRO_TIME = 1.2;

  /** Startet den Kameraflug von oben zur Startposition. */
  startIntro(): void {
    this.intro = 0;
  }

  skipIntro(): void {
    this.intro = 1;
  }

  get introActive(): boolean {
    return this.intro < 1;
  }

  private baseDistance = 20;
  private distance = 20;
  private fx = 0;
  private readonly focus = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Abstand so wählen, dass die Brückenbreite (14 m inkl. Rand) sichtbar ist. */
  setAspect(aspect: number): void {
    const vfov = (VFOV * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    this.baseDistance = clamp(7.8 / Math.tan(hfov / 2), 14, 30);
  }

  /** Folgt dem Trupp; snap=true springt ohne Dämpfung. */
  update(world: WorldState, frameDt: number, snap = false): void {
    const s = world.squad;
    const boss = world.phase === 'bossFight';
    const targetFx = s.x * 0.55;
    if (this.intro < 1) this.intro = Math.min(1, this.intro + frameDt / CameraRig.INTRO_TIME);
    const k = 1 - easeOutCubic(this.intro);
    const targetFz = s.z + (boss ? 9 : 7) + 55 * k;
    const targetDist = this.baseDistance * (boss ? 1.1 : 1) * this.distanceScale + 22 * k;

    if (snap || this.intro < 1) {
      this.fx = targetFx;
      this.distance = targetDist;
    } else {
      this.fx = damp(this.fx, targetFx, 6, frameDt);
      this.distance = damp(this.distance, targetDist, 6, frameDt);
    }

    // Blickrichtung (Sim: von hinten oben nach vorne): Kamera liegt hinter und über dem Fokus.
    this.clock += frameDt;
    this.focus.set(this.fx, 0, -targetFz);
    if (this.menuMode) {
      const a = Math.sin(this.clock * 0.25) * 0.7;
      const d = this.distance * 0.8;
      this.focus.set(this.fx, 0.5, -(s.z + 3));
      this.camera.position.set(
        this.focus.x + Math.sin(a) * d * Math.cos(TILT),
        Math.sin(TILT * 0.8) * d,
        this.focus.z + Math.cos(a) * d * Math.cos(TILT),
      );
    } else {
      this.camera.position.set(
        this.focus.x,
        Math.sin(TILT) * this.distance,
        this.focus.z + Math.cos(TILT) * this.distance,
      );
    }
    this.fovPulse = Math.max(0, this.fovPulse - frameDt * 5);
    const fov = VFOV + 3 * this.fovPulse;
    if (Math.abs(fov - this.appliedFov) > 0.01) {
      this.appliedFov = fov;
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.focus);
    this.camera.position.add(this.shakeOffset);
  }
}
