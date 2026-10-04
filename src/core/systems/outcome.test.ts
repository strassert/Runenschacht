import { describe, it, expect } from 'vitest';
import { updateOutcome } from './outcome';
import { createWorld } from '../world';
import { makeTestLevel } from '../testUtils';
import { activateHero } from './hero';

describe('outcome', () => {
  it('victory when boss is dead', () => {
    const w = createWorld(makeTestLevel());
    w.boss.state = 'dead';
    updateOutcome(w);
    expect(w.phase).toBe('victory');
  });
  it('defeat when squad is empty without hero', () => {
    const w = createWorld(makeTestLevel());
    w.squad.count = 0;
    updateOutcome(w);
    expect(w.phase).toBe('defeat');
  });
  it('continues when the hero is still alive', () => {
    const w = createWorld(makeTestLevel());
    w.squad.count = 0;
    activateHero(w);
    updateOutcome(w);
    expect(w.phase).toBe('ready');
  });
  it('final phases are sticky', () => {
    const w = createWorld(makeTestLevel());
    w.boss.state = 'dead';
    updateOutcome(w);
    w.squad.count = 0;
    updateOutcome(w);
    expect(w.phase).toBe('victory');
  });
});
