import { describe, it, expect } from 'vitest';
import { Bot, scoreCandidate } from './bot';
import { createWorld } from './world';
import { makeTestLevel } from './testUtils';

describe('bot', () => {
  it('prefers the lane with a gold block', () => {
    const w = createWorld(makeTestLevel({ blocks: [{ x: 4.5, z: 15, value: 33 }] }));
    expect(scoreCandidate(w, 4.5)).toBeGreaterThan(scoreCandidate(w, -4.5));
  });
  it('avoids a negative gate option', () => {
    const w = createWorld(
      makeTestLevel({
        gates: [
          {
            z: 20,
            options: [
              { xMin: -6, xMax: 0, op: 'sub', value: 5 },
              { xMin: 0, xMax: 6, op: 'add', value: 20 },
            ],
          },
        ],
      }),
    );
    expect(scoreCandidate(w, 3)).toBeGreaterThan(scoreCandidate(w, -3));
  });
  it('avoids enemies', () => {
    const w = createWorld(
      makeTestLevel({ hordes: [{ zStart: 15, zEnd: 20, xMin: -1.5, xMax: 1.5, count: 30 }] }),
    );
    expect(scoreCandidate(w, 4.5)).toBeGreaterThan(scoreCandidate(w, 0));
  });
  it('avoids unreachable cards but likes shootable ones', () => {
    const hard = createWorld(makeTestLevel({ cards: [{ kind: 'hero', x: 0, z: 20, hp: 9999, width: 3.6 }] }));
    expect(scoreCandidate(hard, 4.5)).toBeGreaterThan(scoreCandidate(hard, 0));
    const easy = createWorld(makeTestLevel({ cards: [{ kind: 'weapon', x: 0, z: 20, hp: 3, width: 3.6 }] }));
    expect(scoreCandidate(easy, 0)).toBeGreaterThan(scoreCandidate(easy, 4.5));
  });
  it('update sets the target only on its interval', () => {
    const w = createWorld(makeTestLevel({ blocks: [{ x: 4.5, z: 15, value: 33 }] }));
    const bot = new Bot(0.25);
    bot.update(w, 1 / 60);
    expect(w.squad.targetX).toBeGreaterThan(0);
    const t = w.squad.targetX;
    w.blocks[0].collected = true;
    bot.update(w, 1 / 60);
    expect(w.squad.targetX).toBe(t);
  });
});
