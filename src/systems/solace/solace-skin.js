/**
 * Skin "Solace" do layout de frente e verso de Ordem II (src/systems/vigilia/vigilia-view.js).
 * Solace é o país do deserto. A ficha é a da Vigília (mesmas fontes, faixas, medalhões e
 * palavras dos atributos), em sépia e creme, sobre a pintura do deserto com a moldura de
 * hieróglifos e o disco solar alado (public/assets/solace/solace-bg.webp, moldura inclusa).
 *
 * Ambiente: poeira em suspensão, rajadas de areia rente ao chão, grãos levados pelo vento,
 * raios de sol vindos da direita e partículas flutuando na luz.
 */

import { installMistTexture } from '../../fx/mist-texture.js';
import './solace.css';

const VIG = './assets/vigilia/';
const DIR = './assets/solace/';

// Posições pseudoaleatórias fixas por índice: o ambiente não embaralha a cada render().
const rand = (i, k) => {
  const v = Math.sin((i + 1) * k) * 43758.5453;
  return v - Math.floor(v);
};

function renderAmbient() {
  installMistTexture();
  // Grãos de areia carregados pelo vento, da direita para a esquerda, mais densos perto do chão
  const grains = Array.from({ length: 46 }, (_, i) => `<i style="${[
    `--y:${(22 + Math.pow(rand(i, 12.9898), 0.6) * 74).toFixed(1)}%`,
    `--l:${(6 + rand(i, 78.233) * 22).toFixed(0)}px`,
    `--s:${(0.8 + rand(i, 37.719) * 1.3).toFixed(1)}px`,
    `--d:${(4.5 + rand(i, 4.581) * 6).toFixed(1)}s`,
    `--o:${(-rand(i, 9.137) * 12).toFixed(1)}s`,
    `--w:${(-40 + rand(i, 3.71) * 80).toFixed(0)}px`,
    `--a:${(0.25 + rand(i, 6.13) * 0.55).toFixed(2)}`
  ].join(';')}"></i>`).join('');
  // Pó fino flutuando na luz, subindo devagar
  const motes = Array.from({ length: 20 }, (_, i) => `<i style="${[
    `--x:${(rand(i, 21.17) * 100).toFixed(1)}%`,
    `--y:${(30 + rand(i, 5.71) * 65).toFixed(1)}%`,
    `--s:${(1.4 + rand(i, 8.43) * 2.2).toFixed(1)}px`,
    `--d:${(16 + rand(i, 2.9) * 16).toFixed(1)}s`,
    `--o:${(-rand(i, 1.37) * 32).toFixed(1)}s`
  ].join(';')}"></i>`).join('');

  return `
    <div class="vigilia-ambient solace-ambient" aria-hidden="true">
      <div class="solace-rays"></div>
      <div class="solace-dust dust-far"></div>
      <div class="solace-dust dust-gust"></div>
      <div class="solace-dust dust-ground"></div>
      <div class="solace-grains">${grains}</div>
      <div class="solace-motes">${motes}</div>
    </div>
  `;
}

export const SOLACE_SKIN = {
  id: 'solace',
  pageClass: 'solace-page',
  defaultBg: `${DIR}solace-bg.webp`,
  // A arte da Vigília, tingida de sépia pelo CSS
  art: (file, cls = '', alt = '') => `<img src="${VIG}${file}" alt="${alt}"${cls ? ` class="${cls}"` : ''} draggable="false">`,
  // A palavra vetorial da Vigília vira máscara: a "tinta" é a cor de Solace, e a sombra fica no invólucro
  attrWord: (key, label) => `<span class="solace-attr-shadow"><span class="attr-vector-word solace-attr-ink word-${key}" role="img" aria-label="${label}" style="--src:url('${VIG}attr-${key}.svg')"></span></span>`,
  chevron: () => `
          <svg class="atributos-chevron-ray" viewBox="0 0 36 174" aria-hidden="true">
            <defs>
              <linearGradient id="sl-chevron" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#9a6a3a" stop-opacity="0.3" />
                <stop offset="28%" stop-color="#dea263" stop-opacity="0.9" />
                <stop offset="50%" stop-color="#fadcae" />
                <stop offset="72%" stop-color="#dea263" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#9a6a3a" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <path fill="url(#sl-chevron)" d="M27.70,173.73L2.96,85.95L35.07,0.00L0.00,86.40L1.49,86.22L0.04,86.57Z" />
          </svg>`,
  // A moldura de hieróglifos e o disco alado já estão pintados no fundo
  frame: () => '',
  ambient: renderAmbient
};
