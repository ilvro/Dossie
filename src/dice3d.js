import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createDreadSequence } from './dice-dread-fx.js';
import { createCritSequence, createFumbleSequence } from './fx/dice-crit-fx.js';
import { countUp, fxEnabled, rollSceneEnabled, manualThrowEnabled } from './fx/ui-fx.js';
import { createTray } from './fx/dice-tray.js';
import { createRollHud } from './fx/dice-sum-fx.js';
import { createDiceHand } from './fx/dice-hand.js';

const geometryFactories = {
  4: () => new THREE.TetrahedronGeometry(.9),
  6: () => new THREE.BoxGeometry(1.35, 1.35, 1.35),
  8: () => new THREE.OctahedronGeometry(1),
  10: () => {
    const vertices = [0, 1.18, 0, 0, -1.18, 0];
    for (let i = 0; i < 5; i++) {
      const angle = i / 5 * Math.PI * 2 - Math.PI / 2;
      vertices.push(Math.cos(angle), 0, Math.sin(angle));
    }
    const indices = [];
    for (let i = 0; i < 5; i++) {
      const a = 2 + i, b = 2 + (i + 1) % 5;
      indices.push(0, a, b, 1, b, a);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  },
  12: () => new THREE.DodecahedronGeometry(.94),
  20: () => new THREE.IcosahedronGeometry(1)
};
const DIE_SCALE = .62;

let renderer;
let animationFrame;
let cleanupTimer;
let audioContext;
let noiseBuffer;
let activeSequence = null;
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

function getAudioContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  audioContext ??= new Context();
  audioContext.resume?.();
  if (!noiseBuffer) {
    noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * .055), audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  return audioContext;
}

function playDiceImpact(velocity) {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime, strength = Math.min(1, Math.max(.12, velocity / 10));
  const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
  source.buffer = noiseBuffer; filter.type = 'bandpass'; filter.frequency.value = 520 + Math.random() * 880; filter.Q.value = 1.2;
  gain.gain.setValueAtTime(.075 * strength, now); gain.gain.exponentialRampToValueAtTime(.0001, now + .045 + strength * .025);
  source.connect(filter).connect(gain).connect(context.destination); source.start(now);
}

function playTick(progress = 0) {
  const context = getAudioContext();
  if (!context) return;
  try {
    if (context.state === 'suspended') {
      context.resume?.().catch(() => {});
    }
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'triangle';
    const freq = 750 + progress * 750;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
    osc.connect(gain).connect(context.destination);
    osc.start(now);
    osc.stop(now + 0.042);
  } catch { /* áudio é opcional */ }
}

function faceData(geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = source.attributes.position;
  const faces = [];
  for (let i = 0; i < positions.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(positions, i);
    const b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
    const normal = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    const center = a.clone().add(b).add(c).divideScalar(3);
    let group = faces.find(face => face.normal.dot(normal) > .985);
    if (!group) { group = { normal, centers: [] }; faces.push(group); }
    group.centers.push(center);
  }
  return faces.map((face, index) => ({
    value: index + 1,
    normal: face.normal,
    center: face.centers.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(face.centers.length)
  }));
}

