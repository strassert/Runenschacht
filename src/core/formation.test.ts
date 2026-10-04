import { describe, it, expect } from 'vitest';
import {
  UNIT_SLOT_X,
  UNIT_SLOT_Z,
  computeSlotSpacing,
  computeSquadRadius,
  countSlotsInXRange,
  maxSquadX,
} from './formation';

describe('formation', () => {
  it('slot spacing', () => {
    expect(computeSlotSpacing(10)).toBe(0.34);
    const c = computeSlotSpacing(999);
    expect(c).toBeGreaterThanOrEqual(0.17);
    expect(c).toBeLessThan(0.34);
  });
  it('squad radius', () => {
    expect(computeSquadRadius(0, 0.34)).toBe(0);
    expect(computeSquadRadius(100, 0.34)).toBeCloseTo(3.62, 2);
  });
  it('stays on the bridge', () => {
    for (const n of [1, 50, 300, 999]) {
      expect(computeSquadRadius(n, computeSlotSpacing(n))).toBeLessThanOrEqual(5.65 + 0.5);
    }
  });
  it('max x', () => {
    expect(maxSquadX(1)).toBeCloseTo(4.65, 5);
    expect(maxSquadX(10)).toBe(0);
  });
  it('spiral is evenly spread', () => {
    const n = 300;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(UNIT_SLOT_X[i] - UNIT_SLOT_X[j], UNIT_SLOT_Z[i] - UNIT_SLOT_Z[j]);
        expect(d).toBeGreaterThanOrEqual(0.5);
      }
    }
  });
  it('counts slots in range', () => {
    expect(countSlotsInXRange(50, 0.34, 0, -100, 100, 0)).toBe(50);
    expect(countSlotsInXRange(50, 0.34, 0, 10, 20, 0)).toBe(0);
  });
});
