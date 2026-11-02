/**
 * resource-fx.js
 * Efeitos dinâmicos de PV e PD (rastro fantasma em pips/barras e números flutuantes).
 */
import { floatText, rectOf, fxEnabled } from './ui-fx.js';

let last = {
  sheetId: null,
  pv: null,
  pd: null
};

const pendingDeltas = { pv: 0, pd: 0 };
const pendingTimers = { pv: null, pd: null };

/**
 * Rastreia alterações em PV e PD comparando o estado atual com o anterior.
 * Deve ser chamado ao final de updateResourceUi(key) e runPostRenderFx().
 */
export function trackResources(state) {
  if (!state || !state.id) return;

  const currentPv = Number(state.pv ?? 0);
  const currentPd = Number(state.pd ?? 0);

  // Primeira chamada ou troca de ficha: apenas sincroniza sem animar
  if (state.id !== last.sheetId || last.pv === null || last.pd === null) {
    last = {
      sheetId: state.id,
      pv: currentPv,
      pd: currentPd
    };
    return;
  }

  // Se o estado mudou na mesma ficha, dispara os efeitos
  if (currentPv !== last.pv) {
    const prev = last.pv;
    last.pv = currentPv;
    playResourceFx('pv', prev, currentPv, state.maxPv);
  }

  if (currentPd !== last.pd) {
    const prev = last.pd;
    last.pd = currentPd;
    playResourceFx('pd', prev, currentPd, state.maxPd);
  }
}

/**
 * Dispara os efeitos visuais de transição de recurso.
 */
export function playResourceFx(key, prev, next, max = 0) {
  if (!fxEnabled() || prev === next) return;

  const lowerKey = key.toLowerCase();
  const delta = next - prev;

  // 1. Número flutuante agrupado (< 250ms)
  pendingDeltas[lowerKey] = (pendingDeltas[lowerKey] || 0) + delta;
  if (pendingTimers[lowerKey]) {
    clearTimeout(pendingTimers[lowerKey]);
  }
  pendingTimers[lowerKey] = setTimeout(() => {
    const finalDelta = pendingDeltas[lowerKey];
    pendingDeltas[lowerKey] = 0;
    pendingTimers[lowerKey] = null;
    if (!finalDelta) return;

    const targetEl =
      document.querySelector(`.vigilia-resource-block.resource-${lowerKey} .res-num`) ||
      document.querySelector(`.vigilia-resource-block.resource-${lowerKey} .resource-badge-group`) ||
      document.querySelector(`.cinematic-resource-item.resource-${lowerKey} b`) ||
      document.querySelector(`.resource-row[data-resource-key="${lowerKey}"] b`) ||
      document.querySelector(`[data-resource-key="${lowerKey}"]`);

    const rect = rectOf(targetEl);
    const isPv = lowerKey === 'pv';
    const color = isPv
      ? (finalDelta < 0 ? '#ff4d5e' : '#4ade80')
      : (finalDelta < 0 ? '#a855f7' : '#c4b5fd');

    const label = finalDelta > 0 ? `+${finalDelta}` : `−${Math.abs(finalDelta)}`;
    floatText(rect, label, { color, size: 22 });
  }, 250);

  // 2. Efeito nos pips (Vigília e Cinematic/Dossier)
  const containers = document.querySelectorAll(
    `.vigilia-resource-block.resource-${lowerKey}, ` +
    `.cinematic-resource-item.resource-${lowerKey}, ` +
    `.resource-row[data-resource-key="${lowerKey}"]`
  );

  containers.forEach(container => {
    const pips = Array.from(
      container.querySelectorAll('.vigilia-pip:not(.temp-pip), .pip:not(.temporary)')
    );
    if (!pips.length) return;

    if (delta < 0) {
      // Perda de recurso: intervalo [next, prev)
      const fromIdx = Math.max(0, next);
      const toIdx = Math.min(pips.length, prev);

      for (let i = fromIdx; i < toIdx; i++) {
        const pip = pips[i];
        if (!pip) continue;
        const k = i - fromIdx;
        pip.classList.add('ghost');
        pip.style.setProperty('--i', String(k));

        setTimeout(() => {
          if (pip.isConnected) {
            pip.classList.add('ghost-drain');
          }
        }, 380);

        setTimeout(() => {
          if (pip.isConnected) {
            pip.classList.remove('ghost', 'ghost-drain');
            pip.style.removeProperty('--i');
          }
        }, 380 + 450 + (k * 40) + 60);
      }
    } else {
      // Ganho de recurso: intervalo [prev, next)
      const fromIdx = Math.max(0, prev);
      const toIdx = Math.min(pips.length, next);

      for (let i = fromIdx; i < toIdx; i++) {
        const pip = pips[i];
        if (!pip) continue;
        const k = i - fromIdx;
        pip.classList.add('pip-pop');
        pip.style.setProperty('--i', String(k));

        setTimeout(() => {
          if (pip.isConnected) {
            pip.classList.remove('pip-pop');
            pip.style.removeProperty('--i');
          }
        }, 500 + (k * 40));
      }
    }
  });

  // 3. Efeito em barra de progresso (se existir em ameaças ou cartões)
  if (max > 0) {
    const tracks = document.querySelectorAll(
      `[data-resource-key="${lowerKey}"] .progress-track, ` +
      `.resource-${lowerKey} .progress-track, ` +
      `.threat-pv-bar .progress-track`
    );
    tracks.forEach(track => {
      let ghost = track.querySelector('.ghost-bar');
      if (!ghost) {
        ghost = document.createElement('i');
        ghost.className = 'ghost-bar';
        track.insertBefore(ghost, track.firstChild);
      }
      const prevPct = Math.max(0, Math.min(100, (prev / max) * 100));
      const nextPct = Math.max(0, Math.min(100, (next / max) * 100));
      ghost.style.width = `${prevPct}%`;
      ghost.style.opacity = '1';

      setTimeout(() => {
        if (ghost.isConnected) {
          ghost.style.width = `${nextPct}%`;
          setTimeout(() => {
            if (ghost.isConnected) ghost.style.opacity = '0';
          }, 450);
        }
      }, 380);
    });
  }

  // 4. Tremidinha leve na perda de PV
  if (lowerKey === 'pv' && delta < 0) {
    const shakeTargets = document.querySelectorAll(
      `.vigilia-resource-block.resource-pv, ` +
      `.cinematic-resource-item.resource-pv, ` +
      `[data-resource-key="pv"]`
    );
    shakeTargets.forEach(target => {
      target.classList.remove('res-shake');
      void target.offsetWidth;
      target.classList.add('res-shake');
      setTimeout(() => target.classList.remove('res-shake'), 180);
    });
  }
}

