import type { QualitySetting, Settings } from '../../persistence/SaveManager';
import { button } from '../components/Button';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface SettingsCallbacks {
  change: (patch: Partial<Settings>) => void;
  back: () => void;
  resetProgress: () => void;
}

const QUALITY_LABELS: [QualitySetting, string][] = [
  ['auto', 'Auto'],
  ['low', 'Niedrig'],
  ['medium', 'Mittel'],
  ['high', 'Hoch'],
];

export class SettingsScreen extends BaseScreen {
  private readonly body = h('div', { class: 'panel col settings-body' });

  constructor(private readonly cb: SettingsCallbacks) {
    super('screen--panel');
    this.el.append(
      h('h2', { class: 'heading' }, 'Einstellungen'),
      this.body,
      button('Zurück', cb.back, 'ghost'),
    );
  }

  refresh(s: Readonly<Settings>): void {
    clear(this.body);
    const toggle = (label: string, key: 'sound' | 'music' | 'haptics' | 'reducedMotion'): HTMLElement => {
      const input = h('input', {
        type: 'checkbox',
        'data-ui-interactive': true,
        role: 'switch',
        'aria-label': label,
      });
      input.checked = s[key];
      input.addEventListener('change', () => this.cb.change({ [key]: input.checked }));
      return h('label', { class: 'setting-row' }, h('span', null, label), input);
    };
    const slider = h('input', {
      type: 'range',
      min: '0.5',
      max: '3',
      step: '0.1',
      value: String(s.sensitivity),
      'data-ui-interactive': true,
      'aria-label': 'Steuerempfindlichkeit',
    });
    const sliderValue = h('b', null, s.sensitivity.toFixed(1));
    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      sliderValue.textContent = v.toFixed(1);
      this.cb.change({ sensitivity: v });
    });

    const quality = h(
      'div',
      { class: 'segmented', role: 'radiogroup', 'aria-label': 'Grafikqualität' },
      ...QUALITY_LABELS.map(([value, label]) => {
        const b = h(
          'button',
          {
            type: 'button',
            class: `segmented__btn${s.quality === value ? ' segmented__btn--on' : ''}`,
            role: 'radio',
            'aria-checked': String(s.quality === value),
            'data-ui-interactive': true,
          },
          label,
        );
        b.addEventListener('click', () => {
          this.cb.change({ quality: value });
          this.refresh({ ...s, quality: value });
        });
        return b;
      }),
    );

    this.body.append(
      toggle('Soundeffekte', 'sound'),
      toggle('Musik', 'music'),
      toggle('Vibration', 'haptics'),
      toggle('Bewegung reduzieren', 'reducedMotion'),
      h(
        'label',
        { class: 'setting-row setting-row--col' },
        h('span', null, 'Steuerempfindlichkeit ', sliderValue),
        slider,
      ),
      h('div', { class: 'setting-row setting-row--col' }, h('span', null, 'Grafikqualität'), quality),
      button(
        'Fortschritt zurücksetzen',
        () => {
          if (window.confirm('Wirklich den gesamten Fortschritt löschen?')) this.cb.resetProgress();
        },
        'danger',
      ),
    );
  }
}
