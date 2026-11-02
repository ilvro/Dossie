/**
 * dice-fx-primitives.js
 * Primitivas visuais e de áudio compartilhadas para efeitos 3D de dados.
 */
import * as THREE from 'three';

export const FLOOR_Y = -1.12;

export const clamp01 = t => Math.max(0, Math.min(1, t));
export const easeOutCubic = t => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = t => Math.pow(clamp01(t), 3);
export const easeInOutCubic = t => {
  t = clamp01(t);
  return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const rand = (a, b) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ */
/* Ruído sintetizado compartilhado                                    */
/* ------------------------------------------------------------------ */
let cachedNoise = null;
export function noise(ctx) {
  if (cachedNoise && cachedNoise.sampleRate === ctx.sampleRate) return cachedNoise;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  cachedNoise = buffer;
  return buffer;
}

/* ------------------------------------------------------------------ */
/* Textura de partícula pontual (gradiente radial)                     */
/* ------------------------------------------------------------------ */
let dotTexture = null;
export function getDotTexture() {
  if (dotTexture) return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(.35, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new THREE.CanvasTexture(c);
  return dotTexture;
}

/* ------------------------------------------------------------------ */
/* Estilhaçamento de malha em fragmentos triangulares                 */
/* ------------------------------------------------------------------ */
export function createShards(scene, sourceMesh, {
  emissive,
  ashColor = new THREE.Color('#1a0b2e'),
  push = new THREE.Vector3(),
  speed = 3.2,
  lift = 2.4,
  life = 1.05,
  gravity = 7
}) {
  sourceMesh.updateMatrixWorld(true);
  const geometry = sourceMesh.geometry.index ? sourceMesh.geometry.toNonIndexed() : sourceMesh.geometry;
  const pos = geometry.attributes.position;
  const center = sourceMesh.getWorldPosition(new THREE.Vector3());
  const worldQuat = sourceMesh.getWorldQuaternion(new THREE.Quaternion());
  const materials = [0, 1, 2].map(() => new THREE.MeshStandardMaterial({
    color: sourceMesh.material.color.clone(),
    roughness: .35,
    metalness: .25,
    flatShading: true,
    emissive: emissive ? emissive.clone() : new THREE.Color('#ffffff'),
    emissiveIntensity: 2.2,
    transparent: true,
    side: THREE.DoubleSide
  }));
  const shards = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), g = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    g.copy(a).add(b).add(c).divideScalar(3);
    [[a, b], [b, c], [c, a]].forEach(([p, q]) => {
      const sc = p.clone().add(q).add(g).divideScalar(3);
      const verts = [p, q, g].flatMap(v => {
        const d = v.clone().sub(sc).multiplyScalar(.9);
        return [d.x, d.y, d.z];
      });
      const shardGeo = new THREE.BufferGeometry();
      shardGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      shardGeo.computeVertexNormals();
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(shardGeo, material);
      mesh.position.copy(sc).applyMatrix4(sourceMesh.matrixWorld);
      mesh.quaternion.copy(worldQuat);
      scene.add(mesh);
      const dir = mesh.position.clone().sub(center).normalize();
      const vel = dir.multiplyScalar(speed * rand(.55, 1.35))
        .add(push.clone().multiplyScalar(rand(.3, 1)))
        .add(new THREE.Vector3(0, lift * rand(.4, 1.1), 0));
      shards.push({
        mesh,
        vel,
        axis: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(),
        spin: rand(5, 16),
        life: life * rand(.7, 1.15)
      });
    });
  }
  const hot = emissive ? emissive.clone() : new THREE.Color('#ffffff');
  const ash = ashColor.clone();
  const tmpQ = new THREE.Quaternion();
  let elapsed = 0;
  return {
    update(dt) {
      elapsed += dt;
      let alive = false;
      shards.forEach(s => {
        const t = elapsed / s.life;
        if (t >= 1) {
          if (s.mesh.parent) {
            scene.remove(s.mesh);
            s.mesh.geometry.dispose();
          }
          return;
        }
        alive = true;
        s.vel.y -= gravity * dt;
        s.vel.multiplyScalar(1 - 1.6 * dt);
        s.mesh.position.addScaledVector(s.vel, dt);
        if (s.mesh.position.y < FLOOR_Y) {
          s.mesh.position.y = FLOOR_Y;
          s.vel.y *= -.35;
          s.vel.x *= .7;
          s.vel.z *= .7;
          s.spin *= .6;
        }
        tmpQ.setFromAxisAngle(s.axis, s.spin * dt);
        s.mesh.quaternion.premultiply(tmpQ);
        s.mesh.scale.setScalar(Math.max(.001, 1 - easeInCubic(t)));
      });
      const t = clamp01(elapsed / life);
      materials.forEach((m, i) => {
        m.emissive.copy(hot).lerp(ash, clamp01(t * 1.4 + i * .08));
        m.emissiveIntensity = 2.2 * (1 - t) + .2;
        m.color.lerp(ash, .05);
        m.opacity = 1 - easeInCubic(t);
      });
      return alive;
    },
    dispose() {
      shards.forEach(s => {
        scene.remove(s.mesh);
        s.mesh.geometry.dispose();
      });
      materials.forEach(m => m.dispose());
    }
  };
}

