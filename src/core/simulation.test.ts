import { describe, it, expect } from 'vitest';
import { Simulation } from './simulation';
import { makeTestLevel } from './testUtils';

describe('Simulation', () => {
  it('is ready until started', () => {
    const sim = new Simulation(makeTestLevel());
    sim.step();
    expect(sim.world.phase).toBe('ready');
    expect(sim.world.squad.z).toBe(0);
    sim.start();
    sim.step();
    expect(sim.world.squad.z).toBeGreaterThan(0);
  });
  it('finishes only after the outcome delay', () => {
    const sim = new Simulation(makeTestLevel());
    sim.start();
    sim.world.squad.count = 0;
    sim.step();
    expect(sim.world.phase).toBe('defeat');
    expect(sim.isFinished()).toBe(false);
    for (let i = 0; i < 70; i++) sim.step();
    expect(sim.isFinished()).toBe(true);
    expect(sim.getResult().victory).toBe(false);
  });
  it('clears events', () => {
    const sim = new Simulation(makeTestLevel());
    sim.start();
    expect(sim.world.events.length).toBeGreaterThan(0);
    sim.clearEvents();
    expect(sim.world.events.length).toBe(0);
  });
  it('nudges and sets the target', () => {
    const sim = new Simulation(makeTestLevel());
    sim.setTargetX(1);
    sim.nudgeTargetX(0.5);
    expect(sim.world.squad.targetX).toBe(1.5);
  });
});
