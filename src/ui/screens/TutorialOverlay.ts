import type { TipId } from '../../app/TutorialDirector';
import { icon, type IconName } from '../components/Icon';
import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';

const TIPS: Record<TipId, { icon: IconName; text: string }> = {
  drag: { icon: 'hand', text: 'Halte und ziehe nach links oder rechts, um deinen Trupp zu steuern.' },
  blocks: { icon: 'coin', text: 'Lauf durch die Blöcke – jeder bringt dir neue Soldaten!' },
  card: {
    icon: 'sword',
    text: 'Schieß auf die Karte, bis die Zahl 0 erreicht. Dann gehört die Belohnung dir!',
  },
  horde: {
    icon: 'skull',
    text: 'Gegner! Jeder, der dich erreicht, kostet einen Soldaten. Abschießen oder ausweichen!',
  },
  gate: { icon: 'chevronLeft', text: 'Tore verändern deinen Trupp. Wähle die bessere Seite!' },
  wall: { icon: 'shield', text: 'Eine Karte, die noch nicht leer geschossen ist, wirkt wie eine Mauer.' },
  boss: { icon: 'skull', text: 'Der Boss! Halte durch und feuere mit allem, was du hast.' },
};

/** Nicht blockierende Sprechblase mit Pfeil zum Ziel; bei „drag“ zusätzlich eine animierte Wischgeste. */
export class TutorialOverlay extends BaseScreen {
  private readonly bubble = h('div', { class: 'tip' });
  private readonly text = h('span', null, '');
  private readonly iconSlot = h('span', { class: 'tip__icon' });
  private readonly arrow = h('i', { class: 'tip__arrow' });
  private readonly swipe = h('div', { class: 'tip-swipe' }, icon('hand', 48));

  constructor() {
    super('screen--tutorial');
    this.bubble.append(this.iconSlot, this.text, this.arrow);
    this.el.append(this.bubble, this.swipe);
    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-live', 'polite');
  }

  /** targetPercent: horizontale Position des Ziels (0–100) für den Pfeil, null = kein Pfeil. */
  showTip(id: TipId, targetPercent: number | null): void {
    const def = TIPS[id];
    setText(this.text, def.text);
    this.iconSlot.replaceChildren(icon(def.icon, 28));
    this.arrow.style.display = targetPercent === null ? 'none' : '';
    if (targetPercent !== null) this.arrow.style.left = `${Math.max(8, Math.min(92, targetPercent))}%`;
    this.swipe.style.display = id === 'drag' ? '' : 'none';
    this.bubble.classList.remove('tip--in');
    void this.bubble.offsetWidth;
    this.bubble.classList.add('tip--in');
    this.show();
  }
}
