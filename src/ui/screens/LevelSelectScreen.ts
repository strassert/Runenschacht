import { LEVELS, LEVEL_COUNT } from '../../core/level/levels';
import type { SaveData } from '../../persistence/SaveManager';
import { button } from '../components/Button';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface LevelSelectCallbacks {
  select: (levelId: number | 'endless') => void;
  back: () => void;
}

export class LevelSelectScreen extends BaseScreen {
  private readonly grid = h('div', { class: 'level-grid' });

  constructor(private readonly cb: LevelSelectCallbacks) {
    super('screen--panel');
    this.el.append(
      h('h2', { class: 'heading' }, 'Level wählen'),
      this.grid,
      button('Zurück', cb.back, 'ghost'),
    );
  }

  refresh(save: Readonly<SaveData>): void {
    clear(this.grid);
    for (const lvl of LEVELS) {
      const locked = lvl.id > save.highestUnlockedLevel;
      const stars = save.levelStars[String(lvl.id)] ?? 0;
      const tile = h(
        'button',
        {
          class: `level-tile${locked ? ' level-tile--locked' : ''}`,
          type: 'button',
          'data-ui-interactive': true,
          disabled: locked,
          'aria-label': `Level ${lvl.id}: ${lvl.name}${locked ? ' (gesperrt)' : ''}`,
          onclick: () => this.cb.select(lvl.id),
        },
        h('span', { class: 'level-tile__num' }, locked ? '🔒' : String(lvl.id)),
        h('span', { class: 'level-tile__name' }, lvl.name),
        h('span', { class: 'level-tile__stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
      );
      this.grid.append(tile);
    }
    const endlessLocked = save.highestUnlockedLevel <= LEVEL_COUNT;
    this.grid.append(
      h(
        'button',
        {
          class: `level-tile level-tile--endless${endlessLocked ? ' level-tile--locked' : ''}`,
          type: 'button',
          'data-ui-interactive': true,
          disabled: endlessLocked,
          'aria-label': 'Endlosmodus',
          onclick: () => this.cb.select('endless'),
        },
        h('span', { class: 'level-tile__num' }, endlessLocked ? '🔒' : '∞'),
        h('span', { class: 'level-tile__name' }, 'Endlos'),
        h(
          'span',
          { class: 'level-tile__stars' },
          save.stats.bestEndlessRound > 0 ? `Rekord ${save.stats.bestEndlessRound}` : ' ',
        ),
      ),
    );
  }
}
