import type { BlockColor, CardKind, GateOp } from '../types';

export interface BlockDef {
  x: number;
  z: number;
  value: number;
  color?: BlockColor;
}
/** Spalte gleichartiger Blöcke von zStart bis einschließlich zEnd (sofern auf dem Raster). */
export interface BlockColumnDef {
  x: number;
  zStart: number;
  zEnd: number;
  spacing: number;
  value: number;
  color?: BlockColor;
}
export interface GateOptionDef {
  xMin: number;
  xMax: number;
  op: GateOp;
  value: number;
}
export interface GateDef {
  z: number;
  options: GateOptionDef[];
}
export interface CardDef {
  kind: CardKind;
  x: number;
  z: number;
  hp: number;
  width?: number;
  reward?: number;
}
export interface HordeDef {
  zStart: number;
  zEnd: number;
  xMin: number;
  xMax: number;
  count: number;
  hp?: number;
}
export interface BossDef {
  hp: number;
  speed?: number;
  contactKillRate?: number;
  scale?: number;
}

export interface LevelDef {
  id: number;
  name: string;
  seed: number;
  /** z, an dem der Trupp stoppt und der Bosskampf beginnt */
  arenaZ: number;
  /** zusätzliche Startsoldaten (zu CONFIG.squad.baseStartSoldiers) */
  startSoldiers?: number;
  startWeaponTier?: number;
  blocks?: BlockDef[];
  blockColumns?: BlockColumnDef[];
  gates?: GateDef[];
  cards?: CardDef[];
  hordes?: HordeDef[];
  boss: BossDef;
}
