import { changeSoldiers } from '../core/world';
import type { Quality } from '../render/quality';
import type { App } from './App';

export interface DebugParams {
  level: number | null;
  seed: number | null;
  autoplay: boolean;
  speed: number;
  debug: boolean;
  quality: Quality | null;
}

function num(v: string | null): number | null {
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parst location.search. speed auf 1..8 begrenzt; ungültige Werte → Standard. */
export function parseDebugParams(search: string): DebugParams {
  const p = new URLSearchParams(search);
  const level = num(p.get('level'));
  const seed = num(p.get('seed'));
  const speed = num(p.get('speed'));
  const q = p.get('quality');
  return {
    level: level !== null && level >= 1 ? Math.floor(level) : null,
    seed: seed !== null ? Math.floor(seed) : null,
    autoplay: p.get('autoplay') === '1',
    speed: speed !== null ? Math.min(8, Math.max(1, speed)) : 1,
    debug: p.get('debug') === '1',
    quality: q === 'low' || q === 'medium' || q === 'high' ? q : null,
  };
}

export class FpsMeter {
  private readonly el: HTMLElement;
  private acc = 0;
  private frames = 0;
  fps = 0;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:absolute;top:4px;left:4px;z-index:50;padding:3px 6px;font:11px/1.3 monospace;color:#fff;background:rgba(0,0,0,.55);border-radius:4px;pointer-events:none;white-space:pre';
    parent.appendChild(this.el);
  }

  update(frameDt: number, info: string): void {
    this.acc += frameDt;
    this.frames++;
    if (this.acc >= 0.5) {
      this.fps = Math.round(this.frames / this.acc);
      this.el.textContent = `${this.fps} FPS | ${info}`;
      this.acc = 0;
      this.frames = 0;
    }
  }

  dispose(): void {
    this.el.remove();
  }
}

export interface DebugApi {
  getState(): {
    state: string;
    phase: string;
    count: number;
    x: number;
    z: number;
    bossHp: number;
    weaponTier: number;
    heroActive: boolean;
    fps: number;
  } | null;
  renderInfo(): { calls: number; triangles: number; geometries: number; textures: number };
  start(level: number): void;
  skipTo(z: number): void;
  win(): void;
  lose(): void;
}

/** Hängt window.__game an (nur für Debug). */
export function installDebugApi(app: App): void {
  const api: DebugApi = {
    getState() {
      const s = app.getSession();
      if (!s) return null;
      const w = s.world;
      return {
        state: app.machine.state,
        phase: w.phase,
        count: w.squad.count,
        x: w.squad.x,
        z: w.squad.z,
        bossHp: w.boss.hp,
        weaponTier: w.squad.weaponTier,
        heroActive: w.hero.active,
        fps: app.fps,
      };
    },
    renderInfo() {
      return app.getRenderInfo();
    },
    start(level) {
      app.startLevel(level);
    },
    skipTo(z) {
      const s = app.getSession();
      if (!s) return;
      s.world.squad.z = z;
      s.world.squad.prevZ = z;
    },
    win() {
      const s = app.getSession();
      if (!s) return;
      s.sim.start();
      s.world.boss.hp = 0;
      s.world.boss.state = 'dead';
    },
    lose() {
      const s = app.getSession();
      if (!s) return;
      s.sim.start();
      changeSoldiers(s.world, -s.world.squad.count, 'enemy');
      s.world.hero.active = false;
    },
  };
  (window as unknown as { __game: DebugApi }).__game = api;
}
