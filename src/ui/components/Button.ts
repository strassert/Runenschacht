import { h } from '../dom';
import { icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger' | 'icon';

export interface ButtonOptions {
  icon?: IconName;
  disabled?: boolean;
  ariaLabel?: string;
  size?: 'md' | 'lg';
  /** Kleine Beschriftung rechts (z. B. Preis). */
  badge?: string;
  /** Roter, pulsierender Punkt (z. B. „Upgrade verfügbar“). */
  dot?: boolean;
}

/** Zentraler Klick-Hook (Sound, Vibration). */
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
      class: `btn btn--${variant}${opts.size === 'lg' ? ' btn--lg' : ''}`,
      type: 'button',
      'data-ui-interactive': true,
      'aria-label': opts.ariaLabel,
      disabled: opts.disabled,
    },
    opts.icon ? icon(opts.icon, variant === 'icon' ? 26 : 22) : null,
    label ? h('span', null, label) : null,
    opts.badge ? h('span', { class: 'btn__badge' }, opts.badge) : null,
    opts.dot ? h('i', { class: 'btn__dot' }) : null,
  );
  el.addEventListener('click', () => {
    clickHook?.();
    onClick();
  });
  return el;
}
