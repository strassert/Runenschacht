import * as THREE from 'three';

const planeGeo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);

/** Flacher HP-Balken (Hintergrund + Füllung, Füllung wächst von links). Zeigt zur +Z-Seite (Kamera). */
export class HpBar {
  readonly root = new THREE.Group();
  private readonly fill: THREE.Mesh;
  private readonly fillMat: THREE.MeshBasicMaterial;
  private readonly bgMat: THREE.MeshBasicMaterial;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.bgMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.7,
      toneMapped: false,
    });
    this.fillMat = new THREE.MeshBasicMaterial({ color: 0x2ec27e, toneMapped: false });
    const bg = new THREE.Mesh(planeGeo, this.bgMat);
    bg.scale.set(width + 0.08, height + 0.08, 1);
    bg.position.set(-width / 2 - 0.04, 0, -0.005);
    this.fill = new THREE.Mesh(planeGeo, this.fillMat);
    this.fill.position.set(-width / 2, 0, 0);
    this.root.add(bg, this.fill);
    this.set(1);
  }

  /** ratio 0..1; Farbe läuft von Grün über Gelb nach Rot. */
  set(ratio: number): void {
    const r = Math.max(0, Math.min(1, ratio));
    this.fill.scale.set(Math.max(0.001, this.width * r), this.height, 1);
    this.fillMat.color.setHSL(0.33 * r, 0.75, 0.5);
  }

  dispose(): void {
    this.fillMat.dispose();
    this.bgMat.dispose();
  }
}
