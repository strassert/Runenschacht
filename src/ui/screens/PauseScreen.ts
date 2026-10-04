import { button } from '../components/Button';
import { h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface PauseCallbacks {
  resume: () => void;
  restart: () => void;
  settings: () => void;
  menu: () => void;
}

export class PauseScreen extends BaseScreen {
  private readonly summary = h('p', { class: 'pause-summary', 'aria-live': 'polite' }, '');

  constructor(cb: PauseCallbacks) {
    super('screen--overlay');
    this.el.append(
      h(
        'div',
        { class: 'panel col' },
        h('h2', { class: 'heading' }, 'Pause'),
        this.summary,
        button('Weiter', cb.resume, 'primary'),
        button('Neustart', cb.restart, 'ghost'),
        button('Einstellungen', cb.settings, 'ghost'),
        button('Menü', cb.menu, 'ghost'),
      ),
    );
  }

  /** Zusammenfassung für Screenreader, z. B. „87 Soldaten, 64 % geschafft“. */
  setSummary(text: string): void {
    this.summary.textContent = text;
  }
}
