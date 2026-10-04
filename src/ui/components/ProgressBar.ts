import { h } from '../dom';

/** Balken, dessen Füllung per transform: scaleX() skaliert wird (kein Layout). Optional mit „Schadens-Nachlauf“. */
export class ProgressBar {
  readonly el: HTMLElement;
  private readonly fill: HTMLElement;
  private readonly trail: HTMLElement | null;
  private last = -1;

  constructor(className: string, withTrail = false) {
    this.fill = h('div', { class: className.includes('bar') ? 'bar__fill' : 'hud-progress__fill' });
    this.trail = withTrail ? h('div', { class: 'bar__trail' }) : null;
    this.el = h('div', { class: className }, this.trail, this.fill);
  }

  /** ratio 0..1 */
  set(ratio: number): void {
    const r = Math.max(0, Math.min(1, ratio));
    if (Math.abs(r - this.last) < 0.0005) return;
    this.last = r;
    const t = `scaleX(${r.toFixed(4)})`;
    this.fill.style.transform = t;
    if (this.trail) this.trail.style.transform = t;
  }
}
