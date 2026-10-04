import type { SimEvent } from '../core/events';
import type { WorldState } from '../core/types';
import type { AudioEngine } from './AudioEngine';

const COMBO_WINDOW = 0.6;
const STEP_INTERVAL = 0.55;

/** Ordnet Simulations-Ereignisse Soundeffekten zu. */
export class SfxDirector {
  private combo = 0;
  private lastPickup = -10;
  private stepTimer = 0;

  constructor(private readonly audio: AudioEngine) {}

  onEvent(e: SimEvent, world: WorldState): void {
    const a = this.audio;
    switch (e.type) {
      case 'shotsFired':
        a.play('shoot', {
          pitch: 1 + 0.08 * world.squad.weaponTier,
          volume: (e.owner === 'hero' ? 0.7 : 1) * 0.5,
        });
        break;
      case 'blockCollected': {
        this.combo = world.time - this.lastPickup <= COMBO_WINDOW ? this.combo + 1 : 0;
        this.lastPickup = world.time;
        a.play('pickup', { pitch: 1 + Math.min(0.5, this.combo * 0.04) });
        break;
      }
      case 'gatePassed':
        a.play(e.after >= e.before ? 'gateGood' : 'gateBad');
        break;
      case 'cardDamaged':
        a.play('cardHit');
        break;
      case 'cardUnlocked':
        a.play('cardUnlock');
        break;
      case 'cardSmashed':
        a.play('wallSmash');
        break;
      case 'enemyKilled':
        a.play('enemyDie', { pitch: 0.9 + Math.random() * 0.3 });
        break;
      case 'soldiersChanged':
        if (e.delta < 0 && (e.reason === 'enemy' || e.reason === 'boss')) a.play('soldierLost');
        break;
      case 'heroJoined':
        a.play('heroJoin');
        break;
      case 'heroDied':
        a.play('heroDie');
        break;
      case 'bossDamaged':
        a.play('bossHit');
        break;
      case 'bossDefeated':
        a.play('bossDie');
        break;
      case 'phaseChanged':
        if (e.phase === 'victory' || e.phase === 'defeat') {
          a.duckMusic(1.2);
          a.play(e.phase);
        }
        break;
      default:
        break;
    }
  }

  /** Pro Frame: Boss-Schritte, solange er läuft. */
  update(world: WorldState, frameDt: number): void {
    if (world.boss.state === 'walking') {
      this.stepTimer -= frameDt;
      if (this.stepTimer <= 0) {
        this.stepTimer = STEP_INTERVAL;
        this.audio.play('bossStep');
      }
    } else {
      this.stepTimer = 0;
    }
  }
}
