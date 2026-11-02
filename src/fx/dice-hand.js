/**
 * src/fx/dice-hand.js
 * Arremesso manual na cena de rolagem: os dados esperam flutuando sobre o círculo;
 * o jogador os pega (eles seguem o ponteiro, chacoalhando) e solta com um peteleco.
 * A velocidade do gesto vira direção e força do arremesso. Clique simples joga sozinho.
 */
import * as THREE from 'three';
import { clamp01, easeOutCubic } from './dice-fx-primitives.js';

const HAND_Y = -.1;        // altura base dos dados na mão (chão em -1.14)
const SPACING = .48;       // agrupamento mais compacto dos dados na mão
const ENTER = 280;

const rand = (a, b) => a + Math.random() * (b - a);

export function createDiceHand({ camera, dice, radius, size, stage, onRattle, onThrow }) {
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -HAND_Y);
  const ray = new THREE.Raycaster();
  const rest = new THREE.Vector3(0, HAND_Y, radius * .2);
  const hand = rest.clone(), handTarget = rest.clone(), lastHand = rest.clone();

  // Formação compacta: até 3 por fileira
  const n = dice.length, cols = Math.min(n, 3), rows = Math.ceil(n / 3);
  const slots = dice.map((_, i) => new THREE.Vector3(
    ((i % 3) - (Math.min(cols, n - Math.floor(i / 3) * 3) - 1) / 2) * SPACING,
    (i % 2) * .08,
    Math.floor(i / 3) * SPACING * .85 - (rows - 1) * SPACING * .42
  ));
  const halfWidth = (cols - 1) / 2 * SPACING + .35;
  const spins = dice.map(() => new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize());
  dice.forEach(die => die.mesh.scale.setScalar(.001));

  const startedAt = performance.now();
  let grabbed = false, pointerId = null, samples = [], downAt = 0, downX = 0, downY = 0;
  let thrown = false, thrownAt = 0, lastRattle = 0, handSpeed = 0;

  function toWorld(x, y) {
    ray.setFromCamera(new THREE.Vector2(x / size.width * 2 - 1, -(y / size.height) * 2 + 1), camera);
    const point = new THREE.Vector3();
    return ray.ray.intersectPlane(plane, point) ? point : null;
  }

  // A mão pode navegar livremente pela maior parte do círculo ritual
  function clampToCircle(point) {
    const max = Math.max(0.5, radius * 0.84);
    const r = Math.hypot(point.x, point.z);
    if (r > max) { point.x *= max / r; point.z *= max / r; }
    point.y = HAND_Y;
    return point;
  }

  function throwWith(dir, speed) {
    if (thrown) return;
    thrown = true; thrownAt = performance.now();
    grabbed = false;
    stage.classList.remove('grabbing');
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    onThrow(dice.map((die, i) => {
      const s = speed * rand(.9, 1.1);
      const velocity = dir.clone().multiplyScalar(s).add(perp.clone().multiplyScalar(rand(-.4, .4)));
      // Arco parabólico expressivo em Y: sobe alto e cai quicando na mesa
      velocity.y = 3.6 + s * .35 + rand(-.3, .5);
      const spinPower = 14 + s * 3.2;
      return {
        position: die.mesh.position.clone(),
        quaternion: die.mesh.quaternion.clone(),
        velocity,
        angularVelocity: spins[i].clone().multiplyScalar(spinPower).add(new THREE.Vector3(rand(-6, 6), rand(-6, 6), rand(-6, 6)))
      };
    }));
  }

  // Sem gesto: joga a partir de onde a mão está, cruzando o círculo com arco vigoroso
  function throwAuto() {
    const toCenter = new THREE.Vector3(-hand.x, 0, -hand.z);
    const dir = toCenter.lengthSq() > .04
      ? toCenter.normalize()
      : new THREE.Vector3(rand(-1, 1), 0, rand(-1, -.2)).normalize();
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rand(-.4, .4));
    throwWith(dir, rand(4.2, 5.8) * radius / 1.6);
  }

  function release(x, y) {
    const now = performance.now();
    const recent = samples.filter(sample => now - sample.t <= 90);
    const first = recent[0] || samples[samples.length - 1];
    const dt = Math.max(.016, (now - first.t) / 1000);
    const vx = (x - first.x) / dt, vy = (y - first.y) / dt;
    if (Math.hypot(vx, vy) < 160) { throwAuto(); return; }
    // Converte a velocidade da tela para o chão: dois pontos do plano separados por 50ms
    const p1 = toWorld(x, y), p0 = toWorld(x - vx * .05, y - vy * .05);
    if (!p1 || !p0) { throwAuto(); return; }
    const worldVel = p1.sub(p0).divideScalar(.05);
    worldVel.y = 0;
    const speed = THREE.MathUtils.clamp(worldVel.length() * .7, 2.2, 7.5) * radius / 1.6;
    throwWith(worldVel.normalize(), speed);
  }

  const onDown = e => {
    if (thrown || e.button > 0 || e.target.closest?.('button')) return;
    grabbed = true; pointerId = e.pointerId;
    downAt = performance.now(); downX = e.clientX; downY = e.clientY;
    samples = [{ t: downAt, x: e.clientX, y: e.clientY }];
    try { stage.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
    stage.classList.add('grabbing');
    const point = toWorld(e.clientX, e.clientY);
    if (point) handTarget.copy(clampToCircle(point));
    e.preventDefault();
  };
  const onMove = e => {
    if (!grabbed || e.pointerId !== pointerId) return;
    const t = performance.now();
    samples.push({ t, x: e.clientX, y: e.clientY });
    while (samples.length > 2 && t - samples[0].t > 140) samples.shift();
    const point = toWorld(e.clientX, e.clientY);
    if (point) handTarget.copy(clampToCircle(point));
  };
  const onUp = e => {
    if (!grabbed || e.pointerId !== pointerId) return;
    try { stage.releasePointerCapture(e.pointerId); } catch { /* sem captura */ }
    const quick = performance.now() - downAt < 320 && Math.hypot(e.clientX - downX, e.clientY - downY) < 10;
    if (quick) throwAuto(); else release(e.clientX, e.clientY);
  };
  const onCancel = e => {
    if (e.pointerId !== pointerId) return;
    grabbed = false;
    stage.classList.remove('grabbing');
    handTarget.copy(rest);
  };
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onCancel);

  function update(now, dt) {
    if (thrown) return;
    if (!grabbed) handTarget.lerp(rest, 1 - Math.exp(-dt * 2));
    lastHand.copy(hand);
    hand.lerp(handTarget, 1 - Math.exp(-dt * (grabbed ? 22 : 6)));
    handSpeed = dt > 0 ? lastHand.distanceTo(hand) / dt : 0;

    const appear = easeOutCubic(clamp01((now - startedAt) / ENTER));
    const shake = THREE.MathUtils.clamp(handSpeed / 3.0, 0, 1);
    dice.forEach((die, i) => {
      const bob = Math.sin(now * .004 + i * 1.7) * .08;
      // Chacoalhar vivo e evidente no eixo Y com saltos assíncronos e tremor
      const shakeBounce = Math.sin(now * .022 + i * 2.3) * (shake * 0.40);
      const jitterY = (Math.random() - .5) * (shake * 0.16);
      const target = hand.clone().add(slots[i].clone().multiplyScalar(grabbed ? .85 : 1));
      target.y += (grabbed ? 0.38 : 0) + bob + shakeBounce + jitterY;
      target.x += Math.cos(now * .018 + i * 1.5) * (shake * 0.12);
      target.z += Math.sin(now * .018 + i * 1.5) * (shake * 0.12);

      die.mesh.position.lerp(target, 1 - Math.exp(-dt * (grabbed ? 18 : 10)));
      die.mesh.rotateOnAxis(spins[i], dt * (1.2 + shake * 18));
      if (shake > .08) {
        die.mesh.rotation.y += Math.sin(now * .016 + i) * shake * dt * 8;
        die.mesh.rotation.x += Math.cos(now * .016 + i) * shake * dt * 8;
      }
      die.mesh.scale.setScalar(Math.max(.001, appear));
    });

    // Chacoalhar faz barulho dinâmico de dados batendo
    if (grabbed && shake > .16 && now - lastRattle > Math.max(48, 90 - shake * 45)) {
      lastRattle = now;
      onRattle?.(1.5 + shake * 6);
    }
  }

  function dispose() {
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onCancel);
    stage.classList.remove('grabbing');
    dice.forEach(die => die.mesh.scale.setScalar(1));
  }

  return {
    update, throwAuto, dispose,
    get thrown() { return thrown; },
    get thrownAt() { return thrownAt; }
  };
}
