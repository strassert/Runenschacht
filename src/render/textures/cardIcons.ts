import type { CardKind } from '../../core/types';
import { roundedRect } from './canvas';
import { CARD_LABEL, FONT_FAMILY } from './labelTexture';

const INK = '#1a1a1a';

function outline(ctx: CanvasRenderingContext2D, fill: string, lw = 6): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawRifle(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  // Schaft
  ctx.beginPath();
  ctx.moveTo(-190, -4);
  ctx.lineTo(-120, -22);
  ctx.lineTo(-95, -22);
  ctx.lineTo(-95, 26);
  ctx.lineTo(-140, 40);
  ctx.lineTo(-190, 34);
  ctx.closePath();
  outline(ctx, '#f4f4f4');
  // Gehäuse
  roundedRect(ctx, -105, -30, 160, 50, 8);
  outline(ctx, '#ffffff');
  // Magazin
  ctx.beginPath();
  ctx.moveTo(-30, 20);
  ctx.lineTo(10, 20);
  ctx.lineTo(24, 78);
  ctx.lineTo(-14, 78);
  ctx.closePath();
  outline(ctx, '#e9e9e9');
  // Griff
  ctx.beginPath();
  ctx.moveTo(-76, 20);
  ctx.lineTo(-48, 20);
  ctx.lineTo(-56, 70);
  ctx.lineTo(-84, 66);
  ctx.closePath();
  outline(ctx, '#e9e9e9');
  // Zielfernrohr
  roundedRect(ctx, -70, -52, 90, 20, 8);
  outline(ctx, '#d9d9d9');
  // Lauf
  roundedRect(ctx, 55, -22, 130, 22, 6);
  outline(ctx, '#ffffff');
  // Leuchtstreifen
  ctx.save();
  ctx.shadowColor = '#3fa9ff';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#6fc4ff';
  roundedRect(ctx, -100, -14, 280, 10, 5);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawBrute(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  // Beine
  roundedRect(ctx, -58, 40, 44, 80, 10);
  outline(ctx, '#f4f4f4');
  roundedRect(ctx, 14, 40, 44, 80, 10);
  outline(ctx, '#f4f4f4');
  // Rumpf (breite Schultern)
  ctx.beginPath();
  ctx.moveTo(-100, -40);
  ctx.quadraticCurveTo(0, -70, 100, -40);
  ctx.lineTo(72, 50);
  ctx.lineTo(-72, 50);
  ctx.closePath();
  outline(ctx, '#ffffff');
  // Arme
  ctx.beginPath();
  ctx.ellipse(-112, -4, 30, 52, 0.25, 0, Math.PI * 2);
  outline(ctx, '#f4f4f4');
  ctx.beginPath();
  ctx.ellipse(112, -4, 30, 52, -0.25, 0, Math.PI * 2);
  outline(ctx, '#f4f4f4');
  // Kopf
  ctx.beginPath();
  ctx.ellipse(0, -70, 30, 34, 0, 0, Math.PI * 2);
  outline(ctx, '#ffffff');
  // Patronengurt
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-90, -38);
  ctx.lineTo(-68, -48);
  ctx.lineTo(88, 40);
  ctx.lineTo(66, 52);
  ctx.closePath();
  ctx.fillStyle = '#e9e9e9';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  for (let i = 0; i < 6; i++) ctx.fillRect(-72 + i * 26, -34 + i * 15, 10, 14);
  ctx.restore();
  // Minigun
  roundedRect(ctx, 60, 4, 110, 26, 6);
  outline(ctx, '#d9d9d9');
  for (let i = 0; i < 3; i++) {
    roundedRect(ctx, 150, 6 + i * 8, 54, 6, 3);
    outline(ctx, '#ffffff', 3);
  }
  ctx.restore();
}

function drawSoldiers(ctx: CanvasRenderingContext2D, cx: number, cy: number, reward: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  const xs = [-90, 0, 90];
  xs.forEach((x, i) => {
    const y = i === 1 ? -20 : 0;
    ctx.beginPath();
    ctx.ellipse(x, y + 52, 34, 40, 0, 0, Math.PI * 2);
    outline(ctx, '#f4f4f4', 5);
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    outline(ctx, '#ffffff', 5);
    ctx.beginPath();
    ctx.arc(x, y - 4, 32, Math.PI, Math.PI * 2);
    ctx.closePath();
    outline(ctx, '#bcd3ff', 5);
  });
  ctx.font = `64px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 12;
  ctx.strokeStyle = INK;
  ctx.strokeText(`+${reward}`, 0, 118);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`+${reward}`, 0, 118);
  ctx.restore();
}

/** Zeichnet eine komplette Kartenvorderseite (weiße Tafel, Symbol, großer Zähler). */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  kind: CardKind,
  hpText: string,
  w = 512,
  h = 384,
  reward = 0,
): void {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#dfe3ea');
  roundedRect(ctx, 6, 6, w - 12, h - 12, 36);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#d9dde3';
  ctx.stroke();

  const iconY = h * 0.34;
  if (kind === 'weapon') drawRifle(ctx, w / 2, iconY);
  else if (kind === 'hero') drawBrute(ctx, w / 2, iconY + 4);
  else drawSoldiers(ctx, w / 2, iconY - 14, reward);

  ctx.font = `150px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const ty = h * 0.8;
  let px = 150;
  const maxW = w - 60;
  const m = ctx.measureText(hpText).width;
  if (m > maxW) {
    px = Math.floor((150 * maxW) / m);
    ctx.font = `${px}px ${FONT_FAMILY}`;
  }
  ctx.lineWidth = CARD_LABEL.strokePx;
  ctx.strokeStyle = CARD_LABEL.stroke;
  ctx.strokeText(hpText, w / 2, ty);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(hpText, w / 2, ty);
}
