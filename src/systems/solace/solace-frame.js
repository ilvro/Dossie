/**
 * Moldura de Solace, desenhada em código (SVG) sobre a pintura limpa do deserto.
 *
 * Linguagem da referência: uma gravação na própria pintura, não uma peça aplicada.
 * - As faixas só escurecem a pintura (multiplicação translúcida): a textura aparece por baixo.
 * - Hieróglifos, filetes e contornos em areia fosca, com um filtro que entorta de leve o traço
 *   e "gasta" trechos dele, como tinta velha.
 * - Asas em duas tonalidades: penas no marrom da faixa com contorno de areia e, junto do disco,
 *   uma camada interna clara riscada de marrom. Discos foscos, marrom-escuros, com aro de areia.
 * - Filetes contínuos (CSS) contornam as faixas; os hieróglifos seguem a escrita egípcia (altos sozinhos, baixos empilhados, divisórias e
 *   um cartucho), num ladrilho gerado uma vez que o CSS repete; as pontas ficam sob os cantos.
 * - Vida: só uma luz morna e lenta passando pelo traço (CSS, desligável com o ambiente).
 */

const INK = '#c98f58';        // areia fosca: traço, filetes, contornos (medido: ~200,141,87)
const INK_DARK = '#4a3322';   // marrom dos riscos sobre a camada clara
const FILL = 'rgba(52, 34, 20, 0.5)';      // miolo das penas, no tom da faixa
const PALE = 'rgba(196, 142, 92, 0.78)';   // camada clara das asas

// Pseudoaleatório com semente fixa: a moldura sai igual em todo render
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Traço gasto: desloca de leve (mão humana) e apaga manchas (tinta descascada)
const wornFilter = (id, scale = 1.4, seed = 3) => `
  <filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${seed + 6}" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 3.95" result="wear"/>
    <feComposite in="d" in2="wear" operator="in"/>
  </filter>`;

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

// Um símbolo: traço de areia (o filtro do ladrilho gasta e entorta)
function glyph(name, x, y, scale = 1) {
  const g = GLYPHS[name];
  const t = `translate(${x.toFixed(1)} ${y.toFixed(1)})${scale !== 1 ? ` scale(${scale.toFixed(3)})` : ''}`;
  return `<path d="${g.d}" transform="${t}"/>`;
}

