import type { ControlMode, QualitySetting, Settings } from '../../persistence/SaveManager';
import { button } from '../components/Button';
import { panel } from '../components/Panel';
import { segmented } from '../components/Segmented';
import { slider } from '../components/Slider';
import { toggle } from '../components/Toggle';
import { clear, h } from '../dom';
import { BaseScreen } from '../UIManager';

export interface SettingsCallbacks {
  change: (patch: Partial<Settings>) => void;
  back: () => void;
  resetProgress: () => void;
  resetTips: () => void;
}

const QUALITY_OPTIONS: readonly (readonly [QualitySetting, string])[] = [
  ['auto', 'Auto'],
  ['low', 'Niedrig'],
  ['medium', 'Mittel'],
  ['high', 'Hoch'],
];

const CONTROL_OPTIONS: readonly (readonly [ControlMode, string])[] = [
  ['relative', 'Ziehen (relativ)'],
  ['absolute', 'Finger folgen'],
];

/** Mini-Feld: Punkt folgt dem Finger mit der eingestellten Empfindlichkeit. */
function sensitivityPreview(getSensitivity: () => number): HTMLElement {
  const dot = h('i', { class: 'sens-dot' });
  const strip = h('div', { class: 'sens-strip', 'data-ui-interactive': true, 'aria-hidden': 'true' }, dot);
  let pos = 0.5;
  let lastX = 0;
  let down = false;
  strip.addEventListener('pointerdown', (e) => {
    down = true;
    lastX = e.clientX;
    strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener('pointermove', (e) => {
    if (!down) return;
    const gameWidth = document.getElementById('app')?.clientWidth ?? 390;
    const meters = (e.clientX - lastX) * (12 / gameWidth) * getSensitivity();
    lastX = e.clientX;
    pos = Math.max(0.03, Math.min(0.97, pos + meters / 12));
    dot.style.left = `${pos * 100}%`;
  });
  const end = (): void => {
    down = false;
  };
  strip.addEventListener('pointerup', end);
  strip.addEventListener('pointercancel', end);
  return h('div', { class: 'slider-row' }, h('span', null, 'Vorschau: im Feld ziehen'), strip);
}

export class SettingsScreen extends BaseScreen {
  private readonly body = panel({ className: 'col settings-body' });

  constructor(private readonly cb: SettingsCallbacks) {
    super('screen--panel');
    this.el.append(
      h('h2', { class: 'heading' }, 'Einstellungen'),
      this.body,
      button('Zurück', cb.back, 'ghost'),
    );
  }

  private sens = 1.4;

  refresh(s: Readonly<Settings>): void {
    this.sens = s.sensitivity;
    clear(this.body);
    this.body.append(
      toggle('Soundeffekte', s.sound, (v) => this.cb.change({ sound: v })),
      toggle('Musik', s.music, (v) => this.cb.change({ music: v })),
      toggle('Vibration', s.haptics, (v) => this.cb.change({ haptics: v })),
      toggle('Bewegung reduzieren', s.reducedMotion, (v) => this.cb.change({ reducedMotion: v })),
      slider({
        label: 'Steuerempfindlichkeit',
        min: 0.5,
        max: 3,
        step: 0.1,
        value: s.sensitivity,
        onChange: (v) => {
          this.sens = v;
          this.cb.change({ sensitivity: v });
        },
      }),
      segmented('Steuerung', CONTROL_OPTIONS, s.controlMode, (v) => this.cb.change({ controlMode: v })),
      sensitivityPreview(() => this.sens),
      segmented('Grafikqualität', QUALITY_OPTIONS, s.quality, (v) => this.cb.change({ quality: v })),
      button('Tipps zurücksetzen', () => this.cb.resetTips(), 'ghost'),
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
