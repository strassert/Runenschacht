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
  constructor(cb: PauseCallbacks) {
    super('screen--overlay');
    this.el.append(
      h(
        'div',
        { class: 'panel col' },
        h('h2', { class: 'heading' }, 'Pause'),
        button('Weiter', cb.resume, 'primary'),
        button('Neustart', cb.restart, 'ghost'),
        button('Einstellungen', cb.settings, 'ghost'),
        button('Menü', cb.menu, 'ghost'),
      ),
    );
  }
}
