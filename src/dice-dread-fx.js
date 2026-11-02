/**
 * dice-dread-fx.js
 * Sequência cinematográfica do Dado de Pavor (Contos da Vigília).
 * - O dado de pavor se ergue, gira e carrega energia.
 * - Raios atingem cada dado de valor MENOR, que se estilhaça em fragmentos
 *   e se desintegra em cinzas/brasas roxas.
 * - Se o dado de pavor tirar 1, ele próprio se despedaça em luz dourada (pavor vencido).
 */
import * as THREE from 'three';
import {
  FLOOR_Y,
  clamp01,
  easeOutCubic,
  easeInCubic,
  easeInOutCubic,
  rand,
  noise,
  getDotTexture,
  createShards,
  createDust,
  createShockwave
} from './fx/dice-fx-primitives.js';

const DREAD = new THREE.Color('#a855f7');
const DREAD_HOT = new THREE.Color('#f0abfc');
const ASH = new THREE.Color('#1a0b2e');
const GOLD = new THREE.Color('#fde68a');
const GOLD_HOT = new THREE.Color('#fffbeb');
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/* ------------------------------------------------------------------ */
/* Áudio sintetizado                                                   */
/* ------------------------------------------------------------------ */
function playCharge(ctx, duration = .55) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(), sub = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth'; sub.type = 'sine';
    osc.frequency.setValueAtTime(48, now); osc.frequency.exponentialRampToValueAtTime(140, now + duration);
    sub.frequency.setValueAtTime(36, now); sub.frequency.exponentialRampToValueAtTime(70, now + duration);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(180, now); filter.frequency.exponentialRampToValueAtTime(1400, now + duration);
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.09, now + duration * .85); gain.gain.exponentialRampToValueAtTime(.0001, now + duration + .12);
    osc.connect(filter); sub.connect(filter); filter.connect(gain).connect(ctx.destination);
    osc.start(now); sub.start(now); osc.stop(now + duration + .15); sub.stop(now + duration + .15);
    // chiado crescente
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
    src.buffer = noise(ctx); hp.type = 'highpass'; hp.frequency.value = 2400;
    ng.gain.setValueAtTime(.0001, now); ng.gain.exponentialRampToValueAtTime(.035, now + duration); ng.gain.exponentialRampToValueAtTime(.0001, now + duration + .08);
    src.connect(hp).connect(ng).connect(ctx.destination); src.start(now); src.stop(now + duration + .1);
  } catch { /* áudio é opcional */ }
}

function playShatter(ctx, intensity = 1) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // estalo do raio
    const zap = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), zg = ctx.createGain();
    zap.buffer = noise(ctx); bp.type = 'bandpass'; bp.Q.value = .8;
    bp.frequency.setValueAtTime(5200, now); bp.frequency.exponentialRampToValueAtTime(900, now + .16);
    zg.gain.setValueAtTime(.22 * intensity, now); zg.gain.exponentialRampToValueAtTime(.0001, now + .22);
    zap.connect(bp).connect(zg).connect(ctx.destination); zap.start(now); zap.stop(now + .25);
    // cristais quebrando
    for (let i = 0; i < 5; i++) {
      const t = now + .02 + i * rand(.012, .03);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(rand(1800, 4200), t); o.frequency.exponentialRampToValueAtTime(rand(500, 900), t + .09);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.03 * intensity, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .12);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .13);
    }
    // impacto grave
    const boom = ctx.createOscillator(), bg = ctx.createGain();
    boom.type = 'sine'; boom.frequency.setValueAtTime(110, now); boom.frequency.exponentialRampToValueAtTime(32, now + .35);
    bg.gain.setValueAtTime(.0001, now); bg.gain.exponentialRampToValueAtTime(.16 * intensity, now + .01); bg.gain.exponentialRampToValueAtTime(.0001, now + .45);
    boom.connect(bg).connect(ctx.destination); boom.start(now); boom.stop(now + .48);
    // poeira se desfazendo
    const dust = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), dg = ctx.createGain();
    dust.buffer = noise(ctx); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, now + .05); lp.frequency.exponentialRampToValueAtTime(300, now + .9);
    dg.gain.setValueAtTime(.0001, now + .04); dg.gain.exponentialRampToValueAtTime(.05 * intensity, now + .1); dg.gain.exponentialRampToValueAtTime(.0001, now + .95);
    dust.connect(lp).connect(dg).connect(ctx.destination); dust.start(now + .04); dust.stop(now + 1);
  } catch { /* áudio é opcional */ }
}

