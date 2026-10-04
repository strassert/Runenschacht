import { h } from './dom';

export type ScreenName =
  'loading' | 'menu' | 'levelSelect' | 'hud' | 'pause' | 'result' | 'shop' | 'settings' | 'tutorial';

export interface Screen {
  readonly el: HTMLElement;
  show(): void;
  hide(): void;
  destroy(): void;
}

/** Gemeinsame Basis: ein Container mit der Klasse "screen". */
export abstract class BaseScreen implements Screen {
  readonly el: HTMLElement;

  constructor(extraClass = '') {
    this.el = h('div', { class: `screen hidden ${extraClass}`.trim() });
  }

  show(): void {
    this.el.classList.remove('hidden');
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  destroy(): void {
    this.el.remove();
  }
}

export class UIManager {
  private readonly screens = new Map<ScreenName, Screen>();
  private readonly visible = new Set<ScreenName>();

  constructor(private readonly root: HTMLElement) {}

  /** Hängt el an root und versteckt den Bildschirm. */
  register(name: ScreenName, screen: Screen): void {
    this.screens.set(name, screen);
    screen.hide();
    this.root.appendChild(screen.el);
  }

  get<T extends Screen>(name: ScreenName): T {
    const s = this.screens.get(name);
    if (!s) throw new Error(`Bildschirm ${name} nicht registriert`);
    return s as T;
  }

  /** Zeigt genau diesen Bildschirm (alle anderen werden versteckt). */
  show(name: ScreenName): void {
    this.hideAll();
    this.showOverlay(name);
  }

  /** Zeigt zusätzlich über den aktuellen Bildschirmen. */
  showOverlay(name: ScreenName): void {
    this.get(name).show();
    this.visible.add(name);
  }

  hide(name: ScreenName): void {
    this.screens.get(name)?.hide();
    this.visible.delete(name);
  }

  isVisible(name: ScreenName): boolean {
    return this.visible.has(name);
  }

  hideAll(): void {
    for (const n of [...this.visible]) this.hide(n);
  }
}
