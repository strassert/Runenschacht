import { icon } from '../components/Icon';
import { button } from '../components/Button';
import { h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface PauseCallbacks {
  resume: () => void;
  restart: () => void;
  settings: () => void;
  menu: () => void;
  /** Schaltet Ton und Musik gemeinsam stumm/laut; gibt den neuen Zustand zurück (true = Ton an). */
  toggleMute: () => boolean;
  isSoundOn: () => boolean;
}

export class PauseScreen extends BaseScreen {
  private readonly summary = h('p', { class: 'pause-summary', 'aria-live': 'polite' }, '');

  private readonly muteBtn: HTMLButtonElement;

  constructor(cb: PauseCallbacks) {
    super('screen--overlay');
    this.muteBtn = button('', () => this.setSoundOn(cb.toggleMute()), 'icon', {
      icon: 'soundOn',
      ariaLabel: 'Ton ausschalten',
    });
    this.setSoundOn(cb.isSoundOn());
    this.el.append(
      h(
        'div',
        { class: 'panel col' },
        h('div', { class: 'row pause-head' }, h('h2', { class: 'heading' }, 'Pause'), this.muteBtn),
        this.summary,
        button('Weiter', cb.resume, 'primary'),
        button('Neustart', cb.restart, 'ghost'),
        button('Einstellungen', cb.settings, 'ghost'),
        button('Menü', cb.menu, 'ghost'),
      ),
    );
  }

  setSoundOn(on: boolean): void {
    this.muteBtn.replaceChildren(icon(on ? 'soundOn' : 'soundOff', 26));
    this.muteBtn.setAttribute('aria-label', on ? 'Ton ausschalten' : 'Ton einschalten');
  }

  /** Zusammenfassung für Screenreader, z. B. „87 Soldaten, 64 % geschafft“. */
  setSummary(text: string): void {
    this.summary.textContent = text;
  }
}
