/**
 * Moldura de Solace, desenhada em código (SVG) sobre a pintura limpa do deserto.
 *
 * - Faixas de hieróglifos: um conjunto de símbolos próprios, distribuído à moda egípcia
 *   (altos sozinhos, baixos empilhados, divisórias e um cartucho), gerado uma vez como
 *   ladrilho que o CSS repete; as pontas das faixas ficam sob os cantos.
 * - Disco solar alado no topo e discos com uma asa nos cantos, com penas geradas em leque.
 * - Vida: um brilho percorre o ouro gravado das faixas e das asas, o disco respira
 *   e os raios dos cantos giram devagar (tudo em CSS, desligável com o ambiente).
 */

const GOLD_HI = '#f6cf8a';
const GOLD = '#dca25a';
const GOLD_LO = '#a8692e';
const SHADOW = '#120800';

// Pseudoaleatório com semente fixa: a moldura sai igual em todo render
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ─── Hieróglifos (traço, em px; h 26 = alto, ≤12 = baixo) ─────────────────── */
const dot = (x, y, r = 1.3) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const GLYPHS = {
  // altos
  ankh: { w: 12, h: 26, d: 'M6 10C1.5 10 2 2 6 2S10.5 10 6 10ZM1 11.5H11M6 11.5V25' },
  djed: { w: 11, h: 26, d: 'M5.5 25V5M3 2.5L5.5 4.5L8 2.5M1.5 7H9.5M1.5 10H9.5M1.5 13H9.5M1.5 16H9.5M3 25H8' },
  was: { w: 10, h: 26, d: 'M5 24V6L8.5 3L6.5 1.5M3 25L5 22.5L7 25' },
  reed: { w: 8, h: 26, d: 'M4 25V9M4 9C1 6 1.5 3 4 1C6.5 3 7 6 4 9M2.5 14L4 12.5L5.5 14' },
  feather: { w: 9, h: 26, d: 'M3 25V5C3 1.5 8 1.5 8 6C8 11 5 14 3 16M3 9L6.5 7M3 12.5L6 11' },
  owl: { w: 14, h: 26, d: `M4 24C1.5 17 2.5 10 7 8C11.5 7 13 11 12 16L13.5 24ZM6.5 8C5 4 10.5 2.5 10.5 6.5M6.5 24V25.5M10 24V25.5M5 13C7 14 9 14 11 13${dot(8.5, 5.2, 0.9)}` },
  cobra: { w: 11, h: 26, d: 'M2 25H10M7.5 25C10 21.5 4 20 5 15.5C6 12.5 8.5 11.5 7.5 7C6.5 3 2.5 4 3.5 7.5C4 9 5.5 9 6 8' },
  nefer: { w: 10, h: 24, d: 'M5 23C1 23 1 15 5 12.5C9 15 9 23 5 23ZM5 12.5V2M2 5H8M2 8H8' },
  lotus: { w: 14, h: 24, d: 'M7 23V12M7 12C2.5 10.5 2 4.5 3.5 1.5M7 12V1M7 12C11.5 10.5 12 4.5 10.5 1.5M4 23H10' },
  sedge: { w: 12, h: 24, d: 'M6 23V10M6 10C3 8 2 4 2.5 1M6 10C9 8 10 4 9.5 1M6 10V3M3 23H9' },
  // quadrados
  scarab: { w: 16, h: 19, d: 'M8 4.5C13 4.5 13 18 8 18S3 4.5 8 4.5ZM6 4.5C6 1.5 10 1.5 10 4.5M8 7.5V18M3.5 8L1 6M12.5 8L15 6M3.5 13L1 15M12.5 13L15 15' },
  eye: { w: 20, h: 15, d: `M1 6C6 1 14 1 19 6C14 10 6 10 1 6ZM2 2C8-0.5 13-0.5 19 2M9 9.5V12.5C9 14.5 12 14.5 12 12.5M13 9L17 13.5${dot(10, 5.8, 1.9)}` },
  sun: { w: 14, h: 14, d: `M7 1A6 6 0 1 1 6.99 1Z${dot(7, 7, 1.6)}` },
  shen: { w: 14, h: 18, d: 'M7 1.5A5.5 5.5 0 1 1 6.99 1.5ZM1 15.5H13M3.5 12L1.5 15.5M10.5 12L12.5 15.5' },
  quail: { w: 15, h: 18, d: 'M3 15C1 10 4 6.5 8 6.5C12 6.5 13 10 11 14L3 15ZM8 6.5C7 2 12 1 12 5L14.5 5.5M6 15V18M9 15V18' },
  vase: { w: 10, h: 18, d: 'M3 1H7M4 1V4C1 6 1 13 3.5 17H6.5C9 13 9 6 6 4V1' },
  // baixos
  water: { w: 20, h: 6, d: 'M1 5L3 1.5L5 5L7 1.5L9 5L11 1.5L13 5L15 1.5L17 5L19 1.5' },
  mouth: { w: 16, h: 8, d: 'M1 4C5 0.5 11 0.5 15 4C11 7.5 5 7.5 1 4Z' },
  bread: { w: 12, h: 7, d: 'M1 6.5C1 0.5 11 0.5 11 6.5Z' },
  hand: { w: 19, h: 7, d: 'M1 3.5H13C16 3.5 18 4.5 18 6.5H1ZM11 3.5L14 0.5' },
  basket: { w: 15, h: 7, d: 'M1 1H14C14 7 1 7 1 1Z' },
  house: { w: 15, h: 9, d: 'M6 8.5H1V1H14V8.5H9' },
  viper: { w: 20, h: 8, d: 'M1 6C4 3 7 9 10 6S15 3 17.5 5L19 2.5M17.5 5L19 6' },
  bolt: { w: 17, h: 7, d: 'M1 3.5H16M3.5 1V6M13.5 1V6' },
  pool: { w: 17, h: 8, d: 'M1 1H16V7H1ZM4 4H13' },
  rope: { w: 8, h: 11, d: 'M4 1C1 2.5 7 4.5 4 6C1 7.5 7 9.5 4 11' }
};
const TALL = ['ankh', 'djed', 'was', 'reed', 'feather', 'owl', 'cobra', 'nefer', 'lotus', 'sedge'];
const SQUARE = ['scarab', 'eye', 'sun', 'shen', 'quail', 'vase'];
const FLAT = ['water', 'mouth', 'bread', 'hand', 'basket', 'house', 'viper', 'bolt', 'pool', 'rope'];

