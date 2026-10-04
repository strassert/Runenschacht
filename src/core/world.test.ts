import { describe, it, expect } from 'vitest';
import { changeSoldiers, createWorld, setPhase } from './world';
import { getLevel } from './level/levels';

describe('world', () => {
  it('creates level 1', () => {
    const w = createWorld(getLevel(1)!);
    expect(w.squad.count).toBe(8);
    expect(w.blocks.length).toBe(28 + 10);
    expect(w.cards.length).toBe(2);
    expect(w.gates.length).toBe(2);
    expect(w.enemies.count).toBe(280);
    expect(w.boss.z).toBe(214);
    expect(w.phase).toBe('ready');
    expect(w.squad.radius).toBeGreaterThan(0);
  });
  it('applies start soldier modifier', () => {
    const w = createWorld(getLevel(1)!, { startSoldierBonus: 6, fireRateMultiplier: 1, coinMultiplier: 1 });
    expect(w.squad.count).toBe(14);
  });
  it('changeSoldiers clamps and emits once', () => {
    const w = createWorld(getLevel(1)!);
    expect(changeSoldiers(w, -100, 'enemy')).toBe(-8);
    expect(w.squad.count).toBe(0);
    expect(w.stats.soldiersLost).toBe(8);
    expect(w.events.length).toBe(1);
  });
  it('does not emit for zero change', () => {
    const w = createWorld(getLevel(1)!);
    expect(changeSoldiers(w, 0, 'block')).toBe(0);
    expect(w.events.length).toBe(0);
  });
  it('tracks peak count', () => {
    const w = createWorld(getLevel(1)!);
    changeSoldiers(w, 50, 'block');
    changeSoldiers(w, -30, 'enemy');
    expect(w.squad.peakCount).toBe(58);
  });
  it('setPhase emits only on change', () => {
    const w = createWorld(getLevel(1)!);
    setPhase(w, 'running');
    setPhase(w, 'running');
    expect(w.events.filter((e) => e.type === 'phaseChanged').length).toBe(1);
  });
});
