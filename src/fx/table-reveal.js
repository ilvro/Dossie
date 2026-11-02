/**
 * table-reveal.js
 * Efeitos de revelação para as Tabelas de Lesões e Traumas (A Vigília):
 * - Roleta vertical estilo caça-níquel (quando rolado no d20) com desaceleração e ticks.
 * - Carta 3D virando (rotateY 180deg) com frente/verso decorados e estética da Vigília.
 * - Tratamento por gravidade: fatal (tremores e escurecimento), grave, moderada e alívio (brilho e faíscas).
 */
import { getFxLayer, rectOf, burst, fxEnabled, isReducedMotion } from './ui-fx.js';
import { easeOutCubic } from './dice-fx-primitives.js';

function getAudioCtx() {
  const Context = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Context) return null;
  window.__ordemUiAudioCtx ??= new Context();
  window.__ordemUiAudioCtx.resume?.().catch(() => {});
  return window.__ordemUiAudioCtx;
}

/**
 * Determina o grau de gravidade de uma linha da tabela de Lesão ou Trauma.
 * @param {Object} row
 * @returns {'fatal' | 'grave' | 'moderada' | 'alivio'}
 */
export function severityOf(row) {
  if (!row) return 'moderada';
  if (row.fatal || row.insane) return 'fatal';
  if (
    row.maxPvPenalty ||
    row.maxPdPenalty ||
    row.stepPenalty ||
    row.handLost ||
    row.footLost ||
    row.extraDamage ||
    (row.skillPenalties && Object.values(row.skillPenalties).some(v => v < 0))
  ) {
    return 'grave';
  }
  if (row.pvBonus || row.pdBonus) {
    return 'alivio';
  }
  if (row.tempStepPenalty || row.stunned || row.pavor) {
    return 'moderada';
  }
  return 'moderada';
}

/**
 * Tick sonoro para cada passagem de nome na roleta (pitch decrescente à medida que desacelera).
 */
function playRouletteTick(audioCtx, progress) {
  try {
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const freq = Math.max(220, 850 - progress * 520);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.035, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.024);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.026);
  } catch {}
}

/**
 * Efeito sonoro temático ao virar a carta.
 */
function playCardRevealSound(audioCtx, severity) {
  try {
    const t0 = audioCtx.currentTime;
    if (severity === 'fatal') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t0);
      osc.frequency.exponentialRampToValueAtTime(32, t0 + 0.75);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.09, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.78);
    } else if (severity === 'alivio') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t0 + i * 0.07);
        g.gain.setValueAtTime(0.0001, t0 + i * 0.07);
        g.gain.linearRampToValueAtTime(0.04, t0 + i * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.07 + 0.35);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t0 + i * 0.07);
        o.stop(t0 + i * 0.07 + 0.37);
      });
    } else {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.28);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.05, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.29);
    }
  } catch {}
}

const sigilSvg = `
<svg class="card-back-sigil" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="44" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="50" cy="50" r="34" stroke="#7c3aed" stroke-width="1.2"/>
  <polygon points="50,14 81,68 19,68" stroke="#c084fc" stroke-width="1.5"/>
  <polygon points="50,86 19,32 81,32" stroke="#c084fc" stroke-width="1.5"/>
  <circle cx="50" cy="50" r="10" fill="#3b0764" stroke="#e9d5ff" stroke-width="1.5"/>
  <circle cx="50" cy="50" r="3.5" fill="#f8fafc"/>
</svg>
`;