// Um símbolo gravado: sombra escura deslocada + traço dourado
function glyph(name, x, y, scale = 1) {
  const g = GLYPHS[name];
  const t = `translate(${x.toFixed(1)} ${y.toFixed(1)})${scale !== 1 ? ` scale(${scale.toFixed(3)})` : ''}`;
  return `<g transform="${t}"><path d="${g.d}" transform="translate(0.7 0.9)" stroke="${SHADOW}" stroke-opacity="0.75"/><path d="${g.d}" stroke="url(#g)"/></g>`;
}

const svgTile = (w, h, body, gradVertical) => {
  const grad = gradVertical
    ? `<linearGradient id="g" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${GOLD_HI}"/><stop offset="0.55" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_LO}"/></linearGradient>`
    : `<linearGradient id="g" x1="0" y1="0" x2="${w}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${GOLD_HI}"/><stop offset="0.5" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_HI}"/></linearGradient>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${grad}</defs><g fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  // Aspas simples (e ' escapado): o valor vai dentro de style="..." no HTML
  return `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`;
};

/* Faixa horizontal: altos sozinhos, baixos empilhados, divisórias e um cartucho */
function horizontalTile(seed, H = 44) {
  const r = rng(seed);
  const pick = list => list[Math.floor(r() * list.length)];
  const top = (H - 26) / 2;
  let x = 5;
  let body = '';
  let groups = 0;
  let cartoucheDone = false;
  const TARGET = 760;
  while (x < TARGET - 40) {
    groups++;
    if (!cartoucheDone && groups === 9) {
      // Cartucho: moldura oval com três símbolos e a barra no fim
      const start = x;
      let cx = x + 7;
      const inner = [pick(TALL), pick(SQUARE), pick(TALL)];
      let parts = '';
      for (const n of inner) {
        const g = GLYPHS[n];
        const s = Math.min(1, 22 / g.h);
        parts += glyph(n, cx, top + 2 + (22 - g.h * s) / 2, s);
        cx += g.w * s + 4;
      }
      const w = cx - start + 3;
      body += `<rect x="${start}" y="${top - 3}" width="${w}" height="32" rx="12" stroke="url(#g)" stroke-width="1.4"/>`;
      body += `<path d="M${start + w + 3} ${top - 3}V${top + 29}" stroke="url(#g)" stroke-width="1.8"/>`;
      body += parts;
      x = start + w + 12;
      cartoucheDone = true;
      continue;
    }
    const roll = r();
    if (roll < 0.42) {
      const n = pick(TALL);
      const g = GLYPHS[n];
      body += glyph(n, x, top + (26 - g.h) / 2);
      x += g.w + 6;
    } else if (roll < 0.66) {
      const n = pick(SQUARE);
      const g = GLYPHS[n];
      body += glyph(n, x, top + (26 - g.h) / 2);
      x += g.w + 6;
    } else if (roll < 0.94) {
      // dois baixos empilhados, centrados na coluna
      const a = pick(FLAT);
      let b = pick(FLAT);
      if (b === a) b = FLAT[(FLAT.indexOf(a) + 3) % FLAT.length];
      const wa = GLYPHS[a].w, wb = GLYPHS[b].w;
      const w = Math.max(wa, wb);
      body += glyph(a, x + (w - wa) / 2, top + 1 + (11 - GLYPHS[a].h) / 2);
      body += glyph(b, x + (w - wb) / 2, top + 14 + (11 - GLYPHS[b].h) / 2);
      x += w + 6;
    } else {
      // divisória dupla entre registros
      body += `<path d="M${x + 1} ${top - 2}V${top + 28}M${x + 4} ${top - 2}V${top + 28}" stroke="url(#g)" stroke-width="1.1"/>`;
      x += 11;
    }
  }
  const W = Math.ceil(x + 4);
  return { url: svgTile(W, H, body, true), w: W, h: H };
}

/* Coluna vertical: os mesmos símbolos, um sob o outro (os largos encolhem para caber) */
function verticalTile(seed, W = 30) {
  const r = rng(seed);
  const pick = list => list[Math.floor(r() * list.length)];
  const maxW = W - 12;
  let y = 8;
  let body = '';
  while (y < 640) {
    const roll = r();
    const n = roll < 0.4 ? pick(TALL) : roll < 0.65 ? pick(SQUARE) : pick(FLAT);
    if (roll > 0.93) {
      body += `<path d="M5 ${y + 1}H${W - 5}M5 ${y + 4}H${W - 5}" stroke="url(#g)" stroke-width="1.1"/>`;
      y += 11;
      continue;
    }
    const g = GLYPHS[n];
    const s = Math.min(1, maxW / g.w);
    body += glyph(n, (W - g.w * s) / 2, y, s);
    y += g.h * s + 6;
  }
  const H = Math.ceil(y + 2);
  return { url: svgTile(W, H, body, false), w: W, h: H };
}

/* ─── Asas em leque ────────────────────────────────────────────────────────── */
// Penas entre os ângulos th0..th1 (graus, 0 = para fora na horizontal, positivo = para baixo),
// do raio relativo rIn ao rOut de uma elipse a×b centrada no disco.
function fan({ dir, a, b, th0, th1, rows, edge }) {
  const rad = d => (d * Math.PI) / 180;
  const R = t => (a * b) / Math.sqrt((b * Math.cos(t)) ** 2 + (a * Math.sin(t)) ** 2);
  const P = (t, k) => [dir * Math.cos(t) * R(t) * k, Math.sin(t) * R(t) * k];
  const f = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  let out = '';
  rows.forEach(({ rIn, rOut, n, tip, cls, rib }) => {
    for (let i = 0; i < n; i++) {
      const t0 = rad(th0 + ((th1 - th0) * i) / n);
      const t1 = rad(th0 + ((th1 - th0) * (i + 1)) / n);
      const tm = (t0 + t1) / 2;
      const in0 = P(t0, rIn), in1 = P(t1, rIn), o0 = P(t0, rOut), o1 = P(t1, rOut);
      const d = tip === 'point'
        ? `M${f(in0)}L${f(o0)}L${f(P(tm, rOut + 0.06))}L${f(o1)}L${f(in1)}Z`
        : `M${f(in0)}L${f(o0)}Q${f(P(tm, rOut + 0.08))} ${f(o1)}L${f(in1)}Z`;
      out += `<path class="${cls}${i % 2 ? ' alt' : ''}" d="${d}"/>`;
      // Nervura dourada no meio das penas longas
      if (rib) out += `<path class="slf-rib" d="M${f(P(tm, rIn + 0.04))}L${f(P(tm, rOut - 0.02))}"/>`;
    }
  });
  // Borda de ataque: uma faixa de escamas ao longo do topo da asa, do disco até a ponta
  if (edge) {
    const { from, to, n, t0: e0, t1: e1 } = edge;
    for (let i = 0; i < n; i++) {
      const k0 = from + ((to - from) * i) / n, k1 = from + ((to - from) * (i + 1)) / n;
      const a0 = rad(e0), a1 = rad(e1);
      const d = `M${f(P(a1, k0))}L${f(P(a0, k0))}L${f(P(a0, k1))}Q${f(P((a0 + a1) / 2, k1 + 0.025))} ${f(P(a1, k1))}Z`;
      out += `<path class="slf-edge${i % 2 ? ' alt' : ''}" d="${d}"/>`;
    }
  }
  return out;
}

const WING_ROWS = [
  { rIn: 0.66, rOut: 1, n: 22, tip: 'point', cls: 'slf-f3', rib: true },
  { rIn: 0.44, rOut: 0.68, n: 16, tip: 'round', cls: 'slf-f2' },
  { rIn: 0.25, rOut: 0.46, n: 11, tip: 'round', cls: 'slf-f1' }
];

function sunDisk(r, id, rays = 16) {
  const lines = Array.from({ length: rays }, (_, i) => {
    const t = (i / rays) * Math.PI * 2;
    return `M${(Math.cos(t) * r * 0.32).toFixed(1)} ${(Math.sin(t) * r * 0.32).toFixed(1)}L${(Math.cos(t) * r * 0.86).toFixed(1)} ${(Math.sin(t) * r * 0.86).toFixed(1)}`;
  }).join('');
  return `
    <circle class="slf-sun" r="${r}" fill="url(#${id}-disk)"/>
    <g class="slf-rays"><path d="${lines}" stroke="#fff3d0" stroke-opacity="0.32" stroke-width="1.2" stroke-linecap="round"/></g>
    <circle r="${r}" fill="none" stroke="${GOLD}" stroke-width="2.6"/>
    <circle r="${r - 4}" fill="none" stroke="${SHADOW}" stroke-opacity="0.55" stroke-width="1"/>
    <circle r="${r + 3.5}" fill="none" stroke="${GOLD_LO}" stroke-width="1"/>`;
}

const sharedDefs = id => `
  <radialGradient id="${id}-disk" cx="0.4" cy="0.35" r="0.75">
    <stop offset="0" stop-color="#ffe9b0"/><stop offset="0.35" stop-color="#e9a752"/><stop offset="0.75" stop-color="#9a5121"/><stop offset="1" stop-color="#4f260c"/>
  </radialGradient>
  <radialGradient id="${id}-halo"><stop offset="0" stop-color="#ffd78f" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id}-feather" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a2c15"/><stop offset="1" stop-color="#26140a"/>
  </linearGradient>
  <linearGradient id="${id}-glint" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff0c8" stop-opacity="0"/><stop offset="0.5" stop-color="#fff0c8" stop-opacity="0.75"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/>
  </linearGradient>`;

/* Disco solar alado do topo, com as duas uraeus */
function wingedDisk() {
  const id = 'slf-c';
  const wing = { a: 236, b: 74, th0: -4, th1: 64, rows: WING_ROWS, edge: { from: 0.2, to: 1.02, n: 14, t0: -13, t1: -4 } };
  const feathers = fan({ ...wing, dir: 1 }) + fan({ ...wing, dir: -1 });
  const uraeus = dir => `<path d="M${dir * 24} 14C${dir * 30} 20 ${dir * 22} 26 ${dir * 27} 33C${dir * 31} 38 ${dir * 26} 44 ${dir * 22} 41M${dir * 24} 14C${dir * 21} 9 ${dir * 27} 6 ${dir * 29} 10" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
  return `
  <svg class="slf-winged" viewBox="-250 -40 500 120" aria-hidden="true">
    <defs>${sharedDefs(id)}
      <mask id="${id}-mask"><g fill="#fff">${feathers}</g></mask>
    </defs>
    <g class="slf-wing" fill="url(#${id}-feather)" stroke="${GOLD}" stroke-width="1.15" stroke-linejoin="round">${feathers}</g>
    <g mask="url(#${id}-mask)"><rect class="slf-glint slf-glint-wing" x="-330" y="-40" width="110" height="140" fill="url(#${id}-glint)"/></g>
    ${uraeus(1)}${uraeus(-1)}
    ${sunDisk(27, id)}
  </svg>`;
}

