/**
 * dice-crit-fx.js
 * Sequências cinematográficas 3D para Sucesso Crítico e Falha Crítica.
 * - Sucesso Crítico: Sigilo de Conhecimento dourado expande no chão, os dados
 *   se erguem, colidem no ar com "clink" harmônico, faíscas douradas e zoom de câmera.
 * - Falha Crítica: Dados tremem de pavor, escurecem, racham, som de estalo seco
 *   com rangido grave, afundam na mesa cortados pelo plano do chão e a tela dessatura.
 */
import * as THREE from 'three';
import {
  FLOOR_Y,
  clamp01,
  easeOutCubic,
  easeInCubic,
  easeInOutCubic,
  rand,
  createShockwave,
  createDust,
  noise
} from './dice-fx-primitives.js';

const GOLD = new THREE.Color('#fde68a');
const GOLD_HOT = new THREE.Color('#fbbf24');
const GOLD_SPARK = new THREE.Color('#fffbeb');

/* ------------------------------------------------------------------ */
/* Textura procedural: Sigilo de Conhecimento (Ordem Paranormal)       */
/* ------------------------------------------------------------------ */
let sigilTexture = null;
function getKnowledgeSigilTexture() {
  if (sigilTexture) return sigilTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const cx = 256, cy = 256;

  ctx.clearRect(0, 0, 512, 512);

  // Brilho dourado radial de fundo
  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 250);
  bgGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
  bgGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.22)');
  bgGrad.addColorStop(0.8, 'rgba(217, 119, 6, 0.06)');
  bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#fffbeb';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;

  // Círculos concêntricos principais
  [238, 226, 218, 145, 76, 34].forEach((r, idx) => {
    ctx.lineWidth = idx === 0 || idx === 2 ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Marcações rúnicas / astrolábio ao longo do anel externo
  const ticks = 48;
  for (let i = 0; i < ticks; i++) {
    const angle = (i / ticks) * Math.PI * 2;
    const isMajor = i % 4 === 0;
    const r1 = 218, r2 = isMajor ? 238 : 227;
    ctx.lineWidth = isMajor ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }

  // Geometria sagrada de Conhecimento (quadrados e losangos rotacionados)
  [0, Math.PI / 4].forEach(rot => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const side = 218 * Math.SQRT2;
    ctx.lineWidth = 2;
    ctx.strokeRect(-side / 2, -side / 2, side, side);
    ctx.restore();
  });

  // Raios geométricos conectando as camadas
  const rays = 16;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.lineWidth = i % 2 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 76, cy + Math.sin(angle) * 76);
    ctx.lineTo(cx + Math.cos(angle) * 218, cy + Math.sin(angle) * 218);
    ctx.stroke();
  }

  // Olho de Conhecimento no centro
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.quadraticCurveTo(cx, cy - 20, cx + 30, cy);
  ctx.quadraticCurveTo(cx, cy + 20, cx - 30, cy);
  ctx.stroke();

  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  sigilTexture = new THREE.CanvasTexture(c);
  return sigilTexture;
}

/* ------------------------------------------------------------------ */
/* Áudio sintetizado de Sucesso Crítico                               */
/* ------------------------------------------------------------------ */
function playCritClink(ctx) {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume?.().catch(() => {});
    const now = ctx.currentTime;

    // Harmonia mística de Conhecimento (Acorde C Maior estendido: 523Hz, 1046Hz, 1568Hz, 2093Hz)
    [523.25, 1046.5, 1568, 2093].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.007;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.35);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.075, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Brilho agudo com ruído highpass (cintilação)
    const n = noise(ctx);
    if (n) {
      const src = ctx.createBufferSource();
      const hp = ctx.createBiquadFilter();
      const ng = ctx.createGain();
      src.buffer = n;
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(3800, now);
      ng.gain.setValueAtTime(0.0001, now);
      ng.gain.exponentialRampToValueAtTime(0.06, now + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      src.connect(hp).connect(ng).connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.38);
    }
  } catch { /* áudio é opcional */ }
}

