import { h } from '../dom';

/** Gruppe von Auswahl-Buttons (role="radiogroup"). */
export function segmented<T extends string>(
  label: string,
  options: readonly (readonly [T, string])[],
  value: T,
  onChange: (value: T) => void,
): HTMLElement {
  const buttons: HTMLButtonElement[] = [];
  const select = (v: T): void => {
    buttons.forEach((b, i) => b.setAttribute('aria-checked', String(options[i][0] === v)));
  };
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label });
  options.forEach(([v, text]) => {
    const b = h(
      'button',
      {
        type: 'button',
        class: 'segmented__btn',
        role: 'radio',
        'aria-checked': String(v === value),
        'data-ui-interactive': true,
      },
      text,
    );
    b.addEventListener('click', () => {
      select(v);
      onChange(v);
    });
    buttons.push(b);
    group.append(b);
  });
  return h('div', { class: 'segmented-row' }, h('span', null, label), group);
}
