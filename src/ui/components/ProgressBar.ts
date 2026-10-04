import { h } from '../dom';

/** Balken, dessen Füllung per transform: scaleX() skaliert wird (kein Layout). */
export class ProgressBar {
  readonly el: HTMLElement;
  private readonly fill: HTMLElement;
  private last = -1;

  constructor(className: string) {
    this.fill = h('div', { class: className.includes('bar') ? 'bar__fill' : 'hud-progress__fill' });
    this.el = h('div', { class: className }, this.fill);
  }

  /** ratio 0..1 */
  set(ratio: number): void {
    const r = Math.max(0, Math.min(1, ratio));
    if (Math.abs(r - this.last) < 0.0005) return;
    this.last = r;
    this.fill.style.transform = `scaleX(${r.toFixed(4)})`;
  }
}
