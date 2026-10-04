import { CONFIG, WEAPONS } from './config';
import { countSlotsInXRange, maxSquadX } from './formation';
import { clamp } from './math';
import { applyGateOp, findGateOption } from './systems/gates';
import type { WorldState } from './types';

const CANDIDATES = [-4.5, -3, -1.5, 0, 1.5, 3, 4.5];
const LOOKAHEAD = 30;

const CARD_VALUE = { weapon: 40, hero: 80 } as const;

/** Bewertet eine Ziel-Position cx anhand der Welt in den nächsten 30 m. Exportiert für Tests. */
export function scoreCandidate(world: WorldState, cx: number): number {
  const s = world.squad;
  const R = s.radius;
  const zMin = s.z;
  const zMax = s.z + LOOKAHEAD;
  let score = 0;

  // 1) Karten zuerst: eine nicht freischießbare Karte ist eine Wand. Alles dahinter ist in dieser Spur unerreichbar.
  let blockedZ = Infinity;
  const weapon = WEAPONS[s.weaponTier];
  for (const c of world.cards) {
    if (c.state !== 'locked' || c.z < zMin || c.z > zMax) continue;
    if (Math.abs(c.x - cx) > c.width / 2 + R) continue;
    const t = Math.max(0.1, (c.z - s.z) / CONFIG.squad.forwardSpeed);
    const dps = (s.count * weapon.damage * world.modifiers.fireRateMultiplier) / weapon.fireInterval;
    if (dps * t * 0.6 >= c.hp) {
      score += c.kind === 'soldiers' ? c.reward : CARD_VALUE[c.kind];
    } else {
      score -= countSlotsInXRange(
        s.count,
        s.slotSpacing,
        cx,
        c.x - c.width / 2,
        c.x + c.width / 2,
        CONFIG.squad.soldierRadius,
      );
      blockedZ = Math.min(blockedZ, c.z);
    }
  }

  for (const b of world.blocks) {
    if (b.collected || b.z < zMin || b.z > zMax || b.z >= blockedZ) continue;
    if (Math.abs(b.x - cx) <= R + 0.8) score += b.value;
  }

  for (const g of world.gates) {
    if (g.passed || g.z < zMin || g.z > zMax || g.z >= blockedZ) continue;
    const idx = findGateOption(g, cx);
    if (idx < 0) continue;
    const o = g.options[idx];
    const after = clamp(applyGateOp(s.count, o.op, o.value), 0, CONFIG.squad.maxSoldiers);
    score += after - s.count;
  }

  const e = world.enemies;
  for (let i = 0; i < e.count; i++) {
    if (e.z[i] < zMin || e.z[i] > zMax || e.z[i] >= blockedZ) continue;
    if (Math.abs(e.x[i] - cx) <= R + 1.5) score -= 0.6;
  }

  score -= 0.5 * Math.abs(cx - s.x);
  return score;
}

export class Bot {
  private timer = 0;

  constructor(private readonly interval = 0.25) {}

  /** Setzt alle `interval` Sekunden world.squad.targetX auf die beste Kandidaten-Position. */
  update(world: WorldState, dt: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.interval;
    const s = world.squad;
    const limit = maxSquadX(s.radius);
    let bestX = s.x;
    let bestScore = -Infinity;
    for (const c of CANDIDATES) {
      const cx = clamp(c, -limit, limit);
      const sc = scoreCandidate(world, cx);
      if (
        sc > bestScore + 1e-9 ||
        (Math.abs(sc - bestScore) <= 1e-9 && Math.abs(cx - s.x) < Math.abs(bestX - s.x))
      ) {
        bestScore = sc;
        bestX = cx;
      }
    }
    s.targetX = bestX;
  }
}
