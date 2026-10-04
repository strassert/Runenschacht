import { describe, it, expect } from 'vitest';
import { GameStateMachine } from './GameStateMachine';

describe('GameStateMachine', () => {
  it('starts in boot and follows valid transitions', () => {
    const m = new GameStateMachine();
    expect(m.state).toBe('boot');
    m.go('playing');
    m.go('paused');
    m.go('playing');
    m.go('result');
    expect(m.state).toBe('result');
    expect(m.previous).toBe('playing');
  });
  it('throws on invalid transitions', () => {
    const m = new GameStateMachine();
    expect(m.canGo('result')).toBe(false);
    expect(() => m.go('result')).toThrow();
    expect(m.state).toBe('boot');
  });
  it('notifies listeners with (to, from) and supports unsubscribe', () => {
    const m = new GameStateMachine();
    const calls: [string, string][] = [];
    const off = m.onChange((to, from) => calls.push([to, from]));
    m.go('menu');
    off();
    m.go('shop');
    expect(calls).toEqual([['menu', 'boot']]);
  });
});
