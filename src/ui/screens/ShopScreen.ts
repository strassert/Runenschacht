import { CONFIG } from '../../core/config';
import { UPGRADES, UPGRADE_IDS, upgradeCost, type UpgradeId } from '../../core/upgrades';
import type { SaveData } from '../../persistence/SaveManager';
import { button } from '../components/Button';
import { icon } from '../components/Icon';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface ShopCallbacks {
  buy: (id: UpgradeId) => boolean;
  back: () => void;
  sound?: (name: 'coin') => void;
}

/** Wert vor/nach dem Kauf, z. B. „+6 % Feuerrate → +12 % Feuerrate“. */
function effectText(id: UpgradeId, level: number, max: number): string {
  const at = (n: number): string => {
    switch (id) {
      case 'startSoldiers':
        return `${CONFIG.squad.baseStartSoldiers + n * 2} Soldaten`;
      case 'fireRate':
        return `+${n * 6} % Feuerrate`;
      case 'coinBonus':
        return `+${n * 10} % Münzen`;
    }
  };
  return level >= max ? at(level) : `${at(level)} → ${at(level + 1)}`;
}

export class ShopScreen extends BaseScreen {
  private readonly list = h('div', { class: 'col shop-list' });
  /** Wird nach erfolgreichem Kauf aufgerufen; die App ruft dann refresh(neuerStand, id). */
  onBought: ((id: UpgradeId) => void) | null = null;
  private readonly coinText = h('span', null, '0');

  constructor(private readonly cb: ShopCallbacks) {
    super('screen--panel');
    this.el.append(
      h('h2', { class: 'heading' }, 'Shop'),
      h('div', { class: 'pill shop-coins' }, icon('coin', 20), this.coinText),
      this.list,
      button('Zurück', cb.back, 'ghost', { icon: 'chevronLeft' }),
    );
  }

  refresh(save: Readonly<SaveData>, justBought?: UpgradeId): void {
    this.coinText.textContent = String(save.coins);
    clear(this.list);
    for (const id of UPGRADE_IDS) {
      const def = UPGRADES[id];
      const level = save.upgrades[id];
      const cost = upgradeCost(id, level);
      const missing = cost !== null ? cost - save.coins : 0;
      const fresh = justBought === id;
      const segments = Array.from({ length: def.maxLevel }, (_, i) =>
        h('i', { class: `seg${i < level ? ' seg--on' : ''}${fresh && i === level - 1 ? ' seg--new' : ''}` }),
      );
      const buy =
        cost === null
          ? button('MAX', () => undefined, 'ghost', { disabled: true })
          : button(
              missing > 0 ? `Dir fehlen ${missing}` : 'Kaufen',
              () => {
                if (this.cb.buy(id)) {
                  this.cb.sound?.('coin');
                  this.onBought?.(id);
                }
              },
              'gold',
              {
                disabled: missing > 0,
                badge: `${cost}`,
                ariaLabel: `${def.name} kaufen für ${cost} Münzen`,
              },
            );
      const card = h(
        'div',
        { class: `panel shop-card${fresh ? ' shop-card--flash' : ''}` },
        h(
          'div',
          { class: 'shop-card__head' },
          h('b', null, def.name),
          h('span', null, `Stufe ${level}/${def.maxLevel}`),
        ),
        h('div', { class: 'shop-card__desc' }, def.description),
        h('div', { class: 'segs' }, ...segments),
        h('div', { class: 'shop-card__effect' }, effectText(id, level, def.maxLevel)),
        buy,
      );
      if (fresh) {
        for (let k = 0; k < 5; k++) {
          card.append(
            h('i', { class: 'fly-coin', style: `--dx:${(k - 2) * 14}px;animation-delay:${k * 60}ms` }),
          );
        }
      }
      this.list.append(card);
    }
  }
}