function numberTexture(value) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 128, 128);
  context.font = '900 92px Hanken Grotesk, sans-serif';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillStyle = '#fff'; context.fillText(String(value), 64, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addFaceNumbers(mesh, faces, sides, sizeFactor = 1) {
  const scale = (sides >= 20 ? .25 : sides >= 12 ? .31 : sides >= 10 ? .34 : .43) * sizeFactor;
  faces.forEach(face => {
    const material = new THREE.MeshBasicMaterial({ map: numberTexture(face.value), transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), material);
    label.position.copy(face.center).add(face.normal.clone().multiplyScalar(.018));
    label.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
    mesh.add(label);
  });
}

function cannonShapeFromGeometry(geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = source.attributes.position;
  const vertices = [], faces = [], lookup = new Map();
  const vertexIndex = point => {
    const key = `${point.x.toFixed(5)},${point.y.toFixed(5)},${point.z.toFixed(5)}`;
    if (!lookup.has(key)) { lookup.set(key, vertices.length); vertices.push(new CANNON.Vec3(point.x, point.y, point.z)); }
    return lookup.get(key);
  };
  for (let i = 0; i < positions.count; i += 3) {
    const points = [0, 1, 2].map(offset => new THREE.Vector3().fromBufferAttribute(positions, i + offset));
    const face = points.map(vertexIndex);
    const normal = new THREE.Vector3().crossVectors(points[1].clone().sub(points[0]), points[2].clone().sub(points[0]));
    const center = points[0].clone().add(points[1]).add(points[2]).divideScalar(3);
    if (normal.dot(center) < 0) face.reverse();
    faces.push(face);
  }
  return new CANNON.ConvexPolyhedron({ vertices, faces });
}

function createDie(scene, world, config, index, total) {
  const sides = Number(config.sides);
  const geometry = (geometryFactories[sides] || geometryFactories[20])();
  // Na cena os dados são um pouco menores, para caberem juntos no círculo
  const dieScale = world.sceneRadius ? .5 : DIE_SCALE;
  geometry.scale(dieScale, dieScale, dieScale);
  geometry.computeVertexNormals();
  const faces = faceData(geometry).slice(0, sides);
  const material = new THREE.MeshStandardMaterial({ color: config.color || 0xe51b2b, roughness: .42, metalness: .08, flatShading: true });
  if (config.dread) { material.emissive = new THREE.Color('#a855f7'); material.emissiveIntensity = .35; material.roughness = .3; material.metalness = .3; }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 12), new THREE.LineBasicMaterial({ color: config.dread ? 0xe9d5ff : 0xffa3aa, transparent: true, opacity: .78 })));
  addFaceNumbers(mesh, faces, sides, dieScale / DIE_SCALE);
  scene.add(mesh);

  const shape = cannonShapeFromGeometry(geometry);
  const offset = (index - (total - 1) / 2) * .72;
  const body = new CANNON.Body({ mass: .72, shape, material: world.diceMaterial, allowSleep: true, sleepSpeedLimit: .24, sleepTimeLimit: .28 });
  const launch = world.launch;
  const speedScale = world.boundsX <= 2.0 ? 0.75 : 1.0;

  let angScale = 1.0;
  if (world.throwVec) {
    const { dx, dy, power } = world.throwVec;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const nz = -dy / len;
    const dir = new THREE.Vector3(nx, 0, nz);
    const perp = new THREE.Vector3(-nz, 0, nx);
    angScale = 0.6 + power * 0.8;

    if (world.sceneRadius) {
      const r = world.sceneRadius;
      const spread = Math.min(r * 1.4, (total - 1) * .9);
      const lane = (total > 1 ? (index / (total - 1) - .5) * spread : 0) + (Math.random() - .5) * .3;
      const stagger = index * .22;
      const startPos = dir.clone().multiplyScalar(-r * 0.78 - stagger)
        .add(perp.clone().multiplyScalar(lane));
      body.position.set(startPos.x, -0.2 + Math.random() * 0.3, startPos.z);
      const speed = (2.2 + power * 3.6) * (r / 1.6);
      const vel = dir.clone().multiplyScalar(speed);
      body.velocity.set(vel.x, 1.6 + power * 1.2, vel.z);
    } else {
      const spread = Math.min(world.boundsX * 1.4, (total - 1) * .72);
      const lane = total > 1 ? (index / (total - 1) - .5) * spread : 0;
      const startPos = new THREE.Vector3(
        -dir.x * world.boundsX * 0.7,
        0,
        -dir.z * world.boundsZ * 0.7
      ).add(perp.clone().multiplyScalar(lane));
      body.position.set(startPos.x, 1.8 + Math.random() * 0.8, startPos.z);
      const speed = 3.5 + power * 7;
      const vel = dir.clone().multiplyScalar(speed);
      body.velocity.set(vel.x, -2.5 - power * 2, vel.z);
    }
  } else if (world.sceneRadius) {
    // Cena: o arremesso começa dentro do quadro, rente ao chão, e cruza o círculo
    // Espaçamento de um dado inteiro entre eles: nascer sobrepostos faz a física explodir
    const r = world.sceneRadius, side = launch % 2 ? 1 : -1, power = r / 1.6;
    const spread = Math.min(r * 1.4, (total - 1) * .9);
    const lane = (total > 1 ? (index / (total - 1) - .5) * spread : 0) + (Math.random() - .5) * .3;
    const stagger = index * .22, drift = (Math.random() - .5) * 2.2, speed = (2.6 + Math.random() * 1.4) * power;
    if (launch < 2) {
      body.position.set(side * (r * .78 + stagger), -.2 + Math.random() * .3, lane);
      body.velocity.set(-side * speed, 1.8 + Math.random() * .8, -lane * .5 + drift);
    } else {
      body.position.set(lane, -.2 + Math.random() * .3, r * .78 + stagger);
      body.velocity.set(-lane * .5 + drift, 2 + Math.random() * .8, -speed);
    }
  } else if (launch === 0) {
    // Lançamento da esquerda em direção ao centro da ficha
    body.position.set(-world.boundsX * 0.70, 2.0 + Math.random() * 1.0 + index * .15, offset * 0.4 + (Math.random() - .5) * .3);
    body.velocity.set((4.2 + Math.random() * 1.2) * speedScale, -3.2 - Math.random() * 1.0, (Math.random() - .5) * 1.6);
  } else if (launch === 1) {
    // Lançamento da direita em direção ao centro da ficha
    body.position.set(world.boundsX * 0.70, 2.0 + Math.random() * 1.0 + index * .15, offset * 0.4 + (Math.random() - .5) * .3);
    body.velocity.set((-4.2 - Math.random() * 1.2) * speedScale, -3.2 - Math.random() * 1.0, (Math.random() - .5) * 1.6);
  } else if (launch === 2) {
    // Queda rolada do topo central da ficha
    body.position.set(offset * 0.4 + (Math.random() - .5) * 0.5, 3.0 + index * .15, (Math.random() - .5) * 0.5);
    body.velocity.set((Math.random() - .5) * 1.8, -4.2 - Math.random() * 1.0, (Math.random() - .5) * 1.8);
  } else {
    // Lançamento de frente em direção ao fundo da mesa
    body.position.set(offset * 0.4 + (Math.random() - .5) * 0.5, 1.8 + Math.random() * 0.8, world.boundsZ * 0.65);
    body.velocity.set((Math.random() - .5) * 1.8, -3.0 - Math.random() * 1.0, (-4.2 - Math.random() * 1.2) * speedScale);
  }
  body.angularVelocity.set((13 + Math.random() * 10) * angScale, (11 + Math.random() * 12) * angScale, (12 + Math.random() * 11) * angScale);
  body.angularDamping = .13; body.linearDamping = world.sceneRadius ? .22 : .035;
  body.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  let lastImpact = 0;
  body.addEventListener('collide', event => {
    const now = performance.now(), velocity = Math.abs(event.contact?.getImpactVelocityAlongNormal?.() || 0);
    if (velocity > .7 && now - lastImpact > 42) { lastImpact = now; playDiceImpact(velocity); }
    if (velocity > 2.8 && world.onHardImpact) {
      world.onHardImpact();
    }
  });
  world.addBody(body);
  const flashBase = { color: material.emissive.clone(), intensity: material.emissiveIntensity };
  return { mesh, body, faces, sides, flashBase, color: config.color, dread: Boolean(config.dread), label: config.label || `d${sides}` };
}

