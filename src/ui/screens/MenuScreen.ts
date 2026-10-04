import { formatCount } from '../../core/math';
import { button } from '../components/Button';
import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';

export interface MenuCallbacks {
  play: () => void;
  levels: () => void;
  shop: () => void;
  settings: () => void;
}

export class MenuScreen extends BaseScreen {
  private readonly coins = h('div', { class: 'menu-coins' }, '🪙 0');
  private readonly playBtn: HTMLButtonElement;
  private playLabel = '';
  private shopBtn: HTMLButtonElement;

  constructor(cb: MenuCallbacks) {
    super('screen--menu');
    this.shopBtn = button('Shop', cb.shop, 'ghost');
    this.playBtn = button('Spielen', cb.play, 'gold');
    this.playBtn.classList.add('btn--lg');
    this.el.append(
      this.coins,
      h(
        'div',
        { class: 'menu-logo' },
        h('h1', { class: 'title' }, 'RUNENSCHACHT'),
        h('p', { class: 'subtitle' }, 'Brückensturm'),
      ),
      h(
        'div',
        { class: 'col menu-buttons' },
        this.playBtn,
        button('Level', cb.levels, 'ghost'),
        this.shopBtn,
        button('Einstellungen', cb.settings, 'ghost'),
      ),
    );
  }

  /** Zeigt am Shop-Button einen pulsierenden Punkt, wenn ein Upgrade bezahlbar ist. */
  setShopDot(on: boolean): void {
    const has = this.shopBtn.querySelector('.btn__dot');
    if (on && !has) this.shopBtn.append(h('i', { class: 'btn__dot' }));
    if (!on && has) has.remove();
  }

  setCoins(n: number): void {
    setText(this.coins, `🪙 ${formatCount(n)}`);
  }

  /** Beschriftet den Hauptbutton, z. B. „Spielen – Level 3“. */
  setNextLevel(label: string): void {
    if (label === this.playLabel) return;
    this.playLabel = label;
    this.playBtn.textContent = `Spielen – ${label}`;
  }
}
