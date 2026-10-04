import * as THREE from 'three';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  maxPixelRatio: number;
  shadows: boolean;
  antialias: boolean;
}

export class Renderer {
  readonly three: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private readonly listeners: ((w: number, h: number) => void)[] = [];
  private readonly observer: ResizeObserver;
  private width = 1;
  private height = 1;

  constructor(opts: RendererOptions) {
    this.canvas = opts.canvas;
    this.three = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: opts.antialias,
      powerPreference: 'high-performance',
    });
    this.three.outputColorSpace = THREE.SRGBColorSpace;
    this.three.toneMapping = THREE.ACESFilmicToneMapping;
    this.three.toneMappingExposure = 1.05;
    this.three.shadowMap.enabled = opts.shadows;
    this.three.shadowMap.type = THREE.PCFSoftShadowMap;
    this.three.setPixelRatio(Math.min(window.devicePixelRatio, opts.maxPixelRatio));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

    const parent = opts.canvas.parentElement ?? document.body;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(parent);
    this.resize();
  }

  /** Passt Größe an das Elternelement des Canvas an. Ruft onResize-Listener auf. */
  resize(): void {
    const parent = this.canvas.parentElement ?? document.body;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.three.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    for (const cb of this.listeners) cb(w, h);
  }

  onResize(cb: (width: number, height: number) => void): void {
    this.listeners.push(cb);
    cb(this.width, this.height);
  }

  render(): void {
    this.three.render(this.scene, this.camera);
  }

  dispose(): void {
    this.observer.disconnect();
    this.three.dispose();
  }
}