function playVanquished(ctx) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const t = now + i * .055, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.15);
    });
    playShatter(ctx, .55);
  } catch { /* áudio é opcional */ }
}

export function playGrowl(ctx) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70, now); o.frequency.exponentialRampToValueAtTime(42, now + .5);
    f.type = 'lowpass'; f.frequency.value = 260;
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.07, now + .06); g.gain.exponentialRampToValueAtTime(.0001, now + .6);
    o.connect(f).connect(g).connect(ctx.destination); o.start(now); o.stop(now + .62);
  } catch { /* áudio é opcional */ }
}

/* ------------------------------------------------------------------ */
/* Primitivas visuais                                                  */
/* ------------------------------------------------------------------ */

/** Raio arqueado e tremido entre dois pontos. */
function createBolt(scene, getFrom, getTo, { life = .3, color = DREAD } = {}) {
  const SEG = 18;
  const strands = [
    { color: new THREE.Color('#ffffff'), amp: .14, opacity: 1 },
    { color, amp: .32, opacity: .85 },
    { color: DREAD_HOT, amp: .45, opacity: .55 }
  ].map(cfg => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    scene.add(line);
    return { ...cfg, geo, mat, line };
  });
  const tmp = new THREE.Vector3(), side = new THREE.Vector3();
  let elapsed = 0;
  return {
    update(dt) {
      elapsed += dt;
      const t = elapsed / life;
      if (t >= 1) { strands.forEach(s => scene.remove(s.line)); return false; }
      const from = getFrom(), to = getTo();
      const dir = to.clone().sub(from);
      side.crossVectors(dir, Y_AXIS).normalize();
      // o raio "cresce" do dado de pavor até o alvo nos primeiros 30% da vida
      const reach = easeOutCubic(t / .3);
      strands.forEach(s => {
        const arr = s.geo.attributes.position.array;
        for (let i = 0; i <= SEG; i++) {
          const k = (i / SEG) * reach, env = Math.sin(Math.PI * (i / SEG));
          tmp.copy(from).addScaledVector(dir, k);
          tmp.y += Math.sin(Math.PI * k) * .7;
          tmp.addScaledVector(side, rand(-1, 1) * s.amp * env);
          tmp.y += rand(-1, 1) * s.amp * env * .6;
          arr[i * 3] = tmp.x; arr[i * 3 + 1] = tmp.y; arr[i * 3 + 2] = tmp.z;
        }
        s.geo.attributes.position.needsUpdate = true;
        s.mat.opacity = s.opacity * (Math.random() > .18 ? 1 : .25) * (1 - easeInCubic(t));
      });
      return true;
    },
    dispose() { strands.forEach(s => { scene.remove(s.line); s.geo.dispose(); s.mat.dispose(); }); }
  };
}

/* ------------------------------------------------------------------ */
/* Orquestrador                                                        */
/* ------------------------------------------------------------------ */
/**
 * @param {object} opts
 * @param {THREE.Scene} opts.scene
 * @param {THREE.Camera} opts.camera
 * @param {Array} opts.dice              dados ({ mesh, ... }) já parados
 * @param {number} opts.dreadIndex
 * @param {number[]} opts.victims        índices destruídos pelo pavor
 * @param {boolean} opts.vanquished      dado de pavor tirou 1
 * @param {object} opts.lights           { hemi, key }
 * @param {AudioContext} opts.audio
 * @param {boolean} opts.reducedMotion
 * @param {Function} opts.onImpact       chamado a cada impacto (para efeitos no DOM)
 * @param {Function} opts.onReveal       chamado quando o resultado deve aparecer
 */
