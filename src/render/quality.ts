export type Quality = 'low' | 'medium' | 'high';

export interface QualityProfile {
  maxPixelRatio: number;
  shadows: boolean;
  antialias: boolean;
  maxRenderedSoldiers: number;
  environmentDensity: number;
  particlesScale: number;
}

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  low: {
    maxPixelRatio: 1,
    shadows: false,
    antialias: false,
    maxRenderedSoldiers: 150,
    environmentDensity: 0.5,
    particlesScale: 0.5,
  },
  medium: {
    maxPixelRatio: 1.5,
    shadows: true,
    antialias: false,
    maxRenderedSoldiers: 250,
    environmentDensity: 1,
    particlesScale: 1,
  },
  high: {
    maxPixelRatio: 2,
    shadows: true,
    antialias: true,
    maxRenderedSoldiers: 300,
    environmentDensity: 1.3,
    particlesScale: 1,
  },
};

const ORDER: Quality[] = ['low', 'medium', 'high'];

/** Startwert für 'auto': mobile (pointer: coarse) → medium, sonst high. */
export function initialAutoQuality(isCoarsePointer: boolean): Quality {
  return isCoarsePointer ? 'medium' : 'high';
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Bewertet gemessene Frame-Zeiten (ms) und schlägt eine Stufe vor (oder null = bleiben). */
export class AutoQualityGovernor {
  private current: Quality;
  private samples: number[] = [];
  private elapsedMs = 0;
  private fastWindows = 0;
  private upgraded = false;

  constructor(start: Quality) {
    this.current = start;
  }

  get quality(): Quality {
    return this.current;
  }

  /**
   * Nach je 3 s Messung: Median > 22 ms → eine Stufe runter; Median < 12 ms über 2 Messungen →
   * eine Stufe hoch (höchstens 1× pro Sitzung).
   */
  sample(frameMs: number): Quality | null {
    this.samples.push(frameMs);
    this.elapsedMs += frameMs;
    if (this.elapsedMs < 3000) return null;
    const med = median(this.samples);
    this.samples = [];
    this.elapsedMs = 0;
    const idx = ORDER.indexOf(this.current);
    if (med > 22) {
      this.fastWindows = 0;
      if (idx > 0) {
        this.current = ORDER[idx - 1];
        return this.current;
      }
      return null;
    }
    if (med < 12) {
      this.fastWindows++;
      if (this.fastWindows >= 2 && !this.upgraded && idx < ORDER.length - 1) {
        this.upgraded = true;
        this.fastWindows = 0;
        this.current = ORDER[idx + 1];
        return this.current;
      }
    } else {
      this.fastWindows = 0;
    }
    return null;
  }
}
