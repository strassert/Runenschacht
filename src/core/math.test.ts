import { describe, it, expect } from 'vitest';
import {
  approach,
  circleIntersectsRect,
  clamp,
  damp,
  distSq,
  easeOutBack,
  easeOutCubic,
  formatCount,
  inverseLerp,
  lerp,
} from './math';

describe('math', () => {
  it('clamp', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it('lerp / inverseLerp', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(inverseLerp(0, 10, 5)).toBe(0.5);
    expect(inverseLerp(3, 3, 5)).toBe(0);
  });
  it('damp', () => {
    const v = damp(0, 10, 10, 1 / 60);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
    expect(damp(0, 10, 10, 100)).toBeCloseTo(10, 5);
  });
  it('approach', () => {
    expect(approach(0, 5, 2)).toBe(2);
    expect(approach(4, 5, 2)).toBe(5);
    expect(approach(5, 0, 2)).toBe(3);
  });
  it('circleIntersectsRect', () => {
    expect(circleIntersectsRect(0, 0, 1, 1.5, 0, 0.6, 0.5)).toBe(true);
    expect(circleIntersectsRect(0, 0, 1, 3, 0, 0.5, 0.5)).toBe(false);
  });
  it('distSq', () => {
    expect(distSq(0, 0, 3, 4)).toBe(25);
  });
  it('easing', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutBack(1)).toBeCloseTo(1, 5);
    expect(easeOutBack(0.7)).toBeGreaterThan(1);
  });
  it('formatCount', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1234)).toBe('1.2k');
  });
});