function topFace(die) {
  const quaternion = new THREE.Quaternion(die.body.quaternion.x, die.body.quaternion.y, die.body.quaternion.z, die.body.quaternion.w);
  let best = die.faces[0], bestY = -Infinity;
  die.faces.forEach(face => {
    const y = face.normal.clone().applyQuaternion(quaternion).y;
    if (y > bestY) { bestY = y; best = face; }
  });
  return best.value;
}

/**
 * Calcula o resultado considerando o Dado de Pavor:
 * - o dado de pavor não entra na soma/escolha;
 * - todo dado com valor MENOR que o do pavor é destruído (anulado);
 * - se o pavor tirar 1, nada é destruído e o pavor é vencido.
 */
function computeOutcome(dice, values, rollMode, modifier, dreadIndex) {
  const dreadValue = dreadIndex >= 0 ? values[dreadIndex] : null;
  const vanquished = dreadValue === 1;
  const destroyed = new Set();
  if (dreadValue > 1) values.forEach((value, index) => { if (index !== dreadIndex && value < dreadValue) destroyed.add(index); });
  const counted = values.map((_, index) => index).filter(index => index !== dreadIndex && !destroyed.has(index));
  const countedValues = counted.map(index => values[index]);
  let total = modifier, chosenValue = null, chosenIndex = -1;
  if (countedValues.length) {
    if (rollMode === 'highest' || rollMode === 'lowest') {
      chosenValue = rollMode === 'highest' ? Math.max(...countedValues) : Math.min(...countedValues);
      chosenIndex = counted[countedValues.indexOf(chosenValue)];
      total = chosenValue + modifier;
    } else {
      total = countedValues.reduce((sum, value) => sum + value, 0) + modifier;
    }
  }
  return { dreadIndex, dreadValue, vanquished, destroyed, counted, countedValues, total, chosenValue, chosenIndex, values };
}

/**
 * Classifica a rolagem quanto a Sucesso Crítico ou Falha Crítica.
 * Mesma regra da Vigília: sem d20, ≥2 dados, contando apenas os dados válidos (outcome.counted).
 * critIndices = índices contados com valor RA (máximo 2 primeiros).
 */
export function classifyRoll(dice, outcome) {
  const { counted, countedValues, values } = outcome;
  if (!countedValues || countedValues.length < 1 || !dice || dice.length < 2 || dice.some(d => d.sides === 20)) {
    return { crit: false, fumble: false, ra: null, rb: null, critIndices: [], fumbleIndices: [] };
  }
  const ra = Math.max(...countedValues);
  const rb = Math.min(...countedValues);
  const countHighest = countedValues.filter(v => v === ra).length;
  const crit = countHighest >= 2 && ra >= 6;
  const fumble = countedValues.every(v => v === 1);

  const critIndices = crit
    ? counted.filter(idx => (values ? values[idx] : countedValues[counted.indexOf(idx)]) === ra).slice(0, 2)
    : [];

  const fumbleIndices = fumble
    ? counted.slice()
    : [];

  return { crit, fumble, ra, rb, critIndices, fumbleIndices };
}

