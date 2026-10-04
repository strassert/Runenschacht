import { h } from '../dom';

export interface SliderOptions {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

/** Beschrifteter Schieberegler mit Wertanzeige. */
export function slider(opts: SliderOptions): HTMLElement {
  const fmt = opts.format ?? ((v: number) => v.toFixed(1));
  const out = h('b', null, fmt(opts.value));
  const input = h('input', {
    type: 'range',
    class: 'slider',
    min: String(opts.min),
    max: String(opts.max),
    step: String(opts.step),
    value: String(opts.value),
    'aria-label': opts.label,
    'data-ui-interactive': true,
  });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    out.textContent = fmt(v);
    opts.onChange(v);
  });
  return h(
    'div',
    { class: 'slider-row' },
    h('div', { class: 'slider-row__head' }, h('span', null, opts.label), out),
    input,
  );
}
