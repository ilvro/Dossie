// Retrato vivo (Vigília): o token "respira" como nas artes animadas das temporadas.
// Um shader WebGL2 deforma a imagem por regiões: a base fica presa, o peito
// expande, ombros e cabeça sobem (a cabeça com um leve atraso) e o tronco
// balança bem devagar. O canvas e o contexto GL são únicos e sobrevivem aos
// render(): a cada render o canvas é só reanexado ao novo container, então a
// respiração nunca reinicia.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * .5 + .5, .5 - aPos.y * .5); // v = 0 no topo
  gl_Position = vec4(aPos, 0., 1.);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uBox;     // tamanho do canvas (px)
uniform vec2 uImg;     // tamanho da imagem (px)
uniform float uLift;   // subida do tronco (fração da altura)
uniform float uExpand; // expansão do peito
uniform float uHead;   // deslocamento extra da cabeça (atrasado)
uniform float uSway;   // balanço lateral do tronco
in vec2 vUv;
out vec4 outColor;
void main() {
  // object-fit: contain + object-position: right top (igual ao <img>)
  float s = min(uBox.x / uImg.x, uBox.y / uImg.y);
  vec2 size = uImg * s;
  vec2 p = vUv * uBox;
  vec2 uv = (p - vec2(uBox.x - size.x, 0.)) / size;
  float v = uv.y;

  // Mapeamento inverso: amostra mais abaixo = conteúdo aparece mais acima
  float body = smoothstep(1.0, 0.5, v);
  float chest = exp(-pow((v - 0.56) / 0.2, 2.));
  float head = smoothstep(0.45, 0.2, v);
  vec2 src = uv;
  src.y += uLift * body + uHead * head;
  src.x = 0.5 + (src.x - 0.5) / (1. + uExpand * chest);
  src.x += uSway * smoothstep(1.0, 0.15, v);

  if (src.x < 0. || src.x > 1. || src.y < 0. || src.y > 1.) { outColor = vec4(0.); return; }
  outColor = texture(uTex, src);
}`;

let gl = null, canvas = null, program = null, uniforms = null, texture = null;
let loadedSrc = '', failedSrc = new Set(), loadingSrc = '', imgSize = [1, 1];
let rafId = 0, lastNow = 0, phase = 0, swayT = 0;
const live = { period: 4.2, amp: 1, tremor: 0 }; // valores suavizados

function init() {
  if (gl) return true;
  if (gl === false) return false;
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) { gl = false; return false; }
  const shader = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl = false; return false; }
  gl.useProgram(program);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uniforms = Object.fromEntries(['uTex', 'uBox', 'uImg', 'uLift', 'uExpand', 'uHead', 'uSway']
    .map(name => [name, gl.getUniformLocation(program, name)]));
  texture = gl.createTexture();
  return true;
}

function loadTexture(src) {
  if (src === loadedSrc || src === loadingSrc) return;
  loadingSrc = src;
  const img = new Image();
  if (/^https?:/i.test(src) && new URL(src, location.href).origin !== location.origin) img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (loadingSrc !== src) return;
    try {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      imgSize = [img.naturalWidth, img.naturalHeight];
      loadedSrc = src;
    } catch {
      failedSrc.add(src); // imagem externa sem CORS: fica o <img> estático
      unmount();
    }
    loadingSrc = '';
  };
  img.onerror = () => { failedSrc.add(src); loadingSrc = ''; unmount(); };
  img.src = src;
}

function unmount() {
  cancelAnimationFrame(rafId);
  rafId = 0;
  canvas?.parentElement?.classList.remove('has-live-portrait');
  canvas?.remove();
}

// Respiração: inspira em ~42% do ciclo, expira no resto, as duas com easing senoidal
function breathCurve(p) {
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
  return p < 0.42 ? ease(p / 0.42) : 1 - ease((p - 0.42) / 0.58);
}

function frame(now) {
  rafId = 0;
  if (!canvas?.isConnected) return;
  const dt = Math.min(0.1, (now - (lastNow || now)) / 1000);
  lastNow = now;

  // Estado do personagem: PV crítico = ofegante; PD crítico = raso e trêmulo
  const body = document.body.classList;
  const target = body.contains('critical-pv-state') ? { period: 2.4, amp: 1.7, tremor: 0 }
    : body.contains('critical-pd-state') ? { period: 3.2, amp: 0.75, tremor: 1 }
    : { period: 4.2, amp: 1, tremor: 0 };
  const k = 1 - Math.exp(-dt * 1.5);
  for (const key in live) live[key] += (target[key] - live[key]) * k;

  phase = (phase + dt / live.period) % 1;
  swayT += dt;
  const b = breathCurve(phase);
  const headB = breathCurve((phase + 0.94) % 1); // cabeça acompanha um pouco depois
  const sway = Math.sin(swayT * 0.65) * 0.6 + Math.sin(swayT * 1.03 + 1.7) * 0.4;
  const tremor = live.tremor * (Math.sin(swayT * 37) * 0.5 + Math.sin(swayT * 23.3) * 0.5);

  const dpr = Math.min(2.5, (window.devicePixelRatio || 1) *
    (parseFloat(getComputedStyle(canvas).getPropertyValue('--vg-token-scale')) || 1));
  const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
  if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }

  if (loadedSrc && w && h) {
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(uniforms.uTex, 0);
    gl.uniform2f(uniforms.uBox, w, h);
    gl.uniform2f(uniforms.uImg, imgSize[0], imgSize[1]);
    gl.uniform1f(uniforms.uLift, 0.0045 * live.amp * b);
    gl.uniform1f(uniforms.uExpand, 0.04 * live.amp * b);
    gl.uniform1f(uniforms.uHead, 0.001 * live.amp * headB);
    gl.uniform1f(uniforms.uSway, 0.0018 * sway + 0.0007 * tremor);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    canvas.parentElement?.classList.add('has-live-portrait');
  }
  rafId = requestAnimationFrame(frame);
}

/** Chamado no fim de cada render(): monta/desmonta o retrato vivo conforme a ficha atual. */
export function syncLivePortrait({ enabled = true } = {}) {
  const img = document.querySelector('.vigilia-page:not(.is-editing) img[data-vigilia-token]');
  const src = img?.currentSrc || img?.getAttribute('src') || '';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!img || !enabled || reduced || failedSrc.has(src) || !init()) { unmount(); return; }

  canvas.className = `${img.className} vigilia-portrait-live`;
  canvas.removeAttribute('data-vigilia-token');
  if (canvas.previousElementSibling !== img) img.after(canvas);
  if (src === loadedSrc) img.parentElement.classList.add('has-live-portrait');
  else loadTexture(src);
  if (!rafId) { lastNow = 0; rafId = requestAnimationFrame(frame); }
}