/* ------------------------------------------------------------------ */
/* Áudio sintetizado de Falha Crítica                                 */
/* ------------------------------------------------------------------ */
function playFumbleSound(ctx) {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume?.().catch(() => {});
    const now = ctx.currentTime;

    // 1. Estalo seco (rachadura violenta no dado)
    const n = noise(ctx);
    if (n) {
      const snap = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter();
      const sg = ctx.createGain();
      snap.buffer = n;
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1200, now);
      bp.Q.value = 2.2;
      sg.gain.setValueAtTime(0.0001, now);
      sg.gain.linearRampToValueAtTime(0.14, now + 0.003);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      snap.connect(bp).connect(sg).connect(ctx.destination);
      snap.start(now);
      snap.stop(now + 0.1);
    }

    // 2. Rangido grave descendente / sub-bass sinistro
    const creak = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const cg = ctx.createGain();

    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(88, now);
    creak.frequency.exponentialRampToValueAtTime(28, now + 0.7);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(46, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.75);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 0.7);

    cg.gain.setValueAtTime(0.0001, now);
    cg.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    creak.connect(filter);
    sub.connect(filter);
    filter.connect(cg).connect(ctx.destination);

    creak.start(now);
    sub.start(now);
    creak.stop(now + 0.85);
    sub.stop(now + 0.85);
  } catch { /* áudio é opcional */ }
}

