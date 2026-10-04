import { h } from './dom';

export type ScreenName =
  | 'loading'
  | 'menu'
  | 'levelSelect'
  | 'hud'
  | 'pause'
  | 'result'
  | 'shop'
  | 'settings'
  | 'tutorial'
  | 'countdown';

export interface Screen {
  readonly el: HTMLElement;
  show(): void;
  hide(): void;
  destroy(): void;
}

/** Gemeinsame Basis: ein Container mit der Klasse "screen". */
export abstract class BaseScreen implements Screen {
  readonly el: HTMLElement;

  constructor(
    extraClass = '',
    private readonly autoFocus = true,
  ) {
    this.el = h('div', { class: `screen hidden ${extraClass}`.trim() });
    if (extraClass.includes('screen--overlay')) {
      this.el.setAttribute('role', 'dialog');
      this.el.setAttribute('aria-modal', 'true');
      // Fokus-Falle: Tab bleibt im Dialog
      this.el.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const items = this.focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    }
  }

  private focusables(): HTMLElement[] {
    return [...this.el.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]')];
  }

  /** Setzt den Fokus auf die Primäraktion (Tastatur-/Screenreader-Nutzung). */
  focusPrimary(): void {
    const el =
      this.el.querySelector<HTMLElement>('.btn--gold:not(:disabled), .btn--primary:not(:disabled)') ??
      this.focusables()[0];
    el?.focus({ preventScroll: true });
  }

  show(): void {
    const wasHidden = this.el.classList.contains('hidden');
    this.el.classList.remove('hidden');
    if (wasHidden) {
      // Ein-/Einblend-Animation; währenddessen keine Eingaben (verhindert Doppelklicks)
      this.el.classList.remove('screen--enter');
      void this.el.offsetWidth;
      this.el.classList.add('screen--enter');
      window.setTimeout(() => {
        this.el.classList.remove('screen--enter');
        if (this.autoFocus && !this.el.classList.contains('hidden')) this.focusPrimary();
      }, 230);
    }
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
