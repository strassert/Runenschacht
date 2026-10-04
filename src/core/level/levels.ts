import type { GateOptionDef, LevelDef } from './types';
import type { GateOp } from '../types';

/** Kurzschreibweise für Tor-Optionen. */
const opt = (xMin: number, xMax: number, op: GateOp, value: number): GateOptionDef => ({
  xMin,
  xMax,
  op,
  value,
});

export const LEVELS: readonly LevelDef[] = [
  {
    id: 1,
    name: 'Die Hängebrücke',
    seed: 101,
    arenaZ: 190,
    blockColumns: [
      { x: -4.6, zStart: 12, zEnd: 100, spacing: 3.2, value: 1 },
      { x: 4.6, zStart: 52, zEnd: 130, spacing: 8, value: 33 },
    ],
    cards: [
      { kind: 'weapon', x: 0, z: 34, hp: 23, width: 3.6 },
      { kind: 'hero', x: 3.9, z: 34, hp: 555, width: 3.2 },
    ],
    hordes: [{ zStart: 46, zEnd: 120, xMin: -1.8, xMax: 1.8, count: 280 }],
    gates: [
      { z: 150, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 20)] },
      { z: 170, options: [opt(-6, 0, 'sub', 30), opt(0, 6, 'add', 15)] },
    ],
    boss: { hp: 600 },
  },
  {
    id: 2,
    name: 'Moosgraben',
    seed: 202,
    arenaZ: 220,
    blockColumns: [
      { x: -4.6, zStart: 10, zEnd: 58, spacing: 3, value: 1 },
      { x: 4.6, zStart: 70, zEnd: 126, spacing: 7, value: 20 },
    ],
    cards: [
      { kind: 'soldiers', x: -4.2, z: 28, hp: 40, width: 3.2, reward: 25 },
      { kind: 'weapon', x: 0, z: 40, hp: 60, width: 3.6 },
    ],
    hordes: [
      { zStart: 50, zEnd: 110, xMin: -1.8, xMax: 1.8, count: 220 },
      { zStart: 140, zEnd: 170, xMin: -5.4, xMax: 5.4, count: 200 },
    ],
    gates: [
      { z: 128, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'sub', 10)] },
      { z: 190, options: [opt(-6, -2, 'add', 30), opt(-2, 2, 'div', 2), opt(2, 6, 'add', 10)] },
    ],
    boss: { hp: 1200 },
  },
  {
    id: 3,
    name: 'Wasserfall-Pass',
    seed: 303,
    arenaZ: 240,
    blockColumns: [
      { x: -4.6, zStart: 12, zEnd: 72, spacing: 3, value: 1 },
      { x: 4.6, zStart: 12, zEnd: 72, spacing: 3, value: 2 },
    ],
    cards: [
      { kind: 'hero', x: 0, z: 45, hp: 300, width: 3.6 },
      { kind: 'weapon', x: -3.9, z: 95, hp: 120, width: 3.2 },
      { kind: 'soldiers', x: 3.9, z: 95, hp: 150, width: 3.2, reward: 60 },
    ],
    hordes: [
      { zStart: 55, zEnd: 85, xMin: -1.8, xMax: 1.8, count: 150 },
      { zStart: 110, zEnd: 160, xMin: -5.4, xMax: 5.4, count: 320, hp: 2 },
    ],
    gates: [
      { z: 175, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 40)] },
      { z: 205, options: [opt(-6, -2, 'sub', 40), opt(-2, 2, 'mul', 2), opt(2, 6, 'sub', 20)] },
    ],
    boss: { hp: 2500, contactKillRate: 15 },
  },
  {
    id: 4,
    name: 'Schlangentempel',
    seed: 404,
    arenaZ: 260,
    blockColumns: [
      { x: 0, zStart: 10, zEnd: 40, spacing: 2.5, value: 1 },
      { x: -4.6, zStart: 120, zEnd: 180, spacing: 6, value: 15 },
    ],
    cards: [
      { kind: 'weapon', x: -3.9, z: 50, hp: 80, width: 3.2 },
      { kind: 'weapon', x: 3.9, z: 50, hp: 250, width: 3.2 },
      { kind: 'hero', x: 0, z: 130, hp: 700, width: 3.6 },
    ],
    hordes: [
      { zStart: 60, zEnd: 110, xMin: -5.4, xMax: 5.4, count: 400 },
      { zStart: 140, zEnd: 200, xMin: 1, xMax: 5.4, count: 250, hp: 2 },
    ],
    gates: [
      { z: 115, options: [opt(-6, -2, 'add', 25), opt(-2, 2, 'mul', 3), opt(2, 6, 'sub', 25)] },
      { z: 215, options: [opt(-6, 0, 'div', 2), opt(0, 6, 'add', 50)] },
      { z: 238, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 80)] },
    ],
    boss: { hp: 4000, speed: 2.4, contactKillRate: 18, scale: 3.3 },
  },
  {
    id: 5,
    name: 'Der Runenschacht',
    seed: 505,
    arenaZ: 300,
    blockColumns: [
      { x: -4.6, zStart: 10, zEnd: 90, spacing: 2.5, value: 1 },
      { x: 4.6, zStart: 150, zEnd: 230, spacing: 10, value: 33 },
    ],
    cards: [
      { kind: 'weapon', x: 0, z: 30, hp: 40, width: 3.6 },
      { kind: 'soldiers', x: -4.2, z: 100, hp: 200, width: 3.2, reward: 80 },
      { kind: 'hero', x: 3.9, z: 100, hp: 900, width: 3.2 },
      { kind: 'weapon', x: 0, z: 240, hp: 600, width: 3.6 },
    ],
    hordes: [
      { zStart: 40, zEnd: 95, xMin: -1.8, xMax: 1.8, count: 250 },
      { zStart: 110, zEnd: 170, xMin: -5.4, xMax: 5.4, count: 450, hp: 2 },
      { zStart: 200, zEnd: 260, xMin: -5.4, xMax: 1.5, count: 300, hp: 3 },
    ],
    gates: [
      { z: 178, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 60)] },
      { z: 275, options: [opt(-6, -2, 'sub', 50), opt(-2, 2, 'mul', 2), opt(2, 6, 'sub', 50)] },
    ],
    boss: { hp: 7000, speed: 2.6, contactKillRate: 22, scale: 3.8 },
  },
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export const LEVEL_COUNT = LEVELS.length;
