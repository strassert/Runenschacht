import { CONFIG } from '../config';
import { emit } from '../events';
import { clamp } from '../math';
import type { GateOp, GateOption, WorldState } from '../types';
import { changeSoldiers } from '../world';

/** Wendet eine Tor-Operation an (ohne Begrenzung). */
export function applyGateOp(count: number, op: GateOp, value: number): number {
  switch (op) {
    case 'add':
      return count + value;
    case 'sub':
      return count - value;
    case 'mul':
      return count * value;
    case 'div':
      return Math.floor(count / value);
  }
}

/** Index der Option, deren [xMin, xMax) x enthält (letzte Option inkl. xMax), sonst -1. */
export function findGateOption(gate: { options: GateOption[] }, x: number): number {
  const opts = gate.options;
  for (let i = 0; i < opts.length; i++) {
    const o = opts[i];
    const last = i === opts.length - 1;
    if (x >= o.xMin && (x < o.xMax || (last && x <= o.xMax))) return i;
  }
  return -1;
}

export function updateGates(world: WorldState): void {
  const s = world.squad;
  for (const g of world.gates) {
    if (g.passed) continue;
    if (!(s.prevZ < g.z && s.z >= g.z)) continue;
    g.passed = true;
    const idx = findGateOption(g, s.x);
    if (idx < 0) continue;
    const o = g.options[idx];
    const before = s.count;
    const target = clamp(applyGateOp(before, o.op, o.value), 0, CONFIG.squad.maxSoldiers);
    changeSoldiers(world, target - before, 'gate');
    g.chosenOption = idx;
    emit(world, {
      type: 'gatePassed',
      id: g.id,
      optionIndex: idx,
      op: o.op,
      value: o.value,
      before,
      after: s.count,
    });
  }
}
