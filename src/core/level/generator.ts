import { CONFIG } from '../config';
import { Rng } from '../rng';
import type { GateOp } from '../types';
import type { BlockColumnDef, CardDef, GateDef, GateOptionDef, HordeDef, LevelDef } from './types';

type SegmentKind = 'blockLane' | 'goldLane' | 'cardPair' | 'horde' | 'gate';

const SEGMENT_LENGTH: Record<SegmentKind, number> = {
  blockLane: 40,
  goldLane: 50,
  cardPair: 20,
  horde: 50,
  gate: 15,
};

/** Erzeugt Runde `round` (≥ 1) des Endlosmodus deterministisch aus seed. */
export function generateEndlessLevel(round: number, seed: number): LevelDef {
  const rng = new Rng(seed * 7919 + round);
  const difficulty = 1 + 0.35 * (round - 1);

  const blockColumns: BlockColumnDef[] = [];
  const cards: CardDef[] = [];
  const hordes: HordeDef[] = [];
  const gates: GateDef[] = [];

  const side = (): number => (rng.chance(0.5) ? -1 : 1);

  const addSegment = (kind: SegmentKind, z: number): void => {
    switch (kind) {
      case 'blockLane':
        blockColumns.push({ x: side() * 4.6, zStart: z, zEnd: z + 36, spacing: 2.5, value: rng.int(1, 3) });
        break;
      case 'goldLane':
        blockColumns.push({
          x: side() * 4.6,
          zStart: z + 5,
          zEnd: z + 45,
          spacing: 8,
          value: Math.round(10 * difficulty),
          color: 'gold',
        });
        break;
      case 'cardPair': {
        const s = side();
        const mid = z + 10;
        cards.push({ kind: 'weapon', x: s * 3.9, z: mid, hp: Math.round(40 * difficulty), width: 3.2 });
        if (rng.chance(0.5)) {
          cards.push({ kind: 'hero', x: -s * 3.9, z: mid, hp: Math.round(250 * difficulty), width: 3.2 });
        } else {
          cards.push({
            kind: 'soldiers',
            x: -s * 3.9,
            z: mid,
            hp: Math.round(250 * difficulty),
            width: 3.2,
            reward: Math.round(30 * difficulty),
          });
        }
        break;
      }
      case 'horde': {
        const shape = rng.int(0, 2);
        const [xMin, xMax] =
          shape === 0 ? [-1.8, 1.8] : shape === 1 ? [-5.4, 5.4] : rng.chance(0.5) ? [-5.4, -1] : [1, 5.4];
        hordes.push({
          zStart: z + 5,
          zEnd: z + 45,
          xMin,
          xMax,
          count: Math.round(60 + 40 * difficulty),
          hp: Math.min(6, 1 + Math.floor(difficulty / 1.5)),
        });
        break;
      }
      case 'gate': {
        const three = rng.chance(0.5);
        const ranges: [number, number][] = three
          ? [
              [-6, -2],
              [-2, 2],
              [2, 6],
            ]
          : [
              [-6, 0],
              [0, 6],
            ];
        const positive = (): { op: GateOp; value: number } =>
          rng.chance(0.5) ? { op: 'mul', value: 2 } : { op: 'add', value: Math.round(20 * difficulty) };
        const negative = (): { op: GateOp; value: number } =>
          rng.chance(0.5) ? { op: 'sub', value: Math.round(15 * difficulty) } : { op: 'div', value: 2 };
        // Mindestens eine positive und eine negative Option, Rest zufällig
        const kinds: boolean[] = ranges.map(() => rng.chance(0.5));
        const posIdx = rng.int(0, ranges.length - 1);
        kinds[posIdx] = true;
        const negIdx = (posIdx + 1 + rng.int(0, ranges.length - 2)) % ranges.length;
        kinds[negIdx] = false;
        const options: GateOptionDef[] = ranges.map(([xMin, xMax], i) => ({
          xMin,
          xMax,
          ...(kinds[i] ? positive() : negative()),
        }));
        gates.push({ z: z + 7, options });
        break;
      }
    }
  };

  let z = 10;
  const sequence: SegmentKind[] = ['blockLane'];
  const middle = 4 + Math.min(6, round);
  const pool: SegmentKind[] = ['goldLane', 'cardPair', 'horde', 'gate'];
  for (let i = 0; i < middle; i++) {
    let k: SegmentKind = i === 0 ? 'goldLane' : rng.pick(pool);
    if (k === 'gate' && sequence[sequence.length - 1] === 'gate') k = 'horde';
    sequence.push(k);
  }
  if (sequence[sequence.length - 1] !== 'gate') sequence.push('gate');

  for (const kind of sequence) {
    addSegment(kind, z);
    z += SEGMENT_LENGTH[kind];
  }

  // Gegner-Gesamtzahl begrenzen
  const total = hordes.reduce((sum, h) => sum + h.count, 0);
  if (total > CONFIG.enemy.maxEnemies) {
    const f = CONFIG.enemy.maxEnemies / total;
    for (const h of hordes) h.count = Math.max(1, Math.floor(h.count * f));
  }

  return {
    id: 1000 + round,
    name: `Endlos – Runde ${round}`,
    seed: seed + round,
    arenaZ: z + 20,
    blockColumns,
    cards,
    hordes,
    gates,
    boss: {
      hp: Math.round(800 * difficulty * difficulty),
      speed: Math.min(3.6, 2.2 + 0.1 * round),
      contactKillRate: Math.round(12 + 3 * round),
      scale: Math.min(5, 3 + 0.15 * round),
    },
  };
}
