export type AppState =
  'boot' | 'menu' | 'levelSelect' | 'shop' | 'settings' | 'playing' | 'paused' | 'result';

const TRANSITIONS: Record<AppState, readonly AppState[]> = {
  boot: ['menu', 'playing'],
  menu: ['levelSelect', 'shop', 'settings', 'playing'],
  levelSelect: ['menu', 'playing'],
  shop: ['menu', 'result'],
  settings: ['menu', 'paused'],
  playing: ['paused', 'result', 'menu'],
  paused: ['playing', 'menu', 'settings', 'result'],
  result: ['playing', 'menu', 'shop', 'levelSelect'],
};

type Listener = (to: AppState, from: AppState) => void;

export class GameStateMachine {
  private current: AppState = 'boot';
  private prev: AppState | null = null;
  private readonly listeners = new Set<Listener>();

  get state(): AppState {
    return this.current;
  }

  get previous(): AppState | null {
    return this.prev;
  }

  canGo(to: AppState): boolean {
    return TRANSITIONS[this.current].includes(to);
  }

  /** Wechselt den Zustand oder wirft Error bei ungültigem Übergang. */
  go(to: AppState): void {
    if (!this.canGo(to)) throw new Error(`Ungültiger Übergang ${this.current} → ${to}`);
    const from = this.current;
    this.prev = from;
    this.current = to;
    for (const l of [...this.listeners]) l(to, from);
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}
