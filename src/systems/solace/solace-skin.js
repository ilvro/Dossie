/**
 * Skin "Solace" do layout de frente e verso de Ordem II (src/systems/vigilia/vigilia-view.js).
 * Solace é o país do deserto: uma metrópole cercada de dunas, latão, azulejo turquesa e noite estrelada.
 * Mesma mecânica e mesmo markup da Vigília; aqui só muda a arte, a moldura e o ambiente.
 * Arte própria em public/assets/solace/ (ornamentos em SVG e fundo pintado por script).
 */

import { installMistTexture } from '../../fx/mist-texture.js';
import './solace.css';

const DIR = './assets/solace/';

// Arte que tem equivalente desenhado; as faixas (banners) viram cartelas em CSS (border-image de 9 fatias).
const ART = {
  'badge-level.png': 'badge-level.svg',
  'badge-pv.png': 'badge-pv.svg',
  'badge-pd.png': 'badge-pd.svg',
  'divider-celtic.png': 'divider.svg'
};

const ATTR_WORDS = { fisico: 'Físico', mente: 'Mente', emocao: 'Emoção' };

// Posições pseudoaleatórias fixas por índice: o ambiente não embaralha a cada render().
const rand = (i, k) => {
  const v = Math.sin((i + 1) * k) * 43758.5453;
  return v - Math.floor(v);
};

// Lua crescente com halo: fica no vão entre os recursos e o retrato (só na frente; no verso há texto ali)
const MOON = `
      <svg class="solace-moon" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="sl-moon-halo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stop-color="#f2e2bd" stop-opacity="0.32"/>
            <stop offset="0.3" stop-color="#d9c39a" stop-opacity="0.1"/>
            <stop offset="1" stop-color="#d9c39a" stop-opacity="0"/>
          </radialGradient>
          <mask id="sl-moon-cut">
            <rect width="200" height="200" fill="#fff"/>
            <circle cx="114" cy="90" r="34" fill="#000"/>
          </mask>
        </defs>
        <circle class="solace-moon-halo" cx="100" cy="100" r="100" fill="url(#sl-moon-halo)"/>
        <circle cx="100" cy="100" r="38" fill="#e8dcc0" opacity="0.07"/>
        <g mask="url(#sl-moon-cut)">
          <circle cx="100" cy="100" r="38" fill="#f4e6c4"/>
          <circle cx="100" cy="100" r="38" fill="none" stroke="#fff8e6" stroke-width="1.2" opacity="0.6"/>
        </g>
      </svg>`;

function renderAmbient() {
  installMistTexture();
  // Grãos de areia levados pelo vento, da direita para a esquerda
  const grains = Array.from({ length: 34 }, (_, i) => `<i style="${[
    `--y:${(18 + rand(i, 12.9898) * 80).toFixed(1)}%`,
    `--s:${(1 + rand(i, 78.233) * 1.8).toFixed(1)}px`,
    `--d:${(9 + rand(i, 37.719) * 12).toFixed(1)}s`,
    `--o:${(-rand(i, 4.581) * 22).toFixed(1)}s`,
    `--w:${(-30 + rand(i, 9.137) * 60).toFixed(0)}px`,
    `--a:${(0.25 + rand(i, 3.33) * 0.5).toFixed(2)}`
  ].join(';')}"></i>`).join('');
  // Estrelas que cintilam por cima das pintadas no fundo
  const stars = Array.from({ length: 9 }, (_, i) => `<b style="${[
    `--x:${(8 + rand(i, 21.17) * 84).toFixed(1)}%`,
    `--y:${(3 + rand(i, 5.71) * 32).toFixed(1)}%`,
    `--d:${(3 + rand(i, 8.43) * 5).toFixed(1)}s`,
    `--o:${(-rand(i, 2.9) * 8).toFixed(1)}s`
  ].join(';')}"></b>`).join('');

  return `
    <div class="vigilia-ambient solace-ambient" aria-hidden="true">
      <div class="solace-stars">${stars}</div>
      ${MOON}
      <div class="solace-haze haze-far"></div>
      <div class="solace-haze haze-ground"></div>
      <div class="solace-grains">${grains}</div>
    </div>
  `;
}

function renderFrame() {
  const corner = pos => `<img src="${DIR}frame-corner.svg" alt="" class="solace-frame-corner ${pos}" draggable="false">`;
  return `
      <div class="vigilia-frame-layer solace-frame" aria-hidden="true">
        <div class="solace-frame-lines"></div>
        <div class="solace-frame-band band-top"></div>
        <div class="solace-frame-band band-bottom"></div>
        ${corner('tl')}${corner('tr')}${corner('bl')}${corner('br')}
      </div>`;
}

export const SOLACE_SKIN = {
  id: 'solace',
  pageClass: 'solace-page',
  defaultBg: `${DIR}solace-bg.webp`,
  art: (file, cls = '', alt = '') => ART[file]
    ? `<img src="${DIR}${ART[file]}" alt="${alt}"${cls ? ` class="${cls}"` : ''} draggable="false">`
    : '',
  attrWord: (key, label) => `<span class="solace-attr-word word-${key}" aria-label="${label}">${ATTR_WORDS[key] || label}</span>`,
  // Colchete em arco ogival com uma estrela no vértice, no lugar do raio prateado da Vigília
  chevron: () => `
          <svg class="atributos-chevron-ray solace-bracket" viewBox="0 0 40 174" aria-hidden="true">
            <defs>
              <linearGradient id="sl-bracket" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#c99b4f" stop-opacity="0.15"/>
                <stop offset="0.5" stop-color="#f6dea2"/>
                <stop offset="1" stop-color="#c99b4f" stop-opacity="0.15"/>
              </linearGradient>
            </defs>
            <path d="M36 2 C22 30 12 58 8 87 C12 116 22 144 36 172" fill="none" stroke="url(#sl-bracket)" stroke-width="1.6"/>
            <path d="M30 14 C19 38 13 62 12 87 C13 112 19 136 30 160" fill="none" stroke="url(#sl-bracket)" stroke-width="0.7" opacity="0.6"/>
            <path d="M8 76 L10.6 82.4 L17 85 L10.6 87.6 L8 94 L5.4 87.6 L-1 85 L5.4 82.4Z" transform="translate(1 2)" fill="#f2d79b"/>
          </svg>`,
  frame: renderFrame,
  ambient: renderAmbient
};
