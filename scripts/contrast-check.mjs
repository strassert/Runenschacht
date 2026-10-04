// Prüft die wichtigsten Text/Hintergrund-Paare der UI gegen WCAG AA (4.5:1 normal, 3:1 große Schrift).
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const pairs = [
  ['Weiß auf Blau (Button)', '#ffffff', '#2f6bff', 3],
  ['Weiß auf Blau-700', '#ffffff', '#1f45b0', 4.5],
  ['Dunkelbraun auf Gold (Button)', '#3b2a00', '#f2c230', 4.5],
  ['Weiß auf Rot (Button)', '#ffffff', '#e5383b', 3],
  ['Weiß auf Panel', '#ffffff', '#1d2638', 4.5],
  ['Gedämpft auf Panel', '#b8c2d6', '#1d2638', 4.5],
  ['Gold auf Panel', '#f2c230', '#1d2638', 4.5],
  ['Tooltip: Tinte auf Papier', '#0e1420', '#f7f4ec', 4.5],
  ['Weiß auf Grün-700 (Schalter an)', '#ffffff', '#168a54', 3],
];
let bad = 0;
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) bad++;
  console.info(`${ok ? 'OK  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${name}`);
}
process.exit(bad ? 1 : 0);
