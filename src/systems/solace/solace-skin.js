/**
 * Skin "Solace" do layout de frente e verso de Ordem II (src/systems/vigilia/vigilia-view.js).
 * Solace é o país do deserto. A ficha é a da Vigília (mesmas fontes, faixas, medalhões e
 * palavras dos atributos), em sépia e creme, sobre a pintura limpa do deserto
 * (public/assets/solace/solace-bg.webp). A moldura de hieróglifos, o disco solar alado
 * e os cantos são desenhados em código (solace-frame.js).
 *
 * Ambiente (no molde da névoa da Vigília: camadas largas e lentas, que respiram):
 * bruma de areia em três alturas, uma rajada rara rente ao chão, nuvens de poeira que
 * atravessam a página de vez em quando, poucos grãos ao vento,
 * pó dourado subindo na luz e o sol pulsando onde a pintura já é clara.
 */

import { installMistTexture } from '../../fx/mist-texture.js';
import { renderSolaceFrame } from './solace-frame.js';
import './solace.css';

const VIG = './assets/vigilia/';
const DIR = './assets/solace/';

// Posições pseudoaleatórias fixas por índice: o ambiente não embaralha a cada render().
const rand = (i, k) => {
  const v = Math.sin((i + 1) * k) * 43758.5453;
  return v - Math.floor(v);
};

function renderAmbient() {
  // A mesma forma da névoa da Vigília, na cor da areia ao sol
  installMistTexture({ varName: '--sl-dust', rgb: [244, 212, 166] });
  // Grãos finos ao vento, mais na metade de baixo (onde a areia corre)
  const grains = Array.from({ length: 26 }, (_, i) => `<i style="${[
    `--y:${(46 + Math.pow(rand(i, 12.9898), 0.7) * 44).toFixed(1)}%`,
    `--l:${(5 + rand(i, 78.233) * 10).toFixed(0)}px`,
    `--s:${(0.7 + rand(i, 37.719) * 0.6).toFixed(1)}px`,
    `--d:${(9 + rand(i, 4.581) * 8).toFixed(1)}s`,
    `--o:${(-rand(i, 9.137) * 17).toFixed(1)}s`,
    `--w:${(-30 + rand(i, 3.71) * 50).toFixed(0)}px`,
    `--a:${(0.25 + rand(i, 6.13) * 0.4).toFixed(2)}`
  ].join(';')}"></i>`).join('');
  // Pó dourado flutuando na luz, subindo devagar
  const motes = Array.from({ length: 18 }, (_, i) => `<i style="${[
    `--x:${(rand(i, 21.17) * 100).toFixed(1)}%`,
    `--y:${(30 + rand(i, 5.71) * 65).toFixed(1)}%`,
    `--s:${(1.4 + rand(i, 8.43) * 2).toFixed(1)}px`,
    `--d:${(18 + rand(i, 2.9) * 16).toFixed(1)}s`,
    `--o:${(-rand(i, 1.37) * 34).toFixed(1)}s`
  ].join(';')}"></i>`).join('');

  return `
    <div class="vigilia-ambient solace-ambient" aria-hidden="true">
      <div class="solace-sun"></div>
      <div class="solace-haze haze-far"></div>
      <div class="solace-haze haze-near"></div>
      <div class="solace-haze haze-ground"></div>
      <div class="solace-haze haze-gust"></div>
      <div class="solace-clouds"><i class="cloud-a"></i><i class="cloud-b"></i><i class="cloud-c"></i></div>
      <div class="solace-grains">${grains}</div>
      <div class="solace-motes">${motes}</div>
    </div>
  `;
}

// Placas de Solace: as artes da Vigília com miolo marrom-escuro, linhas de areia na borda
// e o entrelaçado apagado (geradas por scripts/gen-solace-plates.py, mesmo tamanho e forma).
// O que não tem versão própria (nível, divisória do verso) é a arte da Vigília tingida pelo CSS.
const OWN_ART = new Set(['banner-atributos.png', 'banner-pericias.png', 'banner-power.png', 'banner-profile.png', 'banner-relacoes.png', 'badge-pv.png', 'badge-pd.png']);
const renderArt = (file, cls = '', alt = '') =>
  `<img src="${OWN_ART.has(file) ? DIR : VIG}${file}" alt="${alt}"${cls ? ` class="${cls}"` : ''} draggable="false">`;

export const SOLACE_SKIN = {
  id: 'solace',
  pageClass: 'solace-page',
  defaultBg: `${DIR}solace-bg.webp`,
  art: renderArt,
  // A palavra vetorial da Vigília vira máscara: a "tinta" é a cor de Solace, e a sombra fica no invólucro
  attrWord: (key, label) => `<span class="solace-attr-shadow"><span class="attr-vector-word solace-attr-ink word-${key}" role="img" aria-label="${label}" style="--src:url('${VIG}attr-${key}.svg')"></span></span>`,
  chevron: () => `
          <svg class="atributos-chevron-ray" viewBox="0 0 36 174" aria-hidden="true">
            <defs>
              <linearGradient id="sl-chevron" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#9a6a3a" stop-opacity="0.3" />
                <stop offset="28%" stop-color="#d98a42" stop-opacity="0.95" />
                <stop offset="50%" stop-color="#f4c286" />
                <stop offset="72%" stop-color="#d98a42" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#9a6a3a" stop-opacity="0.3" />
              </linearGradient>
            </defs>
            <path fill="url(#sl-chevron)" stroke="url(#sl-chevron)" stroke-width="1.8" stroke-linejoin="round" d="M27.70,173.73L2.96,85.95L35.07,0.00L0.00,86.40L1.49,86.22L0.04,86.57Z" />
          </svg>`,
  // Moldura de hieróglifos, disco alado e cantos desenhados em código (solace-frame.js)
  frame: renderSolaceFrame,
  ambient: renderAmbient
};
