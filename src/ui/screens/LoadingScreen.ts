import { h, setText } from '../dom';
import { BaseScreen } from '../UIManager';

const TIPS = [
  'Tipp: Goldene Blöcke geben viel mehr Soldaten.',
  'Tipp: Schieß Karten leer, bevor du sie erreichst.',
  'Tipp: Große Trupps passen nicht an Karten vorbei – plane voraus.',
  'Tipp: Im Shop kaufst du mehr Startsoldaten und Feuerrate.',
  'Tipp: Der Held fängt Schaden für deinen Trupp ab.',
];

export class LoadingScreen extends BaseScreen {
  private readonly fill = h('div', { class: 'loading-bar__fill' });
  private readonly tip = h('p', { class: 'loading-tip' }, TIPS[Math.floor(Math.random() * TIPS.length)]);

  constructor() {
    super('screen--loading', false);
    this.el.append(
      h('h1', { class: 'title' }, 'RUNENSCHACHT'),
      h('div', { class: 'loading-bar', role: 'progressbar', 'aria-label': 'Ladefortschritt' }, this.fill),
      this.tip,
    );
  }

  /** ratio 0..1 */
  setProgress(ratio: number): void {
    this.fill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio)).toFixed(3)})`;
  }

  setTip(text: string): void {
    setText(this.tip, text);
  }
}