/* ------------------------------------------------------------------ */
/* SUCESSO CRÍTICO: Sigilo de Conhecimento + Colisão + Faíscas       */
/* ------------------------------------------------------------------ */
export function createCritSequence({
  scene,
  camera,
  dice,
  indices,
  lights,
  audio,
  reducedMotion = false,
  onReveal
}) {
  if (!indices || indices.length < 2) {
    onReveal?.();
    return { update() { return false; }, finish() {} };
  }

  const dieA = dice[indices[0]];
  const dieB = dice[indices[1]];
  if (!dieA || !dieB || !dieA.mesh || !dieB.mesh) {
    onReveal?.();
    return { update() { return false; }, finish() {} };
  }

  const posA0 = dieA.mesh.position.clone();
  const posB0 = dieB.mesh.position.clone();
  const yFloorA = posA0.y;
  const yFloorB = posB0.y;

  const midPoint = posA0.clone().add(posB0).multiplyScalar(0.5);
  const dir = posB0.clone().sub(posA0);
  dir.y = 0;
  if (dir.lengthSq() < 0.001) dir.set(1, 0, 0);
  dir.normalize();

  // Posições de impacto
  const targetA = midPoint.clone().sub(dir.clone().multiplyScalar(0.55));
  const targetB = midPoint.clone().add(dir.clone().multiplyScalar(0.55));
  targetA.y = yFloorA + 0.38;
  targetB.y = yFloorB + 0.38;

  // Câmera
  const initCamPos = camera.position.clone();
  const initFov = camera.fov;
  const camTarget = initCamPos.clone().lerp(
    new THREE.Vector3(midPoint.x, midPoint.y + 1.2, midPoint.z + 2.3),
    0.16
  );

  // Malha 3D do Sigilo de Conhecimento
  const sigilGeo = new THREE.PlaneGeometry(3.6, 3.6);
  const sigilMat = new THREE.MeshBasicMaterial({
    map: getKnowledgeSigilTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const sigilMesh = new THREE.Mesh(sigilGeo, sigilMat);
  sigilMesh.rotation.x = -Math.PI / 2;
  sigilMesh.position.set(midPoint.x, FLOOR_Y + 0.015, midPoint.z);
  sigilMesh.scale.setScalar(0.2);
  scene.add(sigilMesh);

  let shockwave = null;
  let sparks = null;
  let flashLight = null;
  let clinkPlayed = false;
  let revealed = false;
  let finished = false;

  const origEmissiveA = dieA.mesh.material.emissive.clone();
  const origEmissiveB = dieB.mesh.material.emissive.clone();
  const origIntensityA = dieA.mesh.material.emissiveIntensity ?? 0;
  const origIntensityB = dieB.mesh.material.emissiveIntensity ?? 0;

  const startTime = performance.now();
  const DURATION = 1600;

  function finish() {
    if (finished) return;
    finished = true;

    if (!revealed) {
      revealed = true;
      onReveal?.();
    }

    if (sigilMesh.parent) {
      scene.remove(sigilMesh);
      sigilGeo.dispose();
      sigilMat.dispose();
    }

    if (shockwave) shockwave.dispose();
    if (sparks) sparks.dispose();
    if (flashLight) {
      scene.remove(flashLight);
      flashLight.dispose?.();
    }

    if (!reducedMotion) {
      camera.fov = initFov;
      camera.position.copy(initCamPos);
      camera.updateProjectionMatrix();
    }

    dieA.mesh.position.copy(posA0);
    dieB.mesh.position.copy(posB0);
    dieA.mesh.material.emissive.copy(origEmissiveA);
    dieB.mesh.material.emissive.copy(origEmissiveB);
    dieA.mesh.material.emissiveIntensity = origIntensityA;
    dieB.mesh.material.emissiveIntensity = origIntensityB;
  }

  return {
    update(now) {
      if (finished) return false;
      const elapsed = now - startTime;
      const dt = 1 / 60;

      // 0–450ms: Sigilo se expande no chão; dados levitam e deslizam
      if (elapsed < 450) {
        const t = easeOutCubic(elapsed / 450);
        dieA.mesh.position.lerpVectors(posA0, targetA, t);
        dieB.mesh.position.lerpVectors(posB0, targetB, t);

        dieA.mesh.rotation.y += 0.045;
        dieB.mesh.rotation.y -= 0.045;

        sigilMesh.scale.setScalar(0.2 + t * 0.85);
        sigilMat.opacity = t * 0.95;
      }

      // Rotação contínua do sigilo místico no chão
      sigilMesh.rotation.z += dt * 0.35;

      // 450ms: Impacto, som místico, flash e faíscas
      if (elapsed >= 450 && !clinkPlayed) {
        clinkPlayed = true;
        playCritClink(audio);

        shockwave = createShockwave(scene, midPoint, {
          color: GOLD_HOT,
          life: 0.75,
          maxScale: 12
        });

        sparks = createDust(scene, midPoint, {
          count: 150,
          colors: [GOLD, GOLD_HOT, GOLD_SPARK],
          rise: -1.5,
          speed: 3.4,
          life: 1.05,
          size: 0.11
        });

        flashLight = new THREE.PointLight(0xfbbf24, 8, 10);
        flashLight.position.set(midPoint.x, midPoint.y + 0.4, midPoint.z);
        scene.add(flashLight);
      }

      // 450–1400ms: Atualiza partículas, luz e pulsação dourada
      if (elapsed >= 450) {
        if (shockwave) shockwave.update(dt);
        if (sparks) sparks.update(dt);

        if (flashLight) {
          const tLight = clamp01((elapsed - 450) / 450);
          flashLight.intensity = Math.max(0, 8 * (1 - easeInCubic(tLight)));
        }

        const pulseT = (elapsed - 450) / 950;
        if (pulseT <= 1) {
          const glow = Math.sin(pulseT * Math.PI * 3.5) * 0.9 + 0.9;
          dieA.mesh.material.emissive.copy(GOLD_HOT);
          dieB.mesh.material.emissive.copy(GOLD_HOT);
          dieA.mesh.material.emissiveIntensity = glow * (1 - pulseT * 0.4);
          dieB.mesh.material.emissiveIntensity = glow * (1 - pulseT * 0.4);
        }

        // Desvanecimento suave do sigilo após 1000ms
        if (elapsed >= 1000) {
          const tFade = clamp01((elapsed - 1000) / 600);
          sigilMat.opacity = Math.max(0, 0.95 * (1 - easeInCubic(tFade)));
        }
      }

      // 0–900ms e 900–1450ms: Zoom e recuo de câmera
      if (!reducedMotion) {
        if (elapsed < 900) {
          const tCam = easeOutCubic(elapsed / 900);
          camera.fov = initFov - tCam * 5;
          camera.position.lerpVectors(initCamPos, camTarget, tCam);
          camera.updateProjectionMatrix();
        } else if (elapsed < 1450) {
          const tBack = easeInOutCubic((elapsed - 900) / 550);
          camera.fov = (initFov - 5) + tBack * 5;
          camera.position.lerpVectors(camTarget, initCamPos, tBack);
          camera.updateProjectionMatrix();
        }
      }

      // ~700ms: Revela banner de resultado
      if (elapsed >= 700 && !revealed) {
        revealed = true;
        onReveal?.();
      }

      // 900–1600ms: Dados assentam suavemente ao chão
      if (elapsed >= 900 && elapsed < DURATION) {
        const tSettle = easeOutCubic((elapsed - 900) / 700);
        dieA.mesh.position.lerpVectors(targetA, posA0, tSettle);
        dieB.mesh.position.lerpVectors(targetB, posB0, tSettle);
      }

      if (elapsed >= DURATION) {
        finish();
        return false;
      }

      return true;
    },
    finish
  };
}

/* ------------------------------------------------------------------ */
/* FALHA CRÍTICA: Rachaduras + Tremor + Afundar no chão               */
/* ------------------------------------------------------------------ */
export function createFumbleSequence({
  scene,
  camera,
  dice,
  renderer,
  indices,
  lights,
  audio,
  reducedMotion = false,
  onReveal,
  stage
}) {
  const targetDice = (indices && indices.length ? indices : [0, 1])
    .map(idx => dice[idx])
    .filter(Boolean);

  if (!targetDice.length) {
    onReveal?.();
    return { update() { return false; }, finish() {} };
  }

  // Plano de corte no chão para fazer os dados "afundarem"
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);
  if (renderer) renderer.localClippingEnabled = true;

  // Guarda estado original e aplica o plano de corte aos materiais
  const savedProps = targetDice.map(die => {
    const mesh = die.mesh;
    const origColor = mesh.material.color.clone();
    const origEmissive = mesh.material.emissive.clone();
    const origClipping = mesh.material.clippingPlanes ? [...mesh.material.clippingPlanes] : [];

    mesh.material.clippingPlanes = [clipPlane];

    // Linhas de arestas também recebem o clipping
    mesh.children.forEach(child => {
      if (child.material) {
        child.material.clippingPlanes = [clipPlane];
      }
    });

    // Cria malha de rachaduras pretas sobre as faces
    const crackLines = [];
    if (die.faces && die.faces.length) {
      die.faces.forEach(f => {
        const c = f.center || new THREE.Vector3();
        const n = (f.normal || new THREE.Vector3(0, 1, 0)).clone().multiplyScalar(0.008);
        const countBranches = Math.floor(rand(2, 5));
        for (let b = 0; b < countBranches; b++) {
          const p1 = c.clone().add(n);
          const p2 = p1.clone().add(new THREE.Vector3(rand(-0.25, 0.25), rand(-0.25, 0.25), rand(-0.25, 0.25)));
          const p3 = p2.clone().add(new THREE.Vector3(rand(-0.2, 0.2), rand(-0.2, 0.2), rand(-0.2, 0.2)));
          crackLines.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
        }
      });
    }

    let crackMesh = null;
    if (crackLines.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(crackLines, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x0a0a0d,
        clippingPlanes: [clipPlane],
        transparent: true,
        opacity: 0
      });
      crackMesh = new THREE.LineSegments(geo, mat);
      mesh.add(crackMesh);
    }

    return {
      die,
      origPos: mesh.position.clone(),
      origColor,
      origEmissive,
      origClipping,
      crackMesh
    };
  });

  let soundPlayed = false;
  let dustParticles = null;
  let revealed = false;
  let finished = false;

  const startTime = performance.now();
  const DURATION = 1500;

  // Ativa overlay de dessaturação no palco
  stage?.classList.add('fumble-desat');

  function finish() {
    if (finished) return;
    finished = true;

    if (!revealed) {
      revealed = true;
      onReveal?.();
    }

    stage?.classList.remove('fumble-desat');
    if (dustParticles) dustParticles.dispose();

    savedProps.forEach(item => {
      const mesh = item.die.mesh;
      mesh.material.color.copy(item.origColor);
      mesh.material.emissive.copy(item.origEmissive);
      mesh.material.clippingPlanes = item.origClipping;
      mesh.position.copy(item.origPos);

      mesh.children.forEach(child => {
        if (child.material) {
          child.material.clippingPlanes = item.origClipping;
        }
      });

      if (item.crackMesh) {
        mesh.remove(item.crackMesh);
        item.crackMesh.geometry.dispose();
        item.crackMesh.material.dispose();
      }
    });

    if (renderer) renderer.localClippingEnabled = false;
  }

  return {
    update(now) {
      if (finished) return false;
      const elapsed = now - startTime;
      const dt = 1 / 60;

      // 0–250ms: Tremores de pavor e escurecimento do dado
      if (elapsed < 250) {
        const t = clamp01(elapsed / 250);
        savedProps.forEach(item => {
          const mesh = item.die.mesh;
          // Tremor
          mesh.position.x = item.origPos.x + rand(-0.035, 0.035);
          mesh.position.z = item.origPos.z + rand(-0.035, 0.035);
          // Escurece o material para cinza grafite / carvão
          mesh.material.color.copy(item.origColor).lerp(new THREE.Color('#222227'), t);
          mesh.material.emissive.copy(item.origEmissive).lerp(new THREE.Color('#000000'), t);
        });
      }

      // 250ms: Som de rachadura + estalo seco e início das partículas de poeira cinza
      if (elapsed >= 250 && !soundPlayed) {
        soundPlayed = true;
        playFumbleSound(audio);

        savedProps.forEach(item => {
          if (item.crackMesh) item.crackMesh.material.opacity = 1;
        });

        const centerPos = savedProps[0].origPos.clone();
        dustParticles = createDust(scene, centerPos, {
          count: 90,
          colors: [new THREE.Color('#2d2d35'), new THREE.Color('#141418'), new THREE.Color('#3f3f4a')],
          rise: 0.5,
          speed: 1.1,
          life: 1.1,
          size: 0.09
        });
      }

      // 250–1400ms: Afundam cortados pelo chão e poeira sobe
      if (elapsed >= 250) {
        if (dustParticles) dustParticles.update(dt);

        const tSink = clamp01((elapsed - 250) / 1050);
        const sinkDist = easeInCubic(tSink) * 0.95;

        savedProps.forEach((item, i) => {
          const mesh = item.die.mesh;
          mesh.position.y = item.origPos.y - sinkDist;
          // Leve inclinação angular enquanto afundam
          mesh.rotation.x += dt * 0.2 * (i === 0 ? 1 : -1);
          mesh.rotation.z += dt * 0.15 * (i === 0 ? -1 : 1);
        });
      }

      // ~850ms: Revela banner de resultado com a falha crítica
      if (elapsed >= 850 && !revealed) {
        revealed = true;
        onReveal?.();
      }

      if (elapsed >= DURATION) {
        finish();
        return false;
      }

      return true;
    },
    finish
  };
}
