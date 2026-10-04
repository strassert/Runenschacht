import { CONFIG } from '../config';
import { emit } from '../events';
import { countSlotsInXRange } from '../formation';
import type { Card, WorldState } from '../types';
import { changeSoldiers } from '../world';
import { activateHero } from './hero';

/** Schaltet eine Karte frei und vergibt die Belohnung. */
export function unlockCard(world: WorldState, card: Card): void {
  card.state = 'unlocked';
  card.hp = 0;
  switch (card.kind) {
    case 'weapon':
      world.squad.weaponTier = Math.min(3, world.squad.weaponTier + 1);
      emit(world, { type: 'weaponUpgraded', tier: world.squad.weaponTier });
      break;
    case 'hero':
      activateHero(world);
      break;
    case 'soldiers':
      changeSoldiers(world, card.reward, 'card');
      break;
  }
  emit(world, { type: 'cardUnlocked', id: card.id, kind: card.kind, x: card.x, z: card.z });
}

/** Karten als Wand gegen den Trupp. */
export function updateCardWalls(world: WorldState): void {
  const s = world.squad;
  if (s.count <= 0) return;
  const half = CONFIG.card.depth / 2;
  for (const c of world.cards) {
    if (c.state !== 'locked') continue;
    const front = c.z - half;
    const back = c.z + half;
    if (!(s.z + s.radius >= front && s.z - s.radius <= back)) continue;
    const lost = countSlotsInXRange(
      s.count,
      s.slotSpacing,
      s.x,
      c.x - c.width / 2,
      c.x + c.width / 2,
      CONFIG.squad.soldierRadius,
    );
    if (lost === 0) continue;
    changeSoldiers(world, -lost, 'wall');
    c.hp -= lost * CONFIG.card.wallDamagePerSoldier;
    if (c.hp <= 0) {
      unlockCard(world, c);
    } else {
      c.state = 'smashed';
      emit(world, { type: 'cardSmashed', id: c.id, lost, x: c.x, z: c.z });
    }
  }
}
