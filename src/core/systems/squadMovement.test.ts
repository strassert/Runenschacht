import { describe, it, expect } from 'vitest';
import { updateSquadMovement } from './squadMovement';
import { createWorld } from '../world';
import { makeTestLevel, runSteps } from '../testUtils';
import { maxSquadX } from '../formation';

describe('squadMovement', () => {
  it('moves forward 7 m/s', () => {
    const w = createWorld(makeTestLevel());
    runSteps(w, 60, updateSquadMovement);
    expect(w.squad.z).toBeCloseTo(7, 1);
  });
  it('follows targetX with limited speed', () => {
    const w = createWorld(makeTestLevel());
    w.squad.targetX = 4;
    let prev = w.squad.x;
    for (let i = 0; i < 60; i++) {
      updateSquadMovement(w, 1 / 60);
      expect(w.squad.x - prev).toBeLessThanOrEqual(16 / 60 + 1e-6);
      prev = w.squad.x;
    }
    expect(w.squad.x).toBeGreaterThan(3.9 - 0.2);
  });
  it('clamps target to the bridge', () => {
    const w = createWorld(makeTestLevel());
    w.squad.targetX = 100;
    runSteps(w, 200, updateSquadMovement);
    expect(w.squad.x).toBeLessThanOrEqual(maxSquadX(w.squad.radius) + 1e-6);
  });
  it('stops at the arena and starts the boss fight', () => {
    const w = createWorld(makeTestLevel());
    w.squad.z = w.arenaZ - 0.05;
    updateSquadMovement(w, 1 / 60);
    expect(w.squad.z).toBe(w.arenaZ);
    expect(w.squad.stopped).toBe(true);
    expect(w.phase).toBe('bossFight');
    expect(w.events.some((e) => e.type === 'phaseChanged' && e.phase === 'bossFight')).toBe(true);
  });
});
