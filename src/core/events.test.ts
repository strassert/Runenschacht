import { describe, it, expect } from 'vitest';
import { emit, type SimEvent } from './events';

describe('emit', () => {
  it('appends events in order', () => {
    const target: { events: SimEvent[] } = { events: [] };
    emit(target, { type: 'heroJoined' });
    emit(target, { type: 'bossActivated' });
    expect(target.events.map((e) => e.type)).toEqual(['heroJoined', 'bossActivated']);
  });
});
