import { describe, it, expect } from 'vitest';
import { validateLevel } from './validate';
import type { LevelDef } from './types';

function ok(over: Partial<LevelDef> = {}): LevelDef {
  return { id: 1, name: 'Test', seed: 1, arenaZ: 200, boss: { hp: 10 }, ...over };
}
function has(errors: string[], text: string): boolean {
  return errors.some((e) => e.includes(text));
}

describe('validateLevel', () => {
  it('accepts a minimal level', () => {
    expect(validateLevel(ok())).toEqual([]);
  });
  it('prefixes messages', () => {
    const e = validateLevel(ok({ id: 7, name: '' }));
    expect(e.every((m) => m.startsWith('Level 7: '))).toBe(true);
  });
  it('rejects bad arena and id', () => {
    expect(has(validateLevel(ok({ arenaZ: 50 })), 'arenaZ')).toBe(true);
    expect(has(validateLevel(ok({ id: 0 })), 'id')).toBe(true);
  });
  it('rejects blocks outside the bridge / range', () => {
    expect(has(validateLevel(ok({ blocks: [{ x: 5.6, z: 20, value: 1 }] })), 'ragt über die Brücke')).toBe(
      true,
    );
    expect(has(validateLevel(ok({ blocks: [{ x: 0, z: 1, value: 1 }] })), 'außerhalb')).toBe(true);
    expect(has(validateLevel(ok({ blocks: [{ x: 0, z: 20, value: 0 }] })), 'value')).toBe(true);
  });
  it('rejects tight block columns', () => {
    const e = validateLevel(ok({ blockColumns: [{ x: 0, zStart: 10, zEnd: 20, spacing: 0.1, value: 1 }] }));
    expect(has(e, 'spacing')).toBe(true);
  });
  it('validates gates', () => {
    const base = { z: 50 };
    expect(has(validateLevel(ok({ gates: [{ ...base, options: [] }] })), 'Optionen')).toBe(true);
    expect(
      has(
        validateLevel(
          ok({
            gates: [
              {
                ...base,
                options: [
                  { xMin: -6, xMax: 1, op: 'add', value: 5 },
                  { xMin: 0, xMax: 6, op: 'add', value: 5 },
                ],
              },
            ],
          }),
        ),
        'überlappen',
      ),
    ).toBe(true);
    expect(
      has(
        validateLevel(ok({ gates: [{ ...base, options: [{ xMin: -6, xMax: 6, op: 'mul', value: 1 }] }] })),
        'value',
      ),
    ).toBe(true);
  });
  it('validates cards', () => {
    expect(
      has(validateLevel(ok({ cards: [{ kind: 'weapon', x: 5, z: 30, hp: 5, width: 3.4 }] })), 'ragt'),
    ).toBe(true);
    expect(has(validateLevel(ok({ cards: [{ kind: 'soldiers', x: 0, z: 30, hp: 5 }] })), 'reward')).toBe(
      true,
    );
    expect(
      has(
        validateLevel(
          ok({
            cards: [
              { kind: 'weapon', x: 0, z: 30, hp: 5 },
              { kind: 'hero', x: 1, z: 30, hp: 5 },
            ],
          }),
        ),
        'überlappen',
      ),
    ).toBe(true);
  });
  it('validates hordes', () => {
    expect(
      has(validateLevel(ok({ hordes: [{ zStart: 50, zEnd: 40, xMin: -1, xMax: 1, count: 5 }] })), 'zStart'),
    ).toBe(true);
    expect(
      has(
        validateLevel(ok({ hordes: [{ zStart: 50, zEnd: 60, xMin: -7, xMax: 1, count: 5 }] })),
        'außerhalb',
      ),
    ).toBe(true);
    expect(
      has(
        validateLevel(ok({ hordes: [{ zStart: 50, zEnd: 60, xMin: -1, xMax: 1, count: 3000 }] })),
        'Gesamtzahl',
      ),
    ).toBe(true);
  });
  it('validates boss and weapon tier', () => {
    expect(has(validateLevel(ok({ boss: { hp: 0 } })), 'Boss')).toBe(true);
    expect(has(validateLevel(ok({ boss: { hp: 5, speed: -1 } })), 'speed')).toBe(true);
    expect(has(validateLevel(ok({ startWeaponTier: 9 })), 'startWeaponTier')).toBe(true);
  });
});
