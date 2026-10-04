import { CONFIG } from '../config';
import { expandBlocks } from './expand';
import type { LevelDef } from './types';

const isInt = (v: number): boolean => Number.isInteger(v);

/** Liefert eine Liste lesbarer Fehlermeldungen (leer = gültig). */
export function validateLevel(level: LevelDef): string[] {
  const errors: string[] = [];
  const err = (msg: string): void => {
    errors.push(`Level ${level.id}: ${msg}`);
  };
  const arena = level.arenaZ;
  const half = CONFIG.track.halfWidth;

  if (!(level.id >= 1)) err('id muss >= 1 sein');
  if (!level.name || level.name.trim() === '') err('name darf nicht leer sein');
  if (!(arena >= 100 && arena <= 2000)) err('arenaZ muss zwischen 100 und 2000 liegen');
  if (level.startWeaponTier !== undefined && ![0, 1, 2, 3].includes(level.startWeaponTier)) {
    err('startWeaponTier muss 0..3 sein');
  }

  for (const col of level.blockColumns ?? []) {
    if (col.spacing < CONFIG.block.depth) err(`Blockspalte x=${col.x}: spacing zu klein`);
    if (col.zStart > col.zEnd) err(`Blockspalte x=${col.x}: zStart > zEnd`);
  }
  const colsOk = (level.blockColumns ?? []).every((c) => c.spacing >= CONFIG.block.depth);
  const blocks = colsOk ? expandBlocks(level) : (level.blocks ?? []);
  for (const b of blocks) {
    if (Math.abs(b.x) + 0.8 > half) err(`Block bei x=${b.x}, z=${b.z} ragt über die Brücke`);
    if (b.z < 5 || b.z > arena - 5) err(`Block z=${b.z} liegt außerhalb 5..arenaZ-5`);
    if (!(b.value >= 1) || !isInt(b.value)) err(`Block z=${b.z}: value muss ganzzahlig >= 1 sein`);
  }

  for (const g of level.gates ?? []) {
    if (g.z < 5 || g.z > arena - 5) err(`Tor z=${g.z} liegt außerhalb 5..arenaZ-5`);
    if (g.options.length < 1 || g.options.length > 3) err(`Tor z=${g.z}: 1-3 Optionen erlaubt`);
    const sorted = [...g.options].sort((a, b) => a.xMin - b.xMin);
    for (let i = 0; i < sorted.length; i++) {
      const o = sorted[i];
      if (!(o.xMin >= -half && o.xMin < o.xMax && o.xMax <= half)) {
        err(`Tor z=${g.z}: ungültiger x-Bereich ${o.xMin}..${o.xMax}`);
      }
      if (i > 0 && o.xMin < sorted[i - 1].xMax - 1e-9) err(`Tor z=${g.z}: Optionen überlappen`);
      const min = o.op === 'add' || o.op === 'sub' ? 1 : 2;
      if (!isInt(o.value) || o.value < min) err(`Tor z=${g.z}: value ${o.value} ungültig für ${o.op}`);
    }
  }

  const cards = (level.cards ?? []).map((c) => ({ ...c, width: c.width ?? CONFIG.card.defaultWidth }));
  for (const c of cards) {
    if (!(c.hp >= 1)) err(`Karte z=${c.z}: hp muss >= 1 sein`);
    if (Math.abs(c.x) + c.width / 2 > half) err(`Karte z=${c.z} x=${c.x} ragt über die Brücke`);
    if (c.z < 5 || c.z > arena - 5) err(`Karte z=${c.z} liegt außerhalb 5..arenaZ-5`);
    if (c.kind === 'soldiers' && !((c.reward ?? 0) >= 1)) err(`Karte z=${c.z}: soldiers braucht reward >= 1`);
  }
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i];
      const b = cards[j];
      if (Math.abs(a.z - b.z) < 1) {
        const overlap = Math.abs(a.x - b.x) < (a.width + b.width) / 2;
        if (overlap) err(`Karten bei z=${a.z} überlappen sich`);
      }
    }
  }

  let total = 0;
  for (const h of level.hordes ?? []) {
    if (!(h.zStart < h.zEnd)) err('Horde: zStart muss < zEnd sein');
    if (!(h.xMin < h.xMax)) err('Horde: xMin muss < xMax sein');
    if (h.xMin < -half || h.xMax > half) err('Horde: x-Bereich außerhalb der Brücke');
    if (!(h.count >= 1)) err('Horde: count muss >= 1 sein');
    if (h.hp !== undefined && !(h.hp >= 1)) err('Horde: hp muss >= 1 sein');
    if (h.zEnd > arena - 5) err(`Horde: zEnd=${h.zEnd} liegt hinter arenaZ-5`);
    total += h.count;
  }
  if (total > CONFIG.enemy.maxEnemies) err(`Gesamtzahl Gegner ${total} > ${CONFIG.enemy.maxEnemies}`);

  const b = level.boss;
  if (!(b.hp >= 1)) err('Boss: hp muss >= 1 sein');
  for (const [k, v] of [
    ['speed', b.speed],
    ['contactKillRate', b.contactKillRate],
    ['scale', b.scale],
  ] as const) {
    if (v !== undefined && !(v > 0)) err(`Boss: ${k} muss > 0 sein`);
  }

  return errors;
}
