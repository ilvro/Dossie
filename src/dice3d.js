import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createDreadSequence } from './dice-dread-fx.js';
import { createCritSequence, createFumbleSequence } from './fx/dice-crit-fx.js';
import { countUp, fxEnabled } from './fx/ui-fx.js';

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

function addFaceNumbers(mesh, faces, sides) {
  const scale = sides >= 20 ? .25 : sides >= 12 ? .31 : sides >= 10 ? .34 : .43;
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
  geometry.scale(DIE_SCALE, DIE_SCALE, DIE_SCALE);
  geometry.computeVertexNormals();
  const faces = faceData(geometry).slice(0, sides);
  const material = new THREE.MeshStandardMaterial({ color: config.color || 0xe51b2b, roughness: .42, metalness: .08, flatShading: true });
  if (config.dread) { material.emissive = new THREE.Color('#a855f7'); material.emissiveIntensity = .35; material.roughness = .3; material.metalness = .3; }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 12), new THREE.LineBasicMaterial({ color: config.dread ? 0xe9d5ff : 0xffa3aa, transparent: true, opacity: .78 })));
  addFaceNumbers(mesh, faces, sides);
  scene.add(mesh);

  const shape = cannonShapeFromGeometry(geometry);
  const offset = (index - (total - 1) / 2) * .72;
  const body = new CANNON.Body({ mass: .72, shape, material: world.diceMaterial, allowSleep: true, sleepSpeedLimit: .24, sleepTimeLimit: .28 });
  const launch = world.launch;
  if (launch === 0) {
    // Lançamento da esquerda em direção ao centro da ficha
    body.position.set(-world.boundsX * 0.72, 2.0 + Math.random() * 1.2 + index * .15, offset * 0.6 + (Math.random() - .5) * .4);
    body.velocity.set(4.5 + Math.random() * 1.6, -3.2 - Math.random() * 1.2, (Math.random() - .5) * 2.0);
  } else if (launch === 1) {
    // Lançamento da direita em direção ao centro da ficha
    body.position.set(world.boundsX * 0.72, 2.0 + Math.random() * 1.2 + index * .15, offset * 0.6 + (Math.random() - .5) * .4);
    body.velocity.set(-4.5 - Math.random() * 1.6, -3.2 - Math.random() * 1.2, (Math.random() - .5) * 2.0);
  } else if (launch === 2) {
    // Queda rolada do topo central da ficha
    body.position.set(offset * 0.6 + (Math.random() - .5) * 0.8, 3.2 + index * .15, (Math.random() - .5) * 0.8);
    body.velocity.set((Math.random() - .5) * 2.2, -4.5 - Math.random() * 1.2, (Math.random() - .5) * 2.2);
  } else {
    // Lançamento de frente em direção ao fundo da mesa
    body.position.set(offset * 0.6 + (Math.random() - .5) * 0.8, 1.8 + Math.random() * 1.0, world.boundsZ * 0.7);
    body.velocity.set((Math.random() - .5) * 2.2, -3.0 - Math.random() * 1.2, -4.5 - Math.random() * 1.5);
  }
  body.angularVelocity.set(13 + Math.random() * 10, 11 + Math.random() * 12, 12 + Math.random() * 11);
  body.angularDamping = .13; body.linearDamping = .035;
  body.quaternion.setFromEuler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  let lastImpact = 0;
  body.addEventListener('collide', event => {
    const now = performance.now(), velocity = Math.abs(event.contact?.getImpactVelocityAlongNormal?.() || 0);
    if (velocity > .7 && now - lastImpact > 42) { lastImpact = now; playDiceImpact(velocity); }
  });
  world.addBody(body);
  return { mesh, body, faces, sides, dread: Boolean(config.dread), label: config.label || `d${sides}` };
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

