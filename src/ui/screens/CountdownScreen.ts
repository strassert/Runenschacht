import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';

/** Große 3-2-1-Anzeige nach dem Fortsetzen. */
export class CountdownScreen extends BaseScreen {
  private readonly number = h('div', { class: 'countdown', 'aria-live': 'assertive' }, '3');

  constructor() {
    super('screen--countdown', false);
    this.el.append(this.number);
  }

  setNumber(n: number): void {
    setText(this.number, String(n));
    this.number.style.animation = 'none';
    void this.number.offsetWidth;
    this.number.style.animation = '';
  }
}
