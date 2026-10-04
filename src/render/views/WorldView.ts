import * as THREE from 'three';
import type { SimEvent } from '../../core/events';
import type { LevelDef } from '../../core/level/types';
import type { WorldState } from '../../core/types';
import type { Quality } from '../quality';
import { Particles } from '../fx/Particles';
import { BlockView } from './BlockView';
import { BossView } from './BossView';
import { BulletView } from './BulletView';
import { CardView } from './CardView';
import { CountLabelView } from './CountLabelView';
import { EnemyView } from './EnemyView';
import { EnvironmentView } from './EnvironmentView';
import { GateView } from './GateView';
import { HeroView } from './HeroView';
import { SquadView } from './SquadView';
import { TrackView } from './TrackView';

export interface WorldViewOptions {
  shadows: boolean;
  quality: Quality;
}

/** Fasst alle Views eines Levels zusammen. */
export class WorldView {
  readonly root = new THREE.Group();
  private readonly track: TrackView;
  private readonly environment: EnvironmentView;
  private readonly blocks: BlockView;
  private readonly gates: GateView;
  private readonly cards: CardView;
  private readonly enemies: EnemyView;
  private readonly squad: SquadView;
  private readonly bullets: BulletView;
  private readonly hero: HeroView;
  private readonly boss: BossView;
  private readonly countLabel: CountLabelView;
  private readonly particles = new Particles();
  private camera: THREE.Camera | null = null;
  private cardHitCounter = 0;

  constructor(
    level: LevelDef,
    private readonly world: WorldState,
    opts: WorldViewOptions,
  ) {
    this.track = new TrackView(level);
    this.environment = new EnvironmentView(level, opts.quality);
    this.blocks = new BlockView(world);
    this.gates = new GateView(world.gates);
    this.cards = new CardView(world.cards);
    this.enemies = new EnemyView(level);
    this.squad = new SquadView(opts.shadows);
    this.bullets = new BulletView();
    this.hero = new HeroView(opts.shadows);
    this.boss = new BossView(opts.shadows);
    this.countLabel = new CountLabelView();
    this.root.add(
      this.track.root,
      this.environment.root,
      this.blocks.root,
      this.gates.root,
      this.cards.root,
      this.enemies.root,
      this.squad.root,
      this.bullets.root,
      this.hero.root,
      this.boss.root,
      this.countLabel.root,
      this.particles.root,
    );
  }

  attachCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  setReducedMotion(on: boolean): void {
    this.particles.countScale = on ? 0.5 : 1;
  }

  /** Ereignisse der Simulation (für Animationen/Effekte). */
  onEvent(event: SimEvent): void {
    this.bullets.onEvent(event);
    const p = this.particles;
    switch (event.type) {
      case 'soldiersChanged':
        if (event.delta > 0) this.countLabel.pulse = 1;
        break;
      case 'enemyKilled':
        p.burst(event.x, 0.5, event.z, 6, 0xff3b30, 3, 0.4);
        break;
      case 'blockCollected': {
        const gold = this.world.blocks[event.id]?.color === 'gold';
        p.burst(event.x, 0.6, event.z, 14, gold ? 0xffd84d : 0x4f8bff, 4, 0.5, { upward: 3 });
        break;
      }
      case 'cardDamaged': {
        const c = this.world.cards[event.id];
        if (c && ++this.cardHitCounter % 3 === 0) p.burst(c.x, 1.2, c.z - 0.3, 3, 0xffffff, 3, 0.3);
        break;
      }
      case 'cardUnlocked':
        for (const color of [0xffd84d, 0x4f8bff, 0xff4f6a, 0x4fe08b, 0xffffff]) {
          p.burst(event.x, 1.4, event.z, 12, color, 6, 1.2, { gravity: 0.6, upward: 3 });
        }
        break;
      case 'cardSmashed':
        p.burst(event.x, 1.2, event.z, 30, 0xffffff, 5, 0.7);
        break;
      case 'bossDefeated':
        p.burst(event.x, 3, event.z, 70, 0xff3b30, 9, 1.4, { size: 0.35, upward: 4 });
        p.burst(event.x, 3, event.z, 50, 0xff9f1a, 9, 1.4, { size: 0.3, upward: 4 });
        break;
      case 'heroDied':
        p.burst(event.x, 1, event.z, 40, 0x4f8bff, 6, 0.9);
        break;
      default:
        break;
    }
  }

  sync(world: WorldState, frameDt: number): void {
    this.environment.update(frameDt);
    this.blocks.sync(world);
    this.gates.sync(world);
    this.cards.sync(world);
    this.enemies.sync(world);
    this.squad.sync(world, frameDt);
    this.bullets.sync(world, frameDt);
    this.hero.sync(world);
    this.boss.sync(world);
    this.countLabel.sync(world, frameDt);
    if (this.camera) this.particles.update(frameDt, this.camera);
  }

  dispose(): void {
    this.track.dispose();
    this.environment.dispose();
    this.blocks.dispose();
    this.gates.dispose();
    this.cards.dispose();
    this.enemies.dispose();
    this.squad.dispose();
    this.bullets.dispose();
    this.hero.dispose();
    this.boss.dispose();
    this.countLabel.dispose();
    this.particles.dispose();
  }
}
