/**
 * Moldura de Solace: o traço é o da pintura de referência, vetorizado
 * (scripts/gen-solace-frame.py → solace-frame-data.js), e o resto é código:
 * - pedra: fundo marrom manchado e riscado (ruído em SVG, ladrilho sem emenda);
 * - desgaste: uma máscara de ruído apaga trechos da tinta e dos filetes;
 * - faixas e colunas: os grupos de glifos entram em fila até encher a largura e esticam
 *   juntos para fechar a conta (o que não cabe quebra para uma linha escondida); os filetes
 *   são contínuos, levemente tortos;
 * - cantos (disco e asa), virados embaixo, e o disco alado no centro, sob as abas.
 * Tudo é vetor: nítido em qualquer tela, no tamanho que o CSS mandar (--k).
 * Vida: uma luz morna e lenta passando pela moldura (desligável com o ambiente).
 */

import { FRAME } from './solace-frame-data.js';

const INK = '#c4915a';        // areia do traço (medida: ~186,133,80, um pouco mais clara)
const BODY = '#3a281b';       // corpo escuro das penas e do disco

const svgUrl = svg => `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`;

/* Pedra: manchas largas entre ~(50,36,25) e ~(95,70,48), grão fino e riscos claros.
   stitchTiles faz o ladrilho emendar sem costura. */
const STONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260">
  <filter id="m" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.022 0.034" numOctaves="4" seed="4" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0.5 0 0 0 -0.03  0.37 0 0 0 -0.025  0.26 0 0 0 -0.02  0 0 0 0 0.92"/>
  </filter>
  <filter id="s" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.24" numOctaves="2" seed="9" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.45  0 0 0 0 0.31  9 0 0 0 -5.2"/>
  </filter>
  <filter id="g" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 -1.4 0.75"/>
  </filter>
  <rect width="260" height="260" filter="url(#m)"/>
  <rect width="260" height="260" filter="url(#s)" opacity="0.22"/>
  <rect width="260" height="260" filter="url(#g)" opacity="0.35"/>
</svg>`;

/* Desgaste: branco com alfa entre ~0,55 e 1 (manchas apagadas) e poros pequenos */
const WEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
  <filter id="w" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.6 0 0 0 -0.62" result="a"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="12" stitchTiles="stitch" result="p"/>
    <feColorMatrix in="p" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -20 0 0 0 13.8" result="pits"/>
    <feComposite in="a" in2="pits" operator="in"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.45" intercept="0.55"/></feComponentTransfer>
  </filter>
  <rect width="220" height="220" fill="#fff" filter="url(#w)"/>
</svg>`;

const dataUri = svg => `data:image/svg+xml,${encodeURIComponent(svg)}`;

