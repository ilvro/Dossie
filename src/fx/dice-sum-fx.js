/**
 * src/fx/dice-sum-fx.js
 * HUD da cena de rolagem (modo "CENA DE ROLAGEM"):
 * - antecipação: título do teste e a fórmula (dados + bônus) antes de rolar;
 * - soma cinemática: cada valor sai do dado, voa até o total e soma;
 * - selo: o total pousa com peso, seguido do veredito (crítico, falha, pavor).
 * Tudo vive dentro do #dice-stage e é removido em destroy().
 */
import { clamp01, easeInCubic, easeOutCubic } from './dice-fx-primitives.js';

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

const signed = value => `${value < 0 ? '−' : '+'}${Math.abs(value)}`;

// Fórmula da antecipação: "d8 PERÍCIA + d10 FÍSICO + 2 EXTRA"; dados iguais sem rótulo viram "3d20".
function formulaHtml(configs, modifierParts, rollMode) {
  const groups = [];
  configs.forEach(config => {
    const label = config.label || '';
    const last = groups[groups.length - 1];
    if (last && !label && !last.label && last.sides === config.sides && !config.dread) last.count++;
    else groups.push({ sides: config.sides, label, count: 1, dread: config.dread, color: config.color });
  });
  const dice = groups.filter(group => !group.dread).map(group => `<span class="rh-term" style="--term-color:${safe(group.color || '#fff')}"><b>${group.count > 1 ? group.count : ''}d${group.sides}</b>${group.label ? `<small>${safe(group.label)}</small>` : ''}</span>`);
  const mods = modifierParts.filter(part => part.value).map(part => `<span class="rh-term mod"><b>${signed(part.value)}</b><small>${safe(part.label)}</small></span>`);
  const dread = groups.filter(group => group.dread).map(group => `<span class="rh-term dread"><b>☠ d${group.sides}</b><small>${safe(group.label || 'PAVOR')}</small></span>`);
  const pick = rollMode === 'highest' ? '<span class="rh-pick">MAIOR</span>' : rollMode === 'lowest' ? '<span class="rh-pick">MENOR</span>' : '';
  // Bônus já trazem o sinal: o "+" só separa dados
  const terms = [...dice, ...mods].map((html, i) => (i > 0 && i < dice.length ? '<i>+</i>' : '') + html);
  return pick + terms.join('') + (dread.length ? `<i class="rh-vs">vs</i>${dread.join('')}` : '');
}

function playStampSound(audio) {
  if (!audio) return;
  try {
    const now = audio.currentTime;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + .28);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.22, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .42);
    osc.connect(gain).connect(audio.destination);
    osc.start(now); osc.stop(now + .45);
    const bell = audio.createOscillator(), bellGain = audio.createGain();
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(1046, now + .02);
    bellGain.gain.setValueAtTime(.0001, now + .02);
    bellGain.gain.exponentialRampToValueAtTime(.035, now + .03);
    bellGain.gain.exponentialRampToValueAtTime(.0001, now + .7);
    bell.connect(bellGain).connect(audio.destination);
    bell.start(now + .02); bell.stop(now + .72);
  } catch { /* áudio é opcional */ }
}

function playFumbleStampSound(audio) {
  if (!audio) return;
  try {
    const now = audio.currentTime;
    // 1. Sino fúnebre dissonante (trítono: 110Hz e 155.6Hz decrescendo)
    [110, 155.6].forEach((freq, idx) => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, now + 1.2);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      osc.connect(gain).connect(audio.destination);
      osc.start(now); osc.stop(now + 1.35);
    });

    // 2. Estalo oco de fratura metálica
    const length = Math.floor(audio.sampleRate * 0.18);
    const buf = audio.createBuffer(1, length, audio.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    const snap = audio.createBufferSource(), filter = audio.createBiquadFilter(), snapGain = audio.createGain();
    snap.buffer = buf;
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(450, now); filter.Q.value = 2.5;
    snapGain.gain.setValueAtTime(0.14, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    snap.connect(filter).connect(snapGain).connect(audio.destination);
    snap.start(now); snap.stop(now + 0.18);

    // 3. Sub-grave oco descendente
    const sub = audio.createOscillator(), subGain = audio.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(65, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 0.9);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.24, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    sub.connect(subGain).connect(audio.destination);
    sub.start(now); sub.stop(now + 1.05);
  } catch { /* áudio é opcional */ }
}

