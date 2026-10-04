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
  {
    id: 6,
    name: 'Nebelsteg',
    seed: 606,
    arenaZ: 280,
    blockColumns: [
      { x: -4.6, zStart: 10, zEnd: 70, spacing: 2.5, value: 1 },
      { x: 4.6, zStart: 10, zEnd: 70, spacing: 5, value: 3 },
    ],
    cards: [
      { kind: 'weapon', x: 0, z: 25, hp: 50, width: 3.6 },
      { kind: 'hero', x: 0, z: 120, hp: 600, width: 3.6 },
      { kind: 'soldiers', x: -4.2, z: 160, hp: 250, width: 3.2, reward: 100 },
    ],
    hordes: [
      { zStart: 80, zEnd: 115, xMin: -5.4, xMax: 5.4, count: 380, hp: 2 },
      { zStart: 170, zEnd: 240, xMin: -1.8, xMax: 5.4, count: 400, hp: 3 },
    ],
    gates: [
      { z: 75, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 30)] },
      { z: 130, options: [opt(-6, -2, 'sub', 30), opt(-2, 2, 'add', 40), opt(2, 6, 'mul', 2)] },
      { z: 250, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'sub', 40)] },
    ],
    boss: { hp: 9000, speed: 2.6, contactKillRate: 24, scale: 3.8 },
  },
  {
    id: 7,
    name: 'Affenfelsen',
    seed: 707,
    arenaZ: 300,
    blockColumns: [
      { x: 0, zStart: 10, zEnd: 30, spacing: 2.5, value: 2 },
      { x: -4.6, zStart: 40, zEnd: 100, spacing: 4, value: 5 },
      { x: 4.6, zStart: 190, zEnd: 250, spacing: 6, value: 25 },
    ],
    cards: [
      { kind: 'weapon', x: -3.9, z: 35, hp: 70, width: 3.2 },
      { kind: 'weapon', x: 3.9, z: 35, hp: 70, width: 3.2 },
      { kind: 'hero', x: 0, z: 140, hp: 1000, width: 3.6 },
    ],
    hordes: [
      { zStart: 50, zEnd: 100, xMin: -1.8, xMax: 5.4, count: 350, hp: 2 },
      { zStart: 150, zEnd: 185, xMin: -5.4, xMax: 5.4, count: 400, hp: 3 },
      { zStart: 255, zEnd: 285, xMin: -5.4, xMax: 5.4, count: 300, hp: 3 },
    ],
    gates: [
      { z: 110, options: [opt(-6, -2, 'mul', 2), opt(-2, 2, 'sub', 50), opt(2, 6, 'add', 50)] },
      { z: 188, options: [opt(-6, 0, 'add', 60), opt(0, 6, 'mul', 2)] },
    ],
    boss: { hp: 12000, speed: 2.8, contactKillRate: 26, scale: 4 },
  },
  {
    id: 8,
    name: 'Lianenbrücke',
    seed: 808,
    arenaZ: 320,
    blockColumns: [
      { x: -4.6, zStart: 10, zEnd: 120, spacing: 3, value: 2 },
      { x: 4.6, zStart: 130, zEnd: 250, spacing: 8, value: 40 },
    ],
    cards: [
      { kind: 'soldiers', x: 0, z: 30, hp: 60, width: 3.6, reward: 40 },
      { kind: 'weapon', x: 3.9, z: 60, hp: 150, width: 3.2 },
      { kind: 'hero', x: -3.9, z: 140, hp: 1200, width: 3.2 },
      { kind: 'weapon', x: 0, z: 260, hp: 900, width: 3.6 },
    ],
    hordes: [
      { zStart: 40, zEnd: 120, xMin: -1.8, xMax: 5.4, count: 500, hp: 2 },
      { zStart: 150, zEnd: 230, xMin: -5.4, xMax: 1.8, count: 500, hp: 3 },
      { zStart: 270, zEnd: 300, xMin: -5.4, xMax: 5.4, count: 350, hp: 4 },
    ],
    gates: [
      { z: 125, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'sub', 60)] },
      { z: 245, options: [opt(-6, -2, 'add', 80), opt(-2, 2, 'div', 2), opt(2, 6, 'mul', 2)] },
      { z: 305, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'mul', 3)] },
    ],
    boss: { hp: 16000, speed: 3, contactKillRate: 30, scale: 4 },
  },
  {
    id: 9,
    name: 'Sonnentor',
    seed: 909,
    arenaZ: 340,
    blockColumns: [
      { x: -4.6, zStart: 10, zEnd: 60, spacing: 2.5, value: 2 },
      { x: 4.6, zStart: 10, zEnd: 60, spacing: 2.5, value: 2 },
      { x: 0, zStart: 180, zEnd: 240, spacing: 5, value: 30 },
    ],
    cards: [
      { kind: 'weapon', x: 0, z: 25, hp: 50, width: 3.6 },
      { kind: 'hero', x: 0, z: 70, hp: 800, width: 3.6 },
      { kind: 'weapon', x: -3.9, z: 150, hp: 400, width: 3.2 },
      { kind: 'soldiers', x: 3.9, z: 150, hp: 500, width: 3.2, reward: 150 },
    ],
    hordes: [
      { zStart: 80, zEnd: 140, xMin: -5.4, xMax: 5.4, count: 600, hp: 3 },
      { zStart: 190, zEnd: 250, xMin: -5.4, xMax: -1.5, count: 300, hp: 3 },
      { zStart: 190, zEnd: 250, xMin: 1.5, xMax: 5.4, count: 300, hp: 3 },
      { zStart: 280, zEnd: 320, xMin: -5.4, xMax: 5.4, count: 400, hp: 4 },
    ],
    gates: [
      { z: 160, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 100)] },
      { z: 265, options: [opt(-6, -2, 'sub', 100), opt(-2, 2, 'mul', 2), opt(2, 6, 'sub', 100)] },
    ],
    boss: { hp: 22000, speed: 3, contactKillRate: 34, scale: 4.2 },
  },
  {
    id: 10,
    name: 'Herz des Schachts',
    seed: 1010,
    arenaZ: 380,
    blockColumns: [
      { x: -4.6, zStart: 10, zEnd: 100, spacing: 2.5, value: 2 },
      { x: 4.6, zStart: 110, zEnd: 200, spacing: 6, value: 33 },
      { x: 0, zStart: 260, zEnd: 300, spacing: 4, value: 10 },
    ],
    cards: [
      { kind: 'weapon', x: 0, z: 20, hp: 40, width: 3.6 },
      { kind: 'weapon', x: 0, z: 105, hp: 300, width: 3.6 },
      { kind: 'hero', x: -3.9, z: 105, hp: 1100, width: 3.2 },
      { kind: 'soldiers', x: 3.9, z: 250, hp: 700, width: 3.2, reward: 200 },
      { kind: 'weapon', x: 0, z: 330, hp: 1500, width: 3.6 },
    ],
    hordes: [
      { zStart: 30, zEnd: 95, xMin: -1.8, xMax: 1.8, count: 300, hp: 2 },
      { zStart: 120, zEnd: 200, xMin: -5.4, xMax: 1.8, count: 600, hp: 3 },
      { zStart: 215, zEnd: 250, xMin: -5.4, xMax: 5.4, count: 400, hp: 4 },
      { zStart: 300, zEnd: 360, xMin: -5.4, xMax: 5.4, count: 600, hp: 5 },
    ],
    gates: [
      { z: 205, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'add', 120)] },
      { z: 255, options: [opt(-6, -2, 'add', 50), opt(-2, 2, 'mul', 3), opt(2, 6, 'sub', 80)] },
      { z: 365, options: [opt(-6, 0, 'mul', 2), opt(0, 6, 'mul', 2)] },
    ],
    boss: { hp: 30000, speed: 3.2, contactKillRate: 40, scale: 4.5 },
  },
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export const LEVEL_COUNT = LEVELS.length;