/* Disco de canto com uma asa voltada para o centro da página */
function cornerDisk(side) {
  const id = `slf-${side}`;
  const dir = side.endsWith('l') ? 1 : -1;
  const feathers = fan({ dir, a: 132, b: 40, th0: -2, th1: 38, rows: [
    { rIn: 0.6, rOut: 1, n: 16, tip: 'point', cls: 'slf-f3', rib: true },
    { rIn: 0.3, rOut: 0.62, n: 10, tip: 'round', cls: 'slf-f2' }
  ], edge: { from: 0.2, to: 1.02, n: 9, t0: -12, t1: -3 } });
  return `
  <svg class="slf-corner slf-corner-${side}" viewBox="${dir > 0 ? -40 : -170} -40 210 100" aria-hidden="true">
    <defs>${sharedDefs(id)}
      <mask id="${id}-mask"><g fill="#fff">${feathers}</g></mask>
    </defs>
    <g class="slf-wing" fill="url(#${id}-feather)" stroke="${GOLD}" stroke-width="1.1" stroke-linejoin="round">${feathers}</g>
    <g mask="url(#${id}-mask)"><rect class="slf-glint slf-glint-corner" x="${dir > 0 ? -120 : -260}" y="-40" width="80" height="120" fill="url(#${id}-glint)"/></g>
    ${sunDisk(21, id, 12)}
  </svg>`;
}