function playDreadConsumedStampSound(audio) {
  if (!audio) return;
  try {
    const now = audio.currentTime;
    // 1. Drone abissal profundo (colapso no vazio)
    const drone = audio.createOscillator(), sub = audio.createOscillator(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    drone.type = 'sawtooth'; sub.type = 'sine';
    drone.frequency.setValueAtTime(58, now); drone.frequency.exponentialRampToValueAtTime(26, now + 1.4);
    sub.frequency.setValueAtTime(42, now); sub.frequency.exponentialRampToValueAtTime(18, now + 1.5);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(320, now); filter.frequency.exponentialRampToValueAtTime(60, now + 1.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    drone.connect(filter); sub.connect(filter); filter.connect(gain).connect(audio.destination);
    drone.start(now); sub.start(now); drone.stop(now + 1.55); sub.stop(now + 1.55);

    // 2. Chiado espectral fantasmagórico
    const len = Math.floor(audio.sampleRate * 0.9);
    const buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
    const wind = audio.createBufferSource(), bp = audio.createBiquadFilter(), wg = audio.createGain();
    wind.buffer = buf;
    bp.type = 'bandpass'; bp.Q.value = 3.0;
    bp.frequency.setValueAtTime(480, now); bp.frequency.exponentialRampToValueAtTime(140, now + 0.8);
    wg.gain.setValueAtTime(0.0001, now);
    wg.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    wind.connect(bp).connect(wg).connect(audio.destination);
    wind.start(now); wind.stop(now + 0.9);
  } catch { /* áudio é opcional */ }
}

function playWhoosh(audio, strength = 1) {
  if (!audio) return;
  try {
    const now = audio.currentTime, length = Math.floor(audio.sampleRate * .22);
    const buffer = audio.createBuffer(1, length, audio.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / length);
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass'; filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(600, now); filter.frequency.exponentialRampToValueAtTime(2600, now + .2);
    gain.gain.value = .045 * strength;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(now);
  } catch { /* áudio é opcional */ }
}

// Pontos de uma curva quadrática do dado até o total, arqueando para cima.
function arcKeyframes(from, to, steps = 14) {
  const lift = Math.min(160, Math.hypot(to.x - from.x, to.y - from.y) * .35);
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
  const frames = [];
  for (let i = 0; i <= steps; i++) {
    const t = easeInCubic(i / steps), u = 1 - t;
    const x = u * u * from.x + 2 * u * t * control.x + t * t * to.x;
    const y = u * u * from.y + 2 * u * t * control.y + t * t * to.y;
    const scale = 1 - .45 * (i / steps);
    frames.push({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`, opacity: i === steps ? .2 : 1 });
  }
  return frames;
}

export function createRollHud(stage, { title, configs, modifierParts = [], rollMode = 'sum', audio = null, onOpenLog } = {}) {
  const root = document.createElement('div');
  root.className = 'roll-hud';
  root.innerHTML = `
    <header class="rh-head">
      <span class="rh-orn" aria-hidden="true"></span>
      <h2 class="rh-title">${safe(title)}</h2>
      <div class="rh-formula">${formulaHtml(configs, modifierParts, rollMode)}</div>
    </header>
    <div class="rh-chips" aria-hidden="true"></div>
    <section class="rh-result">
      <div class="rh-prompt"><b>PEGUE OS DADOS E ARREMESSE</b><small class="rh-prompt-fine">ARRASTE E SOLTE · CLIQUE OU ESPAÇO PARA ROLAR</small><small class="rh-prompt-touch">ARRASTE E SOLTE · TOQUE PARA ROLAR</small></div>
      <div class="rh-total-wrap"><i class="rh-ring" aria-hidden="true"></i><strong class="rh-total idle">0</strong></div>
      <div class="rh-breakdown"></div>
      <div class="rh-verdict"></div>
    </section>
    <footer class="rh-foot">
      <span class="rh-hint">CLIQUE PARA PULAR</span>
      <button type="button" class="rh-log">HISTÓRICO</button>
    </footer>`;
  stage.appendChild(root);
  root.querySelector('.rh-log').addEventListener('click', event => { event.stopPropagation(); onOpenLog?.(); });

  const chipsLayer = root.querySelector('.rh-chips');
  const totalEl = root.querySelector('.rh-total');
  const breakdownEl = root.querySelector('.rh-breakdown');
  const verdictEl = root.querySelector('.rh-verdict');
  const hintEl = root.querySelector('.rh-hint');

  requestAnimationFrame(() => root.classList.add('in'));

  // Posiciona cabeçalho e total a partir das bordas do círculo projetadas na tela.
  function layout({ headBottom, totalTop }) {
    const h = innerHeight;
    const w = innerWidth;
    if (h < 560 || w < 460 || document.body?.dataset?.compacto === '1') {
      root.style.setProperty('--rh-head-bottom', `${Math.round(h - Math.max(76, h * 0.22))}px`);
      root.style.setProperty('--rh-total-top', `${Math.round(Math.min(h - 145, Math.max(h * 0.44, totalTop)))}px`);
    } else {
      root.style.setProperty('--rh-head-bottom', `${Math.round(h - Math.max(130, headBottom))}px`);
      root.style.setProperty('--rh-total-top', `${Math.round(Math.min(h - 210, Math.max(h * .5, totalTop)))}px`);
    }
  }

  let sum = null;

  /**
   * items: [{ kind: 'die'|'mod'|'destroyed'|'discarded'|'dread'|'vanquished', value, label, color, index }]
   * project(index) → {x, y} do dado na tela; onLaunch(index) quando o valor sai do dado.
   */
  function playSum({ items, total, quick = false, instant = false, project, onLaunch, onTick, verdict, onStamp }) {
    let shown = 0, target = 0, pending = 0, stamped = false, skipped = false, raf = 0, lastTickValue = 0;
    const earliestStamp = performance.now() + (items.some(item => item.kind !== 'die' && item.kind !== 'mod') ? 750 : 0);
    const timers = [];
    let resolveDone;
    const done = new Promise(resolve => { resolveDone = resolve; });
    const adding = items.filter(item => item.kind === 'die' || item.kind === 'mod');
    const passive = items.filter(item => !adding.includes(item));
    const totalPoint = () => {
      const rect = totalEl.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    // Lugares reservados na ordem da fórmula; cada um aparece quando seu valor chega.
    breakdownEl.replaceChildren();
    adding.forEach((item, i) => {
      const slot = document.createElement('span');
      slot.className = `rh-part ${item.kind} pending`;
      slot.style.setProperty('--part-color', item.color || '#fff');
      const sep = i > 0 && item.kind !== 'mod' ? '<i>+</i>' : '';
      slot.innerHTML = `${sep}<b>${item.kind === 'mod' ? signed(item.value) : item.value}</b><small>${safe(item.label)}</small>`;
      breakdownEl.appendChild(slot);
      item.slot = slot;
    });
    const addBreakdown = item => item.slot.classList.remove('pending');

    // Um único laço aproxima o número mostrado do alvo: chegadas sobrepostas não brigam.
    function tween() {
      if (shown !== target) {
        const step = Math.sign(target - shown) * Math.max(1, Math.round(Math.abs(target - shown) * .28));
        shown = Math.abs(target - shown) <= Math.abs(step) ? target : shown + step;
        totalEl.textContent = String(shown);
        if (shown !== lastTickValue) { lastTickValue = shown; onTick?.(clamp01(Math.abs(shown) / Math.max(1, Math.abs(total)))); }
      }
      if (!pending && shown === target && !stamped && performance.now() >= earliestStamp) { stamp(); return; }
      raf = requestAnimationFrame(tween);
    }

    function arrive(item) {
      totalEl.classList.remove('idle', 'bump');
      void totalEl.offsetWidth;
      totalEl.classList.add('bump');
      target += item.value;
      addBreakdown(item);
      pending--;
    }

    function stamp() {
      stamped = true;
      totalEl.textContent = String(total);
      totalEl.classList.remove('idle', 'bump');
      void totalEl.offsetWidth;
      totalEl.classList.add('stamp');
      root.classList.add('stamped');
      if (verdict?.crit) root.classList.add('crit');
      if (verdict?.fumble) root.classList.add('fumble');
      if (verdict?.dreadConsumedAll) root.classList.add('dread-consumed');
      verdictEl.innerHTML = verdict?.html || '';
      hintEl.textContent = 'CLIQUE PARA FECHAR';
      if (verdict?.fumble) {
        playFumbleStampSound(audio);
      } else if (verdict?.dreadConsumedAll) {
        playDreadConsumedStampSound(audio);
      } else {
        playStampSound(audio);
      }
      onStamp?.();
      resolveDone();
    }

    function popChip(item, cls) {
      const chip = document.createElement('div');
      chip.className = `rh-chip ${cls}`;
      chip.style.setProperty('--chip-color', item.color || '#fff');
      const prefix = item.kind === 'dread' ? '☠ ' : item.kind === 'vanquished' ? '✦ ' : '';
      chip.innerHTML = `<b>${prefix}${item.kind === 'mod' ? signed(item.value) : item.value}</b><small>${safe(item.label)}</small>`;
      chipsLayer.appendChild(chip);
      return chip;
    }

    function launchDie(item, delay) {
      timers.push(setTimeout(() => {
        if (skipped) return;
        const from = project(item.index);
        const start = { x: from.x, y: from.y - 34 };
        const chip = popChip(item, 'die');
        onLaunch?.(item.index);
        chip.animate([
          { transform: `translate(${from.x}px, ${from.y}px) translate(-50%, -50%) scale(.3)`, opacity: 0 },
          { transform: `translate(${start.x}px, ${start.y}px) translate(-50%, -50%) scale(1.15)`, opacity: 1, offset: .7 },
          { transform: `translate(${start.x}px, ${start.y}px) translate(-50%, -50%) scale(1)`, opacity: 1 }
        ], { duration: quick ? 120 : 170, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'forwards' }).onfinish = () => {
          if (skipped) return;
          playWhoosh(audio, quick ? .5 : 1);
          const fly = chip.animate(arcKeyframes(start, totalPoint()), { duration: quick ? 260 : 320, delay: quick ? 0 : 70, fill: 'forwards' });
          fly.onfinish = () => { chip.remove(); if (!skipped) arrive(item); };
        };
      }, delay));
    }

    function launchMod(item, delay) {
      timers.push(setTimeout(() => {
        if (skipped) return;
        const end = totalPoint(), start = { x: end.x + Math.min(220, innerWidth * .2), y: end.y };
        const chip = popChip(item, 'mod');
        chip.animate([
          { transform: `translate(${start.x}px, ${start.y}px) translate(-50%, -50%) scale(.6)`, opacity: 0 },
          { transform: `translate(${start.x - 30}px, ${start.y}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: .35 },
          { transform: `translate(${end.x}px, ${end.y}px) translate(-50%, -50%) scale(.55)`, opacity: .2 }
        ], { duration: quick ? 260 : 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).onfinish = () => {
          chip.remove(); if (!skipped) arrive(item);
        };
      }, delay));
    }

    // Itens que não somam: aparecem juntos sobre o dado e somem cada um do seu jeito.
    function showPassive(item) {
      const from = project(item.index);
      const chip = popChip(item, item.kind);
      const at = (dy, scale) => `translate(${from.x}px, ${from.y + dy}px) translate(-50%, -50%) scale(${scale})`;
      const exits = {
        destroyed: [{ transform: at(-34, 1), opacity: 1, filter: 'blur(0)' }, { transform: at(-40, 1.5), opacity: 0, filter: 'blur(6px)' }],
        discarded: [{ transform: at(-34, 1), opacity: .7 }, { transform: at(-6, .9), opacity: 0 }],
        dread: [{ transform: at(-34, 1), opacity: 1 }, { transform: at(-70, .9), opacity: 0 }],
        vanquished: [{ transform: at(-34, 1), opacity: 1 }, { transform: at(-70, 1.1), opacity: 0 }]
      };
      chip.animate([{ transform: at(0, .3), opacity: 0 }, { transform: at(-34, 1.1), opacity: 1, offset: .7 }, { transform: at(-34, 1), opacity: 1 }], { duration: 170, fill: 'forwards' }).onfinish = () => {
        chip.animate(exits[item.kind] || exits.discarded, { duration: item.kind === 'destroyed' ? 420 : 520, delay: quick ? 120 : 380, easing: 'ease-in', fill: 'forwards' }).onfinish = () => chip.remove();
      };
    }

    function cancel() {
      skipped = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    }

    function skip() {
      if (stamped) return;
      cancel();
      chipsLayer.replaceChildren();
      adding.forEach(addBreakdown);
      pending = 0; target = shown = total;
      stamp();
    }

    if (instant) {
      skip();
    } else {
      passive.forEach(showPassive);
      pending = adding.length;
      const dice = adding.filter(item => item.kind === 'die'), mods = adding.filter(item => item.kind === 'mod');
      const step = quick ? 45 : Math.max(130, Math.min(230, 560 / Math.max(1, adding.length)));
      const lead = passive.length && !quick ? 260 : 0;
      dice.forEach((item, i) => launchDie(item, lead + i * step));
      const modsStart = lead + dice.length * step + (quick ? 80 : 220);
      mods.forEach((item, i) => launchMod(item, modsStart + i * step));
      raf = requestAnimationFrame(tween);
    }

    sum = { done, skip, cancel, get stamped() { return stamped; } };
    return sum;
  }

  function destroy() {
    sum?.cancel();
    root.remove();
  }

  // Fase de arremesso manual: o convite ocupa o lugar do total
  function setHolding(holding) {
    root.classList.toggle('holding', holding);
  }

  return { root, layout, playSum, setHolding, destroy, get sum() { return sum; } };
}