function safe(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showResult(resultNode, dice, results, title, modifier = 0, rollMode = 'sum', outcome = computeOutcome(dice, results, rollMode, modifier, -1), options = {}) {
  const { dreadIndex, destroyed, countedValues, total, chosenIndex, vanquished } = outcome;
  const modifierParts = Array.isArray(options.modifierParts) ? options.modifierParts : [];

  let modifierLabel = '';
  if (modifierParts.length > 0) {
    modifierLabel = modifierParts.map(p => {
      const sign = p.value >= 0 ? '+' : '−';
      return `<span class="roll-die-tag mod-tag"><b>${sign}${Math.abs(p.value)}</b><small>${safe(p.label || 'BÔNUS')}</small></span>`;
    }).join(' ');
  } else if (modifier) {
    modifierLabel = `<span class="roll-die-tag mod-tag"><b>${modifier > 0 ? '+' : '−'}${Math.abs(modifier)}</b><small>BÔNUS</small></span>`;
  }

  const isPick = rollMode === 'highest' || rollMode === 'lowest';
  const hasLabels = dice.some(d => d.label) || modifierParts.length > 0;
  const tags = results.map((value, index) => {
    const d = dice[index];
    const classes = (isPick || dreadIndex >= 0 || hasLabels || d.label) ? ['roll-die-tag'] : [];
    if (index === dreadIndex) classes.push('dread', vanquished ? 'vanquished' : 'active');
    else if (destroyed.has(index)) classes.push('destroyed');
    else if (isPick) classes.push(index === chosenIndex ? 'chosen' : 'discarded');
    const prefix = index === dreadIndex ? (vanquished ? '✦ ' : '☠ ') : '';
    const labelText = d.label || `d${d.sides}`;
    return `<span class="${classes.join(' ')}" style="--tag-i:${index}"><b>${prefix}${value}</b><small>${safe(labelText)}</small></span>`;
  });
  const sep = (isPick || dreadIndex >= 0 || hasLabels) ? ' ' : '<i>+</i>';
  const diceBreakdownHtml = tags.join(sep) + (modifierLabel ? ` ${modifierLabel}` : '');

  const classification = classifyRoll(dice, outcome);
  const { crit: isCritSuccess, fumble: isCritFumble, ra, rb } = classification;

  let vigiliaMetaHtml = '';
  if (ra !== null && rb !== null) {
    vigiliaMetaHtml = `
      <div class="vigilia-roll-meta">
        <span class="ra-badge" title="Rolagem Alta (maior dado)">RA: <b>${ra}</b></span>
        <span class="rb-badge" title="Rolagem Baixa (menor dado)">RB: <b>${rb}</b></span>
      </div>
      ${isCritSuccess ? '<span class="roll-crit-badge">★ SUCESSO CRÍTICO!</span>' : ''}
      ${isCritFumble ? '<span class="roll-fumble-badge">☠ FALHA CRÍTICA!</span>' : ''}
    `;
  }
  let dreadHtml = '';
  if (dreadIndex >= 0) {
    if (vanquished) dreadHtml = '<span class="roll-dread-badge vanquished">✦ PAVOR VENCIDO!</span>';
    else if (!countedValues.length) dreadHtml = '<span class="roll-dread-badge total">☠ O PAVOR CONSUMIU TODOS OS DADOS</span>';
    else if (destroyed.size) dreadHtml = `<span class="roll-dread-badge">☠ PAVOR DESTRUIU ${destroyed.size} ${destroyed.size === 1 ? 'DADO' : 'DADOS'}</span>`;
    else dreadHtml = '<span class="roll-dread-badge resisted">VOCÊ RESISTIU AO PAVOR</span>';
  }

  const shouldAnimateTotal = fxEnabled() && total > 0;
  const totalHtml = shouldAnimateTotal
    ? `<strong data-total="${total}">0</strong>`
    : `<strong>${total}</strong>`;

  resultNode.innerHTML = `<small>${title}</small><div>${diceBreakdownHtml}</div>${vigiliaMetaHtml}${dreadHtml}${totalHtml}<button type="button" class="btn-dice-open-log" data-open-roll-log title="Ver histórico de rolagens">HISTÓRICO ▾</button>`;
  resultNode.classList.toggle('dread-result', dreadIndex >= 0);
  resultNode.classList.toggle('crit-result', isCritSuccess);
  resultNode.classList.toggle('fumble-result', isCritFumble);
  resultNode.classList.add('visible');

  if (shouldAnimateTotal) {
    const strong = resultNode.querySelector('strong[data-total]');
    if (strong) {
      const duration = isCritSuccess ? 900 : Math.min(650, 220 + total * 25);
      countUp(strong, total, {
        duration,
        onTick: (progress) => playTick(progress)
      }).then(() => {
        if (strong.isConnected) strong.classList.add('landed');
      });
    }
  }
}

function pulseStage(stage, className) {
  if (!stage) return;
  stage.classList.remove(className);
  void stage.offsetWidth;
  stage.classList.add(className);
}

let activeTray = null;
let activeHud = null;
let activeHand = null;
let stageGestureCleanup = null;
// Resolve a rolagem em andamento se ela for interrompida (nova rolagem ou fechamento).
let pendingFinish = null;

function openLogFromScene() {
  closeDice3d({ immediate: true });
  document.querySelector('.btn-nav-roll-log, [data-open-roll-log]')?.click();
}

export function rollDice3d(configs, title = 'Rolagem', modifier = 0, sharedAudioContext = null, rollMode = 'sum', options = {}) {
  const list = Array.isArray(configs) ? configs : [{ sides: configs }];
  const stage = document.querySelector('#dice-stage');
  const canvas = document.querySelector('#dice-canvas');
  const resultNode = document.querySelector('#dice-stage-result');
  if (!stage || !canvas) return Promise.resolve(null);
  if (sharedAudioContext) audioContext = sharedAudioContext;
  getAudioContext();
  closeDice3d({ immediate: true });

  const sceneMode = rollSceneEnabled();
  stage.classList.remove('dread-active', 'dread-impact', 'dread-vanquished', 'fumble-desat');
  stage.classList.add('active');
  if (sceneMode) {
    stage.classList.add('scene-mode');
  } else {
    stage.classList.remove('scene-mode');
  }
  resultNode.classList.remove('visible', 'dread-result', 'crit-result', 'fumble-result');

  return new Promise(resolve => {
    let resolved = false;
    const finishResolve = res => {
      if (!resolved) {
        resolved = true;
        resolve(res);
      }
    };

    renderer?.dispose();
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const width = innerWidth, height = innerHeight;
    renderer.setSize(width, height, false);
    const aspect = width / height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, aspect, .1, 100);
    const trayRadius = aspect < 1 ? 1.2 : 1.6;
    if (sceneMode) {
      // Enquadra o círculo inteiro na largura e deixa os dados grandes; o deslocamento
      // vertical sobe o círculo para abrir espaço ao total embaixo.
      const target = new THREE.Vector3(0, -1.15, 0);
      const halfTan = Math.tan(THREE.MathUtils.degToRad(17));
      const elevation = THREE.MathUtils.degToRad(aspect < 1 ? 58 : 52);
      const frontEdge = new THREE.Vector3(0, -1.15, trayRadius * 1.18);
      let dist = Math.max(8, (trayRadius * 2.36 + .5) / (2 * halfTan * aspect));
      // Em telas baixas, recua a câmera até sobrar espaço para o total embaixo do círculo
      for (let i = 0; i < 12; i++) {
        camera.position.set(0, target.y + Math.sin(elevation) * dist, Math.cos(elevation) * dist);
        camera.lookAt(target);
        camera.setViewOffset(width, height, 0, Math.round(height * .05), width, height);
        camera.updateMatrixWorld();
        if ((1 - frontEdge.clone().project(camera).y) / 2 * height <= height - Math.min(225, height * .3)) break;
        dist *= 1.08;
      }
    } else {
      camera.position.set(0, 3.3, 9);
      camera.lookAt(0, .7, 0);
    }
    const hemi = new THREE.HemisphereLight(0xcce1ff, 0x210006, 2.4); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4.5); key.position.set(-4, 8, 5); key.castShadow = true; scene.add(key);
    const accent = new THREE.PointLight(0xff1f47, 15, 10); accent.position.set(4, 2, 4); scene.add(accent);
    if (sceneMode) {
      // Na cena, o foco do palco (dice-tray) faz a luz principal e a sombra.
      hemi.intensity = 1.1; key.intensity = 1.6; key.castShadow = false; accent.intensity = 5;
    }

    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -25, 0) });
    world.allowSleep = true; world.broadphase = new CANNON.SAPBroadphase(world);
    world.launch = Math.floor(Math.random() * 4);
    world.diceMaterial = new CANNON.Material('dice');
    const floorMaterial = new CANNON.Material('floor');
    world.addContactMaterial(new CANNON.ContactMaterial(world.diceMaterial, floorMaterial, { friction: .25, restitution: .55 }));
    world.addContactMaterial(new CANNON.ContactMaterial(world.diceMaterial, world.diceMaterial, { friction: .15, restitution: .40 }));
    const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: floorMaterial });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); floorBody.position.y = -1.15; world.addBody(floorBody);
    const wallMaterial = floorMaterial;

    let tray = null;
    if (sceneMode) {
      world.sceneRadius = trayRadius;
      world.boundsX = trayRadius;
      world.boundsZ = trayRadius;

      // 12 paredes em círculo formando a contenção física da bandeja circular
      const N = 12;
      const segLen = 2 * trayRadius * Math.tan(Math.PI / N);
      for (let i = 0; i < N; i++) {
        const ang = (i * 2 * Math.PI) / N;
        const wall = new CANNON.Body({ mass: 0, material: wallMaterial });
        wall.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 3.0, segLen * 0.58)));
        wall.position.set(Math.cos(ang) * (trayRadius + 0.48), 1.8, Math.sin(ang) * (trayRadius + 0.48));
        wall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -ang);
        world.addBody(wall);
      }
      // Teto baixo: os dados nunca saem do enquadramento
      const ceiling = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(trayRadius * 2, 1.0, trayRadius * 2)), material: wallMaterial });
      ceiling.position.set(0, 2.7, 0);
      world.addBody(ceiling);

      tray = createTray({ scene, radius: trayRadius, floorY: -1.14 });
      tray.enter();
      activeTray = tray;
    } else {
      world.boundsX = Math.min(2.85, 1.65 * width / height);
      world.boundsZ = 2.2;
      const wallThickness = 1.0;
      const wallHeight = 5.0;
      const wallSpecs = [
        [new CANNON.Vec3(wallThickness, wallHeight, world.boundsZ + wallThickness), new CANNON.Vec3(-world.boundsX - wallThickness, 1.8, 0)],
        [new CANNON.Vec3(wallThickness, wallHeight, world.boundsZ + wallThickness), new CANNON.Vec3(world.boundsX + wallThickness, 1.8, 0)],
        [new CANNON.Vec3(world.boundsX + wallThickness, wallHeight, wallThickness), new CANNON.Vec3(0, 1.8, -world.boundsZ - wallThickness)],
        [new CANNON.Vec3(world.boundsX + wallThickness, wallHeight, wallThickness), new CANNON.Vec3(0, 1.8, world.boundsZ + wallThickness)],
        [new CANNON.Vec3(world.boundsX + wallThickness, wallThickness, world.boundsZ + wallThickness), new CANNON.Vec3(0, 4.8 + wallThickness, 0)]
      ];
      wallSpecs.forEach(([halfExtents, position]) => {
        const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(halfExtents), material: wallMaterial });
        wall.position.copy(position); world.addBody(wall);
      });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(world.boundsX * 2, world.boundsZ * 2), new THREE.ShadowMaterial({ color: 0x000000, opacity: .25 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -1.14; floor.receiveShadow = true; scene.add(floor);
    }

    world.throwVec = options.throw || null;
    if (tray && options.throw && options.throw.power > 0.7) {
      let hardImpactTriggered = false;
      world.onHardImpact = () => {
        if (hardImpactTriggered) return;
        hardImpactTriggered = true;
        tray.pulse();
      };
    }

    const dice = list.map((config, index) => createDie(scene, world, config, index, list.length));
    const dreadIndex = dice.findIndex(die => die.dread);
    let start = performance.now(); let last = start; let settledAt = 0; let finishedAt = 0; let finished = false;
    let sequenceFactories = [];
    let currentSequence = null;
    let seqIndex = 0;
    let revealResultFn = null;
    let skipRequested = false;
    let stampAt = 0;
    const baseFov = camera.fov;

    const toScreen = point => {
      const p = point.clone().project(camera);
      return { x: (p.x + 1) / 2 * width, y: (1 - p.y) / 2 * height };
    };
    const modifierParts = (options.modifierParts || []).filter(part => part.value);
    const partsSum = modifierParts.reduce((acc, part) => acc + part.value, 0);
    if (partsSum !== modifier) modifierParts.push({ label: 'BÔNUS', value: modifier - partsSum });

    let hud = null;
    let hand = null;
    if (sceneMode) {
      hud = createRollHud(stage, { title, configs: list, modifierParts, rollMode, audio: audioContext, onOpenLog: openLogFromScene });
      activeHud = hud;
      hud.layout({
        headBottom: toScreen(new THREE.Vector3(0, -1.15, -trayRadius * 1.18)).y - 14,
        totalTop: toScreen(new THREE.Vector3(0, -1.15, trayRadius * 1.18)).y + 4
      });

      // Testes com arremesso manual: os dados esperam na mão até o jogador jogar
      if (options.scene === 'full' && manualThrowEnabled() && !options.throw) {
        hand = createDiceHand({
          camera, dice, radius: trayRadius, size: { width, height }, stage,
          onRattle: playDiceImpact,
          onThrow: throws => {
            throws.forEach((t, i) => {
              const body = dice[i].body;
              body.position.set(t.position.x, t.position.y, t.position.z);
              body.quaternion.set(t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w);
              body.velocity.set(t.velocity.x, t.velocity.y, t.velocity.z);
              body.angularVelocity.set(t.angularVelocity.x, t.angularVelocity.y, t.angularVelocity.z);
              body.wakeUp();
              dice[i].mesh.scale.setScalar(1);
            });
            start = last = performance.now();
            settledAt = 0;
            hud.setHolding(false);
          }
        });
        activeHand = hand;
        hud.setHolding(true);
        // Se a cena for fechada antes do arremesso, a rolagem termina sem resultado
        pendingFinish = () => finishResolve(null);
      }

      // 1º gesto pula para o resultado; depois do selo, fecha.
      const handleGesture = e => {
        if (e.type === 'keydown') {
          if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Escape') return;
          e.preventDefault();
        }
        if (e.target?.closest?.('.rh-log')) return;
        e.stopPropagation();
        if (hand && !hand.thrown) {
          if (e.type === 'keydown') hand.throwAuto();
          return;
        }
        if (hand && e.type === 'click' && performance.now() - hand.thrownAt < 400) return;
        if (hud.sum?.stamped) {
          if (performance.now() - stampAt < 200) return;
          closeDice3d();
          return;
        }
        skipRequested = true;
        if (hud.sum) { hud.sum.skip(); return; }
        if (!finished) {
          for (let s = 0; s < 240 && !dice.every(d => d.body.sleepState === CANNON.Body.SLEEPING); s++) world.step(1 / 60, 1 / 60, 1);
          dice.forEach(die => { die.mesh.position.copy(die.body.position); die.mesh.quaternion.copy(die.body.quaternion); });
          settledAt = performance.now() - 1000;
          return;
        }
        if (currentSequence) {
          currentSequence.finish();
          currentSequence = null; activeSequence = null; sequenceFactories = [];
          revealResultFn?.();
        }
      };
      stage.addEventListener('click', handleGesture);
      window.addEventListener('keydown', handleGesture);
      stageGestureCleanup = () => {
        stage.removeEventListener('click', handleGesture);
        window.removeEventListener('keydown', handleGesture);
      };
    }

    // Depois do resultado, na cena: brilho no dado de onde o valor saiu e o "tranco" do total.
    function updateSceneFx(now) {
      dice.forEach(die => {
        if (!die.flashAt) return;
        const material = die.mesh.material;
        const k = 1 - (now - die.flashAt) / 380;
        if (k <= 0) { material.emissive.copy(die.flashBase.color); material.emissiveIntensity = die.flashBase.intensity; die.flashAt = 0; return; }
        material.emissive.set(die.color || '#ffffff');
        material.emissiveIntensity = die.flashBase.intensity + k * .9;
      });
      if (stampAt) {
        const t = (now - stampAt) / 360;
        camera.fov = t >= 1 ? baseFov : baseFov - Math.sin(Math.PI * t) * 1.4;
        camera.updateProjectionMatrix();
        if (t >= 1) stampAt = 0;
      }
    }

    function animate(now) {
      if (tray) tray.update(now);
      const delta = Math.min(.033, (now - last) / 1000); last = now;
      if (hand && !hand.thrown) {
        hand.update(now, delta);
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      if (sceneMode && finished && !currentSequence) {
        updateSceneFx(now);
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      if (currentSequence) {
        // Durante a execução de FX os dados são controlados pelas sequências
        const running = currentSequence.update(now);
        renderer.render(scene, camera);
        if (running) { animationFrame = requestAnimationFrame(animate); return; }
        currentSequence.finish();
        seqIndex++;
        if (seqIndex < sequenceFactories.length) {
          const isLast = seqIndex === sequenceFactories.length - 1;
          currentSequence = sequenceFactories[seqIndex](isLast ? revealResultFn : undefined);
          activeSequence = currentSequence;
          animationFrame = requestAnimationFrame(animate);
          return;
        }
        currentSequence = null;
        activeSequence = null;
        if (sceneMode) animationFrame = requestAnimationFrame(animate);
        return;
      }
      if (!sceneMode && finished && !currentSequence && now - finishedAt >= 900) return;
      world.step(1 / 60, delta, 3);

      // Trava de segurança física: impede que dados saiam da área da bandeja/ficha
      if (sceneMode) {
        const maxR = trayRadius - .12;
        dice.forEach(die => {
          const r = Math.hypot(die.body.position.x, die.body.position.z);
          if (r > maxR) {
            const factor = maxR / (r || 1);
            die.body.position.x *= factor;
            die.body.position.z *= factor;
            if (die.body.velocity.x * die.body.position.x + die.body.velocity.z * die.body.position.z > 0) {
              die.body.velocity.x *= -0.35;
              die.body.velocity.z *= -0.35;
            }
          }
          if (die.body.position.y < -1.10) {
            die.body.position.y = -1.10;
            if (die.body.velocity.y < 0) die.body.velocity.y = -die.body.velocity.y * 0.35;
          }
          die.mesh.position.copy(die.body.position);
          die.mesh.quaternion.copy(die.body.quaternion);
        });
      } else {
        const pad = 0.5;
        const minX = -world.boundsX + pad, maxX = world.boundsX - pad;
        const minZ = -world.boundsZ + pad, maxZ = world.boundsZ - pad;
        const minY = -1.14 + pad * 0.5;

        dice.forEach(die => {
          if (die.body.position.x < minX) {
            die.body.position.x = minX;
            if (die.body.velocity.x < 0) die.body.velocity.x = -die.body.velocity.x * 0.35;
          } else if (die.body.position.x > maxX) {
            die.body.position.x = maxX;
            if (die.body.velocity.x > 0) die.body.velocity.x = -die.body.velocity.x * 0.35;
          }

          if (die.body.position.z < minZ) {
            die.body.position.z = minZ;
            if (die.body.velocity.z < 0) die.body.velocity.z = -die.body.velocity.z * 0.35;
          } else if (die.body.position.z > maxZ) {
            die.body.position.z = maxZ;
            if (die.body.velocity.z > 0) die.body.velocity.z = -die.body.velocity.z * 0.35;
          }

          if (die.body.position.y < minY) {
            die.body.position.y = minY;
            if (die.body.velocity.y < 0) die.body.velocity.y = -die.body.velocity.y * 0.35;
          }

          die.mesh.position.copy(die.body.position);
          die.mesh.quaternion.copy(die.body.quaternion);
        });
      }
      renderer.render(scene, camera);
      const slow = dice.every(die => die.body.velocity.length() < .25 && die.body.angularVelocity.length() < .32);
      if (slow) settledAt ||= now; else settledAt = 0;
      if (!finished && ((settledAt && now - settledAt > 260) || now - start > 4200)) {
        finished = true;
        finishedAt = now;
        dice.forEach(die => { die.body.velocity.setZero(); die.body.angularVelocity.setZero(); });
        let values = dice.map(topFace);

        // Modo de teste dev: força resultados se window.__forceDice estiver definido
        if (import.meta.env.DEV && Array.isArray(window.__forceDice)) {
          const forced = window.__forceDice;
          window.__forceDice = null;
          forced.forEach((fVal, idx) => {
            if (fVal !== undefined && dice[idx]) {
              values[idx] = fVal;
              const die = dice[idx];
              const targetFace = die.faces?.find(f => f.value === fVal);
              if (targetFace && die.mesh) {
                const q = new THREE.Quaternion().setFromUnitVectors(targetFace.normal.clone(), new THREE.Vector3(0, 1, 0));
                const rotY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
                q.multiply(rotY);
                die.mesh.quaternion.copy(q);
                die.body.quaternion.copy(q);
              }
            }
          });
        }

        const outcome = computeOutcome(dice, values, rollMode, modifier, dreadIndex);
        const { total, chosenValue, chosenIndex, destroyed } = outcome;
        const classification = classifyRoll(dice, outcome);

        let resultsShown = false;
        const revealResult = () => {
          if (resultsShown) return;
          resultsShown = true;
          if (sceneMode) {
            playSceneSum();
            return;
          }
          showResult(resultNode, dice, values, title, modifier, rollMode, outcome, options);
          clearTimeout(cleanupTimer);
          cleanupTimer = setTimeout(closeDice3d, classification.crit ? 5200 : 4200);
          resolveRoll();
        };
        revealResultFn = revealResult;

        const resolveRoll = () => {
          pendingFinish = null;
          finishResolve({
            values,
            total,
            chosenValue,
            chosenIndex,
            rollMode,
            dice: values,
            dreadValue: outcome.dreadValue,
            vanquished: outcome.vanquished,
            destroyed: [...destroyed],
            breakdown: dice.map((d, i) => ({
              sides: d.sides,
              value: values[i],
              label: d.label || '',
              isChosen: i === chosenIndex,
              dread: i === dreadIndex,
              destroyed: destroyed.has(i),
              discarded: (chosenIndex >= 0 && i !== chosenIndex) || destroyed.has(i) || i === dreadIndex
            }))
          });
        };
        pendingFinish = resolveRoll;

        const playSceneSum = () => {
          const items = dice.map((die, i) => {
            const item = { index: i, value: values[i], label: die.label || `d${die.sides}`, color: die.color };
            if (i === dreadIndex) return { ...item, kind: outcome.vanquished ? 'vanquished' : 'dread' };
            if (destroyed.has(i)) return { ...item, kind: 'destroyed' };
            if (chosenIndex >= 0 && i !== chosenIndex) return { ...item, kind: 'discarded' };
            return { ...item, kind: 'die' };
          });
          modifierParts.forEach(part => items.push({ kind: 'mod', value: part.value, label: part.label }));

          const banners = [];
          if (classification.crit) banners.push('<span class="rh-banner crit">★ SUCESSO CRÍTICO</span>');
          if (classification.fumble) banners.push('<span class="rh-banner fumble">☠ FALHA CRÍTICA</span>');
          if (dreadIndex >= 0) {
            if (outcome.vanquished) banners.push('<span class="rh-banner dread vanquished">✦ PAVOR VENCIDO</span>');
            else if (!outcome.countedValues.length) banners.push('<span class="rh-banner dread">☠ O PAVOR CONSUMIU TODOS OS DADOS</span>');
            else if (destroyed.size) banners.push(`<span class="rh-banner dread">☠ PAVOR DESTRUIU ${destroyed.size} ${destroyed.size === 1 ? 'DADO' : 'DADOS'}</span>`);
            else banners.push('<span class="rh-banner dread resisted">VOCÊ RESISTIU AO PAVOR</span>');
          }
          if (classification.ra !== null) banners.push(`<span class="rh-meta">RA <b>${classification.ra}</b> · RB <b>${classification.rb}</b></span>`);

          const sum = hud.playSum({
            items, total,
            quick: options.scene !== 'full',
            instant: skipRequested,
            project: i => toScreen(dice[i].mesh.getWorldPosition(new THREE.Vector3())),
            onLaunch: i => { dice[i].flashAt = performance.now(); },
            onTick: playTick,
            verdict: { crit: classification.crit, fumble: classification.fumble, html: banners.join('') },
            onStamp: () => { stampAt = performance.now(); tray?.pulse(); }
          });
          sum.done.then(() => {
            resolveRoll();
            clearTimeout(cleanupTimer);
          });
        };

        sequenceFactories = [];
        if (dreadIndex >= 0) {
          sequenceFactories.push((onSeqReveal) => {
            stage.classList.add('dread-active');
            return createDreadSequence({
              scene, camera, dice, dreadIndex,
              victims: [...destroyed],
              vanquished: outcome.vanquished,
              lights: { hemi, key },
              audio: audioContext,
              reducedMotion: Boolean(reducedMotionQuery?.matches),
              onImpact: kind => pulseStage(stage, kind === 'vanquished' ? 'dread-vanquished' : 'dread-impact'),
              onReveal: () => {
                stage.classList.remove('dread-active');
                onSeqReveal?.();
              }
            });
          });
        }

        if (classification.crit) {
          sequenceFactories.push((onSeqReveal) => {
            return createCritSequence({
              scene, camera, dice,
              indices: classification.critIndices,
              lights: { hemi, key },
              audio: audioContext,
              reducedMotion: Boolean(reducedMotionQuery?.matches),
              zoom: sceneMode ? .4 : 1,
              ...(sceneMode ? { sigilSize: trayRadius * 2.2, sigilCenter: new THREE.Vector3(0, 0, 0) } : {}),
              onReveal: onSeqReveal
            });
          });
        }

        if (classification.fumble) {
          sequenceFactories.push((onSeqReveal) => {
            return createFumbleSequence({
              scene, camera, dice, renderer,
              indices: classification.fumbleIndices,
              lights: { hemi, key },
              audio: audioContext,
              reducedMotion: Boolean(reducedMotionQuery?.matches),
              onReveal: onSeqReveal,
              stage
            });
          });
        }

        if (skipRequested) sequenceFactories = [];
        if (sequenceFactories.length) {
          seqIndex = 0;
          currentSequence = sequenceFactories[0](sequenceFactories.length === 1 ? revealResult : undefined);
          activeSequence = currentSequence;
        } else {
          revealResult();
        }
      }
      animationFrame = requestAnimationFrame(animate);
    }
    animationFrame = requestAnimationFrame(animate);
  });
}

