/**
 * src/fx/dice-tray.js
 * Palco da cena de rolagem: um círculo ritual gravado no chão, com poça de luz
 * e sombra. Não é um objeto 3D com bordas: o protagonista é o dado. As paredes
 * físicas (invisíveis) ficam em dice3d.js.
 */
import * as THREE from 'three';
import {
  clamp01,
  easeOutCubic,
  easeInCubic,
  rand,
  createDust,
  createShockwave
} from './dice-fx-primitives.js';

const BONE = '#e9e1cf';
const EMBER = '#c0262d';

let sigilTextures = null;

// Desenha um anel de "runas": traços curtos irregulares que lembram glifos.
function drawRunes(ctx, radius, count, size) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    ctx.save();
    ctx.rotate(ang);
    ctx.translate(0, -radius);
    const seed = (i * 7919) % 13;
    ctx.beginPath();
    ctx.moveTo(-size * .35, -size * .5);
    ctx.lineTo(-size * .35, size * .5);
    if (seed % 3 === 0) { ctx.moveTo(-size * .35, -size * .1); ctx.lineTo(size * .35, -size * .5); }
    if (seed % 3 === 1) { ctx.moveTo(-size * .35, 0); ctx.lineTo(size * .35, size * .5); ctx.moveTo(-size * .35, 0); ctx.lineTo(size * .35, -size * .5); }
    if (seed % 3 === 2) { ctx.moveTo(size * .35, -size * .5); ctx.lineTo(size * .35, size * .5); ctx.moveTo(-size * .35, 0); ctx.lineTo(size * .35, 0); }
    if (seed % 4 === 0) { ctx.moveTo(-size * .6, size * .5); ctx.lineTo(size * .6, size * .5); }
    ctx.stroke();
    ctx.restore();
  }
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return canvas;
}

function toTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Gera uma vez: anel externo (gira), selo interno (fixo) e poça de luz.
function getSigilTextures() {
  if (sigilTextures) return sigilTextures;
  const S = 1024, C = S / 2;

  const outer = makeCanvas(S);
  let ctx = outer.getContext('2d');
  ctx.translate(C, C);
  ctx.strokeStyle = BONE; ctx.lineCap = 'round';
  ctx.globalAlpha = .9; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 492, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = .55; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 476, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 418, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 96; i++) {
    const ang = (i / 96) * Math.PI * 2, major = i % 8 === 0;
    ctx.globalAlpha = major ? .9 : .4; ctx.lineWidth = major ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 476, Math.sin(ang) * 476);
    ctx.lineTo(Math.cos(ang) * (major ? 452 : 466), Math.sin(ang) * (major ? 452 : 466));
    ctx.stroke();
  }
  ctx.globalAlpha = .7; ctx.lineWidth = 2.2;
  drawRunes(ctx, 447, 40, 18);
  // Losangos nos quatro pontos cardeais, em brasa.
  ctx.fillStyle = EMBER; ctx.globalAlpha = .95;
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.translate(0, -492);
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(8, 0); ctx.lineTo(0, 13); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  const inner = makeCanvas(S);
  ctx = inner.getContext('2d');
  ctx.translate(C, C);
  ctx.strokeStyle = BONE; ctx.lineCap = 'round';
  ctx.globalAlpha = .4; ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 9]);
  ctx.beginPath(); ctx.arc(0, 0, 380, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  // Heptagrama aberto: geometria ritual sem cara de pentagrama de cartoon.
  ctx.globalAlpha = .22; ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i <= 7; i++) {
    const ang = (i * 3 / 7) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(ang) * 340, y = Math.sin(ang) * 340;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = .3;
  ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = .16;
  ctx.beginPath(); ctx.arc(0, 0, 210, 0, Math.PI * 2); ctx.stroke();

  const pool = makeCanvas(512);
  ctx = pool.getContext('2d');
  const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255, 240, 214, .34)');
  grad.addColorStop(.45, 'rgba(255, 228, 190, .14)');
  grad.addColorStop(.8, 'rgba(255, 210, 170, .03)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);

  sigilTextures = { outer: toTexture(outer), inner: toTexture(inner), pool: toTexture(pool) };
  return sigilTextures;
}

