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
  private world: WorldState | null = null;
  private readonly combo = h('div', { class: 'hud-combo' });
  private readonly banner = h('div', { class: 'hud-banner' });
  private readonly gateResult = h('div', { class: 'hud-gate-result' });
  private comboCount = 0;
  private lastBlockMs = -1e9;
  private comboHideAt = 0;
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
    this.el.append(
      top,
      this.bossWrap,
      this.weaponBox,
      this.heroWrap,
      this.hint,
      this.combo,
      this.banner,
      this.gateResult,
    );
    this.bossWrap.classList.add('hud-boss--hidden');
    this.heroWrap.style.display = 'none';
  }

  /** Beschriftung über dem Fortschrittsbalken, z. B. „Level 3 · Wasserfall-Pass“. */
  setLabel(text: string): void {
    setText(this.levelLabel, text);
  }

  /** Baut die Meilenstein-Marker (Karten, Tore, Boss) für eine neue Welt. */
  bind(world: WorldState): void {
    this.world = world;
    this.comboCount = 0;
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
    this.tick();
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
    switch (event.type) {
      case 'weaponUpgraded':
        this.popElement(this.weaponBox);
        this.showBanner('sword', `${WEAPONS[event.tier].name.toUpperCase()}!`);
        break;
      case 'heroJoined':
        this.popElement(this.heroWrap);
        this.showBanner('shield', 'HELD SCHLIESST SICH AN!');
        break;
      case 'cardUnlocked': {
        const card = this.world?.cards[event.id];
        if (event.kind === 'soldiers' && card) this.showBanner('heart', `+${card.reward} SOLDATEN!`);
        break;
      }
      case 'gatePassed': {
        const good = event.after >= event.before;
        const sym = { add: '+', sub: '\u2212', mul: '\u00d7', div: '\u00f7' }[event.op];
        this.gateResult.textContent = `${sym}${event.value}`;
        this.gateResult.className = `hud-gate-result ${good ? 'is-good' : 'is-bad'} is-on`;
        this.restart(this.gateResult);
        break;
      }
      case 'blockCollected': {
        const now = performance.now();
        this.comboCount = now - this.lastBlockMs <= 600 ? this.comboCount + 1 : 1;
        this.lastBlockMs = now;
        if (this.comboCount >= 5) {
          this.combo.textContent = `KOMBO \u00d7${this.comboCount}`;
          this.combo.classList.add('is-on');
          this.restart(this.combo);
          this.comboHideAt = now + 900;
        }
        break;
      }
      default:
        break;
    }
  }

  /** Blendet abgelaufene Kombo-/Tor-Anzeigen aus (pro Frame). */
  tick(): void {
    if (this.comboHideAt && performance.now() > this.comboHideAt) {
      this.comboHideAt = 0;
      this.combo.classList.remove('is-on');
    }
  }

  private showBanner(name: IconName, text: string): void {
    this.banner.replaceChildren(icon(name, 28), h('span', null, text));
    this.banner.classList.add('is-on');
    this.restart(this.banner);
    window.setTimeout(() => this.banner.classList.remove('is-on'), 1000);
  }

  private restart(el: HTMLElement): void {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  private popElement(el: HTMLElement): void {
    el.classList.remove('pop-anim');
    void el.offsetWidth; // Animation neu starten
    el.classList.add('pop-anim');
  }
}
