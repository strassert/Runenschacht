import { h } from '../dom';

/** Zeile mit Beschriftung und Schalter (role="switch"). */
export function toggle(label: string, value: boolean, onChange: (value: boolean) => void): HTMLElement {
  let on = value;
  const sw = h('button', {
    type: 'button',
    class: 'toggle',
    role: 'switch',
    'aria-checked': String(on),
    'aria-label': label,
    'data-ui-interactive': true,
  });
  sw.addEventListener('click', () => {
    on = !on;
    sw.setAttribute('aria-checked', String(on));
    onChange(on);
  });
  return h('div', { class: 'toggle-row' }, h('span', null, label), sw);
}
