import { describe, it, expect } from 'vitest';
import { applyGateOp, findGateOption, updateGates } from './gates';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';
import type { GateDef } from '../level/types';

const gate: GateDef = {
  z: 50,
  options: [
    { xMin: -6, xMax: 0, op: 'mul', value: 2 },
    { xMin: 0, xMax: 6, op: 'add', value: 20 },
  ],
};

function pass(x: number, count: number, g: GateDef = gate): ReturnType<typeof createWorld> {
  const w = createWorld(makeTestLevel({ gates: [g], startSoldiers: count - 8 }));
  w.squad.x = x;
  w.squad.prevZ = 49.9;
  w.squad.z = 50.1;
  updateGates(w);
  return w;
}

describe('gates', () => {
  it('applies all operations', () => {
    expect(applyGateOp(10, 'add', 5)).toBe(15);
    expect(applyGateOp(10, 'sub', 5)).toBe(5);
    expect(applyGateOp(10, 'mul', 3)).toBe(30);
    expect(applyGateOp(11, 'div', 2)).toBe(5);
  });
  it('finds options', () => {
    expect(findGateOption({ options: gate.options }, -1)).toBe(0);
    expect(findGateOption({ options: gate.options }, 1)).toBe(1);
    expect(findGateOption({ options: gate.options }, 6)).toBe(1);
    expect(findGateOption({ options: gate.options }, 7)).toBe(-1);
  });
  it('left side multiplies, right side adds', () => {
    expect(pass(-1, 10).squad.count).toBe(20);
    expect(pass(1, 10).squad.count).toBe(30);
  });
  it('clamps to 0 and 999', () => {
    const neg: GateDef = { z: 50, options: [{ xMin: -6, xMax: 6, op: 'sub', value: 50 }] };
    expect(pass(0, 10, neg).squad.count).toBe(0);
    const big: GateDef = { z: 50, options: [{ xMin: -6, xMax: 6, op: 'mul', value: 5 }] };
    expect(pass(0, 500, big).squad.count).toBe(999);
  });
  it('only triggers once', () => {
    const w = pass(1, 10);
    w.squad.prevZ = 49.9;
    w.squad.z = 50.1;
    updateGates(w);
    expect(w.squad.count).toBe(30);
    expect(w.events.filter((e) => e.type === 'gatePassed').length).toBe(1);
  });
});
