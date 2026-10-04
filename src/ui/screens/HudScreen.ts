import { WEAPONS } from '../../core/config';
import type { SimEvent } from '../../core/events';
import { formatCount } from '../../core/math';
import type { WorldState } from '../../core/types';
import { button } from '../components/Button';
import { icon, type IconName } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';

interface Marker {
  el: HTMLElement;
  done: () => boolean;
  isDone: boolean;
}

export class HudScreen extends BaseScreen {
  onPause: (() => void) | null = null;

  private readonly levelLabel = h('div', { class: 'hud-level' }, 'Level 1');
  private readonly progress = new ProgressBar('hud-progress');
  private readonly coinsText = h('span', null, '0');
  private readonly bossWrap = h('div', { class: 'hud-boss' });
  private readonly bossHp = h('span', null, '');
  private readonly bossBar = new ProgressBar('bar bar--boss', true);
  private readonly weaponName = h('span', null, WEAPONS[0].name);
  private readonly pips: HTMLElement[] = [0, 1, 2, 3].map(() => h('i', { class: 'pip' }));
  private readonly weaponBox = h('div', { class: 'hud-pill hud-bottom-left' });
  private readonly heroWrap = h('div', { class: 'hud-pill hud-bottom-right' });
  private readonly heroBar = new ProgressBar('bar bar--hero');
  private readonly hint = h(
    'div',
    { class: 'hud-hint' },
    icon('hand', 22),
    h('span', null, 'Ziehen zum Starten'),
  );
  private readonly markerLayer = h('div', { class: 'hud-markers' });
  private markers: Marker[] = [];
  private lastTier = -1;
  private lastCoins = -1;
  private hintVisible = true;
  private bossVisible = false;
  private heroVisible = false;

  constructor() {
    super('screen--hud');
    const pauseBtn = button('', () => this.onPause?.(), 'icon', { icon: 'pause', ariaLabel: 'Pause' });
    const center = h(
      'div',
      { class: 'hud-center' },
      this.levelLabel,
      h('div', { class: 'hud-progress-wrap' }, this.progress.el, this.markerLayer),
    );
    const coins = h('div', { class: 'pill hud-coins' }, icon('coin', 18), this.coinsText);
    const top = h('div', { class: 'hud-top' }, pauseBtn, center, coins);

    this.bossWrap.append(
      h('div', { class: 'hud-boss__head' }, h('span', null, 'Wächter des Schachts'), this.bossHp),
      this.bossBar.el,
    );
    this.weaponBox.append(icon('sword', 16), this.weaponName, h('span', { class: 'pips' }, ...this.pips));
    this.heroWrap.append(icon('heart', 16), this.heroBar.el);
    this.el.append(top, this.bossWrap, this.weaponBox, this.heroWrap, this.hint);
    this.bossWrap.classList.add('hud-boss--hidden');
    this.heroWrap.style.display = 'none';
  }

  /** Beschriftung über dem Fortschrittsbalken, z. B. „Level 3 · Wasserfall-Pass“. */
  setLabel(text: string): void {
    setText(this.levelLabel, text);
  }

  /** Baut die Meilenstein-Marker (Karten, Tore, Boss) für eine neue Welt. */
  bind(world: WorldState): void {
    this.markerLayer.replaceChildren();
    this.markers = [];
    const add = (z: number, name: IconName, cls: string, done: () => boolean): void => {
      const el = h(
        'span',
        { class: `hud-marker ${cls}`, style: `left:${((z / world.arenaZ) * 100).toFixed(2)}%` },
        icon(name, 12),
      );
      this.markerLayer.append(el);
      this.markers.push({ el, done, isDone: false });
    };
    for (const c of world.cards) {
      const name: IconName = c.kind === 'weapon' ? 'sword' : c.kind === 'hero' ? 'shield' : 'heart';
      add(c.z, name, 'hud-marker--card', () => c.state !== 'locked');
    }
    for (const g of world.gates) add(g.z, 'chevronLeft', 'hud-marker--gate', () => g.passed);
    add(world.arenaZ, 'skull', 'hud-marker--boss', () => world.boss.state === 'dead');
    this.lastTier = -1;
    this.lastCoins = -1;
    this.hintVisible = true;
  }

  /** Pro Frame aufrufen; schreibt nur geänderte Werte ins DOM. */
  update(world: WorldState, coins: number): void {
    this.progress.set(world.squad.z / world.arenaZ);
    for (const m of this.markers) {
      const d = m.done();
      if (d !== m.isDone) {
        m.isDone = d;
        m.el.classList.toggle('is-done', d);
      }
    }
    if (coins !== this.lastCoins) {
      this.lastCoins = coins;
      setText(this.coinsText, formatCount(coins));
    }

    const boss = world.phase === 'bossFight' && world.boss.state !== 'dead';
    if (boss !== this.bossVisible) {
      this.bossVisible = boss;
      this.bossWrap.classList.toggle('hud-boss--hidden', !boss);
    }
    if (boss) {
      this.bossBar.set(world.boss.hp / world.boss.maxHp);
      setText(this.bossHp, String(Math.ceil(world.boss.hp)));
    }

    const tier = world.squad.weaponTier;
    if (tier !== this.lastTier) {
      this.lastTier = tier;
      setText(this.weaponName, WEAPONS[tier].name);
      this.pips.forEach((p, i) => p.classList.toggle('pip--on', i <= tier));
    }

    const hero = world.hero;
    if (hero.active !== this.heroVisible) {
      this.heroVisible = hero.active;
      this.heroWrap.style.display = hero.active ? '' : 'none';
    }
    if (hero.active) this.heroBar.set(hero.hp / hero.maxHp);

    const showHint = world.phase === 'ready';
    if (showHint !== this.hintVisible) {
      this.hintVisible = showHint;
      this.hint.style.display = showHint ? '' : 'none';
    }
  }

  onEvent(event: SimEvent): void {
    if (event.type === 'weaponUpgraded') this.popElement(this.weaponBox);
    else if (event.type === 'heroJoined') this.popElement(this.heroWrap);
  }

  private popElement(el: HTMLElement): void {
    el.classList.remove('pop-anim');
    void el.offsetWidth; // Animation neu starten
    el.classList.add('pop-anim');
  }
}
