import { LEVEL_COUNT, getLevel } from '../core/level/levels';
import { modifiersFromUpgrades } from '../core/upgrades';
import { InputController } from '../input/InputController';
import { SaveManager, type Settings } from '../persistence/SaveManager';
import { CameraRig } from '../render/CameraRig';
import { Lighting } from '../render/Lighting';
import type { Quality } from '../render/quality';
import { Renderer } from '../render/Renderer';
import { applyFog, createSky } from '../render/Sky';
import { AudioEngine } from '../audio/AudioEngine';
import { SfxDirector } from '../audio/SfxDirector';
import { setButtonClickHook } from '../ui/components/Button';
import { HudScreen } from '../ui/screens/HudScreen';
import { LevelSelectScreen } from '../ui/screens/LevelSelectScreen';
import { LoadingScreen } from '../ui/screens/LoadingScreen';
import { MenuScreen } from '../ui/screens/MenuScreen';
import { PauseScreen } from '../ui/screens/PauseScreen';
import { ResultScreen } from '../ui/screens/ResultScreen';
import { SettingsScreen } from '../ui/screens/SettingsScreen';
import { ShopScreen } from '../ui/screens/ShopScreen';
import { UIManager } from '../ui/UIManager';
import { FpsMeter, type DebugParams } from './debug';
import { GameLoop } from './GameLoop';
import { GameStateMachine, type AppState } from './GameStateMachine';
import { Session } from './Session';

export class App {
  readonly machine = new GameStateMachine();
  readonly save = new SaveManager();
  readonly audio = new AudioEngine();
  fps = 0;

  private readonly renderer: Renderer;
  private readonly rig: CameraRig;
  private readonly lighting: Lighting;
  private readonly sky: ReturnType<typeof createSky>;
  private readonly input: InputController;
  private readonly loop: GameLoop;
  private readonly ui: UIManager;
  private readonly hud = new HudScreen();
  private readonly menu: MenuScreen;
  private readonly levelSelect: LevelSelectScreen;
  private readonly pauseScreen: PauseScreen;
  private readonly result: ResultScreen;
  private readonly shop: ShopScreen;
  private readonly settings: SettingsScreen;
  private readonly loading = new LoadingScreen();

  private readonly sfx = new SfxDirector(this.audio);
  private session: Session | null = null;
  private currentLevelId = 1;
  private autoplay = false;
  private seedOverride: number | null = null;
  private qualityOverride: Quality | null = null;
  private timeScale = 1;
  private fpsMeter: FpsMeter | null = null;
  private lastResultInfo: { progress: number } = { progress: 0 };

