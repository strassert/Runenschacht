import * as THREE from 'three';
import { clamp, damp } from '../core/math';
import type { WorldState } from '../core/types';

const VFOV = 55;
const TILT = (38 * Math.PI) / 180;

export class CameraRig {
  /** Zusätzlicher Versatz (Screenshake, Phase 7). */
  readonly shakeOffset = new THREE.Vector3();
  /** Zusätzlicher Skalierungsfaktor für die Distanz (Zoom-Effekte). */
  distanceScale = 1;

  private baseDistance = 20;
  private distance = 20;
  private fx = 0;
  private readonly focus = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Abstand so wählen, dass die Brückenbreite (14 m inkl. Rand) sichtbar ist. */
  setAspect(aspect: number): void {
    const vfov = (VFOV * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    this.baseDistance = clamp(7.2 / Math.tan(hfov / 2), 14, 30);
  }

  /** Folgt dem Trupp; snap=true springt ohne Dämpfung. */
  update(world: WorldState, frameDt: number, snap = false): void {
    const s = world.squad;
    const boss = world.phase === 'bossFight';
    const targetFx = s.x * 0.55;
    const targetFz = s.z + (boss ? 9 : 7);
    const targetDist = this.baseDistance * (boss ? 1.1 : 1) * this.distanceScale;

    if (snap) {
      this.fx = targetFx;
      this.distance = targetDist;
    } else {
      this.fx = damp(this.fx, targetFx, 6, frameDt);
      this.distance = damp(this.distance, targetDist, 6, frameDt);
    }

    // Blickrichtung (Sim: von hinten oben nach vorne): Kamera liegt hinter und über dem Fokus.
    this.focus.set(this.fx, 0, -targetFz);
    this.camera.position.set(
      this.focus.x,
      Math.sin(TILT) * this.distance,
      this.focus.z + Math.cos(TILT) * this.distance,
    );
    this.camera.lookAt(this.focus);
    this.camera.position.add(this.shakeOffset);
  }
}
