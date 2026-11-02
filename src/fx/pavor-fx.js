/**
 * pavor-fx.js
 * Efeitos visuais e sonoros do Dado de Pavor no dock flutuante:
 * - Materialização com fumaça cósmica/paranormal.
 * - Troca de passo (d6 → d8 → d10 → d12) com flip 3D e transformação.
 */
import { getFxLayer, rectOf, fxEnabled } from './ui-fx.js';
import { playGrowl } from '../dice-dread-fx.js';
import { die } from '../dice-icon.js';
import { rand } from './dice-fx-primitives.js';

function getAudioCtx() {
  const Context = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Context) return null;
  window.__ordemUiAudioCtx ??= new Context();
  window.__ordemUiAudioCtx.resume?.().catch(() => {});
  return window.__ordemUiAudioCtx;
}

/**
 * Cria nuvem de fumaça cósmica roxa/paranormal ao materializar o dado.
 */
function pavorSmokeBurst(rect) {
  if (!rect || !fxEnabled()) return;
  const layer = getFxLayer();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const colors = ['#7c3aed', '#a855f7', '#1a0b2e', '#9333ea', '#581c87'];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'pavor-smoke-particle';
    const s = rand(20, 36);
    p.style.width = `${s}px`;
    p.style.height = `${s}px`;
    const col = colors[Math.floor(Math.random() * colors.length)];
    p.style.background = `radial-gradient(circle, ${col} 0%, rgba(26,11,46,0.6) 55%, transparent 75%)`;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    layer.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = rand(12, 48);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - rand(15, 35); // sobe como fumaça
    const life = rand(650, 1000);

    const anim = p.animate([
      { transform: 'translate(-50%, -50%) scale(0.35)', opacity: 0.95 },
      { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.7}px)) scale(1.2)`, opacity: 0.8, offset: 0.4 },
      { transform: `translate(calc(-50% + ${dx * 1.25}px), calc(-50% + ${dy * 1.25}px)) scale(1.6)`, opacity: 0 }
    ], {
      duration: life,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });

    anim.onfinish = () => p.remove();
  }
}

/**
 * Dispara o efeito de transição ou materialização do dado de pavor.
 * @param {number|null} from - Passo anterior (null se não existia)
 * @param {number|null} to - Novo passo (null se removido)
 */
export function pavorStepFx(from, to) {
  if (!fxEnabled() || from === to) return;

  const dockDie = document.querySelector('.pavor-dock-die');
  const dockContainer = document.querySelector('.dock-pavor-active') || document.querySelector('.vigilia-floating-dock');
  const targetRect = rectOf(dockDie) || rectOf(dockContainer);

  const audioCtx = getAudioCtx();

  // Caso 1: Ganhou o dado (materializar)
  if (!from && to) {
    if (audioCtx) playGrowl(audioCtx);
    pavorSmokeBurst(targetRect);

    if (dockDie) {
      dockDie.classList.remove('materialize');
      void dockDie.offsetWidth;
      dockDie.classList.add('materialize');
      setTimeout(() => dockDie?.classList.remove('materialize'), 750);
    }
    return;
  }

  // Caso 2: Troca de passo (aumentou ou diminuiu)
  if (from && to && dockDie) {
    if (audioCtx) playGrowl(audioCtx);
    pavorSmokeBurst(targetRect);

    const newDieSvg = dockDie.querySelector('.die-svg');
    const label = dockDie.querySelector('.pavor-dock-label');

    if (label) {
      label.classList.remove('pip-pop');
      void label.offsetWidth;
      label.classList.add('pip-pop');
      setTimeout(() => label?.classList.remove('pip-pop'), 500);
    }

    if (newDieSvg) {
      // Cria o SVG anterior sobreposto para fazer a troca em 3D
      const wrapper = document.createElement('div');
      wrapper.innerHTML = die(from, 'micro', true);
      const oldDieSvg = wrapper.firstElementChild;
      if (oldDieSvg) {
        oldDieSvg.classList.add('pavor-morph-old');
        newDieSvg.classList.add('pavor-morph-new');

        dockDie.style.position = 'relative';
        dockDie.appendChild(oldDieSvg);

        const isUpgrade = to > from;
        const dur = 400;

        // O antigo gira e encolhe
        const animOld = oldDieSvg.animate([
          { transform: 'rotateY(0deg) scale(1)', opacity: 1 },
          { transform: `rotateY(${isUpgrade ? 90 : -90}deg) scale(0.75)`, opacity: 0 }
        ], {
          duration: dur * 0.6,
          easing: 'ease-in',
          fill: 'forwards'
        });

        // O novo entra girando a partir do ângulo oposto
        const animNew = newDieSvg.animate([
          { transform: `rotateY(${isUpgrade ? -90 : 90}deg) scale(1.25)`, opacity: 0 },
          { transform: 'rotateY(0deg) scale(1)', opacity: 1 }
        ], {
          duration: dur * 0.6,
          delay: dur * 0.4,
          easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          fill: 'forwards'
        });

        animOld.onfinish = () => oldDieSvg.remove();
        animNew.onfinish = () => {
          newDieSvg.classList.remove('pavor-morph-new');
        };
      }
    }
  }
}

