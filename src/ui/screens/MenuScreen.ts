import { formatCount } from '../../core/math';
import { button } from '../components/Button';
import { icon, type IconName } from '../components/Icon';
import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';

export interface MenuCallbacks {
  play: () => void;
  levels: () => void;
  shop: () => void;
  settings: () => void;
}

export class MenuScreen extends BaseScreen {
  private readonly coins = h('div', { class: 'pill menu-coins' });
  private readonly coinText = h('span', null, '0');
  private readonly playBtn: HTMLButtonElement;
  private readonly playSub = h('small', { class: 'menu-play__sub' }, '');
  private readonly shopBtn: HTMLButtonElement;
  private playLabel = '';

  constructor(cb: MenuCallbacks) {
    super('screen--menu');
    this.coins.append(icon('coin', 18), this.coinText);
    this.playBtn = button('', cb.play, 'gold', { size: 'lg', ariaLabel: 'Spielen' });
    this.playBtn.classList.add('menu-play');
    this.playBtn.replaceChildren(
      h('span', { class: 'menu-play__label' }, icon('play', 28), h('span', null, 'SPIELEN')),
      this.playSub,
    );
    this.shopBtn = button('', cb.shop, 'icon', { icon: 'cart', ariaLabel: 'Shop' });
    const tool = (label: string, btn: HTMLButtonElement): HTMLElement =>
      h('div', { class: 'menu-tool' }, btn, h('span', null, label));
    const mk = (name: IconName, label: string, fn: () => void): HTMLElement =>
      tool(label, button('', fn, 'icon', { icon: name, ariaLabel: label }));

    this.el.append(
      this.coins,
      h(
        'div',
        { class: 'menu-logo' },
        h('h1', { class: 'title menu-title' }, 'RUNENSCHACHT'),
        h('p', { class: 'subtitle' }, 'Brückensturm'),
      ),
      h(
        'div',
        { class: 'menu-bottom' },
        this.playBtn,
        h(
          'div',
          { class: 'menu-tools' },
          mk('map', 'Level', cb.levels),
          tool('Shop', this.shopBtn),
          mk('gear', 'Optionen', cb.settings),
        ),
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
    setText(this.coinText, formatCount(n));
  }

  /** Beschriftet die Zeile unter „Spielen“, z. B. „Level 3 · Wasserfall-Pass“. */
  setNextLevel(label: string): void {
    if (label === this.playLabel) return;
    this.playLabel = label;
    setText(this.playSub, label);
  }
}
