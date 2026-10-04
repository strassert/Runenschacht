import { formatCount } from '../../core/math';
import type { RunResult } from '../../core/scoring';
import { button } from '../components/Button';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface ResultCallbacks {
  next: () => void;
  retry: () => void;
  menu: () => void;
  shop: () => void;
}

export interface ResultInfo {
  hasNextLevel: boolean;
  newBestStars: boolean;
  totalCoins: number;
  /** squad.z / arenaZ (0..1) */
  progress: number;
  /** Nur im Endlosmodus gesetzt. */
  endless?: { round: number; best: number } | null;
}

export class ResultScreen extends BaseScreen {
  private readonly panel = h('div', { class: 'panel col result-panel' });

  constructor(private readonly cb: ResultCallbacks) {
    super('screen--overlay');
    this.el.append(this.panel);
  }

  showResult(r: RunResult, info: ResultInfo): void {
    clear(this.panel);
    const row = (label: string, value: string): HTMLElement =>
      h('div', { class: 'result-row' }, h('span', null, label), h('b', null, value));

    if (r.victory) {
      this.panel.append(
        h('h2', { class: 'heading heading--gold' }, info.endless ? `RUNDE ${info.endless.round}!` : 'SIEG!'),
        h(
          'div',
          { class: 'result-stars', 'aria-label': `${r.stars} von 3 Sternen` },
          ...[0, 1, 2].map((i) => h('span', { class: i < r.stars ? 'star star--on' : 'star' }, '★')),
        ),
        ...(info.newBestStars ? [h('div', { class: 'result-badge' }, 'Neuer Rekord!')] : []),
        row('Überlebende', String(r.survivors)),
        row('Besiegte Gegner', formatCount(r.enemiesKilled)),
        row('Münzen', `+${r.coins} 🪙`),
        ...(info.hasNextLevel
          ? [button(info.endless ? 'Nächste Runde' : 'Weiter', this.cb.next, 'gold')]
          : []),
        button('Nochmal', this.cb.retry, info.hasNextLevel ? 'ghost' : 'primary'),
        button('Menü', this.cb.menu, 'ghost'),
      );
    } else {
      this.panel.append(
        h('h2', { class: 'heading heading--red' }, 'NIEDERLAGE'),
        ...(info.endless
          ? [row('Erreichte Runde', String(info.endless.round)), row('Rekord', String(info.endless.best))]
          : [row('Fortschritt', `${Math.round(info.progress * 100)} %`)]),
        row('Besiegte Gegner', formatCount(r.enemiesKilled)),
        row('Münzen', `+${r.coins} 🪙`),
        button('Nochmal', this.cb.retry, 'primary'),
        button('Shop', this.cb.shop, 'gold'),
        button('Menü', this.cb.menu, 'ghost'),
      );
    }
  }
}
