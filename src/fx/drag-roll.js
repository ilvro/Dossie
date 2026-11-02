/**
 * src/fx/drag-roll.js
 * Fase 8.4 — Rolar arrastando (força e direção).
 * Permite puxar/arrastar a partir de qualquer gatilho de rolagem para definir
 * direção e força do arremesso 3D.
 */
import { getFxLayer, fxEnabled, isReducedMotion } from './ui-fx.js';

let pendingThrow = null;
let installed = false;

export function takePendingThrow() {
  if (!pendingThrow) return null;
  const now = performance.now();
  if (now - pendingThrow.timestamp > 1000) {
    pendingThrow = null;
    return null;
  }
  const res = pendingThrow;
  pendingThrow = null;
  return res;
}

const TRIGGER_SELECTOR = [
  '[data-roll]',
  '[data-expression]',
  '[data-roll-table]',
  '[data-roll-lesao-check]',
  '[data-roll-trauma-check]',
  '[data-roll-skill]',
  '[data-roll-attack]',
  '[data-roll-damage]',
  '[data-original-roll-attr]',
  '[data-threat-roll-pericia]',
  '[data-threat-roll-attr]',
  '[data-threat-roll-save]',
  '[data-threat-roll-sense]',
  '[data-threat-roll-presence]',
  '[data-threat-roll-atk-test]',
  '[data-threat-roll-atk-dmg]'
].join(', ');

const EXCLUDE_SELECTOR = '.custom-select, input, select, textarea, button.skill-info-button, .card-actions, [data-remove-aptidao], [data-add-aptidao]';

