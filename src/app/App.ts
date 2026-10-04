import { getLevel } from '../core/level/levels';
import { InputController } from '../input/InputController';
import { CameraRig } from '../render/CameraRig';
import { Lighting } from '../render/Lighting';
import { Renderer } from '../render/Renderer';
import { applyFog, createSky } from '../render/Sky';
import { GameLoop } from './GameLoop';
import { Session } from './Session';

export class App {
  private readonly renderer: Renderer;
  private readonly rig: CameraRig;
  private readonly lighting: Lighting;
  private readonly sky: ReturnType<typeof createSky>;
  private readonly input: InputController;
  private readonly loop: GameLoop;
  private session: Session | null = null;

  constructor(root: HTMLElement) {
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
    this.loop = new GameLoop((dt) => this.frame(dt));
    this.loop.start();
  }

  /** Startet ein Level; der Trupp wartet, bis die erste Eingabe erfolgt. */
  startLevel(levelId: number, autoplay = false): void {
    const level = getLevel(levelId);
    if (!level) throw new Error(`Unbekanntes Level ${levelId}`);
    if (this.session) {
      this.renderer.scene.remove(this.session.view.root);
      this.session.dispose();
    }
    const session = new Session({
      level,
      modifiers: { startSoldierBonus: 0, fireRateMultiplier: 1, coinMultiplier: 1 },
      autoplay,
      quality: 'medium',
      shadows: true,
    });
    this.session = session;
    this.renderer.scene.add(session.view.root);
    this.rig.update(session.world, 0, true);
    this.input.reset();
    this.input.enabled = true;
    if (autoplay) session.sim.start();
    else this.input.onFirstInput = () => session.sim.start();
  }

  private frame(frameDt: number): void {
    const s = this.session;
    if (s) {
      const dx = this.input.consumeDeltaX() + this.input.getKeyAxis() * 10 * frameDt;
      s.update(frameDt, dx);
      this.rig.update(s.world, frameDt);
      this.lighting.update(s.world);
    }
    this.sky.position.copy(this.renderer.camera.position);
    this.renderer.render();
  }
}
