import { h } from '../dom';

export type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger' | 'icon';

export interface ButtonOptions {
  icon?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Zentraler Klick-Hook (z. B. für Sounds). */
let clickHook: (() => void) | null = null;
export function setButtonClickHook(fn: (() => void) | null): void {
  clickHook = fn;
}

export function button(
  label: string,
  onClick: () => void,
  variant: ButtonVariant = 'primary',
  opts: ButtonOptions = {},
): HTMLButtonElement {
  const el = h(
    'button',
    {
      class: `btn btn--${variant}`,
      type: 'button',
      'data-ui-interactive': true,
      'aria-label': opts.ariaLabel,
      disabled: opts.disabled,
    },
    opts.icon ? `${opts.icon} ` : null,
    label,
  );
  el.addEventListener('click', () => {
    clickHook?.();
    onClick();
  });
  return el;
}
