/**
 * Moldura de Solace: as peças são recortes da própria pintura de referência
 * (scripts/gen-solace-frame.py), com a pedra, o traço gasto e as asas como foram pintados.
 * O código só monta as peças no tamanho da página:
 * - cantos de cima (disco e asa) e os de baixo, os mesmos virados;
 * - faixas de hieróglifos: os grupos recortados entram em fila até encher a largura, e todos
 *   esticam um pouco para fechar a conta (o que não cabe quebra para uma linha escondida);
 * - colunas: o mesmo, de cima para baixo (a da direita é a da esquerda espelhada);
 * - disco alado no centro, recortado pela silhueta, logo abaixo das abas de frente e verso.
 * Vida: uma luz morna e lenta passando pela moldura (CSS, desligável com o ambiente).
 */

import { FRAME } from './solace-frame-data.js';

const DIR = './assets/solace/';

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

// Um grupo do sprite: o fundo é posto em % para acompanhar o quanto o grupo esticou
function groups(file, sprite, list, vertical, seed) {
  const total = vertical ? sprite.h : sprite.w;
  const cell = ([off, len]) => {
    const pos = ((off / (total - len)) * 100).toFixed(3);
    const size = ((total / len) * 100).toFixed(3);
    const style = vertical
      ? `flex:${len} 0 ${len}px;background-size:100% ${size}%;background-position:0 ${pos}%`
      : `flex:${len} 0 ${len}px;background-size:${size}% 100%;background-position:${pos}% 0`;
    return `<i style="${style}"></i>`;
  };
  // A primeira volta segue a ordem da pintura (só o topo); as outras são embaralhadas, para a
  // repetição não aparecer. Voltas de sobra para páginas grandes: o que passa fica escondido.
  const rounds = [0, 1, 2, 3].map(k => (k === 0 && !seed ? list : shuffled(list, seed * 7 + k * 101 + 1)));
  return `<div class="slf-run" style="--src:url('${DIR}${file}')">${rounds.flat().map(cell).join('')}</div>`;
}

export function renderSolaceFrame() {
  const { band, cornerL, cornerR, colL, wing } = FRAME;
  const glint = vertical => `<i class="slf-glint${vertical ? ' v' : ''}"></i>`;
  const vars = [
    `--band-h:${band.h}px`,
    `--corner-l:${cornerL.w}px`,
    `--corner-r:${cornerR.w}px`,
    `--col:${colL.w}px`,
    `--wing-w:${wing.w}px`,
    `--wing-h:${wing.h}px`,
    `--disk-y:${wing.diskY}px`
  ].join(';');
  return `
    <div class="vigilia-frame-layer sl-frame" style="${vars}" aria-hidden="true">
      <div class="slf-band slf-top">${groups('moldura-faixa.webp', band, band.groups, false, 0)}${glint(false)}</div>
      <div class="slf-band slf-bottom">${groups('moldura-faixa.webp', band, band.groups, false, 3)}${glint(false)}</div>
      <div class="slf-band slf-left">${groups('moldura-coluna-e.webp', colL, colL.groups, true, 0)}${glint(true)}</div>
      <div class="slf-band slf-right">${groups('moldura-coluna-e.webp', colL, colL.groups, true, 5)}${glint(true)}</div>
      <i class="slf-corner slf-corner-tl"></i><i class="slf-corner slf-corner-tr"></i>
      <i class="slf-corner slf-corner-bl"></i><i class="slf-corner slf-corner-br"></i>
      <div class="slf-winged">${glint(false)}</div>
    </div>`;
}
