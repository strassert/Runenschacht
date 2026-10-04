import type { SimEvent } from '../core/events';
import type { WorldState } from '../core/types';

export type TipId = 'drag' | 'blocks' | 'card' | 'horde' | 'gate' | 'boss' | 'wall';

export interface Tip {
  id: TipId;
  /** Zielposition in Sim-Koordinaten (für den Pfeil), falls vorhanden. */
  target: { x: number; z: number } | null;
}

/** Prüfreihenfolge bei gleichzeitigen Auslösern. */
const ORDER: readonly TipId[] = ['drag', 'card', 'blocks', 'wall', 'horde', 'gate', 'boss'];
const MAX_TUTORIAL_LEVEL = 3;

/** Entscheidet (rein logisch), wann welcher Einsteiger-Hinweis erscheint. */
export class TutorialDirector {
  private readonly seen: Record<string, boolean>;
  private wallPending = false;

  constructor(seen: Record<string, boolean>) {
    this.seen = { ...seen };
  }

  get seenTips(): Readonly<Record<string, boolean>> {
    return this.seen;
  }

  /** Ereignisse mitlesen (für nachträgliche Erklärungen). */
  onEvent(e: SimEvent): void {
    if (e.type === 'cardSmashed') this.wallPending = true;
  }

  /** Gibt höchstens einen neuen Hinweis zurück und markiert ihn als gesehen. */
  check(world: WorldState): Tip | null {
    const id = world.level.id;
    if (id < 1 || id > MAX_TUTORIAL_LEVEL) return null;
    for (const tip of ORDER) {
      if (this.seen[tip]) continue;
      const target = this.trigger(tip, world);
      if (target === undefined) continue;
      this.seen[tip] = true;
      return { id: tip, target };
    }
    return null;
  }

  markSeen(id: TipId): void {
    this.seen[id] = true;
  }

  /** undefined = nicht ausgelöst, sonst Ziel (oder null ohne Ziel). */
  private trigger(tip: TipId, w: WorldState): { x: number; z: number } | null | undefined {
    const sz = w.squad.z;
    // Außer dem Start-Hinweis erst, wenn das Spiel läuft (und nicht schon im allerersten Moment)
    if (tip !== 'drag' && (w.phase === 'ready' || sz < 1.5)) return undefined;
    switch (tip) {
      case 'drag':
        return w.phase === 'ready' ? null : undefined;
      case 'blocks': {
        for (const b of w.blocks) {
          if (!b.collected && b.z - sz >= 8 && b.z - sz <= 14) return { x: b.x, z: b.z };
        }
        return undefined;
      }
      case 'card': {
        for (const c of w.cards) {
          if (c.state === 'locked' && c.z - sz >= 18 && c.z - sz <= 24) return { x: c.x, z: c.z };
        }
        return undefined;
      }
      case 'horde': {
        const e = w.enemies;
        for (let i = 0; i < e.count; i++) if (e.charging[i] === 1) return { x: e.x[i], z: e.z[i] };
        return undefined;
      }
      case 'gate': {
        for (const g of w.gates) {
          if (!g.passed && g.z - sz >= 14 && g.z - sz <= 20) return { x: 0, z: g.z };
        }
        return undefined;
      }
      case 'wall':
        return this.wallPending ? null : undefined;
      case 'boss':
        return w.boss.state === 'walking' ? { x: w.boss.x, z: w.boss.z } : undefined;
    }
  }
}