export function installDragRoll({ getColor = () => '#e0150d', isPresentation = () => false, isDisabled = () => false } = {}) {
  if (installed) return;
  installed = true;

  let activePointerId = null;
  let activePointerType = null;
  let currentTrigger = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isAiming = false;
  let holdTimer = null;
  let aimSvg = null;
  let clickSuppressHandler = null;
  let clickSuppressTimer = null;

  function suppressNextClick() {
    clearTimeout(clickSuppressTimer);
    if (clickSuppressHandler) {
      document.removeEventListener('click', clickSuppressHandler, true);
    }
    clickSuppressHandler = (e) => {
      e.stopImmediatePropagation();
      e.preventDefault();
      document.removeEventListener('click', clickSuppressHandler, true);
      clickSuppressHandler = null;
      clearTimeout(clickSuppressTimer);
    };
    document.addEventListener('click', clickSuppressHandler, true);
    clickSuppressTimer = setTimeout(() => {
      if (clickSuppressHandler) {
        document.removeEventListener('click', clickSuppressHandler, true);
        clickSuppressHandler = null;
      }
    }, 400);
  }

  function cleanupAim() {
    clearTimeout(holdTimer);
    holdTimer = null;
    if (aimSvg && aimSvg.parentNode) {
      aimSvg.parentNode.removeChild(aimSvg);
    }
    aimSvg = null;
    document.body.classList.remove('drag-aiming');
    if (currentTrigger && activePointerId !== null) {
      try {
        currentTrigger.releasePointerCapture(activePointerId);
      } catch {}
    }
    isAiming = false;
    activePointerId = null;
    activePointerType = null;
    currentTrigger = null;
  }

  function startAiming() {
    if (isAiming) return;
    isAiming = true;
    document.body.classList.add('drag-aiming');
    if (currentTrigger && activePointerId !== null) {
      try {
        currentTrigger.setPointerCapture(activePointerId);
      } catch {}
    }

    if (!isReducedMotion() && fxEnabled()) {
      createAimGraphic();
      updateAimGraphic();
    }
  }

  function createAimGraphic() {
    const layer = getFxLayer();
    if (!layer) return;

    aimSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    aimSvg.setAttribute('class', 'drag-aim-overlay');
    aimSvg.style.position = 'fixed';
    aimSvg.style.inset = '0';
    aimSvg.style.width = '100vw';
    aimSvg.style.height = '100vh';
    aimSvg.style.pointerEvents = 'none';
    aimSvg.style.zIndex = '40';
    aimSvg.style.overflow = 'visible';

    layer.appendChild(aimSvg);
  }

  function updateAimGraphic() {
    if (!aimSvg) return;

    const dx = currentX - startX;
    const dy = currentY - startY;
    const dist = Math.hypot(dx, dy);
    const power = Math.max(0.15, Math.min(1.0, dist / 220));
    const color = getColor() || '#e0150d';

    const ringRadius = 22;
    const circ = 2 * Math.PI * ringRadius;
    const dashOffset = circ * (1 - power);

    // Ângulo do ponteiro em relação ao ponto inicial
    const angle = Math.atan2(dy, dx);
    const headLen = 14;
    const headAngle = Math.PI / 6;

    // Pontas da seta
    const tipX = currentX;
    const tipY = currentY;
    const leftX = tipX - headLen * Math.cos(angle - headAngle);
    const leftY = tipY - headLen * Math.sin(angle - headAngle);
    const rightX = tipX - headLen * Math.cos(angle + headAngle);
    const rightY = tipY - headLen * Math.sin(angle + headAngle);

    aimSvg.innerHTML = `
      <defs>
        <filter id="aim-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g filter="url(#aim-glow)">
        <!-- Anel de base transparente -->
        <circle cx="${startX}" cy="${startY}" r="${ringRadius}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
        <!-- Anel de força preenchido -->
        <circle cx="${startX}" cy="${startY}" r="${ringRadius}" fill="none" stroke="${color}" stroke-width="4.5"
                stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}"
                stroke-linecap="round" transform="rotate(-90 ${startX} ${startY})" />
        <!-- Ponto central de ancoragem -->
        <circle cx="${startX}" cy="${startY}" r="3.5" fill="${color}" />
        <!-- Linha da mira -->
        <line x1="${startX}" y1="${startY}" x2="${currentX}" y2="${currentY}" stroke="${color}" stroke-width="3.5" stroke-linecap="round" />
        <!-- Cabeça da seta -->
        <polygon points="${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}" fill="${color}" />
      </g>
    `;
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (document.querySelector('#dice-stage.active')) return;
    if (isPresentation() || isDisabled()) return;

    const target = e.target;
    if (target.closest(EXCLUDE_SELECTOR)) return;

    const trigger = target.closest(TRIGGER_SELECTOR);
    if (!trigger) return;

    activePointerId = e.pointerId;
    activePointerType = e.pointerType;
    currentTrigger = trigger;
    startX = e.clientX;
    startY = e.clientY;
    currentX = e.clientX;
    currentY = e.clientY;
    isAiming = false;

    if (e.pointerType === 'touch') {
      holdTimer = setTimeout(() => {
        holdTimer = null;
        startAiming();
      }, 250);
    }
  }, { passive: true });

  document.addEventListener('pointermove', (e) => {
    if (activePointerId === null || e.pointerId !== activePointerId) return;

    currentX = e.clientX;
    currentY = e.clientY;
    const dx = currentX - startX;
    const dy = currentY - startY;
    const dist = Math.hypot(dx, dy);

    if (activePointerType === 'touch') {
      if (holdTimer) {
        // Se mover mais de 8px antes do timer de 250ms expirar, é scroll da página
        if (dist > 8) {
          clearTimeout(holdTimer);
          holdTimer = null;
          activePointerId = null;
          currentTrigger = null;
          return;
        }
      }
    } else {
      // Mouse ou caneta: entra em mira se mover > 12px
      if (!isAiming && dist > 12) {
        startAiming();
      }
    }

    if (isAiming) {
      if (!isReducedMotion() && fxEnabled()) {
        updateAimGraphic();
      }
    }
  }, { passive: true });

  document.addEventListener('pointerup', (e) => {
    if (activePointerId === null || e.pointerId !== activePointerId) return;

    clearTimeout(holdTimer);
    holdTimer = null;

    if (!isAiming) {
      // Soltou sem entrar em mira: deixa o clique normal acontecer
      cleanupAim();
      return;
    }

    const rawDx = e.clientX - startX;
    const rawDy = startY - e.clientY; // dy positivo = para cima
    const dist = Math.hypot(rawDx, rawDy);

    if (dist < 12) {
      // Arrastou e voltou: cancela sem rolar
      cleanupAim();
      return;
    }

    const power = Math.max(0.15, Math.min(1.0, dist / 220));
    pendingThrow = {
      dx: rawDx / dist,
      dy: rawDy / dist,
      power,
      timestamp: performance.now()
    };

    const triggerToClick = currentTrigger;
    cleanupAim();

    suppressNextClick();
    triggerToClick?.click();
  });

  document.addEventListener('pointercancel', (e) => {
    if (activePointerId !== null && e.pointerId === activePointerId) {
      cleanupAim();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isAiming) {
      cleanupAim();
    }
  });
}

