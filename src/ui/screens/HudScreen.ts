import { WEAPONS } from '../../core/config';
import type { SimEvent } from '../../core/events';
import type { WorldState } from '../../core/types';
import { button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';
import { formatCount } from '../../core/math';

export class HudScreen extends BaseScreen {
  onPause: (() => void) | null = null;

  private readonly levelLabel = h('div', { class: 'hud-level' }, 'Level 1');
  private readonly progress = new ProgressBar('hud-progress');
  private readonly coins = h('div', { class: 'hud-coins' }, '0');
  private readonly bossWrap = h('div', { class: 'hud-boss' });
  private readonly bossText = h('div', null, 'BOSS');
  private readonly bossBar = new ProgressBar('bar bar--boss');
  private readonly weaponName = h('span', null, WEAPONS[0].name);
  private readonly pips: HTMLElement[] = [0, 1, 2, 3].map(() => h('i', { class: 'pip' }));
  private readonly weaponBox = h('div', { class: 'hud-bottom-left' });
  private readonly heroWrap = h('div', { class: 'hud-bottom-right' });
  private readonly heroBar = new ProgressBar('bar bar--hero');
  private readonly hint = h('div', { class: 'hud-hint' }, '☝ Ziehen zum Starten');
  private lastTier = -1;
  private lastCoins = -1;

  constructor() {
    super('screen--hud');
    const pauseBtn = button('', () => this.onPause?.(), 'icon', { icon: '⏸', ariaLabel: 'Pause' });
    const top = h('div', { class: 'hud-top' }, this.levelLabel, this.progress.el, this.coins, pauseBtn);
    this.bossWrap.append(this.bossText, this.bossBar.el);
    this.weaponBox.append(this.weaponName, ' ', h('span', { class: 'pips' }, ...this.pips));
    this.heroWrap.append(h('div', null, 'Held'), this.heroBar.el);
    this.el.append(top, this.bossWrap, this.weaponBox, this.heroWrap, this.hint);
    this.bossWrap.style.display = 'none';
    this.heroWrap.style.display = 'none';
  }

  setLabel(text: string): void {
    setText(this.levelLabel, text);
  }

  /** Pro Frame aufrufen; schreibt nur geänderte Werte ins DOM. */
  update(world: WorldState, coins: number): void {
    this.progress.set(world.squad.z / world.arenaZ);
    if (coins !== this.lastCoins) {
      this.lastCoins = coins;
      setText(this.coins, `🪙 ${formatCount(coins)}`);
    }

    const boss = world.phase === 'bossFight' && world.boss.state !== 'dead';
    this.bossWrap.style.display = boss ? '' : 'none';
    if (boss) {
      this.bossBar.set(world.boss.hp / world.boss.maxHp);
      setText(this.bossText, `BOSS ${Math.ceil(world.boss.hp)}`);
    }

    const tier = world.squad.weaponTier;
    if (tier !== this.lastTier) {
      this.lastTier = tier;
      setText(this.weaponName, WEAPONS[tier].name);
      this.pips.forEach((p, i) => p.classList.toggle('pip--on', i <= tier));
    }

    const hero = world.hero;
    this.heroWrap.style.display = hero.active ? '' : 'none';
    if (hero.active) this.heroBar.set(hero.hp / hero.maxHp);

    this.hint.style.display = world.phase === 'ready' ? '' : 'none';
  }

  onEvent(event: SimEvent): void {
    if (event.type === 'weaponUpgraded') {
      this.weaponBox.classList.remove('pulse');
      void this.weaponBox.offsetWidth; // Animation neu starten
      this.weaponBox.classList.add('pulse');
    }
  }
}
