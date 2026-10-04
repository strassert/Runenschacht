import { describe, it, expect } from 'vitest';
import { updatePickups } from './pickups';
import { updateSquadMovement } from './squadMovement';
import { createWorld } from '../world';
import { getLevel } from '../level/levels';
import { makeTestLevel } from '../testUtils';

function run(w: ReturnType<typeof createWorld>, steps: number): void {
  for (let i = 0; i < steps; i++) {
    updateSquadMovement(w, 1 / 60);
    updatePickups(w);
  }
}

describe('pickups', () => {
  it('collects blocks on the left column', () => {
    const w = createWorld(getLevel(1)!);
    w.squad.targetX = -4.6;
    w.squad.x = -4.6;
    run(w, 100 * 9); // ~ 15 s => 105 m
    expect(w.stats.blocksCollected).toBeGreaterThanOrEqual(3);
    expect(w.squad.count).toBe(8 + w.stats.blocksCollected);
  });
  it('does not collect far-away blocks', () => {
    const w = createWorld(
      makeTestLevel({ blockColumns: [{ x: -4.6, zStart: 10, zEnd: 40, spacing: 3, value: 1 }] }),
    );
    w.squad.targetX = 0;
    run(w, 300);
    expect(w.stats.blocksCollected).toBe(0);
  });
  it('never counts a block twice', () => {
    const w = createWorld(makeTestLevel({ blocks: [{ x: 0, z: 10, value: 5 }] }));
    run(w, 400);
    expect(w.stats.blocksCollected).toBe(1);
    expect(w.squad.count).toBe(13);
  });
});