  constructor(
    root: HTMLElement,
    private readonly params?: DebugParams,
  ) {
    if (params) {
      this.seedOverride = params.seed;
      this.timeScale = params.speed;
      this.qualityOverride = params.quality;
      this.autoplay = params.autoplay;
    }
    const canvas = root.querySelector<HTMLCanvasElement>('#game-canvas');
    const uiRoot = root.querySelector<HTMLElement>('#ui-root');
    if (!canvas || !uiRoot) throw new Error('#game-canvas oder #ui-root fehlt');

    this.renderer = new Renderer({ canvas, maxPixelRatio: 2, shadows: true, antialias: true });
    this.rig = new CameraRig(this.renderer.camera);
    this.renderer.onResize((w, h) => this.rig.setAspect(w / h));
    this.lighting = new Lighting(true);
    this.renderer.scene.add(this.lighting.root);
    this.sky = createSky(this.lighting.sunDirection);
    this.renderer.scene.add(this.sky);
    applyFog(this.renderer.scene);

    const unlock = (): void => this.audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    setButtonClickHook(() => this.audio.play('uiClick'));
    this.input = new InputController(root);
    this.input.onPauseRequest = () => this.togglePause();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.machine.state === 'playing') this.pause();
    });

    this.ui = new UIManager(uiRoot);
    this.menu = new MenuScreen({
      play: () => this.startLevel(this.nextLevelId()),
      levels: () => this.openLevelSelect(),
      shop: () => this.openShop(),
      settings: () => this.openSettings(),
    });
    this.levelSelect = new LevelSelectScreen({
      select: (id) => this.startLevel(id === 'endless' ? LEVEL_COUNT : id),
      back: () => this.goMenu(),
    });
    this.pauseScreen = new PauseScreen({
      resume: () => this.resume(),
      restart: () => this.startLevel(this.currentLevelId),
      settings: () => this.openSettings(),
      menu: () => this.goMenu(),
    });
    this.result = new ResultScreen({
      next: () => this.startLevel(Math.min(LEVEL_COUNT, this.currentLevelId + 1)),
      retry: () => this.startLevel(this.currentLevelId),
      menu: () => this.goMenu(),
      shop: () => this.openShop(),
    });
    this.shop = new ShopScreen({
      buy: (id) => this.save.buyUpgrade(id),
      back: () => this.leaveShop(),
    });
    this.settings = new SettingsScreen({
      change: (patch) => this.changeSettings(patch),
      back: () => this.leaveSettings(),
      resetProgress: () => {
        this.save.reset();
        this.applySettings();
        this.settings.refresh(this.save.data.settings);
      },
    });
    this.hud.onPause = () => this.pause();
    this.ui.register('loading', this.loading);
    this.ui.register('menu', this.menu);
    this.ui.register('levelSelect', this.levelSelect);
    this.ui.register('hud', this.hud);
    this.ui.register('pause', this.pauseScreen);
    this.ui.register('result', this.result);
    this.ui.register('shop', this.shop);
    this.ui.register('settings', this.settings);

    if (params?.debug) this.fpsMeter = new FpsMeter(root);
    this.applySettings();
    this.ui.show('loading');
    this.loop = new GameLoop((dt) => this.frame(dt));
    this.loop.start();
  }

  /** Wartet auf Schrift, zeigt dann Menü – oder startet direkt, wenn ein Level per URL gewünscht ist. */
  async boot(): Promise<void> {
    try {
      await Promise.all([document.fonts.load('48px "Lilita One"'), document.fonts.ready]);
    } catch {
      /* Schrift optional */
    }
    if (this.params?.level) this.startLevel(this.params.level);
    else this.goMenu();
  }

  /** Startet ein Level; der Trupp wartet, bis die erste Eingabe erfolgt. */
  startLevel(levelId: number): void {
    this.createSession(levelId);
    const session = this.session!;
    this.ui.hideAll();
    this.hud.setLabel(`Level ${levelId}`);
    this.ui.show('hud');
    if (this.machine.state !== 'playing') this.machine.go('playing');
    this.input.reset();
    this.input.enabled = true;
    if (this.autoplay) session.sim.start();
    else this.input.onFirstInput = () => session.sim.start();
  }

  getSession(): Session | null {
    return this.session;
  }

  pause(): void {
    if (this.machine.state !== 'playing') return;
    this.machine.go('paused');
    this.input.enabled = false;
    this.ui.showOverlay('pause');
  }

  resume(): void {
    if (this.machine.state !== 'paused') return;
    this.ui.hide('pause');
    this.machine.go('playing');
    this.input.reset();
    this.input.enabled = true;
  }

  togglePause(): void {
    if (this.machine.state === 'playing') this.pause();
    else if (this.machine.state === 'paused') this.resume();
  }

  // ---------------------------------------------------------------------------------------------

  private nextLevelId(): number {
    return Math.min(LEVEL_COUNT, this.save.data.highestUnlockedLevel);
  }

  private resolveQuality(): Quality {
    if (this.qualityOverride) return this.qualityOverride;
    const q = this.save.data.settings.quality;
    if (q !== 'auto') return q;
    return window.matchMedia?.('(pointer: coarse)').matches ? 'medium' : 'high';
  }

  private createSession(levelId: number): void {
    const base = getLevel(levelId);
    if (!base) throw new Error(`Unbekanntes Level ${levelId}`);
    const level = this.seedOverride !== null ? { ...base, seed: this.seedOverride } : base;
    if (this.session) {
      this.renderer.scene.remove(this.session.view.root);
      this.session.dispose();
    }
    this.currentLevelId = levelId;
    const session = new Session({
      level,
      modifiers: modifiersFromUpgrades(this.save.data.upgrades),
      autoplay: this.autoplay,
      quality: this.resolveQuality(),
      shadows: true,
    });
    session.timeScale = this.timeScale;
    session.addListener((e, w) => {
      this.hud.onEvent(e);
      this.sfx.onEvent(e, w);
    });
    this.session = session;
    this.renderer.scene.add(session.view.root);
    this.rig.update(session.world, 0, true);
  }

  private goTo(state: AppState): void {
    if (this.machine.state !== state) this.machine.go(state);
  }

  private goMenu(): void {
    this.input.enabled = false;
    this.input.onFirstInput = null;
    const next = this.nextLevelId();
    this.createSession(next);
    this.goTo('menu');
    const lvl = getLevel(next);
    this.menu.setNextLevel(`Level ${next}${lvl ? ` · ${lvl.name}` : ''}`);
    this.menu.setCoins(this.save.data.coins);
    this.ui.show('menu');
  }

  private openLevelSelect(): void {
    this.goTo('levelSelect');
    this.levelSelect.refresh(this.save.data);
    this.ui.show('levelSelect');
  }

  private openShop(): void {
    this.goTo('shop');
    this.shop.refresh(this.save.data);
    this.ui.show('shop');
  }

  private leaveShop(): void {
    if (this.machine.previous === 'result') {
      this.goTo('result');
      this.ui.show('result');
    } else this.goMenu();
  }

  private openSettings(): void {
    this.goTo('settings');
    this.settings.refresh(this.save.data.settings);
    this.ui.show('settings');
  }

  private leaveSettings(): void {
    if (this.machine.previous === 'paused') {
      this.goTo('paused');
      this.ui.show('hud');
      this.ui.showOverlay('pause');
    } else this.goMenu();
  }

  private changeSettings(patch: Partial<Settings>): void {
    this.save.update((d) => {
      Object.assign(d.settings, patch);
    });
    this.applySettings();
  }

  private applySettings(): void {
    const st = this.save.data.settings;
    this.input.sensitivity = st.sensitivity;
    this.audio.setSoundEnabled(st.sound);
    this.audio.setMusicEnabled(st.music);
  }

  private onFinished(): void {
    const s = this.session;
    if (!s) return;
    const result = s.sim.getResult();
    const { newBestStars } = this.save.applyResult(result);
    this.input.enabled = false;
    this.goTo('result');
    this.lastResultInfo = { progress: s.world.squad.z / s.world.arenaZ };
    this.result.showResult(result, {
      hasNextLevel: result.victory && this.currentLevelId < LEVEL_COUNT,
      newBestStars,
      totalCoins: this.save.data.coins,
      progress: this.lastResultInfo.progress,
    });
    this.ui.show('hud');
    this.ui.showOverlay('result');
  }

  private frame(frameDt: number): void {
    const s = this.session;
    if (s) {
      const state = this.machine.state;
      if (state === 'playing') {
        const dx = this.input.consumeDeltaX() + this.input.getKeyAxis() * 10 * frameDt;
        s.update(frameDt, dx);
        this.sfx.update(s.world, frameDt);
        this.hud.update(s.world, this.save.data.coins);
        if (s.sim.isFinished()) this.onFinished();
      } else {
        s.view.sync(s.world, frameDt);
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
