/**
 * src/fx/dice-tray.js
 * Palco da cena de rolagem: um círculo ritual gravado no chão, com poça de luz
 * e sombra. Não é um objeto 3D com bordas: o protagonista é o dado. As paredes
 * físicas (invisíveis) ficam em dice3d.js.
 */
import * as THREE from 'three';
import { clamp01, easeOutCubic } from './dice-fx-primitives.js';

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
    pulseStart = performance.now();
  }

  function update(now) {
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
    scene.remove(group);
    shadowGeo.dispose(); shadowMat.dispose();
    poolGeo.dispose(); poolMat.dispose();
    sigilGeo.dispose(); innerMat.dispose(); outerMat.dispose();
    spot.shadow.map?.dispose();
    spot.dispose?.();
  }

  return { group, enter, exit, update, pulse, dispose };
}