function showResult(resultNode, dice, results, title, modifier = 0, rollMode = 'sum', outcome = computeOutcome(dice, results, rollMode, modifier, -1)) {
  const { dreadIndex, destroyed, countedValues, total, chosenIndex, vanquished } = outcome;
  const modifierLabel = modifier ? `<i>${modifier > 0 ? '+' : '−'}</i><span class="modifier">${Math.abs(modifier)}</span>` : '';
  const isPick = rollMode === 'highest' || rollMode === 'lowest';
  const tags = results.map((value, index) => {
    const classes = (isPick || dreadIndex >= 0) ? ['roll-die-tag'] : [];
    if (index === dreadIndex) classes.push('dread', vanquished ? 'vanquished' : 'active');
    else if (destroyed.has(index)) classes.push('destroyed');
    else if (isPick) classes.push(index === chosenIndex ? 'chosen' : 'discarded');
    const prefix = index === dreadIndex ? (vanquished ? '✦ ' : '☠ ') : '';
    return `<span class="${classes.join(' ')}" style="--tag-i:${index}">${prefix}<b>${value}</b> d${dice[index].sides}</span>`;
  });
  const sep = (isPick || dreadIndex >= 0) ? ' ' : '<i>+</i>';
  const diceBreakdownHtml = tags.join(sep) + modifierLabel;

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

export function rollDice3d(configs, title = 'Rolagem', modifier = 0, sharedAudioContext = null, rollMode = 'sum') {
  const list = Array.isArray(configs) ? configs : [{ sides: configs }];
  const stage = document.querySelector('#dice-stage');
  const canvas = document.querySelector('#dice-canvas');
  const resultNode = document.querySelector('#dice-stage-result');
  if (!stage || !canvas) return Promise.resolve(null);
  if (sharedAudioContext) audioContext = sharedAudioContext;
  getAudioContext();
  activeSequence?.finish();
  activeSequence = null;
  cancelAnimationFrame(animationFrame); clearTimeout(cleanupTimer);
  stage.classList.remove('dread-active', 'dread-impact', 'dread-vanquished', 'fumble-desat');
  stage.classList.add('active'); resultNode.classList.remove('visible', 'dread-result', 'crit-result', 'fumble-result');

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, .1, 100);
    camera.position.set(0, 3.3, 9); camera.lookAt(0, .7, 0);
    const hemi = new THREE.HemisphereLight(0xcce1ff, 0x210006, 2.4); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4.5); key.position.set(-4, 8, 5); key.castShadow = true; scene.add(key);
    const accent = new THREE.PointLight(0xff1f47, 15, 10); accent.position.set(4, 2, 4); scene.add(accent);

    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -25, 0) });
    world.allowSleep = true; world.broadphase = new CANNON.SAPBroadphase(world);
    world.boundsX = Math.min(2.85, 1.65 * width / height);
    world.boundsZ = 2.2;
    world.launch = Math.floor(Math.random() * 4);
    world.diceMaterial = new CANNON.Material('dice');
    const floorMaterial = new CANNON.Material('floor');
    world.addContactMaterial(new CANNON.ContactMaterial(world.diceMaterial, floorMaterial, { friction: .25, restitution: .55 }));
    world.addContactMaterial(new CANNON.ContactMaterial(world.diceMaterial, world.diceMaterial, { friction: .15, restitution: .40 }));
    const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: floorMaterial });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); floorBody.position.y = -1.15; world.addBody(floorBody);
    const wallMaterial = floorMaterial;
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

    const dice = list.map((config, index) => createDie(scene, world, config, index, list.length));
    const dreadIndex = dice.findIndex(die => die.dread);
    const start = performance.now(); let last = start; let settledAt = 0; let finishedAt = 0; let finished = false;
    let sequenceFactories = [];
    let currentSequence = null;
    let seqIndex = 0;

    function animate(now) {
      const delta = Math.min(.033, (now - last) / 1000); last = now;
      if (currentSequence) {
        // Durante a execução de FX os dados são controlados pelas sequências
        const running = currentSequence.update(now);
        renderer.render(scene, camera);
        if (running) { animationFrame = requestAnimationFrame(animate); return; }
        currentSequence.finish();
        seqIndex++;
        if (seqIndex < sequenceFactories.length) {
          const isLast = seqIndex === sequenceFactories.length - 1;
          currentSequence = sequenceFactories[seqIndex](isLast ? revealResult : undefined);
          activeSequence = currentSequence;
          animationFrame = requestAnimationFrame(animate);
          return;
        }
        currentSequence = null;
        activeSequence = null;
        return;
      }
      if (finished && !currentSequence && now - finishedAt >= 900) return;
      world.step(1 / 60, delta, 3);

      // Trava de segurança física: impede que dados saiam da área da ficha mesmo com tunelamento
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

        const revealResult = () => {
          showResult(resultNode, dice, values, title, modifier, rollMode, outcome);
          clearTimeout(cleanupTimer);
          cleanupTimer = setTimeout(closeDice3d, classification.crit ? 5200 : 4200);
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
              isChosen: i === chosenIndex,
              dread: i === dreadIndex,
              destroyed: destroyed.has(i),
              discarded: (chosenIndex >= 0 && i !== chosenIndex) || destroyed.has(i) || i === dreadIndex
            }))
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

export function closeDice3d() {
  activeSequence?.finish();
  activeSequence = null;
  document.querySelector('#dice-stage')?.classList.remove('active', 'dread-active', 'dread-impact', 'dread-vanquished', 'fumble-desat');
  document.querySelector('#dice-stage-result')?.classList.remove('visible', 'crit-result', 'dread-result', 'fumble-result');
  cancelAnimationFrame(animationFrame); clearTimeout(cleanupTimer);
}
