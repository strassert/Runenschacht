export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, v: number): number {
  return b === a ? 0 : (v - a) / (b - a);
}

/** Framerate-unabhängige Annäherung: a + (b - a) * (1 - exp(-lambda * dt)) */
export function damp(a: number, b: number, lambda: number, dt: number): number {
  return a + (b - a) * (1 - Math.exp(-lambda * dt));
}

/** Bewegt a Richtung b um höchstens maxDelta. */
export function approach(a: number, b: number, maxDelta: number): number {
  if (a < b) return Math.min(a + maxDelta, b);
  return Math.max(a - maxDelta, b);
}

/** Kreis (cx,cz,r) schneidet Rechteck (Mitte rx,rz; halbe Ausdehnung hw,hd)? */
export function circleIntersectsRect(
  cx: number,
  cz: number,
  r: number,
  rx: number,
  rz: number,
  hw: number,
  hd: number,
): boolean {
  const nx = clamp(cx, rx - hw, rx + hw);
  const nz = clamp(cz, rz - hd, rz + hd);
  const dx = cx - nx;
  const dz = cz - nz;
  return dx * dx + dz * dz <= r * r;
}

export function distSq(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
}

/** < 1000: ganzzahlig; sonst "1.2k". */
export function formatCount(n: number): string {
  const v = Math.round(n);
  if (v < 1000) return String(v);
  return (Math.floor(v / 100) / 10).toFixed(1) + 'k';
}
