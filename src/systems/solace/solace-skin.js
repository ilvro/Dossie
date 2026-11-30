/**
 * Skin "Solace" do layout de frente e verso de Ordem II (src/systems/vigilia/vigilia-view.js).
 * Solace é o país do deserto: uma metrópole às margens das dunas, ao pôr do sol.
 * Direção: Egito ptolomaico pintado à mão, com frisos de blocos, colar wesekh, disco solar alado,
 * pigmento chapado e desgaste de impressão (sem metal polido, sem brilho).
 * Mesma mecânica e mesmo markup da Vigília; aqui só muda a arte, a moldura e o ambiente.
 * A arte sai de scripts/solace-arte.py para public/assets/solace/.
 */

import { installMistTexture } from '../../fx/mist-texture.js';
import './solace.css';

const DIR = './assets/solace/';

// Cada peça de arte da Vigília e o seu par em Solace (as faixas usam todas a mesma placa)
const ART = {
  'banner-profile.png': 'banner.png',
  'banner-atributos.png': 'banner.png',
  'banner-pericias.png': 'banner.png',
  'banner-power.png': 'banner.png',
  'banner-relacoes.png': 'banner.png',
  'badge-level.png': 'badge-level.png',
  'badge-pv.png': 'badge-pv.png',
  'badge-pd.png': 'badge-pd.png',
  'divider-celtic.png': 'divider.png'
};

const ATTR_WORDS = { fisico: 'Físico', mente: 'Mente', emocao: 'Emoção' };

// Posições pseudoaleatórias fixas por índice: o ambiente não embaralha a cada render().
const rand = (i, k) => {
  const v = Math.sin((i + 1) * k) * 43758.5453;
  return v - Math.floor(v);
};

function renderAmbient() {
  installMistTexture();
  // Poeira suspensa na luz do fim de tarde: sobe devagar e deriva com o vento
  const motes = Array.from({ length: 22 }, (_, i) => `<i style="${[
    `--x:${(rand(i, 12.9898) * 100).toFixed(1)}%`,
    `--y:${(30 + rand(i, 78.233) * 65).toFixed(1)}%`,
    `--s:${(1.2 + rand(i, 37.719) * 2).toFixed(1)}px`,
    `--d:${(18 + rand(i, 4.581) * 16).toFixed(1)}s`,
    `--o:${(-rand(i, 9.137) * 34).toFixed(1)}s`
  ].join(';')}"></i>`).join('');

  return `
    <div class="vigilia-ambient solace-ambient" aria-hidden="true">
      <div class="solace-haze haze-far"></div>
      <div class="solace-haze haze-ground"></div>
      <div class="solace-motes">${motes}</div>
    </div>
  `;
}

export const SOLACE_SKIN = {
  id: 'solace',
  pageClass: 'solace-page',
  defaultBg: `${DIR}solace-bg.webp`,
  art: (file, cls = '', alt = '') => ART[file]
    ? `<img src="${DIR}${ART[file]}" alt="${alt}"${cls ? ` class="${cls}"` : ''} draggable="false">`
    : '',
  attrWord: (key, label) => `<span class="solace-attr-word word-${key}" aria-label="${label}">${ATTR_WORDS[key] || label}</span>`,
  chevron: () => `<img src="${DIR}bracket.png" alt="" class="atributos-chevron-ray solace-bracket" draggable="false">`,
  frame: () => '<div class="vigilia-frame-layer solace-frame" aria-hidden="true"></div>',
  ambient: renderAmbient
};
