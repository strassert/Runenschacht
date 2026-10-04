import { LEVELS, LEVEL_COUNT } from '../../core/level/levels';
import type { SaveData } from '../../persistence/SaveManager';
import { button } from '../components/Button';
import { icon } from '../components/Icon';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface LevelSelectCallbacks {
  select: (levelId: number | 'endless') => void;
  back: () => void;
}

const STEP = 112;
const NS = 'http://www.w3.org/2000/svg';

/** Levelkarte: vertikaler Pfad mit Knoten (Level 1 unten, Endlos oben). */
export class LevelSelectScreen extends BaseScreen {
  private readonly scroller = h('div', { class: 'map-scroll' });
  private readonly sheet = h('div', { class: 'level-sheet hidden' });
  private current: HTMLElement | null = null;

  constructor(private readonly cb: LevelSelectCallbacks) {
    super('screen--panel screen--map');
    const head = h(
      'div',
      { class: 'map-head' },
      button('', cb.back, 'icon', { icon: 'chevronLeft', ariaLabel: 'Zurück' }),
      h('h2', { class: 'heading' }, 'Level wählen'),
    );
    this.el.append(head, this.scroller, this.sheet);
    this.scroller.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const nodes = [...this.scroller.querySelectorAll<HTMLButtonElement>('.map-node:not(:disabled)')];
      const i = nodes.indexOf(document.activeElement as HTMLButtonElement);
      // Knoten sind von unten nach oben sortiert: Pfeil hoch = nächstes Level
      const next = nodes[i + (e.key === 'ArrowUp' ? 1 : -1)];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    });
  }

  refresh(save: Readonly<SaveData>): void {
    this.closeSheet();
    clear(this.scroller);
    const total = LEVEL_COUNT + 1; // + Endlos
    const height = total * STEP + 80;
    const pos = (i: number): { x: number; y: number } => ({
      x: 50 + Math.sin(i * 1.15) * 26,
      y: height - 70 - i * STEP,
    });
    const field = h('div', { class: 'map-field', style: `height:${height}px` });

    // Verbindungslinie
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'map-path');
    svg.setAttribute('viewBox', `0 0 100 ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    let d = '';
    for (let i = 0; i < total; i++) {
      const p = pos(i);
      if (i === 0) d += `M ${p.x} ${p.y}`;
      else {
        const q = pos(i - 1);
        d += ` C ${q.x} ${q.y - STEP / 2}, ${p.x} ${p.y + STEP / 2}, ${p.x} ${p.y}`;
      }
    }
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
    field.append(svg);

    this.current = null;
    LEVELS.forEach((lvl, i) => {
      const locked = lvl.id > save.highestUnlockedLevel;
      const isCurrent = lvl.id === Math.min(save.highestUnlockedLevel, LEVEL_COUNT);
      const stars = save.levelStars[String(lvl.id)] ?? 0;
      const p = pos(i);
      const node = h(
        'button',
        {
          class: `map-node${locked ? ' map-node--locked' : ''}${isCurrent ? ' map-node--current' : ''}`,
          type: 'button',
          'data-ui-interactive': true,
          style: `left:${p.x}%;top:${p.y}px`,
          disabled: locked,
          'aria-label': `Level ${lvl.id}: ${lvl.name}${locked ? ' (gesperrt)' : ''}, ${stars} von 3 Sternen`,
          onclick: () => this.openSheet(save, lvl.id),
        },
        locked ? icon('lock', 26) : h('span', { class: 'map-node__num' }, String(lvl.id)),
        h(
          'span',
          { class: 'map-node__stars', 'aria-hidden': 'true' },
          '★'.repeat(stars) + '☆'.repeat(3 - stars),
        ),
      );
      if (isCurrent) this.current = node;
      field.append(node);
    });

    const endlessLocked = save.highestUnlockedLevel <= LEVEL_COUNT;
    const pe = pos(LEVEL_COUNT);
    field.append(
      h(
        'button',
        {
          class: `map-node map-node--endless${endlessLocked ? ' map-node--locked' : ''}`,
          type: 'button',
          'data-ui-interactive': true,
          style: `left:${pe.x}%;top:${pe.y}px`,
          disabled: endlessLocked,
          'aria-label': endlessLocked ? 'Endlosmodus (gesperrt)' : 'Endlosmodus',
          onclick: () => this.openSheet(save, 'endless'),
        },
        icon(endlessLocked ? 'lock' : 'infinity', 30),
        h(
          'span',
          { class: 'map-node__stars' },
          save.stats.bestEndlessRound > 0 ? `Rekord ${save.stats.bestEndlessRound}` : ' ',
        ),
      ),
    );
    this.scroller.append(field);
  }

  show(): void {
    super.show();
    // Aktuellen Knoten in die Bildmitte scrollen
    window.setTimeout(() => this.current?.scrollIntoView({ block: 'center' }), 0);
  }

  private closeSheet(): void {
    this.sheet.classList.add('hidden');
  }

  private openSheet(save: Readonly<SaveData>, id: number | 'endless'): void {
    clear(this.sheet);
    const close = button('', () => this.closeSheet(), 'icon', { icon: 'close', ariaLabel: 'Schließen' });
    if (id === 'endless') {
      this.sheet.append(
        h('div', { class: 'level-sheet__head' }, h('b', null, 'Endlosmodus'), close),
        h(
          'p',
          { class: 'level-sheet__meta' },
          `Immer härtere Runden. Rekord: Runde ${save.stats.bestEndlessRound}`,
        ),
        button('Start', () => this.cb.select('endless'), 'gold', { size: 'lg', icon: 'play' }),
      );
    } else {
      const lvl = LEVELS.find((l) => l.id === id)!;
      const stars = save.levelStars[String(id)] ?? 0;
      const best = Math.round((save.levelBestProgress[String(id)] ?? 0) * 100);
      this.sheet.append(
        h('div', { class: 'level-sheet__head' }, h('b', null, `Level ${id} · ${lvl.name}`), close),
        h('div', { class: 'level-sheet__stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        h(
          'p',
          { class: 'level-sheet__meta' },
          best > 0 ? `Bester Fortschritt: ${best} %` : 'Noch nicht gespielt',
        ),
        button('Start', () => this.cb.select(id), 'gold', { size: 'lg', icon: 'play' }),
      );
    }
    this.sheet.classList.remove('hidden');
    (this.sheet.querySelector('.btn--gold') as HTMLElement | null)?.focus();
  }
}
