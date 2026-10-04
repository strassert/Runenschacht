import { UPGRADES, UPGRADE_IDS, upgradeCost, type UpgradeId } from '../../core/upgrades';
import { CONFIG } from '../../core/config';
import type { SaveData } from '../../persistence/SaveManager';
import { button } from '../components/Button';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface ShopCallbacks {
  buy: (id: UpgradeId) => boolean;
  back: () => void;
}

/** Beschreibt Wert vor/nach dem Kauf. */
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
  private readonly coins = h('div', { class: 'shop-coins' });

  constructor(private readonly cb: ShopCallbacks) {
    super('screen--panel');
    this.el.append(
      h('h2', { class: 'heading' }, 'Shop'),
      this.coins,
      this.list,
      button('Zurück', cb.back, 'ghost'),
    );
  }

  refresh(save: Readonly<SaveData>): void {
    this.coins.textContent = `🪙 ${save.coins}`;
    clear(this.list);
    for (const id of UPGRADE_IDS) {
      const def = UPGRADES[id];
      const level = save.upgrades[id];
      const cost = upgradeCost(id, level);
      const missing = cost !== null ? cost - save.coins : 0;
      const segments = Array.from({ length: def.maxLevel }, (_, i) =>
        h('i', { class: i < level ? 'seg seg--on' : 'seg' }),
      );
      const buy =
        cost === null
          ? button('MAX', () => undefined, 'ghost', { disabled: true })
          : button(
              `${cost} 🪙`,
              () => {
                if (this.cb.buy(id)) this.refresh(save);
              },
              'gold',
              { disabled: missing > 0, ariaLabel: `${def.name} kaufen für ${cost} Münzen` },
            );
      this.list.append(
        h(
          'div',
          { class: 'panel shop-card' },
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
          missing > 0 ? h('div', { class: 'shop-card__missing' }, `Dir fehlen ${missing} 🪙`) : null,
        ),
      );
    }
  }
}
