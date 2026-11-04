/**
 * dice-cinematic-alt.js — Rolagem no estilo Baldur's Gate 3
 *
 * Interface 2D com dados 3D:
 *  - topo: Classe de Dificuldade (quando o título traz "DT n") e o nome do teste;
 *  - centro: bandeja ornamentada onde os dados são arremessados (câmera de cima);
 *  - abaixo: moedas de bônus e o botão ROLAR;
 *  - sequência: chacoalhar → arremesso com física real → pausa → destaque do dado
 *    que conta → cada bônus voa até o número e soma → veredito.
 *
 * O arremesso é simulado antes com cannon-es; depois as faces são "renomeadas"
 * (rotação local constante) para que o valor sorteado termine voltado para cima.
 * Regras (pavor, maior/menor, críticos) vêm do mesmo motor da rolagem 3D.
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { computeOutcome, classifyRoll } from '../dice3d.js';
import { createDreadSequence } from '../dice-dread-fx.js';
import './dice-cinematic-alt.css';

let activeStage = null;

/* ================================================================== */
/* ÁUDIO                                                               */
/* ================================================================== */

const engines = new WeakMap();

function getAudioContext(passed) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = passed || (Ctx ? (window._bg3AudioCtx ??= new Ctx()) : null);
  if (ctx?.state === 'suspended') ctx.resume?.().catch(() => {});
  return ctx;
}

function impulseResponse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      // ruído levemente filtrado: cauda mais escura, como uma sala de pedra
      lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45;
      d[i] = lp * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

export function createRollAudio(ctx) {
  if (!ctx) return null;
  if (engines.has(ctx)) return engines.get(ctx);
  const master = ctx.createGain();
  master.gain.value = 0.85;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 3.5;
  master.connect(comp).connect(ctx.destination);
  const verb = ctx.createConvolver();
  verb.buffer = impulseResponse(ctx, 2.8, 2.6);
  const verbOut = ctx.createGain();
  verbOut.gain.value = 0.55;
  verb.connect(verbOut).connect(master);

  const noiseBuf = (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();

  const route = (node, send = 0.2) => {
    node.connect(master);
    if (send) {
      const s = ctx.createGain();
      s.gain.value = send;
      node.connect(s).connect(verb);
    }
  };

  const env = (g, t, peak, attack, decay) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  const noise = (t, dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.2, attack = 0.002, send = 0.15 } = {}) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    f.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    env(g, t, gain, attack, dur);
    src.connect(f).connect(g);
    route(g, send);
    src.start(t, Math.random() * 0.5);
    src.stop(t + attack + dur + 0.05);
    return { src, f, g };
  };

  const tone = (t, freq, dur, { type = 'sine', gain = 0.1, attack = 0.003, send = 0.2, glide = null } = {}) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + attack + dur);
    const g = ctx.createGain();
    env(g, t, gain, attack, dur);
    o.connect(g);
    route(g, send);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
    return o;
  };

  // Resina batendo na madeira: modos inarmônicos curtos + corpo grave da bandeja
  const clack = (strength = 1, at = 0, bright = 1) => {
    const t = ctx.currentTime + Math.max(0, at);
    const s = Math.max(0.05, Math.min(1.2, strength));
    const f0 = (2300 + Math.random() * 1500) * bright;
    [[1, 1, 0.055], [1.58, 0.55, 0.04], [2.37, 0.35, 0.028], [3.11, 0.2, 0.02]].forEach(([r, a, d]) => {
      tone(t, f0 * r * (0.98 + Math.random() * 0.04), d * (0.7 + s * 0.5), { gain: 0.13 * a * s, attack: 0.0008, send: 0.12 });
    });
    noise(t, 0.012, { type: 'highpass', freq: 2500, gain: 0.38 * s, attack: 0.0005, send: 0.08 });
    // corpo de madeira
    tone(t, 150 + Math.random() * 60, 0.07 * (0.6 + s * 0.6), { gain: 0.5 * s * Math.sqrt(s), attack: 0.001, glide: 80, send: 0.1 });
    noise(t, 0.04, { type: 'bandpass', freq: 380 + Math.random() * 120, q: 3, gain: 0.32 * s, attack: 0.001, send: 0.1 });
  };

  const engine = {
    clack,
    // dados chacoalhando na mão antes do arremesso
    shake(count = 1) {
      const n = 9 + Math.min(count, 4) * 2;
      for (let i = 0; i < n; i++) clack(0.09 + Math.random() * 0.09, i * 0.034 + Math.random() * 0.018, 0.85);
      noise(ctx.currentTime, 0.32, { type: 'bandpass', freq: 900, q: 0.7, gain: 0.04, attack: 0.08, send: 0.05 });
    },
    whoosh(at = 0, dur = 0.45) {
      const t = ctx.currentTime + at;
      const n = noise(t, dur, { type: 'bandpass', freq: 500, q: 1.2, gain: 0.07, attack: dur * 0.6, send: 0.3 });
      n.f.frequency.exponentialRampToValueAtTime(2600, t + dur);
    },
    // dado balançando até apoiar na face final
    settle() {
      [0, 0.07, 0.12, 0.155, 0.18].forEach((d, i) => clack(0.32 * Math.pow(0.6, i), d, 0.9));
      tone(ctx.currentTime, 70, 0.35, { gain: 0.16, attack: 0.004, glide: 45, send: 0.2 });
    },
    // número aparecendo: pulso grave e brilho
    reveal() {
      const t = ctx.currentTime;
      tone(t, 98, 0.9, { gain: 0.18, attack: 0.01, glide: 55, send: 0.35 });
      tone(t, 784, 0.9, { gain: 0.035, attack: 0.02, send: 0.6 });
      tone(t, 1175, 0.7, { gain: 0.02, attack: 0.03, send: 0.6 });
    },
    // contagem do bônus somando
    tick(i = 0) {
      tone(ctx.currentTime, 1400 + i * 90, 0.05, { type: 'triangle', gain: 0.03, attack: 0.001, send: 0.15 });
    },
    tickDown(i = 0) {
      tone(ctx.currentTime, Math.max(160, 850 - i * 70), 0.045, { type: 'sawtooth', gain: 0.025, attack: 0.001, send: 0.1 });
    },
    // bônus chegando: sino
    bell(i = 0) {
      const notes = [659.25, 739.99, 880, 987.77, 1108.73, 1318.51];
      const f = notes[i % notes.length];
      const t = ctx.currentTime;
      [[1, 0.14, 1.4], [2.0, 0.055, 0.9], [2.76, 0.045, 0.6], [5.4, 0.018, 0.3]].forEach(([r, g, d]) => tone(t, f * r, d, { gain: g, attack: 0.002, send: 0.55 }));
      tone(t, f / 2, 0.5, { gain: 0.04, attack: 0.004, send: 0.3 });
    },
    // penalidade chegando: tom sombrio e grave
    penalty(i = 0) {
      const t = ctx.currentTime;
      tone(t, 140 - i * 15, 0.42, { type: 'sawtooth', gain: 0.12, attack: 0.005, glide: 65, send: 0.4 });
      tone(t, 65, 0.6, { type: 'sine', gain: 0.22, attack: 0.008, glide: 40, send: 0.3 });
      noise(t, 0.14, { type: 'lowpass', freq: 360, gain: 0.22, attack: 0.002, send: 0.25 });
    },
    // acordes de veredito
    verdict(kind) {
      const t = ctx.currentTime;
      const pad = (freqs, { dur = 2.2, gain = 0.05, cutoff = 2200, drop = 1, attack = 0.12, type = 'sawtooth' } = {}) => {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(cutoff * 0.4, t);
        lp.frequency.linearRampToValueAtTime(cutoff, t + attack + 0.2);
        lp.frequency.exponentialRampToValueAtTime(cutoff * 0.3, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(gain, t + attack);
        g.gain.setValueAtTime(gain, t + dur * 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        lp.connect(g);
        route(g, 0.6);
        freqs.forEach(f => [-7, 7].forEach(dt => {
          const o = ctx.createOscillator();
          o.type = type;
          o.frequency.setValueAtTime(f, t);
          if (drop !== 1) o.frequency.exponentialRampToValueAtTime(f * drop, t + dur);
          o.detune.value = dt;
          o.connect(lp);
          o.start(t);
          o.stop(t + dur + 0.05);
        }));
      };
      if (kind === 'crit') {
        tone(t, 55, 1.6, { gain: 0.3, attack: 0.005, glide: 38, send: 0.4 });
        noise(t, 1.2, { type: 'lowpass', freq: 220, gain: 0.18, attack: 0.005, send: 0.4 });
        pad([261.63, 329.63, 392, 523.25, 659.25], { dur: 3.4, gain: 0.04, cutoff: 3200 });
        [2, 3, 4, 5].forEach((n, i) => setTimeout(() => engine.bell(n), 90 * i));
        tone(t + 0.25, 2637, 1.8, { gain: 0.018, attack: 0.4, send: 0.9 });
      } else if (kind === 'success') {
        tone(t, 73.4, 1.1, { gain: 0.2, attack: 0.005, glide: 50, send: 0.35 });
        pad([293.66, 369.99, 440, 587.33], { dur: 2.6, gain: 0.04, cutoff: 2600 });
        [1, 2, 3].forEach((n, i) => setTimeout(() => engine.bell(n), 110 * i));
      } else if (kind === 'failure') {
        tone(t, 61.7, 1.4, { gain: 0.24, attack: 0.006, glide: 36, send: 0.4 });
        pad([146.83, 174.61, 220], { dur: 2.4, gain: 0.05, cutoff: 900, drop: 0.96, attack: 0.05 });
      } else if (kind === 'fumble') {
        tone(t, 41.2, 2.0, { gain: 0.32, attack: 0.006, glide: 28, send: 0.5 });
        noise(t, 1.6, { type: 'lowpass', freq: 160, gain: 0.22, attack: 0.01, send: 0.5 });
        pad([73.42, 103.83, 146.83, 155.56], { dur: 3, gain: 0.05, cutoff: 700, drop: 0.92, attack: 0.04 });
      } else {
        pad([293.66, 440, 587.33], { dur: 1.8, gain: 0.025, cutoff: 1800, type: 'triangle' });
      }
    },
    // pavor destruindo um dado
    shatter() {
      const t = ctx.currentTime;
      noise(t, 0.35, { type: 'highpass', freq: 1800, gain: 0.16, attack: 0.002, send: 0.4 });
      tone(t, 90, 0.5, { gain: 0.18, attack: 0.003, glide: 40, send: 0.3 });
      for (let i = 0; i < 5; i++) clack(0.3, 0.03 + i * 0.03 + Math.random() * 0.02, 1.3);
    }
  };
  engines.set(ctx, engine);
  return engine;
}

/* ================================================================== */
/* DADOS 3D                                                            */
/* ================================================================== */

const DIE_R = 0.62;
const geometryFactories = {
  4: () => new THREE.TetrahedronGeometry(1.25),
  6: () => new THREE.BoxGeometry(1.25, 1.25, 1.25),
  8: () => new THREE.OctahedronGeometry(1.08),
  10: () => {
    const v = [0, 1.18, 0, 0, -1.18, 0];
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 - Math.PI / 2;
      v.push(Math.cos(a), 0, Math.sin(a));
    }
    const idx = [];
    for (let i = 0; i < 5; i++) {
      const a = 2 + i, b = 2 + (i + 1) % 5;
      idx.push(0, a, b, 1, b, a);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  },
  12: () => new THREE.DodecahedronGeometry(1.02),
  20: () => new THREE.IcosahedronGeometry(1.05)
};

function faceData(geometry) {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = src.attributes.position;
  const groups = [];
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    let g = groups.find(f => f.normal.dot(n) > 0.985);
    if (!g) { g = { normal: n, pts: [] }; groups.push(g); }
    g.pts.push(a, b, c);
  }
  return groups.map((g, i) => {
    const uniq = [];
    g.pts.forEach(p => { if (!uniq.some(q => q.distanceToSquared(p) < 1e-6)) uniq.push(p); });
    const center = uniq.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(uniq.length);
    return { value: i + 1, normal: g.normal, center };
  });
}

