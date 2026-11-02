/**
 * ui-fx.js
 * Efeitos visuais no DOM da ficha (camada de FX, partículas, números flutuantes e contagem).
 */
import { clamp01, easeOutCubic, rand } from './dice-fx-primitives.js';

let fxLayer = null;

const reducedMotionQuery = typeof window !== 'undefined'
  ? window.matchMedia?.('(prefers-reduced-motion: reduce)')
  : null;

export function isReducedMotion() {
  return Boolean(reducedMotionQuery?.matches);
}

let fxEnabledGetter = () => true;
let rollSceneGetter = () => true;
let manualThrowGetter = () => true;

export function setFxEnabledGetter(fn) {
  if (typeof fn === 'function') {
    fxEnabledGetter = fn;
  }
}

export function setRollSceneGetter(fn) {
  if (typeof fn === 'function') {
    rollSceneGetter = fn;
  }
}

export function setManualThrowGetter(fn) {
  if (typeof fn === 'function') {
    manualThrowGetter = fn;
  }
}

export function manualThrowEnabled() {
  return Boolean(manualThrowGetter());
}

export function fxEnabled() {
  return Boolean(fxEnabledGetter() && !isReducedMotion());
}

export function rollSceneEnabled() {
  return Boolean(fxEnabled() && rollSceneGetter());
}

/**
 * Cria ou recupera a camada única de FX no body.
 * z-index 40: acima da ficha, abaixo do palco de dados 3D (z-index 45).
 */
export function getFxLayer() {
  if (fxLayer && fxLayer.isConnected) return fxLayer;
  let layer = document.getElementById('fx-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'fx-layer';
    document.body.appendChild(layer);
  }
  fxLayer = layer;
  return fxLayer;
}

/**
 * Retorna o DOMRect de um seletor ou elemento.
 * Capturar antes de qualquer render()!
 */
export function rectOf(selector) {
  if (!selector) return null;
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  return el?.getBoundingClientRect() || null;
}

/* ------------------------------------------------------------------ */
/* Fila de efeitos pós-render                                         */
/* ------------------------------------------------------------------ */
const postRenderQueue = [];

export function queuePostRenderFx(fn) {
  if (typeof fn === 'function') {
    postRenderQueue.push(fn);
  }
}