/* ------------------------------------------------------------------ */
/* Nuvem de partículas (cinzas / poeira / faíscas)                    */
/* ------------------------------------------------------------------ */
const DEFAULT_DUST_COLORS = [
  new THREE.Color('#a855f7'),
  new THREE.Color('#f0abfc'),
  new THREE.Color('#1a0b2e')
];

export function createDust(scene, origin, {
  count = 160,
  colors = DEFAULT_DUST_COLORS,
  spread = .45,
  rise = 1.6,
  speed = 1.8,
  life = 1.4,
  size = .09
} = {}) {
  const positions = new Float32Array(count * 3);
  const colorArr = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3(rand(-1, 1), rand(-.3, 1), rand(-1, 1)).normalize();
    const p = origin.clone().addScaledVector(dir, rand(0, spread));
    positions.set([p.x, p.y, p.z], i * 3);
    const col = colors[Math.floor(Math.random() * colors.length)];
    colorArr.set([col.r, col.g, col.b], i * 3);
    vel.push(dir.multiplyScalar(speed * rand(.2, 1)));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  const mat = new THREE.PointsMaterial({
    size,
    map: getDotTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  let elapsed = 0;
  return {
    update(dt) {
      elapsed += dt;
      const t = elapsed / life;
      if (t >= 1) {
        scene.remove(points);
        return false;
      }
      for (let i = 0; i < count; i++) {
        const v = vel[i];
        v.y += rise * dt;
        v.x += Math.sin(elapsed * 6 + i) * .6 * dt;
        v.z += Math.cos(elapsed * 5 + i * 1.7) * .6 * dt;
        v.multiplyScalar(1 - 1.2 * dt);
        positions[i * 3] += v.x * dt;
        positions[i * 3 + 1] += v.y * dt;
        positions[i * 3 + 2] += v.z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 1 - easeInCubic(t);
      mat.size = size * (1 - t * .5);
      return true;
    },
    dispose() {
      scene.remove(points);
      geo.dispose();
      mat.dispose();
    }
  };
}

/* ------------------------------------------------------------------ */
/* Onda de choque circular no chão                                    */
/* ------------------------------------------------------------------ */
const DEFAULT_SHOCK_COLOR = new THREE.Color('#a855f7');

export function createShockwave(scene, origin, {
  color = DEFAULT_SHOCK_COLOR,
  life = .65,
  maxScale = 13
} = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: .9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.08, .13, 64), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(origin.x, FLOOR_Y + .01, origin.z);
  scene.add(ring);
  let elapsed = 0;
  return {
    update(dt) {
      elapsed += dt;
      const t = elapsed / life;
      if (t >= 1) {
        scene.remove(ring);
        return false;
      }
      ring.scale.setScalar(1 + easeOutCubic(t) * maxScale);
      mat.opacity = .9 * (1 - t);
      return true;
    },
    dispose() {
      scene.remove(ring);
      ring.geometry.dispose();
      mat.dispose();
    }
  };
}

