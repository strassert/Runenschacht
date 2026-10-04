import type { CardKind, GateOp, WorldPhase } from './types';

export type SoldierChangeReason = 'block' | 'gate' | 'card' | 'enemy' | 'boss' | 'wall';

export type SimEvent =
  | { type: 'phaseChanged'; phase: WorldPhase }
  | {
      type: 'soldiersChanged';
      delta: number;
      count: number;
      reason: SoldierChangeReason;
      x: number;
      z: number;
    }
  | { type: 'blockCollected'; id: number; value: number; x: number; z: number }
  | {
      type: 'gatePassed';
      id: number;
      optionIndex: number;
      op: GateOp;
      value: number;
      before: number;
      after: number;
    }
  | { type: 'cardDamaged'; id: number; hp: number; maxHp: number }
  | { type: 'cardUnlocked'; id: number; kind: CardKind; x: number; z: number }
  | { type: 'cardSmashed'; id: number; lost: number; x: number; z: number }
  | { type: 'weaponUpgraded'; tier: number }
  | { type: 'heroJoined' }
  | { type: 'heroDamaged'; hp: number; maxHp: number }
  | { type: 'heroDied'; x: number; z: number }
  | { type: 'enemyKilled'; x: number; z: number; byBullet: boolean }
  | { type: 'shotsFired'; owner: 'squad' | 'hero'; count: number }
  | { type: 'bossActivated' }
  | { type: 'bossDamaged'; hp: number; maxHp: number }
  | { type: 'bossDefeated'; x: number; z: number };

export type SimEventType = SimEvent['type'];

/** Hängt ein Ereignis an die Ereignisliste der Welt an. */
export function emit(target: { events: SimEvent[] }, event: SimEvent): void {
  target.events.push(event);
}
