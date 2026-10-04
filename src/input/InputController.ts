import { CONFIG } from '../core/config';

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const PAUSE_KEYS = new Set(['Escape', 'KeyP']);
const FIRST_INPUT_THRESHOLD_PX = 2;

export class InputController {
  enabled = false;
  sensitivity = 1.4;
  /** Wird bei der ersten Bewegung (Drag oder Taste) nach enable() einmal aufgerufen. */
  onFirstInput: (() => void) | null = null;
  onPauseRequest: (() => void) | null = null;

  private deltaPx = 0;
  private pointerId = -1;
  private lastX = 0;
  private totalPx = 0;
  private readonly keys = { left: false, right: false };

  constructor(private readonly target: HTMLElement) {
    target.style.touchAction = 'none';
    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerup', this.onPointerEnd);
    target.addEventListener('pointercancel', this.onPointerEnd);
    target.addEventListener('lostpointercapture', this.onPointerEnd);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Aufgelaufene seitliche Verschiebung in METERN seit dem letzten Aufruf; setzt auf 0 zurück. */
  consumeDeltaX(): number {
    const width = Math.max(1, this.target.clientWidth);
    const meters = this.deltaPx * (CONFIG.track.width / width) * this.sensitivity;
    this.deltaPx = 0;
    return meters;
  }

  /** Tastaturachse −1 … +1 (links/rechts). */
  getKeyAxis(): number {
    return (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
  }

  /** Ob gerade ein Finger/Maustaste gedrückt ist (für UI-Hinweise). */
  isPointerDown(): boolean {
    return this.pointerId !== -1;
  }

  /** Verwirft angesammelte Eingaben (z. B. beim Level-Start). */
  reset(): void {
    this.deltaPx = 0;
    this.totalPx = 0;
    this.pointerId = -1;
    this.keys.left = false;
    this.keys.right = false;
  }

  dispose(): void {
    const t = this.target;
    t.removeEventListener('pointerdown', this.onPointerDown);
    t.removeEventListener('pointermove', this.onPointerMove);
    t.removeEventListener('pointerup', this.onPointerEnd);
    t.removeEventListener('pointercancel', this.onPointerEnd);
    t.removeEventListener('lostpointercapture', this.onPointerEnd);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private fireFirstInput(): void {
    const cb = this.onFirstInput;
    if (cb) {
      this.onFirstInput = null;
      cb();
    }
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (!this.enabled || this.pointerId !== -1) return;
    if ((e.target as HTMLElement | null)?.closest('[data-ui-interactive]')) return;
    this.pointerId = e.pointerId;
    this.lastX = e.clientX;
    this.totalPx = 0;
    try {
      this.target.setPointerCapture(e.pointerId);
    } catch {
      /* ignorieren */
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId || !this.enabled) return;
    const dx = e.clientX - this.lastX;
    this.lastX = e.clientX;
    this.deltaPx += dx;
    this.totalPx += Math.abs(dx);
    if (this.totalPx > FIRST_INPUT_THRESHOLD_PX) this.fireFirstInput();
  };

  private readonly onPointerEnd = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    try {
      this.target.releasePointerCapture(e.pointerId);
    } catch {
      /* ignorieren */
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (PAUSE_KEYS.has(e.code)) {
      if (!e.repeat) this.onPauseRequest?.();
      return;
    }
    if (!this.enabled) return;
    if (LEFT_KEYS.has(e.code)) {
      this.keys.left = true;
      this.fireFirstInput();
    } else if (RIGHT_KEYS.has(e.code)) {
      this.keys.right = true;
      this.fireFirstInput();
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (LEFT_KEYS.has(e.code)) this.keys.left = false;
    else if (RIGHT_KEYS.has(e.code)) this.keys.right = false;
  };
}
