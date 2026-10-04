/** Alle Spielkonstanten. Werte siehe docs/plan/00-game-design.md. */
export interface WeaponDef {
  id: 'pistol' | 'rifle' | 'laser' | 'plasma';
  name: string;
  fireInterval: number;
  damage: number;
  bulletSpeed: number;
  range: number;
  tracerColor: number;
}

export const WEAPONS: readonly WeaponDef[] = [
  {
    id: 'pistol',
    name: 'Pistole',
    fireInterval: 0.45,
    damage: 1,
    bulletSpeed: 34,
    range: 26,
    tracerColor: 0xffc86b,
  },
  {
    id: 'rifle',
    name: 'Sturmgewehr',
    fireInterval: 0.3,
    damage: 1,
    bulletSpeed: 40,
    range: 28,
    tracerColor: 0xffe08a,
  },
  {
    id: 'laser',
    name: 'Lasergewehr',
    fireInterval: 0.22,
    damage: 1.5,
    bulletSpeed: 55,
    range: 30,
    tracerColor: 0x6fd8ff,
  },
  {
    id: 'plasma',
    name: 'Plasmawerfer',
    fireInterval: 0.18,
    damage: 2,
    bulletSpeed: 50,
    range: 32,
    tracerColor: 0xc58bff,
  },
];

export const CONFIG = {
  sim: { dt: 1 / 60, maxStepsPerFrame: 8 },
  track: { width: 12, halfWidth: 6, railMargin: 0.35, laneCenters: [-4.5, 0, 4.5] },
  squad: {
    baseStartSoldiers: 8,
    maxSoldiers: 999,
    forwardSpeed: 7,
    lateralResponse: 10,
    lateralMaxSpeed: 16,
    slotSpacing: 0.34,
    minSlotSpacing: 0.17,
    soldierRadius: 0.22,
    maxRenderedSoldiers: 300,
  },
  shooting: { maxShooters: 48, maxBullets: 1500, muzzleOffsetZ: 0.4 },
  enemy: {
    radius: 0.3,
    speed: 3.6,
    aggroDistance: 20,
    steerDistance: 8,
    steerGain: 1.5,
    spill: 1.2,
    despawnBehind: 4,
    gridSpacing: 0.55,
    jitter: 0.12,
    maxEnemies: 2000,
  },
  block: { width: 1.6, depth: 0.7 },
  card: { depth: 0.4, defaultWidth: 3.4, wallDamagePerSoldier: 1 },
  gate: { depth: 0.5 },
  boss: {
    defaultSpeed: 2.2,
    defaultContactKillRate: 12,
    defaultScale: 3,
    radiusPerScale: 0.5,
    startOffset: 24,
    activationDistance: 10,
  },
  hero: {
    hp: 60,
    fireInterval: 0.08,
    damage: 2,
    bulletSpeed: 45,
    range: 30,
    followOffsetZ: 1.0,
    radius: 0.8,
  },
  outcome: { victoryDelay: 1.5, defeatDelay: 1.0 },
  economy: { coinsPerSurvivor: 1, coinsBossBonus: 50, coinsPerLevel: 10 },
  stars: { twoStarRatio: 0.25, threeStarRatio: 0.5 },
} as const;

/** Maximale |x| der Truppmitte, damit ein Trupp mit Radius r auf der Brücke bleibt. */
export const TRACK_INNER_HALF_WIDTH = CONFIG.track.halfWidth - CONFIG.track.railMargin; // 5.65
