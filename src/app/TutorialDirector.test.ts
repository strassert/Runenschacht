import { describe, it, expect } from 'vitest';
import { TutorialDirector } from './TutorialDirector';
import { createWorld } from '../core/world';
import { makeTestLevel } from '../core/testUtils';

describe('TutorialDirector', () => {
  it('drag tip fires once in ready phase', () => {
    const w = createWorld(makeTestLevel({ id: 1 }));
    const d = new TutorialDirector({});
    expect(d.check(w)?.id).toBe('drag');
    expect(d.check(w)).toBeNull();
  });
  it('blocks tip when a block is 8-14 m ahead', () => {
    const w = createWorld(makeTestLevel({ id: 1, blocks: [{ x: 3, z: 20, value: 1 }] }));
    w.phase = 'running';
    w.squad.z = 4;
    const d = new TutorialDirector({ drag: true });
    expect(d.check(w)).toBeNull();
    w.squad.z = 8;
    const tip = d.check(w);
    expect(tip?.id).toBe('blocks');
    expect(tip?.target).toEqual({ x: 3, z: 20 });
    expect(d.check(w)).toBeNull();
  });
  it('card comes before blocks when both fire', () => {
    const w = createWorld(
      makeTestLevel({
        id: 1,
        blocks: [{ x: 0, z: 30, value: 1 }],
        cards: [{ kind: 'weapon', x: 0, z: 38, hp: 5 }],
      }),
    );
    w.phase = 'running';
    w.squad.z = 18;
    const d = new TutorialDirector({ drag: true });
    expect(d.check(w)?.id).toBe('card');
    expect(d.check(w)?.id).toBe('blocks');
  });
  it('gives no tips after level 3', () => {
    const w = createWorld(makeTestLevel({ id: 4 }));
    expect(new TutorialDirector({}).check(w)).toBeNull();
  });
  it('respects already seen tips', () => {
    const w = createWorld(makeTestLevel({ id: 1 }));
    expect(new TutorialDirector({ drag: true }).check(w)).toBeNull();
  });
  it('explains walls after a smash event', () => {
    const w = createWorld(makeTestLevel({ id: 1 }));
    w.phase = 'running';
    w.squad.z = 10;
    const d = new TutorialDirector({ drag: true });
    d.onEvent({ type: 'cardSmashed', id: 0, lost: 3, x: 0, z: 10 });
    expect(d.check(w)?.id).toBe('wall');
  });
  it('boss tip when the boss starts walking', () => {
    const w = createWorld(makeTestLevel({ id: 1 }));
    w.squad.z = 190;
    w.phase = 'bossFight';
    w.boss.state = 'walking';
    const d = new TutorialDirector({ drag: true });
    expect(d.check(w)?.id).toBe('boss');
  });
});
