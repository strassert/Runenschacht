import { generateEndlessLevel } from '../core/level/generator';
import type { LevelDef } from '../core/level/types';
import { LEVEL_COUNT, getLevel } from '../core/level/levels';
import { modifiersFromUpgrades } from '../core/upgrades';
import { InputController } from '../input/InputController';
import { SaveManager, type Settings } from '../persistence/SaveManager';
import { CameraRig } from '../render/CameraRig';
import { Lighting } from '../render/Lighting';
import { AutoQualityGovernor, QUALITY_PROFILES, initialAutoQuality, type Quality } from '../render/quality';
import { Renderer } from '../render/Renderer';
import { applyFog, createSky } from '../render/Sky';
import { AudioEngine } from '../audio/AudioEngine';
import type { SimEvent } from '../core/events';
import { MusicPlayer } from '../audio/music';
import { SfxDirector } from '../audio/SfxDirector';
import { setButtonClickHook } from '../ui/components/Button';
import { TutorialDirector } from './TutorialDirector';
import { TutorialOverlay } from '../ui/screens/TutorialOverlay';
import * as THREE from 'three';
import { FeedbackDirector } from './FeedbackDirector';
import { h } from '../ui/dom';
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
  private readonly tutorialOverlay = new TutorialOverlay();
  private tutorial: TutorialDirector | null = null;
  private tipTimer = 0;
  private bossSlowLeft = 0;
  private flashEl: HTMLElement | null = null;
  private slowActive = false;
  private slowElapsed = 0;
  private tipIsDrag = false;

  private readonly sfx = new SfxDirector(this.audio);
  private readonly music = new MusicPlayer(this.audio);
  private feedback!: FeedbackDirector;
  private session: Session | null = null;
  private currentLevelId = 1;
  private endlessSeed = 1;
  private autoplay = false;
  private seedOverride: number | null = null;
  private qualityOverride: Quality | null = null;
  private activeQuality: Quality = 'medium';
  private governor: AutoQualityGovernor | null = null;
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

    this.activeQuality = this.resolveQuality();
    const profile = QUALITY_PROFILES[this.activeQuality];
    this.renderer = new Renderer({
      canvas,
      maxPixelRatio: profile.maxPixelRatio,
      shadows: profile.shadows,
      antialias: profile.antialias,
    });
    this.rig = new CameraRig(this.renderer.camera);
    this.renderer.onResize((w, h) => this.rig.setAspect(w / h));
    this.lighting = new Lighting(profile.shadows);
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

    const vignette = h('div', { class: 'hit-vignette' });
    this.flashEl = h('div', { class: 'screen-flash' });
    uiRoot.append(vignette, this.flashEl);
    this.feedback = new FeedbackDirector(vignette, () => this.save.data.settings);
    // Handy im Querformat: Spiel pausieren, solange der Drehen-Hinweis sichtbar ist
    const landscape = window.matchMedia?.(
      '(orientation: landscape) and (pointer: coarse) and (max-height: 500px)',
    );
    landscape?.addEventListener('change', (e) => {
      if (e.matches && this.machine.state === 'playing') this.pause();
    });
    this.ui = new UIManager(uiRoot);
    this.menu = new MenuScreen({
      play: () => this.startLevel(this.nextLevelId()),
      levels: () => this.openLevelSelect(),
      shop: () => this.openShop(),
      settings: () => this.openSettings(),
    });
    this.levelSelect = new LevelSelectScreen({
      select: (id) => (id === 'endless' ? this.startEndless() : this.startLevel(id)),
      back: () => this.goMenu(),
    });
    this.pauseScreen = new PauseScreen({
      resume: () => this.resume(),
      restart: () => this.startLevel(this.currentLevelId),
      settings: () => this.openSettings(),
      menu: () => this.goMenu(),
    });
    this.result = new ResultScreen({
      next: () =>
        this.startLevel(
          this.isEndless() ? this.currentLevelId + 1 : Math.min(LEVEL_COUNT, this.currentLevelId + 1),
        ),
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
      resetTips: () => this.save.update((d) => (d.tutorialSeen = {})),
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
    this.ui.register('tutorial', this.tutorialOverlay);

    if (params?.debug) this.fpsMeter = new FpsMeter(root);
    this.setupQuality();
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
    this.hud.setLabel(
      levelId > 1000 ? `Endlos · Runde ${levelId - 1000}` : `Level ${levelId} · ${session.level.name}`,
    );
    this.hud.bind(session.world);
    this.ui.show('hud');
    if (this.machine.state !== 'playing') this.machine.go('playing');
    this.input.reset();
    this.input.enabled = true;
    if (this.autoplay) session.sim.start();
    else this.input.onFirstInput = () => session.sim.start();
  }

  /** Startet den Endlosmodus mit neuem Seed bei Runde 1. */
  startEndless(): void {
    this.endlessSeed = this.seedOverride ?? Date.now() % 100000;
    this.startLevel(1001);
  }

  private isEndless(): boolean {
    return this.currentLevelId > 1000;
  }

  /** Render-Statistik (Draw Calls, Dreiecke, GPU-Speicher) für Debug und Messungen. */
  getRenderInfo(): { calls: number; triangles: number; geometries: number; textures: number } {
    const info = this.renderer.three.info;
    return {
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    };
  }

  getSession(): Session | null {
    return this.session;
  }

  pause(): void {
    if (this.machine.state !== 'playing') return;
    this.machine.go('paused');
    this.input.enabled = false;
    this.ui.hide('tutorial');
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
    return initialAutoQuality(window.matchMedia?.('(pointer: coarse)').matches ?? false);
  }

  /** Setzt aktive Qualität und Auto-Regler gemäß Einstellung. */
  private setupQuality(): void {
    const auto = !this.qualityOverride && this.save.data.settings.quality === 'auto';
    this.applyQuality(this.resolveQuality());
    this.governor = auto ? new AutoQualityGovernor(this.activeQuality) : null;
  }

  private applyQuality(q: Quality): void {
    this.activeQuality = q;
    const profile = QUALITY_PROFILES[q];
    this.renderer.applyProfile(profile);
    this.lighting.setShadows(profile.shadows);
  }

  private createSession(levelId: number): void {
    let level: LevelDef;
    if (levelId > 1000) {
      level = generateEndlessLevel(levelId - 1000, this.endlessSeed);
    } else {
      const base = getLevel(levelId);
      if (!base) throw new Error(`Unbekanntes Level ${levelId}`);
      level = this.seedOverride !== null ? { ...base, seed: this.seedOverride } : base;
    }
    if (this.session) {
      this.renderer.scene.remove(this.session.view.root);
      this.session.dispose();
    }
    this.currentLevelId = levelId;
    this.feedback.reset();
    this.tutorial = new TutorialDirector(this.save.data.tutorialSeen);
    this.tipTimer = 0;
    this.slowActive = false;
    const session = new Session({
      level,
      modifiers: modifiersFromUpgrades(this.save.data.upgrades),
      autoplay: this.autoplay,
      quality: this.activeQuality,
      shadows: QUALITY_PROFILES[this.activeQuality].shadows,
    });
    session.timeScale = this.timeScale;
    session.addListener((e, w) => {
      this.hud.onEvent(e);
      this.sfx.onEvent(e, w);
      this.feedback.onEvent(e, w);
      this.tutorial?.onEvent(e);
      this.onJuiceEvent(e);
    });
    this.session = session;
    session.view.attachCamera(this.renderer.camera);
    session.view.setReducedMotion(this.save.data.settings.reducedMotion);
    this.renderer.scene.add(session.view.root);
    this.rig.update(session.world, 0, true);
    // Shader vorab kompilieren (verhindert Ruckler beim ersten Treffer).
    this.renderer.three.compile(this.renderer.scene, this.renderer.camera);
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
    if (patch.quality !== undefined) this.setupQuality();
    this.applySettings();
  }

  private applySettings(): void {
    const st = this.save.data.settings;
    document.documentElement.classList.toggle('reduced-motion', st.reducedMotion);
    this.input.sensitivity = st.sensitivity;
    this.input.mode = st.controlMode;
    this.audio.setSoundEnabled(st.sound);
    this.audio.setMusicEnabled(st.music);
    this.session?.view.setReducedMotion(st.reducedMotion);
  }

  /** Kamera-/Zeit-Effekte (entfallen bei reduzierter Bewegung). */
  private onJuiceEvent(e: SimEvent): void {
    if (this.save.data.settings.reducedMotion) return;
    if (e.type === 'gatePassed' && e.after >= e.before) this.rig.fovPulse = 1;
    if (e.type === 'bossDefeated') {
      this.bossSlowLeft = 0.8;
      this.rig.distanceScale = 0.95;
      const f = this.flashEl;
      if (f) {
        f.style.transition = 'none';
        f.style.opacity = '0.6';
        void f.offsetWidth;
        f.style.transition = 'opacity 0.25s ease-out';
        f.style.opacity = '0';
      }
    }
  }

  /** Hinweise prüfen, anzeigen und Zeitlupe steuern. */
  private updateTutorial(s: Session, frameDt: number): void {
    const reduced = this.save.data.settings.reducedMotion;
    if (this.tutorial && this.tipTimer <= 0) {
      const tip = this.tutorial.check(s.world);
      if (tip) {
        this.save.update((d) => {
          d.tutorialSeen[tip.id] = true;
        });
        let pct: number | null = null;
        if (tip.target) {
          const v = new THREE.Vector3(tip.target.x, 1, -tip.target.z).project(this.renderer.camera);
          pct = (v.x * 0.5 + 0.5) * 100;
        }
        this.tipIsDrag = tip.id === 'drag';
        this.tipTimer = reduced ? 3 : 3.5;
        this.tutorialOverlay.showTip(tip.id, pct);
        this.ui.showOverlay('tutorial');
        if (!this.tipIsDrag && !reduced) {
          this.slowActive = true;
          this.slowElapsed = 0;
        }
      }
    }
    if (this.tipTimer > 0) {
      this.tipTimer -= frameDt;
      const dragStarted = this.tipIsDrag && s.world.phase !== 'ready';
      if (this.tipTimer <= 0 || dragStarted) {
        this.tipTimer = 0;
        this.ui.hide('tutorial');
      }
    }
    if (this.bossSlowLeft > 0) {
      this.bossSlowLeft -= frameDt;
      s.timeScale = this.timeScale * (this.bossSlowLeft > 0 ? 0.25 : 1);
    }
    // Zeitlupe: 1,4 s langsam, danach in 0,3 s zurück auf Normalgeschwindigkeit
    if (this.slowActive) {
      this.slowElapsed += frameDt;
      const t = this.slowElapsed;
      const factor = t < 1.4 ? 0.35 : 0.35 + 0.65 * Math.min(1, (t - 1.4) / 0.3);
      s.timeScale = this.timeScale * factor;
      if (t >= 1.7) {
        this.slowActive = false;
        s.timeScale = this.timeScale;
      }
    }
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
      hasNextLevel: result.victory && (this.isEndless() || this.currentLevelId < LEVEL_COUNT),
      newBestStars,
      totalCoins: this.save.data.coins,
      progress: this.lastResultInfo.progress,
      endless: this.isEndless()
        ? { round: this.currentLevelId - 1000, best: this.save.data.stats.bestEndlessRound }
        : null,
    });
    this.ui.show('hud');
    this.ui.showOverlay('result');
  }

  private updateMusic(): void {
    const st = this.machine.state;
    const w = this.session?.world;
    let mode: 'menu' | 'run' | 'boss' | null = 'menu';
    if (st === 'playing' || st === 'paused') mode = w?.phase === 'bossFight' ? 'boss' : 'run';
    else if (st === 'boot') mode = null;
    if (mode) this.music.setMode(mode);
    this.music.update();
  }

  private frame(frameDt: number): void {
    const s = this.session;
    if (s) {
      const state = this.machine.state;
      if (state === 'playing') {
        const dx = this.input.consumeDeltaX() + this.input.getKeyAxis() * 10 * frameDt;
        s.view.setIndicatorActive(this.input.isPointerDown());
        s.update(frameDt, dx, this.input.getAbsoluteTargetX());
        this.sfx.update(s.world, frameDt);
        this.feedback.update(s.world, frameDt);
        this.hud.update(s.world, this.save.data.coins);
        this.updateTutorial(s, frameDt);
        const next = this.governor?.sample(frameDt * 1000);
        if (next) this.applyQuality(next);
        if (s.sim.isFinished()) this.onFinished();
      } else {
        s.view.sync(s.world, frameDt);
      }
      this.feedback.shake.update(frameDt, this.rig.shakeOffset);
      this.rig.update(s.world, frameDt);
      this.lighting.update(s.world);
    }
    this.updateMusic();
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