function renderMechanicTags(row) {
  if (!row) return '';
  const tags = [];
  if (row.fatal) tags.push({ text: '☠ CONSEQUÊNCIA FATAL', type: 'fatal' });
  if (row.insane) tags.push({ text: '☠ COLAPSO MENTAL TOTAL (INSANO)', type: 'fatal' });
  if (row.pvBonus) tags.push({ text: `♥ RECUPERA ${row.pvBonus} PV`, type: 'alivio' });
  if (row.pdBonus) tags.push({ text: `✦ RECUPERA ${row.pdBonus} PD`, type: 'alivio' });
  if (row.pavor) tags.push({ text: '▲ DADO DE PAVOR (+1 PASSO)', type: 'moderada' });
  if (row.maxPvPenalty) tags.push({ text: `−${row.maxPvPenalty} PV MÁXIMO PERMANENTE`, type: 'grave' });
  if (row.maxPdPenalty) tags.push({ text: `−${row.maxPdPenalty} PD MÁXIMO PERMANENTE`, type: 'grave' });
  if (row.stepPenalty) tags.push({ text: `−1 PASSO EM ${row.stepPenalty.toUpperCase()} (PERMANENTE)`, type: 'grave' });
  if (row.tempStepPenalty) tags.push({ text: `−1 PASSO EM ${row.tempStepPenalty.toUpperCase()} (ATÉ O FIM DA CENA)`, type: 'moderada' });
  if (row.handLost) tags.push({ text: '−1 MÃO / BRAÇO (INUTILIZADO)', type: 'grave' });
  if (row.footLost) tags.push({ text: '−1 PÉ / PERNA (INUTILIZADO)', type: 'grave' });
  if (row.stunned) tags.push({ text: 'ESTUPOR: PERDE A PRÓXIMA AÇÃO', type: 'moderada' });
  if (row.extraDamage) tags.push({ text: `+${row.extraDamage} DANO EMOCIONAL ADICIONAL`, type: 'grave' });
  if (row.skillPenalties) {
    const s = Object.entries(row.skillPenalties).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`).join(', ');
    tags.push({ text: s, type: Object.values(row.skillPenalties).some(v => v < 0) ? 'grave' : 'moderada' });
  }

  if (!tags.length) return '';
  return `
    <div class="card-effects-wrap">
      ${tags.map(t => `<div class="card-mechanic-tag ${t.type}">${t.text}</div>`).join('')}
    </div>
  `;
}

/**
 * Exibe o modal cinematográfico de revelação da tabela com roleta e carta 3D.
 * @param {Object} params
 * @param {'lesao'|'trauma'} params.table
 * @param {Array<Object>} params.rows - Lista completa de linhas da tabela
 * @param {Object} params.row - Linha sorteada ou selecionada
 * @param {string} params.rollLabel - Rótulo da rolagem (ex.: "1d20: 14" ou "11–12")
 * @param {boolean} params.rolled - Se veio de rolagem no d20 (true) ou clique manual (false)
 * @returns {Promise<void>} Resolve quando o usuário clicar em "Aplicar" ou pressionar Enter/Esc.
 */
export function revealTableResult({ table = 'lesao', rows = [], row = null, rollLabel = '', rolled = false } = {}) {
  return new Promise((resolve) => {
    const severity = severityOf(row);
    const severityLabel = severity === 'fatal' ? (row?.insane ? 'INSANO' : 'FATAL') : severity.toUpperCase();
    const audioCtx = fxEnabled() ? getAudioCtx() : null;
    const reduced = isReducedMotion() || !fxEnabled();

    const modal = document.createElement('div');
    modal.className = `table-reveal-modal severity-${severity}`;
    modal.id = 'table-reveal-modal';

    const shouldShowRoulette = rolled && !reduced && rows.length > 0;

    modal.innerHTML = `
      <div class="table-reveal-backdrop"></div>
      <div class="table-reveal-container">
        ${shouldShowRoulette ? `
          <div class="roulette-wrap">
            <div class="roulette-header">
              <span>✦</span> SORTEANDO ${table === 'lesao' ? 'LESÃO' : 'TRAUMA'} <span>✦</span>
            </div>
            <div class="roulette-viewport">
              <div class="roulette-pointer-box"></div>
              <div class="roulette-reel"></div>
            </div>
          </div>
        ` : ''}
        <div class="table-card-stage">
          <div class="table-card-flipper ${reduced ? 'flipped' : ''}">
            <div class="table-card-face table-card-back">
              ${sigilSvg}
              <div class="card-back-title">A VIGÍLIA</div>
              <div class="card-back-sub">${table === 'lesao' ? 'TABELA DE LESÕES' : 'TABELA DE TRAUMAS'}</div>
            </div>
            <div class="table-card-face table-card-front severity-${severity}">
              <div class="card-top-row">
                <span class="card-table-badge">${table === 'lesao' ? 'TABELA DE LESÕES' : 'TABELA DE TRAUMAS'}</span>
                <span class="card-roll-tag">${rollLabel}</span>
              </div>
              <div class="card-severity-badge severity-${severity}">${severityLabel}</div>
              <h2 class="card-title">${row?.name || ''}</h2>
              <p class="card-desc">${row?.desc || ''}</p>
              ${renderMechanicTags(row)}
              <button type="button" class="table-card-apply-btn">APLICAR À FICHA (ENTER)</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    void modal.offsetWidth;
    modal.classList.add('show');

    let cleanedUp = false;
    function cleanupAndResolve() {
      if (cleanedUp) return;
      cleanedUp = true;
      document.removeEventListener('keydown', onKeyDown);
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        resolve();
      }, 250);
    }

    function onKeyDown(e) {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        cleanupAndResolve();
      }
    }
    document.addEventListener('keydown', onKeyDown);

    const applyBtn = modal.querySelector('.table-card-apply-btn');
    if (applyBtn) {
      applyBtn.onclick = (e) => {
        e.stopPropagation();
        cleanupAndResolve();
      };
      // Foca o botão após breve intervalo
      setTimeout(() => applyBtn.focus(), 300);
    }

    modal.querySelector('.table-reveal-backdrop')?.addEventListener('click', () => {
      cleanupAndResolve();
    });

    const cardFlipper = modal.querySelector('.table-card-flipper');

    // Caso 1: Sem animação / movimento reduzido
    if (reduced) {
      return;
    }

    // Caso 2: Com Roleta (rolado no d20)
    if (shouldShowRoulette) {
      const reel = modal.querySelector('.roulette-reel');
      const pointerBox = modal.querySelector('.roulette-pointer-box');
      const rouletteWrap = modal.querySelector('.roulette-wrap');
      const itemHeight = 44;

      // Monta 3 repetições completas + itens até a linha sorteada
      const targetIndex = Math.max(0, rows.findIndex(r => r.name === row?.name));
      const cycles = 3;
      const reelItems = [];
      for (let c = 0; c < cycles; c++) {
        reelItems.push(...rows);
      }
      reelItems.push(...rows.slice(0, targetIndex + 1));

      reel.innerHTML = reelItems.map(item => `
        <div class="roulette-item">${item.name}</div>
      `).join('');

      const totalItemsToTarget = cycles * rows.length + targetIndex;
      const targetY = totalItemsToTarget * itemHeight;
      const duration = 1600;
      const startTime = performance.now();
      let lastItemIndex = -1;

      function stepRoulette(now) {
        if (cleanedUp) return;
        const elapsed = now - startTime;
        const p = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(p);
        const currentY = eased * targetY;

        reel.style.transform = `translateY(-${currentY}px)`;

        const currentItemIndex = Math.floor(currentY / itemHeight);
        if (currentItemIndex !== lastItemIndex) {
          if (audioCtx) playRouletteTick(audioCtx, p);
          lastItemIndex = currentItemIndex;
        }

        if (p < 1) {
          requestAnimationFrame(stepRoulette);
        } else {
          // Chegou no resultado
          pointerBox.classList.add(`hit-${severity}`);
          setTimeout(() => {
            if (cleanedUp) return;
            rouletteWrap.classList.add('fade-out');
            setTimeout(() => {
              if (cleanedUp) return;
              rouletteWrap.style.display = 'none';
              // Vira a carta 3D
              flipCard();
            }, 350);
          }, 350);
        }
      }

      requestAnimationFrame(stepRoulette);
    } else {
      // Caso 3: Escolha manual (sem roleta, apenas vira a carta)
      setTimeout(() => {
        if (!cleanedUp) flipCard();
      }, 100);
    }

    function flipCard() {
      if (!cardFlipper || cleanedUp) return;
      cardFlipper.classList.add('flipped');

      setTimeout(() => {
        if (audioCtx && !cleanedUp) playCardRevealSound(audioCtx, severity);
      }, 250);

      setTimeout(() => {
        if (cleanedUp) return;
        if (severity === 'fatal') {
          cardFlipper.classList.add('shake-fatal');
        } else if (severity === 'alivio') {
          cardFlipper.classList.add('glow-alivio');
          const frontFace = modal.querySelector('.table-card-front');
          const rect = rectOf(frontFace);
          if (rect) {
            burst(rect, { color: '#34d399', count: 16, spread: 45, life: 750 });
          }
        }
      }, 750);
    }
  });
}

