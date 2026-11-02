import * as THREE from 'three';
import * as CANNON from 'cannon-es';

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
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 12), new THREE.LineBasicMaterial({ color: 0xffa3aa, transparent: true, opacity: .78 })));
  addFaceNumbers(mesh, faces, sides);
  scene.add(mesh);

  const shape = cannonShapeFromGeometry(geometry);
  const offset = (index - (total - 1) / 2) * .82;
  const body = new CANNON.Body({ mass: .72, shape, material: world.diceMaterial, allowSleep: true, sleepSpeedLimit: .24, sleepTimeLimit: .28 });
  const launch = world.launch;
  if (launch === 0) {
    body.position.set(-world.boundsX + .7, 1.1 + Math.random() * 2.1 + index * .18, offset + (Math.random() - .5) * .6);
    body.velocity.set(7.5 + Math.random() * 2.2, -2.5 - Math.random() * 2, (Math.random() - .5) * 3.4);
  } else if (launch === 1) {
    body.position.set(world.boundsX - .7, 1.1 + Math.random() * 2.1 + index * .18, offset + (Math.random() - .5) * .6);
    body.velocity.set(-7.5 - Math.random() * 2.2, -2.5 - Math.random() * 2, (Math.random() - .5) * 3.4);
  } else if (launch === 2) {
    body.position.set(offset + (Math.random() - .5) * 2.8, 3.45 + index * .16, (Math.random() - .5) * 1.4);
    body.velocity.set((Math.random() - .5) * 5.5, -5.5 - Math.random() * 2, (Math.random() - .5) * 3.6);
  } else {
    body.position.set(offset + (Math.random() - .5) * 2.4, 1.2 + Math.random() * 1.4, world.boundsZ - .65);
    body.velocity.set((Math.random() - .5) * 4.5, -3 - Math.random() * 2, -7.2 - Math.random() * 2);
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
  return { mesh, body, faces, sides, label: config.label || `d${sides}` };
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

function showResult(resultNode, dice, results, title, modifier = 0, rollMode = 'sum') {
  let total;
  let diceBreakdownHtml;
  const modifierLabel = modifier ? `<i>${modifier > 0 ? '+' : '−'}</i><span class="modifier">${Math.abs(modifier)}</span>` : '';
  if (rollMode === 'highest' || rollMode === 'lowest') {
    const targetVal = rollMode === 'highest' ? Math.max(...results) : Math.min(...results);
    const chosenIndex = results.indexOf(targetVal);
    total = targetVal + modifier;
    diceBreakdownHtml = results.map((value, index) => {
      const isChosen = index === chosenIndex;
      return `<span class="roll-die-tag ${isChosen ? 'chosen' : 'discarded'}"><b>${value}</b> d${dice[index].sides}</span>`;
    }).join(' ') + modifierLabel;
  } else {
    total = results.reduce((sum, value) => sum + value, 0) + modifier;
    diceBreakdownHtml = results.map((value, index) => `<span><b>${value}</b> d${dice[index].sides}</span>`).join('<i>+</i>') + modifierLabel;
  }

  let vigiliaMetaHtml = '';
  if (results.length >= 2 && dice.every(d => d.sides !== 20)) {
    const ra = Math.max(...results);
    const rb = Math.min(...results);
    const countHighest = results.filter(v => v === ra).length;
    const isCritSuccess = countHighest >= 2 && ra >= 6;
    const isCritFumble = results.every(v => v === 1);

    vigiliaMetaHtml = `
      <div class="vigilia-roll-meta">
        <span class="ra-badge" title="Rolagem Alta (maior dado)">RA: <b>${ra}</b></span>
        <span class="rb-badge" title="Rolagem Baixa (menor dado)">RB: <b>${rb}</b></span>
      </div>
      ${isCritSuccess ? '<span class="roll-crit-badge">★ SUCESSO CRÍTICO!</span>' : ''}
      ${isCritFumble ? '<span class="roll-fumble-badge">☠ FALHA CRÍTICA!</span>' : ''}
    `;
  }

  resultNode.innerHTML = `<small>${title}</small><div>${diceBreakdownHtml}</div>${vigiliaMetaHtml}<strong>${total}</strong><button type="button" class="btn-dice-open-log" data-open-roll-log title="Ver histórico de rolagens">HISTÓRICO ▾</button>`;

  resultNode.classList.add('visible');
}

export function rollDice3d(configs, title = 'Rolagem', modifier = 0, sharedAudioContext = null, rollMode = 'sum') {
  const list = Array.isArray(configs) ? configs : [{ sides: configs }];
  const stage = document.querySelector('#dice-stage');
  const canvas = document.querySelector('#dice-canvas');
  const resultNode = document.querySelector('#dice-stage-result');
  if (!stage || !canvas) return Promise.resolve(null);
  if (sharedAudioContext) audioContext = sharedAudioContext;
  getAudioContext();
  cancelAnimationFrame(animationFrame); clearTimeout(cleanupTimer);
  stage.classList.add('active'); resultNode.classList.remove('visible');

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
    scene.add(new THREE.HemisphereLight(0xcce1ff, 0x210006, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 4.5); key.position.set(-4, 8, 5); key.castShadow = true; scene.add(key);
    const accent = new THREE.PointLight(0xff1f47, 15, 10); accent.position.set(4, 2, 4); scene.add(accent);

    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -25, 0) });
    world.allowSleep = true; world.broadphase = new CANNON.SAPBroadphase(world);
    world.boundsX = Math.min(5.15, 2.9 * width / height);
    world.boundsZ = 2.7;
    world.launch = Math.floor(Math.random() * 4);
    world.diceMaterial = new CANNON.Material('dice');
    const floorMaterial = new CANNON.Material('floor');
    world.addContactMaterial(new CANNON.ContactMaterial(world.diceMaterial, floorMaterial, { friction: .25, restitution: .57 }));
    world.addContactMaterial(new CANNON.ContactMaterial(world.diceMaterial, world.diceMaterial, { friction: .15, restitution: .42 }));
    const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: floorMaterial });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); floorBody.position.y = -1.15; world.addBody(floorBody);
    const wallMaterial = floorMaterial;
    const wallSpecs = [
      [new CANNON.Vec3(.08, 3.4, world.boundsZ), new CANNON.Vec3(-world.boundsX, 1.8, 0)],
      [new CANNON.Vec3(.08, 3.4, world.boundsZ), new CANNON.Vec3(world.boundsX, 1.8, 0)],
      [new CANNON.Vec3(world.boundsX, 3.4, .08), new CANNON.Vec3(0, 1.8, -world.boundsZ)],
      [new CANNON.Vec3(world.boundsX, 3.4, .08), new CANNON.Vec3(0, 1.8, world.boundsZ)],
      [new CANNON.Vec3(world.boundsX, .08, world.boundsZ), new CANNON.Vec3(0, 4.15, 0)]
    ];
    wallSpecs.forEach(([halfExtents, position]) => {
      const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(halfExtents), material: wallMaterial });
      wall.position.copy(position); world.addBody(wall);
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(world.boundsX * 2, world.boundsZ * 2), new THREE.ShadowMaterial({ color: 0x000000, opacity: .25 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.14; floor.receiveShadow = true; scene.add(floor);

    const dice = list.map((config, index) => createDie(scene, world, config, index, list.length));
    const start = performance.now(); let last = start; let settledAt = 0; let finishedAt = 0; let finished = false;
    function animate(now) {
      const delta = Math.min(.033, (now - last) / 1000); last = now;
      world.step(1 / 60, delta, 3);
      dice.forEach(die => {
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
        const values = dice.map(topFace);
        let total = 0;
        let chosenValue = null;
        let chosenIndex = -1;
        if (rollMode === 'highest') {
          chosenValue = Math.max(...values);
          chosenIndex = values.indexOf(chosenValue);
          total = chosenValue + modifier;
        } else if (rollMode === 'lowest') {
          chosenValue = Math.min(...values);
          chosenIndex = values.indexOf(chosenValue);
          total = chosenValue + modifier;
        } else {
          total = values.reduce((s, v) => s + v, 0) + modifier;
        }
        showResult(resultNode, dice, values, title, modifier, rollMode);
        cleanupTimer = setTimeout(closeDice3d, 4200);
        finishResolve({
          values,
          total,
          chosenValue,
          chosenIndex,
          rollMode,
          dice: values,
          breakdown: dice.map((d, i) => ({ sides: d.sides, value: values[i], isChosen: i === chosenIndex, discarded: (chosenIndex >= 0 && i !== chosenIndex) }))
        });
      }
      if (!finished || now - finishedAt < 900) animationFrame = requestAnimationFrame(animate);
    }
    animationFrame = requestAnimationFrame(animate);
  });
}

export function closeDice3d() {
  document.querySelector('#dice-stage')?.classList.remove('active');
  document.querySelector('#dice-stage-result')?.classList.remove('visible');
  cancelAnimationFrame(animationFrame); clearTimeout(cleanupTimer);
}
