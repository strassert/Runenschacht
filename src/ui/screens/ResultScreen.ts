import { formatCount } from '../../core/math';
import type { DefeatCause, RunResult } from '../../core/scoring';
import { button } from '../components/Button';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface ResultCallbacks {
  next: () => void;
  retry: () => void;
  menu: () => void;
  shop: () => void;
  /** Soundeffekte für Sterne und Münzen. */
  sound?: (name: 'pickup' | 'coin', pitch: number) => void;
}

export interface ResultInfo {
  hasNextLevel: boolean;
  newBestStars: boolean;
  totalCoins: number;
  /** squad.z / arenaZ (0..1) */
  progress: number;
  /** Bisheriger Bestwert dieses Levels (0..1) */
  bestProgress?: number;
  /** Mindestens ein Upgrade ist bezahlbar */
  shopAffordable?: boolean;
  /** Nur im Endlosmodus gesetzt. */
  endless?: { round: number; best: number } | null;
}

const CAUSES: Record<DefeatCause, { title: string; tip: string }> = {
  horde: {
    title: 'Von der Horde überrannt.',
    tip: 'Tipp: Ziele früher auf die Gegner oder weiche in eine freie Spur aus.',
  },
  boss: {
    title: 'Der Boss war zu stark.',
    tip: 'Tipp: Sammle mehr Soldaten und verbessere die Feuerrate im Shop.',
  },
  wall: {
    title: 'In eine Karte gelaufen.',
    tip: 'Tipp: Schieß Karten erst frei, bevor du sie erreichst.',
  },
  gate: { title: 'Falsches Tor erwischt.', tip: 'Tipp: Achte auf rote Tore.' },
};

export class ResultScreen extends BaseScreen {
  private readonly panel = h('div', { class: 'panel col result-panel' });
  private timers: number[] = [];
  private raf = 0;

  constructor(private readonly cb: ResultCallbacks) {
    super('screen--overlay');
    this.el.append(this.panel);
  }

  hide(): void {
    this.cancelAnimations();
    super.hide();
  }

  private cancelAnimations(): void {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    cancelAnimationFrame(this.raf);
  }

  showResult(r: RunResult, info: ResultInfo): void {
    this.cancelAnimations();
    clear(this.panel);
    const row = (label: string, value: string | HTMLElement): HTMLElement =>
      h(
        'div',
        { class: 'result-row' },
        h('span', null, label),
        typeof value === 'string' ? h('b', null, value) : value,
      );

    const progress = h(
      'div',
      {
        class: 'result-progress',
        role: 'img',
        'aria-label': `Fortschritt ${Math.round(info.progress * 100)} Prozent`,
      },
      h('i', { class: 'result-progress__fill', style: `width:${Math.round(info.progress * 100)}%` }),
      info.bestProgress !== undefined && info.bestProgress > 0
        ? h('i', { class: 'result-progress__best', style: `left:${Math.round(info.bestProgress * 100)}%` })
        : null,
    );

    const coinValue = h('b', null, '+0 🪙');
    this.animateCoins(coinValue, r.coins);

    if (r.victory) {
      const stars = [0, 1, 2].map(() => h('span', { class: 'star' }, '★'));
      stars.forEach((el, i) => {
        if (i >= r.stars) return;
        this.timers.push(
          window.setTimeout(
            () => {
              el.classList.add('star--on', 'star--pop');
              this.cb.sound?.('pickup', 1 + i * 0.2);
            },
            300 + i * 250,
          ),
        );
      });
      this.panel.append(
        h('h2', { class: 'heading heading--gold' }, info.endless ? `RUNDE ${info.endless.round}!` : 'SIEG!'),
        h('div', { class: 'result-stars', 'aria-label': `${r.stars} von 3 Sternen` }, ...stars),
        ...(info.newBestStars ? [h('div', { class: 'result-badge' }, 'NEUER REKORD')] : []),
        row('Überlebende', String(r.survivors)),
        row('Besiegte Gegner', formatCount(r.enemiesKilled)),
        row('Münzen', coinValue),
        ...(info.hasNextLevel
          ? [
              button(info.endless ? 'Nächste Runde' : 'Weiter', this.cb.next, 'gold', {
                size: 'lg',
                icon: 'next',
              }),
            ]
          : []),
        h(
          'div',
          { class: 'row result-secondary' },
          button('Nochmal', this.cb.retry, 'ghost', { icon: 'retry' }),
          button('Menü', this.cb.menu, 'ghost', { icon: 'home' }),
        ),
      );
    } else {
      const cause = r.defeatCause ? CAUSES[r.defeatCause] : null;
      this.panel.append(
        h('h2', { class: 'heading heading--red' }, 'NIEDERLAGE'),
        ...(cause ? [h('p', { class: 'result-cause' }, h('b', null, cause.title), ' ', cause.tip)] : []),
        ...(info.endless
          ? [row('Erreichte Runde', String(info.endless.round)), row('Rekord', String(info.endless.best))]
          : [row('Fortschritt', `${Math.round(info.progress * 100)} %`), progress]),
        row('Besiegte Gegner', formatCount(r.enemiesKilled)),
        row('Münzen', coinValue),
        button('Nochmal', this.cb.retry, 'primary', { size: 'lg', icon: 'retry' }),
        button('Shop', this.cb.shop, 'gold', {
          icon: 'cart',
          dot: info.shopAffordable,
          badge: info.shopAffordable ? 'Upgrade verfügbar' : undefined,
        }),
        button('Menü', this.cb.menu, 'ghost', { icon: 'home' }),
      );
    }
  }

  /** Zählt die Münzen in 800 ms hoch (mit Klick-Sounds, höchstens alle 50 ms). */
  private animateCoins(el: HTMLElement, total: number): void {
    if (total <= 0) {
      el.textContent = '+0 🪙';
      return;
    }
    const start = performance.now();
    let lastSound = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / 800);
      el.textContent = `+${Math.round(total * t)} 🪙`;
      if (now - lastSound >= 50 && t < 1) {
        lastSound = now;
        this.cb.sound?.('coin', 0.9 + t * 0.4);
      }
      if (t < 1) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
}
