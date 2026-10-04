import { CONFIG, TRACK_INNER_HALF_WIDTH } from './config';

export const GOLDEN_ANGLE = (137.50776 * Math.PI) / 180;
const MAX = CONFIG.squad.maxSoldiers;

/** Einheits-Slots (c = 1), einmalig vorberechnet. */
export const UNIT_SLOT_X = new Float32Array(MAX);
export const UNIT_SLOT_Z = new Float32Array(MAX);
for (let i = 0; i < MAX; i++) {
  const r = Math.sqrt(i + 0.5);
  const a = i * GOLDEN_ANGLE;
  UNIT_SLOT_X[i] = r * Math.cos(a);
  UNIT_SLOT_Z[i] = r * Math.sin(a);
}

/** Slot-Abstand c nach Kompression (Game Design 4.1). */
export function computeSlotSpacing(count: number): number {
  if (count <= 0) return CONFIG.squad.slotSpacing;
  const maxC = (TRACK_INNER_HALF_WIDTH - CONFIG.squad.soldierRadius) / Math.sqrt(count);
  return Math.max(CONFIG.squad.minSlotSpacing, Math.min(CONFIG.squad.slotSpacing, maxC));
}

/** Truppradius R. Bei count 0: 0. */
export function computeSquadRadius(count: number, spacing: number): number {
  return count <= 0 ? 0 : spacing * Math.sqrt(count) + CONFIG.squad.soldierRadius;
}

/** Maximal erlaubtes |x| der Truppmitte. */
export function maxSquadX(radius: number): number {
  return Math.max(0, TRACK_INNER_HALF_WIDTH - radius);
}

/** Zählt Slots 0..count-1, deren Welt-x in [xMin - margin, xMax + margin] liegt. */
export function countSlotsInXRange(
  count: number,
  spacing: number,
  squadX: number,
  xMin: number,
  xMax: number,
  margin: number,
): number {
  const lo = xMin - margin;
  const hi = xMax + margin;
  let n = 0;
  for (let i = 0; i < count; i++) {
    const x = squadX + UNIT_SLOT_X[i] * spacing;
    if (x >= lo && x <= hi) n++;
  }
  return n;
}