// Os símbolos são desenhados numa caixa menor e ampliados: ficam grandes e de traço grosso
const SC = 1.3;
const svgTile = (w, h, body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${(w * SC).toFixed(1)}" height="${(h * SC).toFixed(1)}" viewBox="0 0 ${w} ${h}"><defs>${wornFilter('w')}</defs><g filter="url(#w)" fill="none" stroke="${INK}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  // Aspas simples (e ' escapado): o valor vai dentro de style="..." no HTML
  return `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`;
};

/* Faixa horizontal: filetes nas bordas; altos sozinhos, baixos empilhados (2 ou 3),
   divisórias e um cartucho */
function horizontalTile(seed, HP = 44) {
  const H = HP / SC;
  const r = rng(seed);
  const pick = list => list[Math.floor(r() * list.length)];
  const top = (H - 26) / 2 + 0.3;
  let x = 5;
  let body = '';
  let groups = 0;
  let cartoucheDone = false;
  while (x < 560) {
    groups++;
    if (!cartoucheDone && groups === 9) {
      const start = x;
      let cx = x + 7;
      let parts = '';
      for (const n of [pick(TALL), pick(SQUARE), pick(TALL)]) {
        const g = GLYPHS[n];
        const s = Math.min(0.9, 20 / g.h);
        parts += glyph(n, cx, top + 3 + (20 - g.h * s) / 2, s);
        cx += g.w * s + 4;
      }
      const w = cx - start + 3;
      body += `<rect x="${start}" y="${top - 2}" width="${w.toFixed(1)}" height="30" rx="11" stroke-width="1.2"/>`;
      body += `<path d="M${(start + w + 3).toFixed(1)} ${top - 2}V${top + 28}"/>` + parts;
      x = start + w + 12;
      cartoucheDone = true;
      continue;
    }
    const roll = r();
    if (roll < 0.36) {
      const n = pick(TALL), g = GLYPHS[n], s = 1;
      body += glyph(n, x, top + (26 - g.h * s) / 2, s);
      x += g.w * s + 5;
    } else if (roll < 0.56) {
      const n = pick(SQUARE), g = GLYPHS[n], s = 0.95;
      body += glyph(n, x, top + (26 - g.h * s) / 2, s);
      x += g.w * s + 5;
    } else if (roll < 0.94) {
      // baixos empilhados, centrados na coluna (às vezes três)
      const k = r() < 0.3 ? 3 : 2;
      const names = [];
      while (names.length < k) { const n = pick(FLAT); if (!names.includes(n)) names.push(n); }
      const s = k === 3 ? 0.78 : 0.9;
      const w = Math.max(...names.map(n => GLYPHS[n].w)) * s;
      const slot = 26 / k;
      names.forEach((n, i) => {
        const g = GLYPHS[n];
        body += glyph(n, x + (w - g.w * s) / 2, top + i * slot + (slot - g.h * s) / 2, s);
      });
      x += w + 5;
    } else {
      body += `<path d="M${x + 1} ${top - 1}V${top + 27}" stroke-width="1.1"/>`;
      x += 7;
    }
  }
  const W = Math.ceil(x + 2);
  return { url: svgTile(W, H, body), w: +(W * SC).toFixed(1), h: HP };
}

/* Coluna vertical: filetes nas bordas e os mesmos símbolos, um sob o outro */
function verticalTile(seed, WP = 30) {
  const W = WP / SC;
  const r = rng(seed);
  const pick = list => list[Math.floor(r() * list.length)];
  const maxW = W - 7;
  let y = 6;
  let body = '';
  while (y < 500) {
    const roll = r();
    if (roll > 0.94) {
      body += `<path d="M7 ${y + 1}H${W - 7}" stroke-width="1.1"/>`;
      y += 7;
      continue;
    }
    const n = roll < 0.38 ? pick(TALL) : roll < 0.6 ? pick(SQUARE) : pick(FLAT);
    const g = GLYPHS[n];
    const s = Math.min(1, maxW / g.w);
    body += glyph(n, (W - g.w * s) / 2, y, s);
    y += g.h * s + 5;
  }
  const H = Math.ceil(y + 2);
  return { url: svgTile(W, H, body), w: WP, h: +(H * SC).toFixed(1) };
}

/* ─── Asas em leque ────────────────────────────────────────────────────────── */
// Penas entre os ângulos th0..th1 (graus, 0 = para fora na horizontal, positivo = para baixo),
// do raio relativo rIn ao rOut de uma elipse a×b centrada no disco.
function fan({ dir, a, b, th0, th1, rows, edge, cx = 0, cy = 0 }) {
  const rad = d => (d * Math.PI) / 180;
  const R = t => (a * b) / Math.sqrt((b * Math.cos(t)) ** 2 + (a * Math.sin(t)) ** 2);
  const P = (t, k) => [cx + dir * Math.cos(t) * R(t) * k, cy + Math.sin(t) * R(t) * k];
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


// Disco fosco: marrom-escuro com aro de areia e um leve volume
const disk = (r, id) => `
  <circle r="${r}" fill="url(#${id}-disk)"/>
  <circle r="${r}" fill="none" stroke="${INK}" stroke-width="2"/>
  <circle r="${r + 3}" fill="none" stroke="${INK}" stroke-width="0.9" stroke-opacity="0.7"/>`;
const diskDefs = id => `
  <radialGradient id="${id}-disk" cx="0.38" cy="0.32" r="0.8">
    <stop offset="0" stop-color="#7a5a40"/><stop offset="0.55" stop-color="#523826"/><stop offset="1" stop-color="#36241a"/>
  </radialGradient>
  <linearGradient id="${id}-glint" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ffe2b0" stop-opacity="0"/><stop offset="0.5" stop-color="#ffe2b0" stop-opacity="0.45"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/>
  </linearGradient>`;

/* Disco solar alado do topo: penas marrons com contorno de areia por fora,
   camada clara riscada de marrom junto do disco, e o abutre (cabeça e pescoço) por cima */
function wingedDisk() {
  const id = 'slf-c';
  const outer = { a: 214, b: 52, th0: -11, th1: 80 };
  const feathers = fan({ ...outer, dir: 1, rows: [
    { rIn: 0.62, rOut: 1, n: 21, tip: 'point', cls: 'p' },
    { rIn: 0.4, rOut: 0.64, n: 15, tip: 'round', cls: 's' }
  ] }) + fan({ ...outer, dir: -1, rows: [
    { rIn: 0.62, rOut: 1, n: 21, tip: 'point', cls: 'p' },
    { rIn: 0.4, rOut: 0.64, n: 15, tip: 'round', cls: 's' }
  ] });
  // asas internas, claras, erguidas em volta do disco
  const inner = { a: 118, b: 60, th0: -60, th1: -6, rows: [{ rIn: 0.3, rOut: 1, n: 7, tip: 'point', cls: 'i' }] };
  const pale = fan({ ...inner, dir: 1 }) + fan({ ...inner, dir: -1 });
  return `
  <svg class="slf-winged" viewBox="-236 -52 472 112" aria-hidden="true">
    <defs>${wornFilter(`${id}-w`, 1.6, 11)}${diskDefs(id)}
      <mask id="${id}-mask"><g fill="#fff">${feathers}${pale}</g></mask>
    </defs>
    <g filter="url(#${id}-w)">
      <g class="slf-feathers" fill="${FILL}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round">${feathers}</g>
      <g fill="${PALE}" stroke="${INK_DARK}" stroke-width="1.1" stroke-linejoin="round">${pale}</g>
      <path d="M-6 -21C-9 -30 -6 -40 0 -42C6 -40 9 -30 6 -21Z" fill="${PALE}" stroke="${INK_DARK}" stroke-width="1"/><path d="M-3 -34H3M-4 -28H4" stroke="${INK_DARK}" stroke-width="0.9"/>
      ${disk(22, id)}
    </g>
    <g mask="url(#${id}-mask)"><rect class="slf-glint slf-glint-wing" x="-320" y="-52" width="90" height="112" fill="url(#${id}-glint)"/></g>
  </svg>`;
}

/* Disco de canto com uma asa voltada para o centro da página */
function cornerDisk(side) {
  const id = `slf-${side}`;
  const dir = side.endsWith('l') ? 1 : -1;
  const feathers = fan({ dir, a: 142, b: 27, th0: -2, th1: 44, rows: [
    { rIn: 0.5, rOut: 1, n: 17, tip: 'point', cls: 'p' }
  ] });
  const pale = fan({ dir, a: 60, b: 21, th0: -48, th1: -4, rows: [{ rIn: 0.45, rOut: 1, n: 6, tip: 'point', cls: 'i' }] });
  return `
  <svg class="slf-corner slf-corner-${side}" viewBox="${dir > 0 ? -34 : -150} -30 184 72" aria-hidden="true">
    <defs>${wornFilter(`${id}-w`, 1.4, side === 'tl' ? 17 : 23)}${diskDefs(id)}
      <mask id="${id}-mask"><g fill="#fff">${feathers}</g></mask>
    </defs>
    <g filter="url(#${id}-w)">
      <g fill="${FILL}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round">${feathers}</g>
      <g fill="${PALE}" stroke="${INK_DARK}" stroke-width="1" stroke-linejoin="round">${pale}</g>
      ${disk(17, id)}
    </g>
    <g mask="url(#${id}-mask)"><rect class="slf-glint slf-glint-corner" x="${dir > 0 ? -110 : -250}" y="-30" width="70" height="72" fill="url(#${id}-glint)"/></g>
  </svg>`;
}

/* Cantos de baixo: um quadrado gravado com a roseta de lótus */
const rosette = side => `
  <svg class="slf-rosette slf-rosette-${side}" viewBox="-20 -20 40 40" aria-hidden="true">
    <defs>${wornFilter(`slf-${side}-w`, 1.2, side === 'bl' ? 29 : 37)}</defs>
    <g filter="url(#slf-${side}-w)" fill="none" stroke="${INK}" stroke-width="1.4">
      <rect x="-17" y="-17" width="34" height="34" fill="${FILL}"/>
      <rect x="-13.5" y="-13.5" width="27" height="27" stroke-width="0.9"/>
      ${Array.from({ length: 8 }, (_, i) => `<path d="M0 -2.5C-3.2 -5.5 -2.4 -10 0 -11C2.4 -10 3.2 -5.5 0 -2.5Z" transform="rotate(${i * 45})"/>`).join('')}
      <circle r="2.2" fill="${INK}"/>
    </g>
  </svg>`;

let cache = null;
function tiles() {
  if (cache) return cache;
  cache = { top: horizontalTile(7), bottom: horizontalTile(31, 30), left: verticalTile(13), right: verticalTile(57) };
  return cache;
}

export function renderSolaceFrame() {
  const t = tiles();
  const ink = (vertical, seg = '') => `<i class="slf-band-ink${seg}"></i><i class="slf-band-glint${vertical ? ' v' : ''}${seg}"></i>`;
  const band = (cls, tile, vertical, inner = ink(vertical)) => `<div class="slf-band ${cls}" style="--tile:${tile.url};--tw:${tile.w}px;--th:${tile.h}px">${inner}</div>`;
  return `
    <div class="vigilia-frame-layer sl-frame" aria-hidden="true">
      ${band('slf-top', t.top, false, ink(false, ' seg-l') + ink(false, ' seg-r'))}
      ${band('slf-bottom', t.bottom)}
      ${band('slf-left', t.left, true)}
      ${band('slf-right', t.right, true)}
      ${cornerDisk('tl')}${cornerDisk('tr')}
      ${rosette('bl')}${rosette('br')}
      ${wingedDisk()}
    </div>`;
}
