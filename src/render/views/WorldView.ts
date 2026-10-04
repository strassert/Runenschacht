import * as THREE from 'three';
import type { SimEvent } from '../../core/events';
import type { LevelDef } from '../../core/level/types';
import type { WorldState } from '../../core/types';
import type { Quality } from '../quality';
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

  constructor(level: LevelDef, world: WorldState, opts: WorldViewOptions) {
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
    );
  }

  /** Ereignisse der Simulation (für Animationen/Effekte). */
  onEvent(event: SimEvent): void {
    this.bullets.onEvent(event);
    if (event.type === 'soldiersChanged' && event.delta > 0) this.countLabel.pulse = 1;
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
  }
}
