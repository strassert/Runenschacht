import { CONFIG } from '../config';
import type { Rng } from '../rng';
import type { BlockColor, CardKind } from '../types';
import type { GateDef, LevelDef } from './types';

export interface BlockSpawn {
  x: number;
  z: number;
  value: number;
  color: BlockColor;
}
export interface CardSpawn {
  kind: CardKind;
  x: number;
  z: number;
  hp: number;
  width: number;
  reward: number;
}
export interface EnemySpawn {
  x: number;
  z: number;
  hp: number;
  horde: number;
  animPhase: number;
}
export interface ExpandedLevel {
  blocks: BlockSpawn[];
  gates: GateDef[];
  cards: CardSpawn[];
  enemies: EnemySpawn[];
}

export function defaultBlockColor(value: number): BlockColor {
  return value >= 10 ? 'gold' : 'blue';
}

/** Expandiert Einzelblöcke und Blockspalten, sortiert nach z (dann x). */
export function expandBlocks(level: LevelDef): BlockSpawn[] {
  const out: BlockSpawn[] = [];
  for (const b of level.blocks ?? []) {
    out.push({ x: b.x, z: b.z, value: b.value, color: b.color ?? defaultBlockColor(b.value) });
  }
  for (const col of level.blockColumns ?? []) {
    if (col.spacing <= 0) continue;
    const color = col.color ?? defaultBlockColor(col.value);
    for (let k = 0; ; k++) {
      const z = col.zStart + k * col.spacing;
      if (z > col.zEnd + 1e-6) break;
      out.push({ x: col.x, z, value: col.value, color });
    }
  }
  out.sort((a, b) => a.z - b.z || a.x - b.x);
  return out;
}

/** Expandiert ein Level deterministisch. rng wird nur für Gegner-Jitter/animPhase benutzt. */
export function expandLevel(level: LevelDef, rng: Rng): ExpandedLevel {
  const blocks = expandBlocks(level);

  const gates: GateDef[] = (level.gates ?? [])
    .map((g) => ({
      z: g.z,
      options: g.options.map((o) => ({ ...o })).sort((a, b) => a.xMin - b.xMin),
    }))
    .sort((a, b) => a.z - b.z);

  const cards: CardSpawn[] = (level.cards ?? [])
    .map((c) => ({
      kind: c.kind,
      x: c.x,
      z: c.z,
      hp: c.hp,
      width: c.width ?? CONFIG.card.defaultWidth,
      reward: c.reward ?? 0,
    }))
    .sort((a, b) => a.z - b.z);

  const enemies: EnemySpawn[] = [];
  const { gridSpacing, jitter } = CONFIG.enemy;
  (level.hordes ?? []).forEach((h, hi) => {
    const cols = Math.max(1, Math.floor((h.xMax - h.xMin) / gridSpacing) + 1);
    const rows = Math.ceil(h.count / cols);
    const zStep = rows > 1 ? Math.max(gridSpacing, (h.zEnd - h.zStart) / (rows - 1)) : 0;
    const xStep = cols > 1 ? (h.xMax - h.xMin) / (cols - 1) : 0;
    for (let n = 0; n < h.count; n++) {
      const row = Math.floor(n / cols);
      const col = n % cols;
      const baseX = cols === 1 ? (h.xMin + h.xMax) / 2 : h.xMin + col * xStep;
      const x = baseX + rng.range(-jitter, jitter);
      const z = h.zStart + row * zStep + rng.range(-jitter, jitter);
      const animPhase = rng.range(0, Math.PI * 2);
      enemies.push({ x, z, hp: h.hp ?? 1, horde: hi, animPhase });
    }
  });

  return { blocks, gates, cards, enemies };
}
