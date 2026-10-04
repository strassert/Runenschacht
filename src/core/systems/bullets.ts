import { CONFIG } from '../config';
import { emit } from '../events';
import { ZBuckets } from '../spatial/ZBuckets';
import type { WorldState } from '../types';
import { unlockCard } from './cards';
import { killEnemy } from './enemies';

const buckets = new ZBuckets(CONFIG.enemy.maxEnemies);
const candidates = new Int32Array(CONFIG.enemy.maxEnemies);
const damagedCards: number[] = [];

const HIT_NONE = 0;
const HIT_ENEMY = 1;
const HIT_CARD = 2;
const HIT_BOSS = 3;

export function updateBullets(world: WorldState, dt: number): void {
  const b = world.bullets;
  const en = world.enemies;
  const boss = world.boss;
  const r = CONFIG.enemy.radius;
  const cardHalf = CONFIG.card.depth / 2;

  buckets.rebuild(en.z, en.count);
  damagedCards.length = 0;
  let bossHit = false;

  for (let i = b.count - 1; i >= 0; i--) {
    const z0 = b.z[i];
    const z1 = z0 + b.speed[i] * dt;
    const x = b.x[i];
    let bestZ = Infinity;
    let hitKind = HIT_NONE;
    let hitIndex = -1;

    const n = buckets.query(z0 - r, z1 + r, candidates);
    for (let k = 0; k < n; k++) {
      const j = candidates[k];
      if (en.hp[j] <= 0) continue;
      const ez = en.z[j];
      if (ez + r >= z0 && ez - r <= z1 && Math.abs(en.x[j] - x) <= r && ez < bestZ) {
        bestZ = ez;
        hitKind = HIT_ENEMY;
        hitIndex = j;
      }
    }

    for (let c = 0; c < world.cards.length; c++) {
      const card = world.cards[c];
      if (card.state !== 'locked') continue;
      const front = card.z - cardHalf;
      const back = card.z + cardHalf;
      if (Math.abs(x - card.x) <= card.width / 2 && front <= z1 && back >= z0 && front < bestZ) {
        bestZ = front;
        hitKind = HIT_CARD;
        hitIndex = c;
      }
    }

    if (boss.state !== 'dead') {
      const front = boss.z - boss.radius;
      if (Math.abs(x - boss.x) <= boss.radius && front <= z1 && boss.z + boss.radius >= z0 && front < bestZ) {
        bestZ = front;
        hitKind = HIT_BOSS;
        hitIndex = 0;
      }
    }

    if (hitKind !== HIT_NONE) {
      const dmg = b.damage[i];
      world.stats.damageDealt += dmg;
      if (hitKind === HIT_ENEMY) {
        en.hp[hitIndex] -= dmg;
      } else if (hitKind === HIT_CARD) {
        const card = world.cards[hitIndex];
        card.hp -= dmg;
        if (!damagedCards.includes(card.id)) damagedCards.push(card.id);
        if (card.hp <= 0) unlockCard(world, card);
      } else {
        boss.hp = Math.max(0, boss.hp - dmg);
        bossHit = true;
        if (boss.hp === 0) {
          boss.state = 'dead';
          emit(world, { type: 'bossDefeated', x: boss.x, z: boss.z });
        }
      }
      b.remove(i);
      continue;
    }

    b.prevZ[i] = z0;
    b.z[i] = z1;
    b.traveled[i] += b.speed[i] * dt;
    if (b.traveled[i] >= b.range[i]) b.remove(i);
  }

  for (let i = en.count - 1; i >= 0; i--) {
    if (en.hp[i] <= 0) killEnemy(world, i, true);
  }

  for (const id of damagedCards) {
    const card = world.cards[id];
    if (card.state === 'locked') {
      emit(world, { type: 'cardDamaged', id, hp: Math.max(0, card.hp), maxHp: card.maxHp });
    }
  }
  if (bossHit && boss.state !== 'dead') {
    emit(world, { type: 'bossDamaged', hp: boss.hp, maxHp: boss.maxHp });
  }
}
