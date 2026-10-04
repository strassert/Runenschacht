import { describe, it, expect } from 'vitest';
import { AutoQualityGovernor, QUALITY_PROFILES, initialAutoQuality } from './quality';

function feed(g: AutoQualityGovernor, ms: number, seconds: number): (string | null)[] {
  const out: (string | null)[] = [];
  const n = Math.round((seconds * 1000) / ms);
  for (let i = 0; i < n; i++) out.push(g.sample(ms));
  return out.filter((v) => v !== null);
}

describe('quality', () => {
  it('has sane profiles', () => {
    expect(QUALITY_PROFILES.low.shadows).toBe(false);
    expect(QUALITY_PROFILES.high.maxPixelRatio).toBeGreaterThan(QUALITY_PROFILES.medium.maxPixelRatio);
  });
  it('picks medium on touch and high on desktop', () => {
    expect(initialAutoQuality(true)).toBe('medium');
    expect(initialAutoQuality(false)).toBe('high');
  });
  it('steps down after 3 s of slow frames until low', () => {
    const g = new AutoQualityGovernor('high');
    expect(feed(g, 30, 3.2)).toEqual(['medium']);
    expect(feed(g, 30, 3.2)).toEqual(['low']);
    expect(feed(g, 30, 10)).toEqual([]);
  });
  it('steps up at most once per session', () => {
    const g = new AutoQualityGovernor('low');
    const events = feed(g, 8, 30);
    expect(events).toEqual(['medium']);
    expect(g.quality).toBe('medium');
  });
  it('does not change for mid-range frame times', () => {
    const g = new AutoQualityGovernor('medium');
    expect(feed(g, 16.7, 20)).toEqual([]);
  });
});