function cannonShape(geometry) {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = src.attributes.position;
  const vertices = [], faces = [], lookup = new Map();
  const vi = p => {
    const k = `${p.x.toFixed(5)},${p.y.toFixed(5)},${p.z.toFixed(5)}`;
    if (!lookup.has(k)) { lookup.set(k, vertices.length); vertices.push(new CANNON.Vec3(p.x, p.y, p.z)); }
    return lookup.get(k);
  };
  for (let i = 0; i < pos.count; i += 3) {
    const pts = [0, 1, 2].map(o => new THREE.Vector3().fromBufferAttribute(pos, i + o));
    const f = pts.map(vi);
    const n = new THREE.Vector3().crossVectors(pts[1].clone().sub(pts[0]), pts[2].clone().sub(pts[0]));
    const c = pts[0].clone().add(pts[1]).add(pts[2]).divideScalar(3);
    if (n.dot(c) < 0) f.reverse();
    faces.push(f);
  }
  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

const numberTexCache = new Map();
function numberTexture(value, sides) {
  const key = `${value}|${sides}`;
  if (numberTexCache.has(key)) return numberTexCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const label = String(value);
  const size = label.length > 1 ? 118 : 150;
  g.font = `700 ${size}px Georgia, "Times New Roman", serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const grad = g.createLinearGradient(0, 70, 0, 190);
  grad.addColorStop(0, '#fff4cf');
  grad.addColorStop(0.45, '#e9c46f');
  grad.addColorStop(1, '#a8772c');
  g.lineJoin = 'round';
  g.lineWidth = 14;
  g.strokeStyle = 'rgba(25,12,4,.85)';
  g.strokeText(label, 128, 136);
  g.fillStyle = grad;
  g.fillText(label, 128, 136);
  if ((value === 6 || value === 9) && sides >= 8) {
    g.fillStyle = '#e9c46f';
    g.fillRect(104, 210, 48, 9);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  numberTexCache.set(key, tex);
  return tex;
}

function buildDie(cfg) {
  const sides = [4, 6, 8, 10, 12, 20].includes(Number(cfg.sides)) ? Number(cfg.sides) : 20;
  const geometry = geometryFactories[sides]();
  geometry.scale(DIE_R, DIE_R, DIE_R);
  geometry.computeVertexNormals();
  const faces = faceData(geometry).slice(0, sides);
  const color = new THREE.Color(cfg.dread ? '#5b21b6' : (cfg.color || '#9f1d24'));
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.4,
    metalness: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    flatShading: true,
    envMapIntensity: 0.38,
    transparent: true
  });
  material.emissive = new THREE.Color(cfg.dread ? '#7c3aed' : '#000000');
  material.emissiveIntensity = cfg.dread ? 0.28 : 0;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 10),
    new THREE.LineBasicMaterial({ color: 0xffe7c2, transparent: true, opacity: 0.16 })
  );
  mesh.add(edges);

  const labelSize = DIE_R * (sides === 20 ? 0.5 : sides === 12 ? 0.62 : sides === 10 ? 0.6 : sides === 8 ? 0.72 : sides === 6 ? 0.92 : 0.8);
  const labelGeo = new THREE.PlaneGeometry(labelSize, labelSize);
  faces.forEach(face => {
    const m = new THREE.MeshStandardMaterial({
      map: numberTexture(face.value, sides),
      transparent: true,
      depthWrite: false,
      metalness: 0.75,
      roughness: 0.28,
      emissive: new THREE.Color('#5a3b10'),
      emissiveIntensity: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    const label = new THREE.Mesh(labelGeo, m);
    label.position.copy(face.center).add(face.normal.clone().multiplyScalar(0.004));
    label.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
    face.up = new THREE.Vector3(0, 1, 0).applyQuaternion(label.quaternion);
    face.label = label;
    mesh.add(label);
  });

  return { mesh, material, edges, faces, sides, shape: cannonShape(geometry), baseColor: color.clone() };
}

// Orientação que deixa a face com o valor voltada para a câmera (para cima) e o número em pé
function targetQuaternion(face, twist) {
  const n = face.normal.clone().normalize();
  const u = face.up.clone().normalize();
  const x = new THREE.Vector3().crossVectors(u, n).normalize();
  const local = new THREE.Matrix4().makeBasis(x, u, n);
  const world = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
  const m = world.multiply(local.transpose());
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), twist).multiply(q);
}

/* ================================================================== */
/* SIMULAÇÃO (pré-calculada)                                           */
/* ================================================================== */

const SIM_HZ = 60;
const yieldToBrowser = () => new Promise(r => setTimeout(r, 0));

// Simulação fatiada: roda em pedaços de ~6 ms para nunca congelar a página
async function simulateThrow(dice, halfW, halfD, ceiling = 4, isAborted = () => false) {
  let result = null;
  let sliceStart = performance.now();
  const maybeYield = async () => {
    if (performance.now() - sliceStart > 5) { await yieldToBrowser(); sliceStart = performance.now(); }
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    if (isAborted()) return null;
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -21, 0) });
    world.allowSleep = true;
    const diceMat = new CANNON.Material('die');
    const floorMat = new CANNON.Material('floor');
    world.addContactMaterial(new CANNON.ContactMaterial(diceMat, floorMat, { friction: 0.2, restitution: 0.5 }));
    world.addContactMaterial(new CANNON.ContactMaterial(diceMat, diceMat, { friction: 0.1, restitution: 0.5 }));

    const floor = new CANNON.Body({ mass: 0, material: floorMat, shape: new CANNON.Plane() });
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floor);
    const wall = (x, y, z, hx, hy, hz) => {
      const b = new CANNON.Body({ mass: 0, material: floorMat, shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)) });
      b.position.set(x, y, z);
      world.addBody(b);
    };
    wall(-halfW - 1, 3, 0, 1, 6, halfD + 2);
    wall(halfW + 1, 3, 0, 1, 6, halfD + 2);
    wall(0, 3, -halfD - 1, halfW + 2, 6, 1);
    wall(0, 3, halfD + 1, halfW + 2, 6, 1);
    wall(0, ceiling + 1, 0, halfW + 2, 1, halfD + 2);

    const n = dice.length;
    const impacts = [];
    let step = 0;
    const bodies = dice.map((d, i) => {
      const body = new CANNON.Body({ mass: 1, shape: d.shape, material: diceMat, allowSleep: true, sleepSpeedLimit: 0.15, sleepTimeLimit: 0.35 });
      body.angularDamping = 0.09;
      body.linearDamping = 0.035;
      const spread = Math.min(halfW * 1.5, (n - 1) * 1.4);
      const x = (n > 1 ? (i / (n - 1) - 0.5) * spread : 0) + (Math.random() - 0.5) * 0.4;
      body.position.set(x, Math.min(ceiling - 0.8, 1.6 + Math.random() * 0.6), halfD * 0.55);
      body.quaternion.setFromEuler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      body.velocity.set((Math.random() - 0.5) * halfW * 2.2 - x * 0.5, 3 + Math.random() * 1.5, -(halfD * 3.4 + Math.random() * halfD * 1.6));
      body.angularVelocity.set((Math.random() - 0.5) * 46, (Math.random() - 0.5) * 34, (Math.random() - 0.5) * 46);
      let last = -99;
      body.addEventListener('collide', e => {
        const v = Math.abs(e.contact?.getImpactVelocityAlongNormal?.() || 0);
        if (v > 0.6 && step - last > 2) { last = step; impacts.push({ step, v, die: i }); }
      });
      world.addBody(body);
      return body;
    });

    const frames = dice.map(() => []);
    const maxSteps = Math.round(SIM_HZ * 2.6);
    let quiet = 0;
    for (step = 0; step < maxSteps; step++) {
      if (step > SIM_HZ * 1.6) {
        const k = Math.min(1, (step - SIM_HZ * 1.6) / (SIM_HZ * 0.7));
        bodies.forEach(b => { b.angularDamping = 0.09 + k * 0.9; b.linearDamping = 0.035 + k * 0.9; });
      }
      world.step(1 / SIM_HZ, 1 / SIM_HZ, 2);
      bodies.forEach((b, i) => frames[i].push([b.position.x, b.position.y, b.position.z, b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w]));
      const resting = bodies.every(b => b.sleepState === CANNON.Body.SLEEPING || (b.velocity.length() < 0.06 && b.angularVelocity.length() < 0.09));
      quiet = resting ? quiet + 1 : 0;
      if (quiet > 6 && step > SIM_HZ * 1.3) break;
      if ((step & 7) === 0) {
        await maybeYield();
        if (isAborted()) return null;
      }
    }
    result = { frames, impacts, steps: frames[0].length };
    const ok = frames.every(f => {
      const last = f[f.length - 1];
      return last[1] < DIE_R * 1.25 && Math.abs(last[0]) < halfW && Math.abs(last[2]) < halfD;
    });
    if (ok && (result.steps >= SIM_HZ * 1.3 || attempt >= 1)) break;
  }
  return result;
}

/* ================================================================== */
/* UTILITÁRIOS                                                         */
/* ================================================================== */

const clamp01 = t => Math.max(0, Math.min(1, t));
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const CLOSED = Symbol('closed');

function safeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// "Perícia: Furtividade [Rhiona]" → { kind: 'Perícia', name: 'Furtividade', who: 'Rhiona' }
function parseTitle(raw) {
  let t = String(raw || 'Rolagem');
  let who = '';
  let dt = null;
  t = t.replace(/\s*\[([^\]]+)\]\s*/g, (_, n) => { who = n.trim(); return ' '; }).trim();
  t = t.replace(/\s*\(\s*DT\s*(\d+)\s*\)|\s*\bDT\s*(\d+)\b/i, (_, a, b) => { dt = Number(a ?? b); return ''; }).trim();
  t = t.replace(/\s*\((?:\d+d\d+[^)]*|2d20 Menor)\)\s*$/i, '').trim();
  let kind = '';
  const colon = t.match(/^([^:]{2,28}):\s*(.+)$/);
  const paren = t.match(/^(.*?)\s*\((Ataque|Dano)\)$/i);
  if (colon) { kind = colon[1]; t = colon[2]; }
  else if (paren) { kind = paren[2]; t = paren[1]; }
  else if (/^Teste de /i.test(t)) { kind = 'Teste'; t = t.replace(/^Teste de /i, ''); }
  return { kind, name: t || 'Rolagem', who, dt };
}

function modeLabel(list, rollMode, dreadIndex) {
  const rolled = list.filter((_, i) => i !== dreadIndex);
  const same = rolled.every(d => d.sides === rolled[0]?.sides);
  const pool = same && rolled.length ? `${rolled.length}d${rolled[0].sides}` : rolled.map(d => `d${d.sides}`).join(' + ');
  const extra = dreadIndex >= 0 ? ` · Pavor d${list[dreadIndex].sides}` : '';
  if (rolled.length > 1 && rollMode === 'highest') return `Maior de ${pool}${extra}`;
  if (rolled.length > 1 && rollMode === 'lowest') return `Menor de ${pool}${extra}`;
  return pool + extra;
}




/* ================================================================== */
/* RENDERIZADOR E CENA COMPARTILHADOS                                  */
/* Um único contexto WebGL para todas as rolagens: os shaders compilam  */
/* uma vez só e os dados são reaproveitados (nada de travar a cada uso).*/
/* ================================================================== */

let shared = null;

function getShared() {
  if (shared && !shared.lost) return shared;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.domElement.className = 'bg3-canvas';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const scene = new THREE.Scene();
  scene.environment = env;
  const camera = new THREE.PerspectiveCamera(30, 1.6, 0.1, 60);
  camera.up.set(0, 0, -1);

  const hemi = new THREE.HemisphereLight(0xfff1dc, 0x1a1008, 0.35);
  const key = new THREE.DirectionalLight(0xffe2b8, 1.7);
  key.position.set(-4, 10, -5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  const candle = new THREE.PointLight(0xff9a4a, 7, 14, 1.6);
  candle.position.set(5, 3, 3);
  // Duas luzes reservadas (apagadas): o Pavor acrescenta duas luzes próprias;
  // trocamos uma pela outra para o número de luzes não mudar e nada recompilar.
  const reserve = [0, 1].map(() => new THREE.PointLight(0xffffff, 0, 1));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(hemi, key, candle, ...reserve, floor);

  const S = { renderer, scene, camera, hemi, key, candle, reserve, pool: new Map(), lost: false, warm: false };
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); S.lost = true; });
  shared = S;
  return S;
}

// Os efeitos do Pavor criam e descartam materiais a cada uso; descartar o material
// apaga o programa compilado e a próxima rolagem recompila tudo (~1 s travado).
// Enquanto a sequência roda, os materiais adicionados à cena não liberam o programa.
const keepMaterial = m => { if (m && !m.__bg3Kept) { m.__bg3Kept = true; m.dispose = () => {}; } };
function keepEffectPrograms(scene) {
  if (scene.__bg3Add) return;
  scene.__bg3Add = scene.add;
  scene.add = function (...objs) {
    objs.forEach(o => o?.traverse?.(c => [].concat(c.material || []).forEach(keepMaterial)));
    return scene.__bg3Add.apply(this, objs);
  };
}
function releaseEffectPrograms(scene) {
  if (!scene.__bg3Add) return;
  scene.add = scene.__bg3Add;
  delete scene.__bg3Add;
}

function takeDie(S, cfg) {
  const sides = [4, 6, 8, 10, 12, 20].includes(Number(cfg.sides)) ? Number(cfg.sides) : 20;
  const free = S.pool.get(sides) || [];
  S.pool.set(sides, free);
  const d = free.pop() || buildDie({ sides });
  const color = new THREE.Color(cfg.dread ? '#5b21b6' : (cfg.color || '#9f1d24'));
  d.baseColor.copy(color);
  d.material.color.copy(color);
  d.material.opacity = 1;
  d.material.emissive.set(cfg.dread ? '#7c3aed' : '#000000');
  d.material.emissiveIntensity = cfg.dread ? 0.28 : 0;
  d.edges.material.opacity = 0.16;
  d.faces.forEach(f => { f.hidden = false; f.label.material.opacity = 1; });
  d.mesh.visible = true;
  d.mesh.castShadow = true;
  d.mesh.scale.setScalar(1);
  d.mesh.position.set(0, 0, 0);
  d.gone = false;
  S.scene.add(d.mesh);
  return d;
}

function releaseDie(S, d) {
  S.scene.remove(d.mesh);
  S.pool.get(d.sides)?.push(d);
}

/* ================================================================== */
/* MOLDURA (SVG)                                                       */
/* ================================================================== */

// Espaço da moldura: 340 × 496 (y de -26 a 470). Os elementos HTML são
// posicionados em % desse espaço, então tudo escala junto.
const FW = 340, FH = 496, FY = -26;
const pctX = x => `${(x / FW) * 100}%`;
const pctY = y => `${((y - FY) / FH) * 100}%`;
const TRAY = { x: 30, y: 156, w: 280, h: 172 };

const ARCH_OUT = 'M18 452 L18 128 C18 78 60 52 104 38 C136 28 156 18 170 8 C184 18 204 28 236 38 C280 52 322 78 322 128 L322 452 L190 452 L170 466 L150 452 Z';
const ARCH_IN = 'M26 444 L26 131 C26 86 64 61 107 47 C138 37 158 28 170 18 C182 28 202 37 233 47 C276 61 314 86 314 131 L314 444 L188 444 L170 456 L152 444 Z';

const diamond = (cx, cy, r) => `M${cx} ${cy - r} L${cx + r * 0.72} ${cy} L${cx} ${cy + r} L${cx - r * 0.72} ${cy} Z`;

function triquetra(cx, cy, r) {
  const pts = [-90, 30, 150].map(a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)]);
  const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
  const R = (dist * 0.62).toFixed(2);
  const lens = (a, b) => `M${a[0].toFixed(2)} ${a[1].toFixed(2)} A${R} ${R} 0 0 1 ${b[0].toFixed(2)} ${b[1].toFixed(2)} A${R} ${R} 0 0 1 ${a[0].toFixed(2)} ${a[1].toFixed(2)}`;
  return `<path class="f-knot" d="${lens(pts[0], pts[1])} ${lens(pts[1], pts[2])} ${lens(pts[2], pts[0])}"/><circle class="f-knot" cx="${cx}" cy="${cy}" r="${(r * 0.62).toFixed(2)}"/>`;
}

// voluta nos "ombros" do arco
const SCROLL = 'c0 -16 12 -24 24 -19 c8 3.5 6 13 -1.5 13 c-6 0 -6.5 -7.5 -.5 -7.5';

function frameSvg(theme, uid) {
  const vig = theme === 'vigilia';
  const t = TRAY;
  const bracket = (x, y, sx, sy) => `<path class="f-line" d="M${x} ${y + sy * 16} V${y} H${x + sx * 16}"/>`;
  const knotDivider = vig
    ? `<path class="f-thin" d="M66 142 H146 M194 142 H274"/>${triquetra(170, 142, 9)}`
    : `<path class="f-thin" d="M66 142 H150 M190 142 H274"/><path class="f-gem" d="${diamond(170, 142, 7)}"/><circle class="f-orn" cx="156" cy="142" r="1.8"/><circle class="f-orn" cx="184" cy="142" r="1.8"/>`;
  const finial = vig
    ? `${triquetra(170, -8, 13)}`
    : `<path class="f-gem f-glow" d="${diamond(170, -6, 12)}"/><path class="f-thin" d="M146 -6 H156 M184 -6 H194"/>`;
  return `
  <svg class="bg3-frame" viewBox="0 ${FY} ${FW} ${FH}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" class="f-stop-top"/>
        <stop offset="1" class="f-stop-bot"/>
      </linearGradient>
      <radialGradient id="${uid}-glow" cx="50%" cy="22%" r="60%">
        <stop offset="0" class="f-glow-in"/>
        <stop offset="1" stop-opacity="0" class="f-glow-out"/>
      </radialGradient>
      ${vig ? `
      <pattern id="${uid}-tex" patternUnits="userSpaceOnUse" width="${FW}" height="${FH}" y="${FY}">
        <image href="/assets/vigilia/vigilia-bg.png" width="${FW}" height="${FH}" preserveAspectRatio="xMidYMid slice"/>
      </pattern>
      <filter id="${uid}-worn" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/>
        <feDisplacementMap in="SourceGraphic" scale="1.8"/>
      </filter>` : ''}
    </defs>
    <path class="f-shadow" d="${ARCH_OUT}"/>
    <path d="${ARCH_OUT}" fill="url(#${uid}-fill)"/>
    ${vig ? `<path d="${ARCH_OUT}" fill="url(#${uid}-tex)" class="f-tex"/>` : ''}
    <path d="${ARCH_OUT}" fill="url(#${uid}-glow)"/>
    <g ${vig ? `filter="url(#${uid}-worn)"` : ''}>
      <path class="f-line f-main" d="${ARCH_OUT}"/>
      <path class="f-thin" d="${ARCH_IN}"/>
      ${finial}
      <path class="f-line" d="M40 118 ${SCROLL}"/>
      <path class="f-line" transform="translate(340 0) scale(-1 1)" d="M40 118 ${SCROLL}"/>
      <circle class="f-line" cx="170" cy="96" r="33"/>
      <circle class="f-thin" cx="170" cy="96" r="27.5"/>
      <path class="f-gem" d="${diamond(170, 63, 4.5)}"/>
      <path class="f-gem" d="${diamond(137, 96, 4.5)}"/>
      <path class="f-gem" d="${diamond(203, 96, 4.5)}"/>
      ${knotDivider}
      <rect class="f-tray" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="3"/>
      ${bracket(t.x - 4, t.y - 4, 1, 1)}${bracket(t.x + t.w + 4, t.y - 4, -1, 1)}
      ${bracket(t.x - 4, t.y + t.h + 4, 1, -1)}${bracket(t.x + t.w + 4, t.y + t.h + 4, -1, -1)}
      <path class="f-gem" d="${diamond(18, 250, 8)}"/>
      <path class="f-gem" d="${diamond(322, 250, 8)}"/>
      <path class="f-thin" d="M18 236 V214 M18 264 V286 M322 236 V214 M322 264 V286"/>
      <path class="f-gem" d="${diamond(170, 462, 7)}"/>
      ${vig ? `${triquetra(44, 430, 7)}${triquetra(296, 430, 7)}` : `<path class="f-orn" d="${diamond(44, 432, 4)}"/><path class="f-orn" d="${diamond(296, 432, 4)}"/>`}
    </g>
  </svg>`;
}

const DIE_ICON = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L35 11.5 V28.5 L20 37 L5 28.5 V11.5 Z M20 3 L12 25 H28 Z M12 25 L5 28.5 M28 25 L35 28.5 M12 25 L20 37 L28 25 M20 3 L5 11.5 L12 25 M20 3 L35 11.5 L28 25"/></svg>`;

/* ================================================================== */
/* FUNÇÃO PRINCIPAL                                                    */
/* ================================================================== */

let stageUid = 0;

export function rollDiceCinematicAlt(configs, title = 'Rolagem', modifier = 0, sharedAudioContext = null, rollMode = 'sum', options = {}) {
  const list = (Array.isArray(configs) ? configs : [{ sides: configs }]).map(c => (typeof c === 'number' ? { sides: c } : c));
  closeDiceCinematicAlt({ immediate: true });
  const audioCtx = getAudioContext(sharedAudioContext);
  const sfx = createRollAudio(audioCtx);

  // Sorteio e regras (mesmo motor da rolagem 3D)
  const values = list.map(c => Math.floor(Math.random() * c.sides) + 1);
  if (import.meta.env.DEV && Array.isArray(window.__forceDice)) {
    window.__forceDice.forEach((v, i) => { if (v !== undefined && i < values.length) values[i] = v; });
    window.__forceDice = null;
  }
  const dreadIndex = list.findIndex(d => d.dread);
  // O d4 de Ímpeto é um bônus somado ao teste: nunca entra em "maior/menor" nem na classificação de crítico.
  const calcOutcome = mod => {
    const o = computeOutcome(list, values, rollMode, mod, dreadIndex);
    const isImp = i => Boolean(list[i]?.isImpeto);
    if (!list.some(c => c.isImpeto)) return { ...o, bonusSum: 0 };
    const base = o.counted.filter(i => !isImp(i));
    const bonusSum = o.counted.filter(isImp).reduce((s, i) => s + values[i], 0);
    const bv = base.map(i => values[i]);
    let chosenIndex = -1, chosenValue = null, sum = bv.reduce((a, b) => a + b, 0);
    if (bv.length && (rollMode === 'highest' || rollMode === 'lowest')) {
      chosenValue = rollMode === 'highest' ? Math.max(...bv) : Math.min(...bv);
      chosenIndex = base[bv.indexOf(chosenValue)];
      sum = chosenValue;
    }
    return { ...o, counted: base, countedValues: bv, chosenIndex, chosenValue, bonusSum, total: sum + bonusSum + mod, impetoCounted: o.counted.filter(isImp) };
  };
  const classify = o => classifyRoll(list.filter(c => !c.isImpeto), o);
  const baseOf = o => (o.countedValues.length
    ? (o.chosenIndex >= 0 ? o.chosenValue : o.countedValues.reduce((a, b) => a + b, 0))
    : 0) + (o.bonusSum || 0);
  const outcome = calcOutcome(modifier);
  let { destroyed, counted, countedValues, total, chosenValue, chosenIndex, vanquished } = outcome;
  let cls = classify(outcome);
  let baseValue = baseOf(outcome);
  let currentCounted = [...counted, ...(outcome.impetoCounted || [])];
  let currentDestroyed = new Set(destroyed);

  const info = parseTitle(title);
  const dt = options.dt != null && Number.isFinite(Number(options.dt)) ? Number(options.dt) : info.dt;
  const success = dt !== null ? total >= dt : null;

  const parts = (options.modifierParts || []).map(p => ({
    label: p.label || 'BÔNUS',
    value: Number(p.value) || 0,
    isPenalty: Boolean(p.isPenalty) || Number(p.value) < 0
  })).filter(p => p.value);
  const partsSum = parts.reduce((a, p) => a + p.value, 0);
  if (partsSum !== modifier) {
    const diff = modifier - partsSum;
    parts.push({ label: 'BÔNUS', value: diff, isPenalty: diff < 0 });
  }

  const activatables = (options.activatables || []).map((a, idx) => ({
    id: a.id || `act-${idx}`,
    subType: a.subType || '',
    label: a.label || 'Habilidade',
    value: Number(a.value) || 0,
    diceRoll: a.diceRoll || '',
    displayValue: a.displayValue || (a.diceRoll ? a.diceRoll : (a.value > 0 ? `+${a.value}` : (a.value < 0 ? `${a.value}` : '±1'))),
    cost: a.cost || '',
    hint: a.hint || '',
    canAfford: a.canAfford !== false,
    selected: Boolean(a.selected),
    raw: a
  }));

  const calcBonusDisplay = () => {
    const passiveSum = parts.reduce((a, p) => a + p.value, 0);
    const selectedActs = activatables.filter(a => a.selected && a.subType !== 'analise' && a.subType !== 'prontidao');
    const activeFixed = selectedActs.reduce((a, act) => a + (act.diceRoll ? 0 : act.value), 0);
    const diceActs = selectedActs.filter(a => a.diceRoll);
    const baseMod = passiveSum + activeFixed;
    if (!diceActs.length) {
      return signed(baseMod);
    }
    const diceDesc = diceActs.map(d => d.displayValue || d.diceRoll).join(' + ');
    return `${signed(baseMod)} (${diceDesc})`;
  };

  const reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const quick = options.scene !== 'full';
  const waitForClick = options.autoRoll ? false : true;
  const pace = quick ? 0.6 : 1;
  const theme = options.theme === 'vigilia' ? 'vigilia' : 'cinematic';
  const accent = /^#[0-9a-f]{6}$/i.test(options.accent || '') ? options.accent : '#e0150d';
  const signed = v => `${v >= 0 ? '+' : '−'}${Math.abs(v)}`;
  const uid = `bg3f${++stageUid}`;

  const reactions = options.reactions || [];
  const analiseReaction = reactions.find(r => r.type === 'analise');
  let analiseCharges = analiseReaction ? Number(analiseReaction.charges) || 0 : 0;
  const prontidaoReaction = reactions.find(r => r.type === 'prontidao');
  let prontidaoAvailable = Boolean(prontidaoReaction && prontidaoReaction.canUse);
  let prontidaoUsed = false;
  let armed = null; // habilidade pós-rolagem escolhida pelo card: 'analise' | 'prontidao'
  const analiseAdj = {}; // ajuste líquido de Análise por dado (permite devolver o marcador)
  const impetoReaction = reactions.find(r => r.type === 'impeto');
  let impetoCharges = impetoReaction ? Number(impetoReaction.charges) || 0 : (activatables.find(a => a.subType === 'impeto')?.charges || 0);
  let impetoDiePre = null;

  let currentTotal = total;
  let finalSuccess = success;
  let activeParts = [];

  const payload = {
    values, total, chosenValue, chosenIndex, rollMode,
    dice: values,
    dreadValue: outcome.dreadValue,
    vanquished,
    destroyed: [...destroyed],
    breakdown: list.map((d, i) => ({
      sides: d.sides,
      value: values[i],
      label: d.label || '',
      isChosen: i === chosenIndex,
      dread: i === dreadIndex,
      destroyed: destroyed.has(i),
      discarded: (chosenIndex >= 0 && i !== chosenIndex) || destroyed.has(i) || i === dreadIndex
    }))
  };

  return new Promise(resolve => {
    let resolved = false;
    let rolled = false; // antes de rolar, fechar = cancelar (resolve null)
    const finish = () => { if (!resolved) { resolved = true; resolve(rolled ? payload : null); } };

    /* ---------- DOM ---------- */
    const stage = document.createElement('div');
    stage.id = 'bg3-roll-stage';
    stage.className = `bg3-stage theme-${theme} is-waiting`;
    stage.style.setProperty('--accent', accent);
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-label', `Rolagem: ${info.name}`);
    const sub = [info.kind, info.who].filter(Boolean).join(' · ');
    const place = (x, y, w, h) => `left:${pctX(x)};top:${pctY(y)};width:${pctX(w)};height:${(h / FH) * 100}%`;
    stage.innerHTML = `
      <div class="bg3-shade"></div>
      <div class="bg3-dread-veil"></div>
      <div class="bg3-panel">
        <header class="bg3-head">
          <h1 class="bg3-title">${safeHtml(info.name)}</h1>
          ${sub ? `<p class="bg3-sub"><span>${safeHtml(sub)}</span></p>` : ''}
        </header>
        <section class="bg3-board">
          ${frameSvg(theme, uid)}
          <button type="button" class="bg3-close" aria-label="Fechar rolagem" title="Fechar (Esc)">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 L15 15 M15 5 L5 15"/></svg>
          </button>
          <span class="bg3-dc-label" style="top:${pctY(46)}">${dt !== null ? 'Classe de Dificuldade' : 'Rolagem'}</span>
          <b class="bg3-dc-value${dt === null ? ' is-icon' : ''}" style="top:${pctY(96)}">${dt !== null ? dt : DIE_ICON}</b>
          <div class="bg3-tray" style="${place(TRAY.x, TRAY.y, TRAY.w, TRAY.h)}">
            <div class="bg3-total"><span class="bg3-total-num"></span></div>
            <div class="bg3-sparks"></div>
          </div>
          <div class="bg3-action" style="${place(34, 338, 272, 96)}">
            <button type="button" class="bg3-roll-btn"><span>Clique no dado para rolar</span></button>
            <p class="bg3-status" aria-live="polite"></p>
            <div class="bg3-verdict" aria-live="polite"></div>
            <div class="bg3-reactions" aria-live="polite"></div>
          </div>
        </section>
        <p class="bg3-mode">${safeHtml(modeLabel(list, rollMode, dreadIndex))}</p>
        ${(parts.length || activatables.length) ? `
        <div class="bg3-bonuses">
          ${parts.map((p, i) => `
            <div class="bg3-card${p.isPenalty ? ' is-penalty' : ''}" data-card="${i}">
              <span class="bg3-card-value">${signed(p.value)}</span>
              <i class="bg3-card-gem"></i>
              <span class="bg3-card-label">${safeHtml(p.label)}</span>
            </div>`).join('')}
          ${activatables.map((act, idx) => {
            if (act.subType === 'analise') {
              return `
                <div class="bg3-card bg3-card-analise${!act.canAfford ? ' is-disabled' : ''}" data-card-sub="analise">
                  <span class="bg3-card-value">${safeHtml(act.displayValue || '±1')}</span>
                  <i class="bg3-card-gem"></i>
                  <span class="bg3-card-label">${safeHtml(act.label)}</span>
                  ${act.cost ? `<span class="bg3-card-cost">${safeHtml(act.cost)}</span>` : ''}
                  <span class="bg3-card-hint"><b class="bg3-analise-count">${analiseCharges}</b>/4 disp.</span>
                  <div class="bg3-card-steppers" style="display:none;">
                    <button type="button" class="bg3-analise-btn" data-analise-delta="-1" title="Subtrair 1 do total (−1 marcador)">−</button>
                    <button type="button" class="bg3-analise-btn" data-analise-delta="+1" title="Somar 1 ao total (−1 marcador)">+</button>
                  </div>
                </div>`;
            }
            if (act.subType === 'prontidao') {
              return `
                <div class="bg3-card bg3-card-prontidao${!act.canAfford ? ' is-disabled' : ''}" data-card-sub="prontidao">
                  <span class="bg3-card-value">↺</span>
                  <i class="bg3-card-gem"></i>
                  <span class="bg3-card-label">${safeHtml(act.label)}</span>
                  ${act.cost ? `<span class="bg3-card-cost">2 PD</span>` : ''}
                  <span class="bg3-card-hint">${safeHtml(act.hint)}</span>
                  <button type="button" class="bg3-card-reroll-btn bg3-prontidao-btn" style="display:none;" title="Gastar 2 PD para rerolar">REROLAR</button>
                </div>`;
            }
            return `
              <button type="button"
                class="bg3-card is-activatable${act.selected ? ' is-selected' : ''}${!act.canAfford ? ' is-disabled' : ''}"
                data-activatable-idx="${idx}"
                aria-pressed="${act.selected ? 'true' : 'false'}"
                title="${act.canAfford ? 'Clique para ativar na rolagem' : (act.hint || 'Recursos insuficientes')}">
                <span class="bg3-card-value">${safeHtml(act.displayValue || signed(act.value))}</span>
                <i class="bg3-card-gem"></i>
                <span class="bg3-card-label">${safeHtml(act.label)}</span>
                ${act.cost ? `<span class="bg3-card-cost">${safeHtml(act.cost)}</span>` : ''}
                ${act.hint ? `<span class="bg3-card-hint">${safeHtml(act.hint)}</span>` : ''}
              </button>`;
          }).join('')}
        </div>
        <p class="bg3-bonus-total">Bônus total <b class="bg3-total-mod-val">${calcBonusDisplay()}</b></p>` : ''}
        <p class="bg3-hint">${waitForClick ? 'Espaço para rolar · Esc para cancelar' : ''}</p>
      </div>`;
    document.body.appendChild(stage);
    activeStage = stage;

    const tray = stage.querySelector('.bg3-tray');
    const totalEl = stage.querySelector('.bg3-total');
    const totalNum = stage.querySelector('.bg3-total-num');
    const sparks = stage.querySelector('.bg3-sparks');
    const btn = stage.querySelector('.bg3-roll-btn');
    const closeBtn = stage.querySelector('.bg3-close');
    const statusEl = stage.querySelector('.bg3-status');
    const verdictEl = stage.querySelector('.bg3-verdict');
    const hint = stage.querySelector('.bg3-hint');
    const setStatus = text => { statusEl.textContent = text || ''; stage.classList.toggle('has-status', Boolean(text)); };

    /* ---------- cena compartilhada ---------- */
    const S = getShared();
    const { renderer, scene, camera, hemi, key, candle, reserve } = S;
    tray.prepend(renderer.domElement);
    let W = tray.clientWidth || 280;
    let H = tray.clientHeight || 172;

    const n = list.length;
    const CAM_H = n <= 2 ? 7 : n === 3 ? 8.4 : 9.6 + (n - 4) * 0.9;
    const FOV = 30;
    camera.fov = FOV;
    camera.position.set(0, CAM_H, 0);
    camera.lookAt(0, 0, 0);
    candle.color.set(theme === 'vigilia' ? 0x9fd8c0 : 0xff9a4a);
    hemi.intensity = 0.35;
    key.intensity = 1.7;

    const halfExtents = () => {
      const hd = CAM_H * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      return { hw: hd * (W / H) - 0.2, hd: hd - 0.2 };
    };

    const dice = list.map((cfg, i) => {
      const d = takeDie(S, cfg);
      d.index = i;
      d.cfg = cfg;
      d.mesh.__die = d;
      return d;
    });
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedDieIdx = currentCounted[0] ?? 0;

    // Espera: dados flutuando lado a lado, mostrando o maior número, como no jogo
    const tiltX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.32);
    const placeIdle = () => {
      const { hw } = halfExtents();
      const currentN = dice.length;
      const spread = currentN > 1 ? Math.min(1.7, (hw * 2 - 1.3) / (currentN - 1)) : 0;
      dice.forEach((d, i) => {
        d.idlePos = new THREE.Vector3((i - (currentN - 1) / 2) * spread, CAM_H * (currentN === 1 ? 0.3 : 0.2), 0.05);
        const face = d.faces.find(f => f.value === d.sides) || d.faces[0];
        d.idleQuat = tiltX.clone().multiply(targetQuaternion(face, 0));
        d.mesh.position.copy(d.idlePos);
        d.mesh.quaternion.copy(d.idleQuat);
      });
    };

    /* ---------- controle de tempo ---------- */
    let mode = 'idle';
    let sim = null;
    let simStart = 0;
    let simDone = null;
    let dreadRun = null;
    let nextImpact = 0;
    let raf = 0;
    let closed = false;
    let skipping = reduced;
    const tweens = new Set();
    const pending = new Set();
    const timers = new Set();
    const alive = () => { if (closed) throw CLOSED; };

    // Simulação começa já na abertura, fatiada; o clique só espera se ainda não terminou
    let currentSimPromise = null;
    const computeSim = () => {
      return (async () => {
        await yieldToBrowser();
        const { hw, hd } = halfExtents();
        const result = await simulateThrow(dice, hw, hd, Math.min(4.2, CAM_H * 0.5), () => closed);
        if (!result) return null;
        dice.forEach((d, i) => {
          const f = result.frames[i];
          const last = f[f.length - 1];
          const qf = new THREE.Quaternion(last[3], last[4], last[5], last[6]);
          const face = d.faces.find(x => x.value === values[i]) || d.faces[0];
          const qt = targetQuaternion(face, (Math.random() - 0.5) * 0.3);
          d.relabel = qf.clone().invert().multiply(qt);
          d.restPos = new THREE.Vector3(last[0], last[1], last[2]);
          d.restQuat = qt;
        });
        return result;
      })();
    };
    currentSimPromise = computeSim();

    const tmpQ = new THREE.Quaternion();
    const tmpQ2 = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    // reprodução com interpolação entre os quadros de 60 Hz
    const applyFrame = (d, kf) => {
      const frames = sim.frames[d.index];
      const last = frames.length - 1;
      const i = Math.min(Math.floor(kf), last);
      const j = Math.min(i + 1, last);
      const t = Math.min(1, kf - Math.floor(kf));
      const a = frames[i], b = frames[j];
      d.mesh.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
      tmpQ.set(a[3], a[4], a[5], a[6]);
      tmpQ2.set(b[3], b[4], b[5], b[6]);
      tmpQ.slerp(tmpQ2, t);
      d.mesh.quaternion.copy(tmpQ).multiply(d.relabel);
    };

    const toScreen = v => {
      const p = v.clone().project(camera);
      return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
    };

    const tween = (ms, fn, ease = easeInOutCubic) => new Promise(res => {
      if (closed) return res();
      tweens.add({ start: performance.now(), ms: skipping ? 0 : ms * pace, fn, ease, res });
    });
    const wait = ms => new Promise(res => {
      if (skipping || closed) return res();
      const t = setTimeout(() => { timers.delete(t); pending.delete(res); res(); }, ms * pace);
      timers.add(t);
      pending.add(res);
    });
    const skip = () => {
      if (skipping) return;
      skipping = true;
      stage.classList.add('is-skipping');
      pending.forEach(r => r());
      pending.clear();
      tweens.forEach(tw => { tw.ms = 0; });
      stage.getAnimations?.({ subtree: true }).forEach(a => { try { a.finish(); } catch {} });
    };

    /* ---------- loop ---------- */
    const frame = now => {
      if (closed) return;
      try {
        if (mode === 'idle') {
          dice.forEach((d, i) => {
            const t = now / 1000 + i * 1.3;
            d.mesh.position.y = d.idlePos.y + Math.sin(t * 1.4) * 0.1;
            d.mesh.quaternion.copy(d.idleQuat).premultiply(tmpQ.setFromAxisAngle(yAxis, Math.sin(t * 0.7) * 0.28));
          });
        } else if (mode === 'throw') {
          const kf = skipping ? sim.steps : ((now - simStart) / 1000) * SIM_HZ * (quick ? 1.25 : 1);
          while (nextImpact < sim.impacts.length && sim.impacts[nextImpact].step <= kf) {
            const im = sim.impacts[nextImpact++];
            if (!skipping) sfx?.clack(Math.min(1.1, im.v / 6), 0, 1);
          }
          dice.forEach(d => applyFrame(d, kf));
          if (kf >= sim.steps - 1) {
            mode = 'still';
            dice.forEach(d => { d.mesh.position.copy(d.restPos); d.mesh.quaternion.copy(d.restQuat); });
            simDone?.();
          }
        }
        if (dreadRun) {
          if (skipping) { dreadRun.seq.finish(); dreadRun.done(); }
          else if (!dreadRun.seq.update(now)) dreadRun.done();
        }
        tweens.forEach(tw => {
          const t = tw.ms ? clamp01((now - tw.start) / tw.ms) : 1;
          tw.fn(tw.ease(t), t);
          if (t >= 1) { tweens.delete(tw); tw.res(); }
        });
        renderer.render(scene, camera);
      } catch (err) {
        // um erro num quadro nunca deve prender a tela: fecha e devolve o resultado
        console.error(err);
        closeDiceCinematicAlt({ immediate: true });
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    /* ---------- efeitos de material ---------- */
    const fadeDie = (d, { opacity = 1, dark = 0, scale = 1, to = null } = {}, ms = 600) => {
      const o0 = d.material.opacity;
      const c0 = d.material.color.clone();
      const c1 = d.baseColor.clone().lerp(new THREE.Color('#141010'), dark);
      const s0 = d.mesh.scale.x;
      const p0 = d.mesh.position.clone();
      const p1 = to ? to.clone() : p0.clone();
      return tween(ms, e => {
        d.material.opacity = o0 + (opacity - o0) * e;
        d.edges.material.opacity = 0.16 * d.material.opacity;
        d.faces.forEach(f => { f.label.material.opacity = f.hidden ? 0 : d.material.opacity; });
        d.material.color.copy(c0).lerp(c1, e);
        d.mesh.scale.setScalar(s0 + (scale - s0) * e);
        d.mesh.position.lerpVectors(p0, p1, e);
        if (d.material.opacity < 0.5) d.mesh.castShadow = false;
        d.mesh.visible = d.material.opacity > 0.02;
      });
    };

    const burstSparks = (x, y, kind) => {
      if (reduced) return;
      const count = kind === 'crit' ? 40 : kind === 'success' ? 18 : kind === 'fumble' ? 26 : 0;
      for (let i = 0; i < count; i++) {
        const s = document.createElement('i');
        s.className = `bg3-spark ${kind}`;
        s.style.left = `${x}px`;
        s.style.top = `${y}px`;
        sparks.appendChild(s);
        const a = Math.random() * Math.PI * 2;
        const r = (kind === 'crit' ? 120 : 80) + Math.random() * 110;
        const dx = Math.cos(a) * r, dy = Math.sin(a) * r + (kind === 'fumble' ? 50 : -25);
        s.animate([
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.2)`, opacity: 0 }
        ], { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' }).onfinish = () => s.remove();
      }
    };

    /* ---------- sequência ---------- */
    let state = 'waiting';
    const pulse = (el, c = 'is-pulse') => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); };
    const setTotal = (v, size) => {
      totalNum.textContent = String(v);
      if (size) totalEl.style.setProperty('--size', `${size}px`);
    };

    const runSequence = async () => {
      state = 'rolling';
      rolled = true;
      stage.classList.remove('is-waiting');
      stage.classList.add('is-rolling');
      hint.textContent = '';

      // 1. chacoalhar (enquanto a física termina, se ainda não terminou)
      if (!skipping) {
        sfx?.shake(n);
        const from = dice.map(d => d.mesh.position.clone());
        mode = 'hold';
        await tween(380, (e, t) => {
          dice.forEach((d, i) => {
            const jitter = Math.sin(t * 70 + i * 2) * 0.08 * (1 - t);
            d.mesh.position.copy(from[i]).add(new THREE.Vector3(jitter, -e * 0.3, e * 0.9));
            d.mesh.quaternion.copy(d.idleQuat).premultiply(tmpQ.setFromAxisAngle(yAxis, Math.sin(t * 50 + i) * 0.25));
          });
        });
        alive();
      }
      sim = await currentSimPromise;
      alive();
      if (!sim) throw new Error('simulação indisponível');

      const startPose = dice.map(d => {
        const f = sim.frames[d.index][0];
        return { p: new THREE.Vector3(f[0], f[1], f[2]), q: new THREE.Quaternion(f[3], f[4], f[5], f[6]).multiply(d.relabel) };
      });
      const fromPose = dice.map(d => ({ p: d.mesh.position.clone(), q: d.mesh.quaternion.clone() }));
      sfx?.whoosh(0, 0.25);
      await tween(110, e => dice.forEach((d, i) => {
        d.mesh.position.lerpVectors(fromPose[i].p, startPose[i].p, e);
        d.mesh.quaternion.slerpQuaternions(fromPose[i].q, startPose[i].q, e);
      }), t => t);
      alive();

      await new Promise(res => { simDone = res; simStart = performance.now(); nextImpact = 0; mode = 'throw'; });
      alive();
      if (!skipping) sfx?.settle();
      await wait(620);
      alive();

      // 2. pavor: o dado roxo desperta, ergue-se e despedaça os menores
      if (dreadIndex >= 0) {
        stage.classList.add('is-dread');
        setStatus(vanquished ? 'O Pavor estremece…' : 'O Pavor desperta…');
        await wait(300);
        alive();
        await new Promise(res => {
          if (skipping) return res();
          scene.remove(...reserve);
          keepEffectPrograms(scene);
          const seq = createDreadSequence({
            scene, camera, dice, dreadIndex,
            victims: [...destroyed],
            vanquished,
            lights: { hemi, key },
            audio: audioCtx,
            reducedMotion: reduced,
            onImpact: kind => {
              pulse(stage, kind === 'vanquished' ? 'is-dread-light' : 'is-dread-hit');
              if (kind === 'shatter') setStatus('O Pavor despedaça seus dados');
              if (kind === 'vanquished') setStatus('A luz rompe o Pavor!');
            }
          });
          dreadRun = { seq, done: () => { dreadRun = null; releaseEffectPrograms(scene); scene.add(...reserve); res(); } };
        });
        alive();
        // ao pular, a sequência não roda: some com os destruídos direto
        destroyed.forEach(i => { dice[i].gone = true; dice[i].mesh.visible = false; });
        if (vanquished) { dice[dreadIndex].gone = true; dice[dreadIndex].mesh.visible = false; }
        setStatus(vanquished ? '✦ Pavor vencido'
          : !countedValues.length ? 'O Pavor consumiu todos os dados'
          : destroyed.size ? `O Pavor destruiu ${destroyed.size} ${destroyed.size === 1 ? 'dado' : 'dados'}`
          : 'Você resistiu ao Pavor');
        stage.classList.remove('is-dread');
        await wait(900);
        alive();
        setStatus('');
      }

      // 3. maior/menor: os outros apagam
      const main = chosenIndex >= 0 ? dice[chosenIndex] : (counted.length === 1 ? dice[counted[0]] : null);
      const losers = dice.filter(d => main && d !== main && !d.gone && d.index !== dreadIndex && !d.cfg?.isImpeto);
      if (losers.length) {
        sfx?.whoosh(0, 0.3);
        await Promise.all(losers.map(d => fadeDie(d, { opacity: 0.3, dark: 0.75 }, 600)));
        await wait(380);
        alive();
      }

      // 4. destaque: o dado que conta sobe até a câmera; na soma, os dados se juntam
      const { hd } = halfExtents();
      const fadeRest = d => fadeDie(d, { opacity: 0, dark: 0.9, scale: 0.8 }, 520);
      dice.forEach(d => { d.mesh.castShadow = false; });
      let focus;
      sfx?.whoosh(0, 0.6);
      if (main) {
        dice.filter(d => d !== main).forEach(fadeRest);
        focus = new THREE.Vector3(0, CAM_H * 0.42, 0.05);
        const p0 = main.mesh.position.clone();
        await tween(800, e => main.mesh.position.lerpVectors(p0, focus, e));
      } else if (counted.length) {
        const keep = dice.filter(d => counted.includes(d.index));
        dice.filter(d => !counted.includes(d.index)).forEach(fadeRest);
        const gap = 1.45;
        const y = CAM_H * 0.22;
        await Promise.all(keep.map((d, j) => fadeDie(d, { to: new THREE.Vector3((j - (keep.length - 1) / 2) * gap, y, hd * 0.42) }, 800)));
        focus = new THREE.Vector3(0, y, -hd * 0.42);
      } else {
        dice.forEach(fadeRest);
        focus = new THREE.Vector3(0, 0, 0);
        await wait(520);
      }
      alive();

      // 5. o número do dado vira o total
      const sp = toScreen(focus);
      totalEl.style.left = `${sp.x}px`;
      totalEl.style.top = `${sp.y}px`;
      setTotal(baseValue, Math.round(Math.min(H * (main ? 0.32 : 0.36), 84)));
      if (main) {
        const face = main.faces.find(f => f.value === values[main.index]);
        if (face) face.hidden = true;
        main.faces.forEach(f => { f.o0 = f.label.material.opacity; });
        tween(320, e => main.faces.forEach(f => { f.label.material.opacity = f.o0 * (1 - e * (f === face ? 1 : 0.75)); }));
        tween(500, e => main.material.color.copy(main.baseColor).lerp(new THREE.Color('#120806'), e * 0.5));
      } else {
        tween(500, e => dice.forEach(d => { if (counted.includes(d.index)) d.material.opacity = 1 - e * 0.4; }));
      }
      stage.classList.add('has-total');
      pulse(totalEl);
      sfx?.reveal();
      await wait(650);
      alive();

      // 6. cartas de bônus voam e somam
      let running = baseValue;
      for (let i = 0; i < activeParts.length; i++) {
        const part = activeParts[i];
        const card = part.element;
        if (!card) {
          running += part.value;
          continue;
        }
        const value = card.querySelector('.bg3-card-value');
        card.classList.add('is-active');
        if (!skipping) {
          await wait(200);
          alive();
          const from = value.getBoundingClientRect();
          const to = totalEl.getBoundingClientRect();
          const fly = value.cloneNode(true);
          fly.className = `bg3-card-value bg3-fly${part.isPenalty ? ' is-penalty' : ''}`;
          Object.assign(fly.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
          stage.appendChild(fly);
          const dx = to.left + to.width / 2 - (from.left + from.width / 2);
          const dy = to.top + to.height / 2 - (from.top + from.height / 2);
          sfx?.whoosh(0, 0.5);
          await fly.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.55 - 40}px) scale(1.5)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(.6)`, opacity: 0.15 }
          ], { duration: 580 * pace, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' }).finished.catch(() => {});
          fly.remove();
          alive();
          const steps = Math.min(Math.abs(part.value), 8);
          const dir = Math.sign(part.value);
          for (let s = 1; s <= steps && !skipping; s++) {
            setTotal(s === steps ? running + part.value : running + dir * s);
            if (part.isPenalty) sfx?.tickDown(s);
            else sfx?.tick(s);
            await wait(70);
          }
          alive();
        }
        card.classList.add('is-spent');
        running += part.value;
        setTotal(running);
        pulse(totalEl);
        if (!skipping) {
          if (part.isPenalty) sfx?.penalty(i);
          else sfx?.bell(i);
        }
        card.classList.remove('is-active');
        await wait(420);
        alive();
      }
      setTotal(currentTotal);
      await wait(activeParts.length ? 420 : 200);
      alive();

      // 7. veredito
      state = 'done';
      let word = '', tone = 'neutral';
      const evaluateVerdict = () => {
        if (cls.crit) { word = 'Sucesso Crítico'; tone = 'crit'; }
        else if (cls.fumble) { word = 'Falha Crítica'; tone = 'fumble'; }
        else if (finalSuccess === true) { word = 'Sucesso'; tone = 'success'; }
        else if (finalSuccess === false) { word = 'Falha'; tone = 'failure'; }
        else { word = `Total ${currentTotal}`; tone = 'neutral'; }
        const notes = [];
        if (dreadIndex >= 0) {
          if (vanquished) notes.push('✦ Pavor vencido');
          else if (!countedValues.length) notes.push('O Pavor consumiu todos os dados');
          else if (currentDestroyed.size) notes.push(`O Pavor destruiu ${currentDestroyed.size} ${currentDestroyed.size === 1 ? 'dado' : 'dados'}`);
          else notes.push('Você resistiu ao Pavor');
        }
        if (cls.ra !== null) notes.push(`RA ${cls.ra} · RB ${cls.rb}`);
        verdictEl.innerHTML = `
          <strong class="bg3-verdict-word${word && !word.startsWith('Total') ? '' : ' is-total'}">${word}</strong>
          ${notes.length ? `<span class="bg3-verdict-notes">${notes.map(safeHtml).join('<i>◆</i>')}</span>` : ''}`;
        stage.classList.remove('tone-crit', 'tone-fumble', 'tone-success', 'tone-failure', 'tone-neutral');
        stage.classList.add(`tone-${tone}`);
        if (cls.crit) {
          dice.forEach(d => {
            if (currentCounted.includes(d.index)) {
              d.material.emissive.set('#ffb02e');
              d.material.emissiveIntensity = 0.8;
            }
          });
        }
      };
      stage.classList.remove('is-rolling');
      stage.classList.add('is-done');
      evaluateVerdict();
      sfx?.verdict(tone);
      burstSparks(sp.x, sp.y, tone);
      if (main && (tone === 'crit' || tone === 'success')) {
        main.material.emissive.set(tone === 'crit' ? '#ffb02e' : '#c98a2a');
        tween(1100, e => { main.material.emissiveIntensity = Math.sin(e * Math.PI) * (tone === 'crit' ? 0.9 : 0.4); }, t => t);
      }

      const updateDieSelectionVisual = () => {
        dice.forEach((d, i) => {
          const isSel = (i === selectedDieIdx);
          if (isSel) {
            d.material.emissive.set('#ffcf5a');
            d.material.emissiveIntensity = 0.55;
          } else if (cls.crit && currentCounted.includes(i)) {
            d.material.emissive.set('#ffb02e');
            d.material.emissiveIntensity = 0.65;
          } else {
            d.material.emissive.set(d.cfg?.dread ? '#7c3aed' : '#000000');
            d.material.emissiveIntensity = d.cfg?.dread ? 0.28 : 0;
          }
        });
        tray.querySelectorAll('.bg3-die-target').forEach(btn => {
          const idx = Number(btn.dataset.pickDie);
          btn.classList.toggle('is-selected', idx === selectedDieIdx);
        });
      };

      const renderDieTargetsOverlay = () => {
        let targetsEl = tray.querySelector('.bg3-die-targets');
        if (!targetsEl) {
          targetsEl = document.createElement('div');
          targetsEl.className = 'bg3-die-targets';
          tray.appendChild(targetsEl);
        }
        const idx = selectedDieIdx;
        const d = dice[idx];
        if (!d || !currentCounted.includes(idx)) { targetsEl.innerHTML = ''; return; }
        const val = values[idx];
        const name = d.cfg?.label || `d${d.sides}`;
        const sp = toScreen(d.mesh.position);
        const bits = [];
        if (armed === 'analise' && analiseReaction) {
          const adj = analiseAdj[idx] || 0;
          const can = dir => (dir < 0 ? val > 1 : val < d.sides) && (analiseCharges > 0 || adj * dir < 0);
          const tip = dir => (adj * dir < 0 ? 'Desfazer: devolve o marcador' : 'Gasta 1 marcador de Análise');
          bits.push(`<span class="bg3-pop-group">
            <i>Análise</i>
            <button type="button" class="bg3-chip-act bg3-analise-step" data-die-idx="${idx}" data-analise-delta="-1" title="${tip(-1)}" ${can(-1) ? '' : 'disabled'}>−</button>
            <button type="button" class="bg3-chip-act bg3-analise-step" data-die-idx="${idx}" data-analise-delta="+1" title="${tip(1)}" ${can(1) ? '' : 'disabled'}>+</button>
          </span>`);
        }
        if (armed === 'prontidao' && prontidaoReaction && !prontidaoUsed) {
          const off = !prontidaoAvailable || val === 1;
          bits.push(`<span class="bg3-pop-group">
            <i>Prontidão</i>
            <button type="button" class="bg3-chip-act bg3-chip-reroll bg3-prontidao-btn" data-reroll-idx="${idx}" title="${!prontidaoAvailable ? 'PD insuficiente (2 PD)' : val === 1 ? 'Não rerola resultado 1' : 'Rerolar este dado (2 PD)'}" ${off ? 'disabled' : ''}>↺ 2 PD</button>
          </span>`);
        }
        targetsEl.innerHTML = bits.length ? `
          <div class="bg3-die-pop" style="left:${sp.x}px; top:${Math.min(H - 30, sp.y + 46)}px;">${bits.join('')}</div>` : '';
      };

      const renderReactionsUi = () => {
        const reactionsEl = stage.querySelector('.bg3-reactions');
        if (!currentCounted.includes(selectedDieIdx)) selectedDieIdx = -1;
        if (armed && selectedDieIdx === -1 && currentCounted.length === 1) selectedDieIdx = currentCounted[0];
        updateDieSelectionVisual();
        renderDieTargetsOverlay();

        // Os cards de baixo são os botões: refletem recursos e a habilidade "armada"
        stage.querySelectorAll('.bg3-analise-count').forEach(el => { el.textContent = String(analiseCharges); });
        const setCard = (sel, off, on) => stage.querySelectorAll(sel).forEach(c => { c.classList.toggle('is-disabled', off); c.classList.toggle('is-armed', on); c.classList.add('is-post'); });
        setCard('[data-card-sub="analise"]', analiseCharges < 1 && !Object.values(analiseAdj).some(v => v), armed === 'analise');
        setCard('[data-card-sub="prontidao"]', !prontidaoAvailable || prontidaoUsed, armed === 'prontidao');
        stage.querySelectorAll('.bg3-card[data-activatable-idx]').forEach(c => {
          const a = activatables[Number(c.dataset.activatableIdx)];
          if (a?.subType !== 'impeto') return;
          c.classList.toggle('is-disabled', impetoCharges < 1);
          c.classList.remove('is-spent');
          c.classList.add('is-post');
          const h = c.querySelector('.bg3-card-hint');
          if (h) h.textContent = `${impetoCharges}/5 disp.`;
        });

        if (reactionsEl) {
          const msg = armed && selectedDieIdx === -1 ? `${armed === 'analise' ? 'Análise' : 'Prontidão'}: clique em um dado`
            : (!armed && (analiseReaction || prontidaoReaction || impetoReaction) ? 'Opcional · use os cards abaixo' : '');
          reactionsEl.innerHTML = `
            ${msg ? `<p class="bg3-opt-hint">${msg}</p>` : ''}
            <button type="button" class="bg3-confirm-done-btn"><span>Continuar (Espaço / Esc)</span></button>`;
        }
      };
      selectedDieIdx = -1;
      postRoll = { render: renderReactionsUi, verdict: evaluateVerdict, sp };
      renderReactionsUi();

      hint.textContent = 'Espaço ou Esc para fechar';
      finish();

      const hasReactions = (analiseReaction && analiseCharges > 0) || (prontidaoReaction && prontidaoAvailable && !prontidaoUsed && values.some(v => v !== 1)) || (impetoCharges > 0);
      const life = hasReactions ? 60000 : (quick ? 4200 : (tone === 'crit' || tone === 'fumble' ? 11000 : 9000));
      const t = setTimeout(() => closeDiceCinematicAlt(), life);
      timers.add(t);
    };

    const rerollDie = async (d) => {
      const newVal = Math.floor(Math.random() * d.sides) + 1;
      const face = d.faces.find(f => f.value === newVal) || d.faces[0];
      d.faces.forEach(f => {
        f.hidden = (f !== face);
        f.label.material.opacity = (f === face ? 1 : 0);
      });
      d.mesh.visible = true;
      d.material.opacity = 1;
      d.material.emissive.set('#000000');
      sfx?.shake(1);
      sfx?.whoosh(0, 0.4);

      const startP = d.mesh.position.clone();
      const upP = startP.clone().add(new THREE.Vector3(0, -0.6, 0.8));
      const qt = targetQuaternion(face, (Math.random() - 0.5) * 0.3);

      await tween(580, (e, t) => {
        d.mesh.position.lerpVectors(startP, upP, Math.sin(e * Math.PI));
        d.mesh.quaternion.slerp(qt, e).premultiply(tmpQ.setFromAxisAngle(yAxis, (1 - e) * 8));
      });
      d.mesh.quaternion.copy(qt);
      d.mesh.position.copy(startP);
      sfx?.settle();
      return newVal;
    };

    // Recalcula resultado/veredito depois de qualquer mudança nos dados (Ímpeto, Análise, Prontidão).
    let postRoll = null; // preenchido no veredito: { render, verdict }
    const syncOutcome = () => {
      const o = calcOutcome(Number(payload.modifier ?? modifier) || 0);
      ({ destroyed, counted, countedValues, chosenValue, chosenIndex, vanquished } = o);
      cls = classify(o);
      baseValue = baseOf(o);
      currentCounted = [...counted, ...(o.impetoCounted || [])];
      currentTotal = o.total;
      payload.total = currentTotal;
      payload.values = [...values];
      payload.dice = payload.values;
      payload.destroyed = [...destroyed];
      payload.breakdown = list.map((d, i) => ({
        sides: d.sides, value: values[i], label: d.label || '',
        isChosen: i === chosenIndex, dread: i === dreadIndex, destroyed: destroyed.has(i),
        discarded: (chosenIndex >= 0 && i !== chosenIndex && !d.isImpeto) || destroyed.has(i) || i === dreadIndex
      }));
      payload.chosenValue = o.chosenValue;
      if (dt !== null) { finalSuccess = currentTotal >= dt; payload.success = finalSuccess; }
      return o;
    };

    const start = () => {
      if (state !== 'waiting') return;
      state = 'starting';

      const selectedActs = activatables.filter(a => a.selected);
      if (selectedActs.some(a => a.subType === 'impeto')) impetoCharges = Math.max(0, impetoCharges - 1);
      if (selectedActs.length && typeof options.onConsume === 'function') {
        options.onConsume(selectedActs.map(a => a.raw || a));
      }

      const resolvedActs = selectedActs.map(a => {
        let val = a.value;
        let label = a.label;
        if (a.subType === 'impeto') {
          // Ímpeto já foi adicionado como dado físico 3D na bandeja!
          val = 0;
          label = `${a.label} (+d4 no teste)`;
        } else if (a.diceRoll === '1d4') {
          const roll1d4 = Math.floor(Math.random() * 4) + 1;
          val = roll1d4;
          label = `${a.label} (+${roll1d4})`;
        }
        return {
          label,
          value: val,
          isPenalty: val < 0,
          element: stage.querySelector(`[data-activatable-idx="${activatables.indexOf(a)}"]`),
          resolvedVal: val
        };
      });

      resolvedActs.forEach(ra => {
        if (ra.element && ra.resolvedVal !== 0) {
          const valEl = ra.element.querySelector('.bg3-card-value');
          if (valEl) valEl.textContent = signed(ra.resolvedVal);
        }
      });

      activeParts = [
        ...parts.map((p, i) => ({
          ...p,
          element: stage.querySelector(`.bg3-card[data-card="${i}"]`)
        })),
        ...resolvedActs.filter(ra => ra.value !== 0)
      ];

      const activeMod = activeParts.reduce((acc, p) => acc + p.value, 0);
      currentTotal = baseValue + activeMod;
      payload.total = currentTotal;
      payload.modifier = activeMod;
      payload.modifierParts = activeParts.map(p => ({ label: p.label, value: p.value, isPenalty: p.isPenalty }));
      if (dt !== null) {
        finalSuccess = currentTotal >= dt;
        payload.success = finalSuccess;
      }

      runSequence().catch(err => {
        if (err === CLOSED) return;
        console.error(err);
        closeDiceCinematicAlt();
      });
    };

    /* ---------- entrada ---------- */
    const onInput = e => {
      if (e.type === 'keydown') {
        if (![' ', 'Enter', 'Escape'].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') {
          if (state === 'rolling') skip();
          else closeDiceCinematicAlt();
          return;
        }
        if (state === 'waiting') start();
        else if (state === 'done') closeDiceCinematicAlt();
        else skip();
        return;
      }
      e.stopPropagation();
      if (e.target.closest('.bg3-close')) { closeDiceCinematicAlt(); return; }
      if (state === 'waiting') {
        const actBtn = e.target.closest('[data-activatable-idx]');
        if (actBtn) {
          const idx = Number(actBtn.dataset.activatableIdx);
          const act = activatables[idx];
          if (act) {
            if (!act.canAfford) {
              actBtn.classList.remove('is-shaking');
              void actBtn.offsetWidth;
              actBtn.classList.add('is-shaking');
              sfx?.penalty?.();
              setStatus(`${act.label}: ${act.hint || 'recursos insuficientes'}`);
              setTimeout(() => setStatus(''), 2200);
              return;
            }
            act.selected = !act.selected;
            actBtn.classList.toggle('is-selected', act.selected);
            actBtn.setAttribute('aria-pressed', act.selected ? 'true' : 'false');
            const totalValEl = stage.querySelector('.bg3-total-mod-val');
            if (totalValEl) totalValEl.textContent = calcBonusDisplay();
            sfx?.tick(act.selected ? 3 : 1);

            // Se for Ímpeto, adiciona ou remove o d4 físico 3D na bandeja antes da rolagem!
            if (act.subType === 'impeto') {
              if (act.selected) {
                const impetoCfg = { sides: 4, color: '#e0150d', label: 'Ímpeto', isImpeto: true };
                list.push(impetoCfg);
                values.push(Math.floor(Math.random() * 4) + 1);
                const d = takeDie(S, impetoCfg);
                d.index = dice.length;
                d.cfg = impetoCfg;
                d.mesh.__die = d;
                dice.push(d);
                currentCounted.push(d.index);
                placeIdle();
                syncOutcome();
                currentSimPromise = computeSim();
                sfx?.whoosh?.(0, 0.3);
              } else {
                const impIdx = list.findIndex(c => c.isImpeto);
                if (impIdx >= 0) {
                  list.splice(impIdx, 1);
                  values.splice(impIdx, 1);
                  const [d] = dice.splice(impIdx, 1);
                  if (d) releaseDie(S, d);
                  const cIdx = currentCounted.indexOf(impIdx);
                  if (cIdx >= 0) currentCounted.splice(cIdx, 1);
                  dice.forEach((di, i) => { di.index = i; });
                  placeIdle();
                  syncOutcome();
                  currentSimPromise = computeSim();
                }
              }
            }
          }
          return;
        }
        if (e.target.closest('.bg3-roll-btn, .bg3-tray')) start();
        return;
      }
      if (state === 'done') {
        // Ações pós-rolagem, aplicadas ao dado escolhido no próprio dado
        const refreshAfter = (kind) => {
          syncOutcome();
          setTotal(currentTotal);
          pulse(totalEl);
          if (kind === 'up' || kind === 'impeto') { sfx?.bell?.(); burstSparks(postRoll.sp.x, postRoll.sp.y, cls.crit ? 'crit' : 'success'); }
          else if (kind === 'down') sfx?.penalty?.();
          else sfx?.reveal?.();
          if (cls.crit && kind !== 'up') burstSparks(postRoll.sp.x, postRoll.sp.y, 'crit');
          postRoll.verdict();
          postRoll.render();
        };
        const showFace = (d, v, ms = 220) => {
          const face = d.faces.find(f => f.value === v) || d.faces[0];
          d.faces.forEach(f => { f.hidden = (f !== face); f.label.material.opacity = (f === face ? 1 : 0); });
          const qt = targetQuaternion(face, (Math.random() - 0.5) * 0.1);
          tween(ms, e2 => d.mesh.quaternion.slerp(qt, e2));
        };

        // Ímpeto: +1d4 que rola na bandeja e soma ao teste (gasta 1 espaço da barra)
        const doImpeto = () => {
          const spent = options.onSpendMarker ? options.onSpendMarker(impetoReaction?.cardId || 'impeto', impetoReaction?.markerId || 'impeto-m', 1) : true;
          if (spent === false) return;
          impetoCharges = Math.max(0, impetoCharges - 1);
          const impetoCfg = { sides: 4, color: '#e0150d', label: 'Ímpeto', isImpeto: true };
          const d = takeDie(S, impetoCfg);
          d.index = dice.length;
          d.cfg = impetoCfg;
          d.mesh.__die = d;
          dice.push(d);
          list.push(impetoCfg);
          values.push(1);
          d.mesh.position.set(0, CAM_H * 0.22, 0.4);
          rerollDie(d).then(newVal => {
            values[d.index] = newVal;
            refreshAfter('impeto');
          });
        };

        // Cards de baixo: Ímpeto rola o d4; Análise/Prontidão armam o ajuste de um dado
        const cardEl = e.target.closest('.bg3-card.is-activatable, .bg3-card-analise, .bg3-card-prontidao');
        if (cardEl && postRoll) {
          const act = cardEl.dataset.activatableIdx !== undefined ? activatables[Number(cardEl.dataset.activatableIdx)] : null;
          if (act?.subType === 'impeto') {
            if (impetoCharges < 1) { sfx?.penalty?.(); return; }
            doImpeto();
          } else if (cardEl.dataset.cardSub === 'analise' || cardEl.dataset.cardSub === 'prontidao') {
            const kind = cardEl.dataset.cardSub;
            armed = armed === kind ? null : kind;
            sfx?.tick?.(2);
            postRoll.render();
          }
          return;
        }

        // Análise: ±1 no dado (inverter o mesmo dado devolve o marcador)
        const analiseBtn = e.target.closest('.bg3-analise-step');
        if (analiseBtn && postRoll) {
          if (analiseBtn.disabled) return;
          const dieIdx = Number(analiseBtn.dataset.dieIdx);
          const delta = Number(analiseBtn.dataset.analiseDelta) || 0;
          const d = dice[dieIdx];
          const nextVal = d ? values[dieIdx] + delta : 0;
          const adj = analiseAdj[dieIdx] || 0;
          const refund = adj * delta < 0;
          if (d && delta && nextVal >= 1 && nextVal <= d.sides && (refund || analiseCharges > 0)) {
            const mk = [analiseReaction?.cardId || 'analise', analiseReaction?.markerId || 'analise-m', 1];
            const ok = refund
              ? (options.onRefundMarker ? options.onRefundMarker(...mk) : true)
              : (options.onSpendMarker ? options.onSpendMarker(...mk) : true);
            if (ok !== false) {
              analiseCharges += refund ? 1 : -1;
              analiseAdj[dieIdx] = adj + delta;
              values[dieIdx] = nextVal;
              showFace(d, nextVal);
              refreshAfter(delta > 0 ? 'up' : 'down');
            }
          }
          return;
        }

        // Prontidão: rerola o dado (uma vez, resultado ≠ 1)
        const prontidaoBtn = e.target.closest('.bg3-prontidao-btn');
        if (prontidaoBtn && postRoll) {
          if (prontidaoBtn.disabled || prontidaoUsed) return;
          const dieIdx = Number(prontidaoBtn.dataset.rerollIdx);
          const d = dice[dieIdx];
          if (d && values[dieIdx] !== 1) {
            const spent = options.onSpendPd ? options.onSpendPd(2, 'Prontidão') : true;
            if (spent !== false) {
              prontidaoUsed = true;
              armed = null;
              rerollDie(d).then(newVal => {
                values[dieIdx] = newVal;
                delete analiseAdj[dieIdx];
                refreshAfter('reroll');
              });
            }
          }
          return;
        }

        // Seleção via clique direto na bandeja 3D (raycast)
        if (!e.target.closest('.bg3-die-pop') && e.target.closest('.bg3-tray, .bg3-canvas')) {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const meshes = currentCounted.map(i => dice[i]?.mesh).filter(Boolean);
          const hits = raycaster.intersectObjects(meshes, true);
          if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj && !obj.__die) obj = obj.parent;
            if (obj && obj.__die) {
              selectedDieIdx = obj.__die.index;
              postRoll?.render();
              sfx?.tick(2);
              return;
            }
          }
          if (selectedDieIdx !== -1) { selectedDieIdx = -1; postRoll?.render(); return; }
        }

        if (e.target.closest('.bg3-confirm-done-btn, .bg3-shade')) {
          closeDiceCinematicAlt();
          return;
        }
        return;
      }
      if (state === 'rolling') skip();
    };
    stage.addEventListener('click', onInput);
    window.addEventListener('keydown', onInput, true);

    const onResize = () => {
      W = tray.clientWidth || W;
      H = tray.clientHeight || H;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    };
    window.addEventListener('resize', onResize);

    stage._close = (immediate = false) => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      pending.forEach(r => r());
      tweens.forEach(tw => tw.res());
      tweens.clear();
      simDone?.();
      if (dreadRun) { try { dreadRun.seq.finish(); } catch {} dreadRun.done(); }
      stage.removeEventListener('click', onInput);
      window.removeEventListener('keydown', onInput, true);
      window.removeEventListener('resize', onResize);
      if (activeStage === stage) activeStage = null;
      finish();
      // devolve os dados ao estoque e restaura a cena compartilhada
      dice.forEach(d => releaseDie(S, d));
      releaseEffectPrograms(scene);
      reserve.forEach(l => { if (!l.parent) scene.add(l); });
      hemi.intensity = 0.35;
      key.intensity = 1.7;
      const remove = () => {
        if (renderer.domElement.parentNode === tray) renderer.domElement.remove();
        stage.remove();
      };
      if (immediate) { remove(); return; }
      stage.classList.add('is-closing');
      setTimeout(remove, 300);
    };

    // a bandeja só tem tamanho depois de entrar no DOM
    onResize();
    placeIdle();
    requestAnimationFrame(() => stage.classList.add('is-open'));
    // primeira vez: compila os shaders sem travar a página antes de desenhar
    const begin = () => {
      if (closed) return;
      S.warm = true;
      raf = requestAnimationFrame(frame);
      if (!waitForClick) setTimeout(start, 150);
    };
    if (S.warm) begin();
    else renderer.compileAsync(scene, camera).then(begin, begin);
    if (waitForClick) btn.focus({ preventScroll: true });
    closeBtn.addEventListener('pointerdown', e => e.stopPropagation());
  });
}

/* ================================================================== */
/* FECHAMENTO                                                          */
/* ================================================================== */

export function closeDiceCinematicAlt(opts = {}) {
  const immediate = typeof opts === 'boolean' ? opts : Boolean(opts?.immediate);
  const stage = activeStage || document.getElementById('bg3-roll-stage');
  if (!stage) return;
  if (stage._close) stage._close(immediate);
  else stage.remove();
}
