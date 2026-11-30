/**
 * Skin "Solace" do layout de frente e verso de Ordem II (src/systems/vigilia/vigilia-view.js).
 * Solace é o país do deserto. A ficha é a da Vigília (mesmas fontes, faixas, medalhões e
 * palavras dos atributos), virada para sépia e creme, sobre um fundo de deserto pintado
 * e uma moldura entalhada com o disco solar alado.
 *
 * O fundo (solace-bg.webp) e a moldura (frame.png, disco-alado.png) são arquivos em
 * public/assets/solace/: os atuais saem de scripts/solace-arte.py e podem ser trocados
 * por pinturas, mantendo o nome.
 */

import { installMistTexture } from '../../fx/mist-texture.js';
import './solace.css';

const VIG = './assets/vigilia/';
const DIR = './assets/solace/';

function renderAmbient() {
  installMistTexture();
  const rand = (i, k) => {
    const v = Math.sin((i + 1) * k) * 43758.5453;
    return v - Math.floor(v);
  };
  // Poeira de areia levada pelo vento (mesmo esquema das partículas da Vigília)
  const motes = Array.from({ length: 18 }, (_, i) => `<i style="${[
    `--x:${(rand(i, 12.9898) * 100).toFixed(1)}%`,
    `--y:${(35 + rand(i, 78.233) * 60).toFixed(1)}%`,
    `--s:${(1.4 + rand(i, 37.719) * 2).toFixed(1)}px`,
    `--d:${(18 + rand(i, 4.581) * 16).toFixed(1)}s`,
    `--o:${(-rand(i, 9.137) * 34).toFixed(1)}s`
  ].join(';')}"></i>`).join('');
  return `
    <div class="vigilia-ambient solace-ambient" aria-hidden="true">
      <div class="vigilia-mist mist-far"></div>
      <div class="vigilia-mist mist-ground"></div>
      <div class="vigilia-motes">${motes}</div>
    </div>
  `;
}

export const SOLACE_SKIN = {
  id: 'solace',
  pageClass: 'solace-page',
  defaultBg: `${DIR}solace-bg.webp`,
  // A arte da Vigília, tingida de sépia pelo CSS
  art: (file, cls = '', alt = '') => `<img src="${VIG}${file}" alt="${alt}"${cls ? ` class="${cls}"` : ''} draggable="false">`,
  attrWord: (key, label) => `<img src="${VIG}attr-${key}.svg" alt="${label}" class="attr-vector-word word-${key}" draggable="false">`,
  chevron: () => `
          <svg class="atributos-chevron-ray" viewBox="0 0 36 174" aria-hidden="true">
            <defs>
              <linearGradient id="sl-chevron" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#8a6a44" stop-opacity="0.3" />
                <stop offset="30%" stop-color="#d9bf93" stop-opacity="0.85" />
                <stop offset="50%" stop-color="#f6e7c8" />
                <stop offset="70%" stop-color="#d9bf93" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#8a6a44" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <path fill="url(#sl-chevron)" d="M27.70,173.73L2.96,85.95L35.07,0.00L0.00,86.40L1.49,86.22L0.04,86.57Z" />
          </svg>`,
  frame: () => `
      <div class="vigilia-frame-layer solace-frame" aria-hidden="true">
        <img src="${DIR}disco-alado.png" alt="" class="solace-winged-sun" draggable="false">
      </div>`,
  ambient: renderAmbient
};