export function createTray({ scene, radius = 1.7, floorY = -1.14 }) {
  const group = new THREE.Group();
  const textures = getSigilTextures();
  const decalMaterial = (map, opacity) => new THREE.MeshBasicMaterial({
    map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending
  });

  // Sombra dos dados (o chão em si é invisível; só a sombra aparece).
  const shadowGeo = new THREE.PlaneGeometry(radius * 6, radius * 6);
  const shadowMat = new THREE.ShadowMaterial({ color: 0x000000, opacity: .5, transparent: true });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = floorY; shadow.receiveShadow = true;
  group.add(shadow);

  const poolGeo = new THREE.PlaneGeometry(radius * 3.4, radius * 3.4);
  const poolMat = decalMaterial(textures.pool, 1);
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2; pool.position.y = floorY + .002;
  group.add(pool);

  // O anel externo fica um pouco além das paredes, para os dados nunca o cruzarem.
  const sigilSize = radius * 2.36;
  const sigilGeo = new THREE.PlaneGeometry(sigilSize, sigilSize);
  const innerMat = decalMaterial(textures.inner, .9);
  const inner = new THREE.Mesh(sigilGeo, innerMat);
  inner.rotation.x = -Math.PI / 2; inner.position.y = floorY + .004;
  group.add(inner);
  const outerMat = decalMaterial(textures.outer, .8);
  const outer = new THREE.Mesh(sigilGeo, outerMat);
  outer.rotation.x = -Math.PI / 2; outer.position.y = floorY + .006;
  group.add(outer);

  // Luz de palco: foco quente de cima, que dá volume e sombra aos dados.
  const spot = new THREE.SpotLight(0xfff1dc, 60, 16, Math.PI / 6.5, .75, 1.6);
  spot.position.set(0, 7.5, 2.4);
  spot.target.position.set(0, floorY, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -.0004;
  group.add(spot, spot.target);

  scene.add(group);

  const base = { outer: .8, inner: .9, pool: 1 };
  let enterStart = 0, exitStart = 0, exiting = false, pulseStart = -Infinity, exitResolve = null;
  let disintegrating = false, disintegrateStart = 0, disintegrateKind = 'fumble';
  const trayEffects = [];
  let lastNow = performance.now();
  const ENTER = 280, EXIT = 220, PULSE = 650;

  function setFade(alpha, boost = 0) {
    outerMat.opacity = Math.min(1, base.outer * alpha + boost);
    innerMat.opacity = Math.min(1, base.inner * alpha + boost * .5);
    poolMat.opacity = base.pool * alpha + boost * .6;
    shadowMat.opacity = .5 * alpha;
  }

  function enter() {
    enterStart = performance.now();
    setFade(0);
  }

  function exit() {
    if (exiting) return Promise.resolve();
    exiting = true;
    exitStart = performance.now();
    return new Promise(resolve => { exitResolve = resolve; });
  }

  // Brilho curto no selo: usado quando o total "pousa".
  function pulse() {
    if (disintegrating) return;
    pulseStart = performance.now();
  }

  // Desintegração dramática do círculo ritual (falha crítica ou pavor consome tudo)
  function disintegrate({ kind = 'fumble' } = {}) {
    if (disintegrating) return;
    disintegrating = true;
    disintegrateStart = performance.now();
    disintegrateKind = kind;

    const center = new THREE.Vector3(0, floorY, 0);
    if (kind === 'fumble') {
      // Onda de choque escura e cinzas de invocação destruída
      trayEffects.push(createShockwave(scene, center, {
        color: new THREE.Color('#3b1114'),
        maxScale: radius * 12,
        life: 1.1
      }));
      trayEffects.push(createDust(scene, new THREE.Vector3(0, floorY + 0.04, 0), {
        count: 220,
        colors: [new THREE.Color('#141418'), new THREE.Color('#2e1114'), new THREE.Color('#7f1d1d'), new THREE.Color('#383842')],
        rise: 1.2,
        speed: 2.2,
        life: 1.4,
        size: 0.12
      }));
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const px = Math.cos(ang) * radius * 0.95, pz = Math.sin(ang) * radius * 0.95;
        trayEffects.push(createDust(scene, new THREE.Vector3(px, floorY + 0.04, pz), {
          count: 45,
          colors: [new THREE.Color('#141418'), new THREE.Color('#4a151b'), new THREE.Color('#222228')],
          rise: 0.8,
          speed: 1.6,
          life: 1.1,
          size: 0.09
        }));
      }
    } else {
      // Pavor consome tudo: sobrecarga abissal roxa e brasas espectrais
      trayEffects.push(createShockwave(scene, center, {
        color: new THREE.Color('#a855f7'),
        maxScale: radius * 14,
        life: 1.2
      }));
      trayEffects.push(createShockwave(scene, center, {
        color: new THREE.Color('#c084fc'),
        maxScale: radius * 8,
        life: 0.85
      }));
      trayEffects.push(createDust(scene, new THREE.Vector3(0, floorY + 0.04, 0), {
        count: 260,
        colors: [new THREE.Color('#a855f7'), new THREE.Color('#c084fc'), new THREE.Color('#1a0b2e'), new THREE.Color('#4c1d95')],
        rise: 2.2,
        speed: 2.8,
        life: 1.6,
        size: 0.13
      }));
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const px = Math.cos(ang) * radius * 0.95, pz = Math.sin(ang) * radius * 0.95;
        trayEffects.push(createDust(scene, new THREE.Vector3(px, floorY + 0.04, pz), {
          count: 50,
          colors: [new THREE.Color('#7c3aed'), new THREE.Color('#c084fc'), new THREE.Color('#1e0b36')],
          rise: 1.6,
          speed: 1.9,
          life: 1.2,
          size: 0.10
        }));
      }
    }
  }

  function update(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;

    for (let i = trayEffects.length - 1; i >= 0; i--) {
      if (!trayEffects[i].update(dt)) {
        trayEffects[i].dispose();
        trayEffects.splice(i, 1);
      }
    }

    if (disintegrating) {
      const DURATION = 1200;
      const t = clamp01((now - disintegrateStart) / DURATION);

      // Tremor nos anéis que quebram
      const shake = (1 - t) * (t < 0.35 ? 0.09 : 0.035);
      outer.position.x = rand(-1, 1) * shake;
      outer.position.z = rand(-1, 1) * shake;
      inner.position.x = rand(-1, 1) * shake;
      inner.position.z = rand(-1, 1) * shake;
      outer.rotation.z += (rand(-1, 1) * shake * 0.4);

      // SpotLight falha e apaga
      const flicker = (Math.sin(now * 0.06) + Math.cos(now * 0.11)) * 0.5;
      spot.intensity = Math.max(0, 60 * (1 - easeInCubic(t)) * (0.35 + 0.65 * Math.max(0, flicker)));

      // Corrupção e desvanecimento das runas
      const fade = Math.max(0, 1 - easeInCubic(t));
      outerMat.opacity = base.outer * fade;
      innerMat.opacity = base.inner * fade;
      poolMat.opacity = base.pool * Math.max(0, 1 - easeInCubic(t * 1.6));
      shadowMat.opacity = 0.5 * fade;

      if (disintegrateKind === 'fumble') {
        outerMat.color.lerp(new THREE.Color('#221517'), 0.08);
        innerMat.color.lerp(new THREE.Color('#181113'), 0.08);
      } else {
        outerMat.color.lerp(new THREE.Color('#6b21a8'), 0.12);
        innerMat.color.lerp(new THREE.Color('#3b0764'), 0.12);
      }

      if (t >= 1) {
        outer.visible = inner.visible = pool.visible = false;
        spot.intensity = 0;
      }
      return;
    }

    outer.rotation.z = now * .00005;
    const pulseT = clamp01((now - pulseStart) / PULSE);
    const boost = pulseT < 1 ? (1 - easeOutCubic(pulseT)) * .6 : 0;
    if (exiting) {
      const t = clamp01((now - exitStart) / EXIT);
      setFade(1 - t);
      if (t >= 1 && exitResolve) { exitResolve(); exitResolve = null; }
      return;
    }
    const t = clamp01((now - enterStart) / ENTER), e = easeOutCubic(t);
    const scale = .82 + .18 * e;
    outer.scale.setScalar(scale);
    inner.scale.setScalar(.7 + .3 * e);
    setFade(e, boost);
  }

  function dispose() {
    exitResolve?.(); exitResolve = null;
    trayEffects.forEach(fx => fx.dispose());
    trayEffects.length = 0;
    scene.remove(group);
    shadowGeo.dispose(); shadowMat.dispose();
    poolGeo.dispose(); poolMat.dispose();
    sigilGeo.dispose(); innerMat.dispose(); outerMat.dispose();
    spot.shadow.map?.dispose();
    spot.dispose?.();
  }

  return { group, enter, exit, update, pulse, disintegrate, dispose };
}
