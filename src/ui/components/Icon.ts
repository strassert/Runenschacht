export type IconName =
  | 'pause'
  | 'play'
  | 'retry'
  | 'home'
  | 'next'
  | 'gear'
  | 'cart'
  | 'coin'
  | 'star'
  | 'starOutline'
  | 'lock'
  | 'skull'
  | 'sword'
  | 'shield'
  | 'heart'
  | 'soundOn'
  | 'soundOff'
  | 'music'
  | 'musicOff'
  | 'vibrate'
  | 'close'
  | 'check'
  | 'chevronLeft'
  | 'infinity'
  | 'hand';

interface IconDef {
  /** SVG-Pfade (24×24-Raster) */
  paths: string[];
  /** Gefüllt statt nur Kontur */
  fill?: boolean;
}

const STAR = 'M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6-5.9-3.2-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z';
const SPEAKER = 'M4 9v6h4l5 4V5L8 9H4z';
const NOTE = 'M9 18V6l10-2v12 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z';

const ICONS: Record<IconName, IconDef> = {
  pause: { paths: ['M8 5v14', 'M16 5v14'] },
  play: { paths: ['M7 4l13 8-13 8z'], fill: true },
  retry: { paths: ['M20 12a8 8 0 1 1-2.4-5.7', 'M20 4v5h-5'] },
  home: { paths: ['M3 11l9-8 9 8', 'M5 10v10h5v-6h4v6h5V10'] },
  next: { paths: ['M5 4l10 8-10 8z', 'M19 5v14'], fill: true },
  gear: {
    paths: [
      'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
      'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
    ],
  },
  cart: {
    paths: ['M3 4h3l2.5 11h9.5l2-8H7', 'M10 20a1.5 1.5 0 1 0 0-.01', 'M17 20a1.5 1.5 0 1 0 0-.01'],
  },
  coin: {
    paths: [
      'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
      'M12 7v10',
      'M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4',
    ],
  },
  star: { paths: [STAR], fill: true },
  starOutline: { paths: [STAR] },
  lock: { paths: ['M5 11h14v10H5z', 'M8 11V8a4 4 0 0 1 8 0v3'] },
  skull: {
    paths: [
      'M12 3a8 8 0 0 0-8 8c0 2.5 1.2 4.4 3 5.6V20h10v-3.4c1.8-1.2 3-3.1 3-5.6a8 8 0 0 0-8-8z',
      'M9 12a1.6 1.6 0 1 0 0 .01',
      'M15 12a1.6 1.6 0 1 0 0 .01',
    ],
  },
  sword: { paths: ['M14.5 3.5h6v6L10 20H4v-6z', 'M4 20l-1 1'] },
  shield: { paths: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'] },
  heart: { paths: ['M12 20s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z'] },
  soundOn: { paths: [SPEAKER, 'M16 9a4 4 0 0 1 0 6', 'M18.5 6.5a8 8 0 0 1 0 11'] },
  soundOff: { paths: [SPEAKER, 'M17 9l5 6', 'M22 9l-5 6'] },
  music: { paths: [NOTE] },
  musicOff: { paths: [NOTE, 'M3 3l18 18'] },
  vibrate: { paths: ['M8 3h8v18H8z', 'M4 8v8', 'M20 8v8'] },
  close: { paths: ['M6 6l12 12', 'M18 6L6 18'] },
  check: { paths: ['M5 13l4 4 10-10'] },
  chevronLeft: { paths: ['M15 5l-7 7 7 7'] },
  infinity: {
    paths: [
      'M12 12c-2-3-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1 5.5-4s3.5-4 5.5-4a4 4 0 0 1 0 8c-2 0-3.5-1-5.5-4z',
    ],
  },
  hand: {
    paths: [
      'M8 13V6.5a1.5 1.5 0 0 1 3 0V11',
      'M11 11V4.5a1.5 1.5 0 0 1 3 0V11',
      'M14 11V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L3.5 14a1.5 1.5 0 0 1 2.4-1.7L8 15',
    ],
  },
};

const NS = 'http://www.w3.org/2000/svg';

/** Inline-SVG-Icon (Strichstärke 2.5, runde Enden, currentColor). */
export function icon(name: IconName, size = 24): SVGElement {
  const def = ICONS[name];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('fill', def.fill ? 'currentColor' : 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of def.paths) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
  }
  return svg;
}
