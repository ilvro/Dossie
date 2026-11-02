/**
 * pavor-fx.js
 * Efeitos visuais e sonoros do Dado de Pavor no dock flutuante:
 * - Materialização com fumaça cósmica/paranormal.
 * - Troca de passo (d6 → d8 → d10 → d12) com flip 3D e transformação.
 * - Controle com fluxo de partículas de PD, encolhimento e dissipação.
 * - Abraço do pavor com flash carmesim e pulso contínuo.
 */
import { getFxLayer, rectOf, burst, fxEnabled } from './ui-fx.js';
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
 * Som suave descendente ao dissipar completamente o pavor.
 */
function playDissipateSound(audioCtx) {
  try {
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, t0);
    osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t0);
    filter.frequency.exponentialRampToValueAtTime(200, t0 + 0.45);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.045, t0 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.47);
  } catch {}
}

/**
 * Som sutil e calmo ao controlar o pavor reduzindo o passo.
 */
function playCalmSound(audioCtx) {
  try {
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, t0); // D5
    osc.frequency.exponentialRampToValueAtTime(440, t0 + 0.35); // A4

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.04, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.36);
  } catch {}
}

/**
 * Som grave profundo + acorde menor curto ao abraçar o pavor.
 */
function playEmbraceSound(audioCtx) {
  try {
    const t0 = audioCtx.currentTime;

    // Sub-grave
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65.4, t0); // C2
    subOsc.frequency.exponentialRampToValueAtTime(50, t0 + 0.7);

    subGain.gain.setValueAtTime(0.0001, t0);
    subGain.gain.linearRampToValueAtTime(0.075, t0 + 0.03);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);
    subOsc.start(t0);
    subOsc.stop(t0 + 0.72);

    // Acorde menor tenso (D3, F3, A3, C#4)
    const freqs = [146.83, 174.61, 220.0, 277.18];
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, t0);
    filter.frequency.exponentialRampToValueAtTime(250, t0 + 0.6);

    const chordGain = audioCtx.createGain();
    chordGain.gain.setValueAtTime(0.0001, t0);
    chordGain.gain.linearRampToValueAtTime(0.045, t0 + 0.04);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.65);

    freqs.forEach(f => {
      const o = audioCtx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t0);
      o.connect(filter);
      o.start(t0);
      o.stop(t0 + 0.68);
    });

    filter.connect(chordGain);
    chordGain.connect(audioCtx.destination);
  } catch {}
}

/**
 * Cria nuvem de fumaça cósmica roxa/paranormal ao materializar ou dissipar o dado.
 */
export function pavorSmokeBurst(rect, { dissipate = false } = {}) {
  if (!rect || !fxEnabled()) return;
  const layer = getFxLayer();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const colors = dissipate
    ? ['#a855f7', '#c4b5fd', '#7c3aed', '#9333ea', '#6b21a8']
    : ['#7c3aed', '#a855f7', '#1a0b2e', '#9333ea', '#581c87'];
  const count = dissipate ? 18 : 14;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'pavor-smoke-particle';
    const s = dissipate ? rand(16, 32) : rand(20, 36);
    p.style.width = `${s}px`;
    p.style.height = `${s}px`;
    const col = colors[Math.floor(Math.random() * colors.length)];
    p.style.background = `radial-gradient(circle, ${col} 0%, rgba(26,11,46,0.6) 55%, transparent 75%)`;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    layer.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = dissipate ? rand(24, 64) : rand(12, 48);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (dissipate ? rand(5, 20) : rand(15, 35));
    const life = dissipate ? rand(750, 1100) : rand(650, 1000);

    const anim = p.animate([
      { transform: 'translate(-50%, -50%) scale(0.35)', opacity: dissipate ? 0.8 : 0.95 },
      { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.7}px)) scale(${dissipate ? 1.4 : 1.2})`, opacity: dissipate ? 0.6 : 0.8, offset: 0.4 },
      { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy * 1.3}px)) scale(${dissipate ? 1.8 : 1.6})`, opacity: 0 }
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
 * @param {Object} [options] - Opções extras (sound: true | 'calm' | false)
 */
export function pavorStepFx(from, to, { sound = true } = {}) {
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
    if (audioCtx) {
      if (sound === true) playGrowl(audioCtx);
      else if (sound === 'calm') playCalmSound(audioCtx);
    }
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

/**
 * Controlar o pavor com sucesso quando o dado ainda permanece ativo:
 * Encolhe (scale 1 -> 0.6 -> 1), realiza a troca de passo em 3D e solta burst lilás.
 */
export function controlPavorFx(prevSides, nextSides, oldRect) {
  if (!fxEnabled()) return;
  const dockDie = document.querySelector('.pavor-dock-die');
  if (dockDie) {
    dockDie.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.6)', offset: 0.4 },
      { transform: 'scale(1)' }
    ], {
      duration: 380,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });

    pavorStepFx(prevSides, nextSides, { sound: 'calm' });

    const rect = rectOf(dockDie) || oldRect;
    if (rect) {
      burst(rect, { color: '#c4b5fd', count: 8, spread: 25, life: 500 });
    }
  }
}

/**
 * Dissipação completa do dado de pavor (quando passa de d6 para null):
 * Fumaça cósmica dissipando, burst lilás suave e som suave descendente.
 */
export function pavorDissipateFx(rect) {
  if (!fxEnabled() || !rect) return;
  const audioCtx = getAudioCtx();
  if (audioCtx) playDissipateSound(audioCtx);
  pavorSmokeBurst(rect, { dissipate: true });
  burst(rect, { color: '#c4b5fd', count: 12, spread: 32, life: 650 });
}

/**
 * Abraçar o pavor:
 * Flash vermelho (#f43f5e), burst carmesim e som grave com acorde menor.
 */
export function embracePavorFx(targetRect) {
  if (!fxEnabled()) return;
  const audioCtx = getAudioCtx();
  if (audioCtx) playEmbraceSound(audioCtx);

  const dockDie = document.querySelector('.pavor-dock-die');
  const rect = rectOf(dockDie) || targetRect;

  if (dockDie) {
    dockDie.animate([
      { filter: 'drop-shadow(0 0 25px #f43f5e) brightness(2.2) saturate(1.8)', transform: 'scale(1.2)' },
      { filter: 'drop-shadow(0 0 14px rgba(244, 63, 94, 1)) brightness(1)', transform: 'scale(1)' }
    ], {
      duration: 450,
      easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)'
    });
  }

  if (rect) {
    burst(rect, { color: '#f43f5e', count: 14, spread: 35, life: 600 });
  }
}
