import { getLevel } from '../core/level/levels';
import { InputController } from '../input/InputController';
import { CameraRig } from '../render/CameraRig';
import { Lighting } from '../render/Lighting';
import { Renderer } from '../render/Renderer';
import { applyFog, createSky } from '../render/Sky';
import { GameLoop } from './GameLoop';
import { GameStateMachine } from './GameStateMachine';
import { FpsMeter, type DebugParams } from './debug';
import type { Quality } from '../render/quality';
import { Session } from './Session';

export class App {
  private readonly renderer: Renderer;
  private readonly rig: CameraRig;
  private readonly lighting: Lighting;
  private readonly sky: ReturnType<typeof createSky>;
  private readonly input: InputController;
  private readonly loop: GameLoop;
  private session: Session | null = null;
  readonly machine = new GameStateMachine();
  private finishedTimer = 0;
  private autoplay = false;
  private seedOverride: number | null = null;
  private quality: Quality = 'medium';
  private timeScale = 1;
  private fpsMeter: FpsMeter | null = null;
  fps = 0;

  constructor(root: HTMLElement, params?: DebugParams) {
    if (params) {
      this.seedOverride = params.seed;
      this.timeScale = params.speed;
      if (params.quality) this.quality = params.quality;
    }
    const canvas = root.querySelector<HTMLCanvasElement>('#game-canvas');
    if (!canvas) throw new Error('#game-canvas fehlt');
    this.renderer = new Renderer({ canvas, maxPixelRatio: 2, shadows: true, antialias: true });
    this.rig = new CameraRig(this.renderer.camera);
    this.renderer.onResize((w, h) => this.rig.setAspect(w / h));
    this.lighting = new Lighting(true);
    this.renderer.scene.add(this.lighting.root);
    this.sky = createSky(this.lighting.sunDirection);
    this.renderer.scene.add(this.sky);
    applyFog(this.renderer.scene);
    this.input = new InputController(root);
    this.input.onPauseRequest = () => this.togglePause();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.machine.state === 'playing') this.pause();
    });
    if (params?.debug) this.fpsMeter = new FpsMeter(root);
    this.loop = new GameLoop((dt) => this.frame(dt));
    this.loop.start();
  }

  /** Startet ein Level; der Trupp wartet, bis die erste Eingabe erfolgt. */
  startLevel(levelId: number, autoplay = false): void {
    this.autoplay = autoplay;
    const base = getLevel(levelId);
    if (!base) throw new Error(`Unbekanntes Level ${levelId}`);
    const level = this.seedOverride !== null ? { ...base, seed: this.seedOverride } : base;
    if (this.session) {
      this.renderer.scene.remove(this.session.view.root);
      this.session.dispose();
    }
    const session = new Session({
      level,
      modifiers: { startSoldierBonus: 0, fireRateMultiplier: 1, coinMultiplier: 1 },
      autoplay,
      quality: this.quality,
      shadows: true,
    });
    this.session = session;
    session.timeScale = this.timeScale;
    this.finishedTimer = 0;
    if (this.machine.state !== 'playing') this.machine.go('playing');
    this.renderer.scene.add(session.view.root);
    this.rig.update(session.world, 0, true);
    this.input.reset();
    this.input.enabled = true;
    if (autoplay) session.sim.start();
    else this.input.onFirstInput = () => session.sim.start();
  }

  getSession(): Session | null {
    return this.session;
  }

  pause(): void {
    if (this.machine.state === 'playing') {
      this.machine.go('paused');
      this.input.enabled = false;
    }
  }

  resume(): void {
    if (this.machine.state === 'paused') {
      this.machine.go('playing');
      this.input.reset();
      this.input.enabled = true;
    }
  }

  togglePause(): void {
    if (this.machine.state === 'playing') this.pause();
    else if (this.machine.state === 'paused') this.resume();
  }

  private frame(frameDt: number): void {
    const s = this.session;
    if (s) {
      if (this.machine.state === 'playing') {
        const dx = this.input.consumeDeltaX() + this.input.getKeyAxis() * 10 * frameDt;
        s.update(frameDt, dx);
        if (s.sim.isFinished()) {
          this.machine.go('result');
          this.input.enabled = false;
        }
      } else if (this.machine.state === 'result') {
        // Platzhalter bis Phase 6: nach dem Ergebnis nach 2 s dasselbe Level neu starten.
        this.finishedTimer += frameDt;
        if (this.finishedTimer >= 2) this.startLevel(s.level.id, this.autoplay);
      }
      this.rig.update(s.world, frameDt);
      this.lighting.update(s.world);
    }
    this.sky.position.copy(this.renderer.camera.position);
    this.renderer.render();
    if (this.fpsMeter) {
      const w = s?.world;
      const info = w
        ? `${this.machine.state}/${w.phase} n=${w.squad.count} z=${w.squad.z.toFixed(0)} en=${w.enemies.count} b=${w.bullets.count} dc=${this.renderer.three.info.render.calls}`
        : '-';
      this.fpsMeter.update(frameDt, info);
      this.fps = this.fpsMeter.fps;
    }
  }
}