export function createDreadSequence({ scene, camera, dice, dreadIndex, victims, vanquished, lights, audio, reducedMotion, onImpact, onReveal }) {
  const speed = reducedMotion ? .55 : 1;
  const dread = dice[dreadIndex];
  const dreadMat = dread.mesh.material;
  const basePos = dread.mesh.position.clone();
  const baseQuat = dread.mesh.quaternion.clone();
  const baseCam = camera.position.clone();
  const baseHemi = lights.hemi.intensity, baseKey = lights.key.intensity;
  const victimData = victims.map(index => ({ die: dice[index], base: dice[index].mesh.position.clone(), destroyed: false }));

  const aura = new THREE.PointLight(vanquished ? GOLD : DREAD, 0, 6, 1.6);
  aura.position.copy(basePos); scene.add(aura);
  const flash = new THREE.PointLight(DREAD_HOT, 0, 8, 1.4);
  scene.add(flash);

  const effects = [];
  let shake = 0, spinAngle = 0, revealed = false, done = false, start = 0, last = 0;
  const events = [];
  const at = (ms, fn) => events.push({ ms: ms * speed, fn, fired: false });
  const reveal = () => { if (!revealed) { revealed = true; onReveal?.(); } };

  // Linha do tempo -------------------------------------------------------
  let CHARGE, END, LIFT, descendStart, descendEnd;
  if (vanquished) {
    CHARGE = 720; LIFT = .7; descendStart = Infinity; descendEnd = Infinity;
    at(0, () => playCharge(audio, .7 * speed));
    at(CHARGE, () => {
      const origin = dread.mesh.getWorldPosition(new THREE.Vector3());
      effects.push(createShards(scene, dread.mesh, { emissive: GOLD, ashColor: GOLD_HOT, speed: 4.2, lift: 3, life: 1.2, gravity: 3 }));
      effects.push(createDust(scene, origin, { count: 220, colors: [GOLD, GOLD_HOT, new THREE.Color('#fbbf24')], rise: 2.6, speed: 2.4, life: 1.6, size: .11 }));
      effects.push(createShockwave(scene, origin, { color: GOLD, maxScale: 16, life: .8 }));
      scene.remove(dread.mesh);
      flash.color.copy(GOLD); flash.position.copy(origin); flash.intensity = 30;
      shake = reducedMotion ? 0 : .12;
      playVanquished(audio);
      onImpact?.('vanquished');
    });
    at(CHARGE + 260, reveal);
    END = CHARGE + 1500;
  } else if (victims.length) {
    CHARGE = 560; LIFT = .6;
    const STAGGER = 230;
    at(0, () => playCharge(audio, .56 * speed));
    victimData.forEach((v, k) => {
      const strike = CHARGE + k * STAGGER;
      const victimPos = () => v.die.mesh.getWorldPosition(new THREE.Vector3());
      at(strike - 90, () => effects.push(createBolt(scene, () => dread.mesh.getWorldPosition(new THREE.Vector3()), victimPos, { life: .32 * speed })));
      at(strike, () => {
        const origin = victimPos();
        const push = origin.clone().sub(basePos).setY(0).normalize().multiplyScalar(2.2);
        effects.push(createShards(scene, v.die.mesh, { emissive: DREAD, ashColor: ASH, push }));
        effects.push(createDust(scene, origin, {}));
        effects.push(createShockwave(scene, origin));
        scene.remove(v.die.mesh);
        v.destroyed = true;
        flash.color.copy(DREAD_HOT); flash.position.copy(origin).setY(origin.y + .4); flash.intensity = 26;
        shake = reducedMotion ? 0 : .1;
        playShatter(audio);
        onImpact?.('shatter');
      });
    });
    const lastStrike = CHARGE + (victims.length - 1) * STAGGER;
    descendStart = lastStrike + 260; descendEnd = lastStrike + 680;
    at(lastStrike + 420, reveal);
    END = lastStrike + 1250;
  } else {
    // O pavor rugiu, mas ninguém tirou menos que ele.
    CHARGE = 300; LIFT = .3; descendStart = 340; descendEnd = 640;
    at(0, () => playGrowl(audio));
    at(CHARGE, () => effects.push(createShockwave(scene, basePos, { maxScale: 9, life: .55 })));
    at(220, reveal);
    END = 720;
  }
  CHARGE *= speed; END *= speed; descendStart *= speed; descendEnd *= speed;

  function update(now) {
    if (done) return false;
    if (!start) { start = now; last = now; }
    const t = now - start, dt = Math.min(.05, (now - last) / 1000); last = now;

    events.forEach(e => { if (!e.fired && t >= e.ms) { e.fired = true; e.fn(); } });

    // Dado de pavor: sobe, gira, pulsa e desce -----------------------------
    if (dread.mesh.parent) {
      const up = easeOutCubic(t / CHARGE);
      const down = easeInOutCubic((t - descendStart) / Math.max(1, descendEnd - descendStart));
      const lift = LIFT * up * (1 - down);
      const bob = Math.sin(t / 90) * .04 * up * (1 - down);
      const spinSpeed = (vanquished ? 4 : 11) * up * (1 - down);
      spinAngle += spinSpeed * dt;
      dread.mesh.position.copy(basePos).setY(basePos.y + lift + bob);
      if (vanquished) {
        const tremor = easeInCubic(t / CHARGE) * .09;
        dread.mesh.position.x += rand(-1, 1) * tremor; dread.mesh.position.z += rand(-1, 1) * tremor;
      }
      dread.mesh.quaternion.setFromAxisAngle(Y_AXIS, spinAngle).multiply(baseQuat);
      dread.mesh.scale.setScalar(1 + .12 * up * (1 - down) + Math.sin(t / 55) * .03 * up * (1 - down));
      if (dreadMat.emissive) {
        const pulse = .5 + .5 * Math.sin(t / 45);
        if (vanquished) dreadMat.emissive.copy(Math.random() > .5 ? DREAD : GOLD);
        else dreadMat.emissive.copy(DREAD).lerp(DREAD_HOT, pulse * up);
        dreadMat.emissiveIntensity = .35 + (1.4 + pulse) * up * (1 - down * .75);
      }
      aura.position.copy(dread.mesh.position);
      aura.intensity = 9 * up * (1 - down * .7) * (.8 + .2 * Math.sin(t / 40));
    }

    // Vítimas tremem antes de serem atingidas ------------------------------
    victimData.forEach(v => {
      if (v.destroyed) return;
      const fear = easeInCubic(t / CHARGE) * .045;
      v.die.mesh.position.copy(v.base).add(new THREE.Vector3(rand(-1, 1) * fear, Math.abs(rand(0, 1)) * fear, rand(-1, 1) * fear));
      const m = v.die.mesh.material;
      if (m.emissive) { m.emissive.copy(DREAD); m.emissiveIntensity = easeInCubic(t / CHARGE) * .6; }
    });

    // Ambiente escurece enquanto o pavor age -------------------------------
    const gloom = easeOutCubic(t / (CHARGE * .8)) * (1 - easeInOutCubic((t - (END - 450 * speed)) / (450 * speed)));
    lights.hemi.intensity = baseHemi * (1 - .55 * gloom);
    lights.key.intensity = baseKey * (1 - .4 * gloom);

    flash.intensity *= Math.pow(.0009, dt);
    if (shake > .001) {
      camera.position.set(baseCam.x + rand(-1, 1) * shake, baseCam.y + rand(-1, 1) * shake, baseCam.z);
      shake *= Math.pow(.004, dt);
    } else camera.position.copy(baseCam);

    for (let i = effects.length - 1; i >= 0; i--) if (!effects[i].update(dt)) { effects[i].dispose(); effects.splice(i, 1); }

    if (t >= END && !effects.length) { finish(); return false; }
    return true;
  }

  function finish() {
    if (done) return;
    done = true;
    reveal();
    effects.forEach(e => e.dispose()); effects.length = 0;
    camera.position.copy(baseCam);
    lights.hemi.intensity = baseHemi; lights.key.intensity = baseKey;
    scene.remove(aura); scene.remove(flash);
    if (dread.mesh.parent) {
      // mantém o giro final (rotação em Y preserva a face de cima), só assenta posição/escala
      dread.mesh.position.copy(basePos); dread.mesh.scale.setScalar(1);
      if (dreadMat.emissive) { dreadMat.emissive.copy(DREAD); dreadMat.emissiveIntensity = .35; }
    }
  }

  return { update, finish };
}