/* Roseta de lótus dos cantos de baixo */
const rosette = side => `
  <svg class="slf-rosette slf-rosette-${side}" viewBox="-20 -20 40 40" aria-hidden="true">
    <rect x="-18" y="-18" width="36" height="36" rx="3" fill="#2c180a" stroke="${GOLD}" stroke-width="1.6"/>
    <rect x="-14.5" y="-14.5" width="29" height="29" rx="2" fill="none" stroke="${GOLD_LO}" stroke-width="0.9"/>
    <g fill="none" stroke="${GOLD}" stroke-width="1.3">${Array.from({ length: 8 }, (_, i) => `<path d="M0 -2.5C-3.5 -6 -2.5 -11 0 -12C2.5 -11 3.5 -6 0 -2.5Z" transform="rotate(${i * 45})"/>`).join('')}</g>
    <circle r="2.6" fill="${GOLD_HI}"/>
  </svg>`;

let cache = null;
function tiles() {
  if (cache) return cache;
  const top = horizontalTile(7);
  const bottom = horizontalTile(31, 30);
  const left = verticalTile(13);
  const right = verticalTile(57);
  cache = { top, bottom, left, right };
  return cache;
}

export function renderSolaceFrame() {
  const t = tiles();
  const band = (cls, tile, vertical) => `<div class="slf-band ${cls}" style="--tile:${tile.url};--tw:${tile.w}px;--th:${tile.h}px"><i class="slf-band-glint${vertical ? ' v' : ''}"></i></div>`;
  return `
    <div class="vigilia-frame-layer sl-frame" aria-hidden="true">
      ${band('slf-top', t.top)}
      ${band('slf-bottom', t.bottom)}
      ${band('slf-left', t.left, true)}
      ${band('slf-right', t.right, true)}
      ${cornerDisk('tl')}${cornerDisk('tr')}
      ${rosette('bl')}${rosette('br')}
      ${wingedDisk()}
    </div>`;
}