export function closeDice3d(opts = {}) {
  const immediate = typeof opts === 'boolean' ? opts : Boolean(opts?.immediate);
  pendingFinish?.();
  pendingFinish = null;
  activeHand?.dispose();
  activeHand = null;
  activeSequence?.finish();
  activeSequence = null;
  if (stageGestureCleanup) {
    stageGestureCleanup();
    stageGestureCleanup = null;
  }
  clearTimeout(cleanupTimer);

  const stage = document.querySelector('#dice-stage');
  const resultNode = document.querySelector('#dice-stage-result');

  const finalizeDom = () => {
    cancelAnimationFrame(animationFrame);
    stage?.classList.remove('active', 'scene-mode', 'stage-closing', 'dread-active', 'dread-impact', 'dread-vanquished', 'fumble-desat');
    resultNode?.classList.remove('visible', 'crit-result', 'dread-result', 'fumble-result');
    if (activeTray) {
      activeTray.dispose();
      activeTray = null;
    }
    activeHud?.destroy();
    activeHud = null;
  };

  if (activeTray && !immediate && stage?.classList.contains('scene-mode')) {
    stage.classList.add('stage-closing');
    const trayToExit = activeTray;
    activeTray = null;
    let done = false;
    const safeDone = () => {
      if (done) return;
      done = true;
      trayToExit.dispose();
      finalizeDom();
    };
    activeHud?.root.classList.add('out');
    setTimeout(safeDone, 280);
    trayToExit.exit().then(safeDone);
  } else {
    finalizeDom();
  }
}