// Embaralhamento com semente fixa: a moldura sai igual em todo render
function shuffled(list, seed) {
  let s = seed >>> 0;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* Fila de grupos: cada grupo é um <svg> esticável que usa o desenho definido uma vez.
   A primeira volta da faixa de cima segue a ordem da pintura; as outras são embaralhadas. */
function run(kind, seed) {
  const vertical = kind === 'c';
  const list = (vertical ? FRAME.col : FRAME.band).map((g, i) => ({ ...g, i }));
  const rounds = [0, 1, 2, 3].map(k => (k === 0 && !seed ? list : shuffled(list, seed * 7 + k * 101 + 1)));
  const cells = rounds.flat().map(g => {
    const len = vertical ? g.h : g.w;
    const box = vertical ? `0 0 ${FRAME.colW} ${len}` : `0 0 ${len} ${FRAME.bandH}`;
    return `<svg viewBox="${box}" preserveAspectRatio="none" style="flex:${len} 0 calc(var(--k) * ${len}px)"><use href="#slf-${kind}${g.i}"/></svg>`;
  }).join('');
  return `<div class="slf-run">${cells}</div>`;
}

// Definições compartilhadas: os glifos, a pedra e o desgaste (para os cantos e o disco)
function defs() {
  const band = FRAME.band.map((g, i) => `<path id="slf-b${i}" d="${g.d}"/>`).join('');
  const col = FRAME.col.map((g, i) => `<path id="slf-c${i}" d="${g.d}"/>`).join('');
  return `
    <svg class="slf-defs" width="0" height="0" aria-hidden="true">
      <defs>
        ${band}${col}
        <pattern id="slf-stone" patternUnits="userSpaceOnUse" width="260" height="260"><image href="${dataUri(STONE_SVG)}" width="260" height="260"/></pattern>
        <pattern id="slf-wear-p" patternUnits="userSpaceOnUse" width="220" height="220"><image href="${dataUri(WEAR_SVG)}" width="220" height="220"/></pattern>
        <mask id="slf-wear" maskUnits="userSpaceOnUse" x="-20" y="-20" width="700" height="200"><rect x="-20" y="-20" width="700" height="200" fill="url(#slf-wear-p)"/></mask>
        <filter id="slf-rough" color-interpolation-filters="sRGB" x="-2%" y="-20%" width="104%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="5"/>
          <feDisplacementMap in="SourceGraphic" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <linearGradient id="slf-glint-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ffe2b0" stop-opacity="0"/><stop offset="0.5" stop-color="#ffe2b0" stop-opacity="0.5"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/>
        </linearGradient>
      </defs>
    </svg>`;
}

/* Canto: o traço inteiro da pintura (disco, asa, filetes, cabeça da coluna) sobre a pedra da faixa */
const corner = (cls, piece) => `
  <svg class="slf-corner ${cls}" viewBox="0 0 ${piece.w} ${FRAME.bandH}" style="--w:${piece.w}" aria-hidden="true">
    <path d="${piece.d}" fill="${INK}" fill-rule="evenodd" mask="url(#slf-wear)"/>
  </svg>`;

/* Disco alado: corpo escuro de pedra pela silhueta, traço por cima e uma luz que passa */
function winged() {
  const { w, h, body, d, diskX, diskY, diskR } = FRAME.wing;
  return `
  <svg class="slf-winged" viewBox="0 0 ${w} ${h}" style="--w:${w};--h:${h};--dy:${diskY}" aria-hidden="true">
    <defs><clipPath id="slf-wing-clip"><path d="${body}"/></clipPath></defs>
    <path d="${body}" fill="${BODY}"/>
    <path d="${body}" fill="url(#slf-stone)" opacity="0.75"/>
    <radialGradient id="slf-disk-g" cx="0.4" cy="0.36" r="0.75">
      <stop offset="0" stop-color="#7a5a40"/><stop offset="0.55" stop-color="#4e3524"/><stop offset="1" stop-color="#2f1f15"/>
    </radialGradient>
    <circle cx="${diskX}" cy="${diskY}" r="${diskR}" fill="url(#slf-disk-g)"/>
    <circle cx="${diskX}" cy="${diskY}" r="${diskR}" fill="url(#slf-stone)" opacity="0.35"/>
    <path d="${d}" fill="${INK}" fill-rule="evenodd" mask="url(#slf-wear)"/>
    <g clip-path="url(#slf-wing-clip)"><rect class="slf-glint-wing" x="-120" y="0" width="110" height="${h}" fill="url(#slf-glint-g)"/></g>
  </svg>`;
}

export function renderSolaceFrame() {
  const glint = v => `<i class="slf-glint${v ? ' v' : ''}"></i>`;
  const vars = `--band-h:${FRAME.bandH};--col-w:${FRAME.colW};--corner-l:${FRAME.cornerL.w};--corner-r:${FRAME.cornerR.w};--stone:${svgUrl(STONE_SVG)};--wear:${svgUrl(WEAR_SVG)}`;
  return `
    <div class="vigilia-frame-layer sl-frame" style="${vars}" aria-hidden="true">
      ${defs()}
      <div class="slf-band slf-top"><div class="slf-mid">${run('b', 0)}</div>${glint(false)}</div>
      <div class="slf-band slf-bottom"><div class="slf-mid">${run('b', 3)}</div>${glint(false)}</div>
      <div class="slf-band slf-col slf-left"><div class="slf-mid">${run('c', 0)}</div>${glint(true)}</div>
      <div class="slf-band slf-col slf-right"><div class="slf-mid">${run('c', 5)}</div>${glint(true)}</div>
      ${corner('slf-corner-tl', FRAME.cornerL)}${corner('slf-corner-tr', FRAME.cornerR)}
      ${corner('slf-corner-bl', FRAME.cornerL)}${corner('slf-corner-br', FRAME.cornerR)}
      ${winged()}
    </div>`;
}