export function runPostRenderFx() {
  while (postRenderQueue.length) {
    const fn = postRenderQueue.shift();
    try {
      fn();
    } catch (err) {
      console.warn('[UI-FX] Erro ao executar efeito pós-render:', err);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Número flutuante (+2, −3)                                          */
/* ------------------------------------------------------------------ */
export function floatText(rect, text, { color = '#fff', size = 18 } = {}) {
  if (!fxEnabled() || !text) return null;
  const layer = getFxLayer();
  const el = document.createElement('div');
  el.className = 'fx-float-text';
  el.textContent = String(text);
  if (color) el.style.color = color;
  if (size) el.style.fontSize = typeof size === 'number' ? `${size}px` : size;

  const left = rect ? (rect.left + rect.width / 2) : (window.innerWidth / 2);
  const top = rect ? rect.top : (window.innerHeight / 2);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  layer.appendChild(el);

  const anim = el.animate([
    { transform: 'translate(-50%, 0) scale(1.25)', opacity: 1 },
    { transform: 'translate(-50%, -26px) scale(1.08)', opacity: 1, offset: 0.65 },
    { transform: 'translate(-50%, -40px) scale(1)', opacity: 0 }
  ], {
    duration: 900,
    easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
    fill: 'forwards'
  });

  anim.onfinish = () => el.remove();
  return el;
}

/* ------------------------------------------------------------------ */
/* Partículas DOM (fumaça / faíscas)                                   */
/* ------------------------------------------------------------------ */
export function burst(rect, { color = '#a855f7', count = 12, spread = 40, life = 700 } = {}) {
  if (!fxEnabled()) return;
  const layer = getFxLayer();
  const cx = rect ? (rect.left + rect.width / 2) : (window.innerWidth / 2);
  const cy = rect ? (rect.top + rect.height / 2) : (window.innerHeight / 2);

  const actualCount = isReducedMotion() ? Math.min(count, 4) : count;

  for (let i = 0; i < actualCount; i++) {
    const p = document.createElement('div');
    p.className = 'fx-burst-particle';
    const s = rand(8, 16);
    p.style.width = `${s}px`;
    p.style.height = `${s}px`;
    p.style.background = `radial-gradient(circle, ${color} 0%, transparent 75%)`;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    layer.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = rand(8, spread);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (spread * 0.25);
    const pLife = life * rand(0.7, 1.3);

    const anim = p.animate([
      { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.15)`, opacity: 0.85, offset: 0.4 },
      { transform: `translate(calc(-50% + ${dx * 1.35}px), calc(-50% + ${dy * 1.35 - 12}px)) scale(0.15)`, opacity: 0 }
    ], {
      duration: pLife,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });

    anim.onfinish = () => p.remove();
  }
}

/* ------------------------------------------------------------------ */
/* Partículas voadoras entre dois retângulos                          */
/* ------------------------------------------------------------------ */
export function flyParticles(fromRect, toRect, { count = 10, color = '#c4b5fd', duration = 600, curve = 60 } = {}) {
  if (!fromRect || !toRect) return Promise.resolve();
  if (!fxEnabled()) return Promise.resolve();

  return new Promise((resolve) => {
    const layer = getFxLayer();
    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;
    const toX = toRect.left + toRect.width / 2;
    const toY = toRect.top + toRect.height / 2;

    const actualCount = isReducedMotion() ? Math.min(count, 3) : count;
    let resolved = false;

    for (let i = 0; i < actualCount; i++) {
      const p = document.createElement('div');
      p.className = 'fx-fly-particle';
      const s = rand(6, 12);
      p.style.width = `${s}px`;
      p.style.height = `${s}px`;
      p.style.background = `radial-gradient(circle, ${color} 0%, transparent 75%)`;
      p.style.left = '0px';
      p.style.top = '0px';
      layer.appendChild(p);

      // Ponto de controle quadrático arqueado acima da linha
      const midX = (fromX + toX) / 2 + rand(-curve * 0.4, curve * 0.4);
      const midY = Math.min(fromY, toY) - curve * rand(0.6, 1.3);

      const STEPS = 14;
      const keyframes = [];
      for (let sIdx = 0; sIdx <= STEPS; sIdx++) {
        const t = sIdx / STEPS;
        const inv = 1 - t;
        const x = inv * inv * fromX + 2 * inv * t * midX + t * t * toX;
        const y = inv * inv * fromY + 2 * inv * t * midY + t * t * toY;
        const scale = 0.7 + Math.sin(t * Math.PI) * 0.6;
        const opacity = t < 0.1 ? t * 10 : (t > 0.85 ? (1 - t) * 6.6 : 1);
        keyframes.push({
          transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
          opacity
        });
      }

      const pDuration = duration * rand(0.9, 1.15);
      const delay = i * (duration * 0.35 / Math.max(1, actualCount));

      const anim = p.animate(keyframes, {
        duration: pDuration,
        delay,
        easing: 'ease-out',
        fill: 'forwards'
      });

      if (i === 0) {
        // Resolve a Promise quando a primeira partícula atinge o destino
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }, delay + pDuration * 0.95);
      }

      anim.onfinish = () => {
        p.remove();
        if (!resolved && i === actualCount - 1) {
          resolved = true;
          resolve();
        }
      };
    }
  });
}

/* ------------------------------------------------------------------ */
/* Contagem animada de número com ticks                               */
/* ------------------------------------------------------------------ */
export function countUp(el, to, { duration = 500, from = 0, onTick } = {}) {
  if (!el) return Promise.resolve();

  if (!fxEnabled() || isReducedMotion() || duration <= 0) {
    el.textContent = String(to);
    if (typeof onTick === 'function') {
      try { onTick(1); } catch { /* noop */ }
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const delta = to - from;
    let lastValue = from;
    let tickCount = 0;
    const startTime = performance.now();

    function step(now) {
      if (!el.isConnected) {
        resolve();
        return;
      }

      const elapsed = now - startTime;
      const progress = clamp01(elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = Math.round(from + delta * eased);

      if (current !== lastValue) {
        lastValue = current;
        el.textContent = String(current);
        if (typeof onTick === 'function' && tickCount < 25) {
          tickCount++;
          try {
            onTick(progress);
          } catch { /* áudio opcional */ }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = String(to);
        resolve();
      }
    }

    el.textContent = String(from);
    requestAnimationFrame(step);
  });
}

