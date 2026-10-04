import { h, type Child } from '../dom';
import { button } from './Button';

export interface PanelOptions {
  title?: string;
  /** Zeigt links einen Zurück-Button in der Titelzeile. */
  onBack?: () => void;
  className?: string;
}

/** Abgerundete Karte mit optionaler Titelzeile. */
export function panel(opts: PanelOptions, ...children: Child[]): HTMLElement {
  const head =
    opts.title || opts.onBack
      ? h(
          'div',
          { class: 'panel__title' },
          opts.onBack ? button('', opts.onBack, 'icon', { icon: 'chevronLeft', ariaLabel: 'Zurück' }) : null,
          opts.title ? h('h2', null, opts.title) : null,
        )
      : null;
  return h('div', { class: `panel ${opts.className ?? ''}`.trim() }, head, ...children);
}
