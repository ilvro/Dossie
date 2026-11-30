// Textura da Névoa da Membrana: ruído fractal periódico (emenda perfeita em tile),
// gerado uma vez em canvas e exposto como a variável CSS --vg-mist no <html>.

const SIZE = 512;

// Ruído de valor com rede que "dá a volta" (período = cells), então o tile não tem costura
function periodicNoise(cells, seed) {
  const grid = new Float32Array(cells * cells);
  let s = seed;
  for (let i = 0; i < grid.length; i++) {
    s = (s * 16807) % 2147483647;
    grid[i] = s / 2147483647;
  }
  const smooth = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = (x / SIZE) * cells, gy = (y / SIZE) * cells;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const tx = smooth(gx - x0), ty = smooth(gy - y0);
    const at = (cx, cy) => grid[(cy % cells) * cells + (cx % cells)];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

const cache = new Map();

/**
 * Gera a textura uma vez por variável CSS. Padrão: a névoa verde-clara da Vigília em --vg-mist.
 * Outras skins pedem a mesma forma em outra cor (ex.: a areia de Solace em --sl-dust),
 * sem precisar de `filter` na camada animada.
 */
export function installMistTexture({ varName = '--vg-mist', rgb = [190, 228, 214] } = {}) {
  if (cache.has(varName)) return cache.get(varName);
  let url = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(SIZE, SIZE);
    const octaves = [4, 8, 16, 32].map((cells, i) => ({ fn: periodicNoise(cells, 9173 + i * 7919), amp: 0.5 ** i }));
    const total = octaves.reduce((sum, o) => sum + o.amp, 0);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let n = 0;
        for (const o of octaves) n += o.fn(x, y) * o.amp;
        n /= total;
        // Só os picos viram névoa; o resto fica transparente (fiapos, não um véu uniforme)
        const alpha = Math.max(0, Math.min(0.8, (n - 0.42) * 2.8));
        const i = (y * SIZE + x) * 4;
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = alpha * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    url = canvas.toDataURL('image/png');
    document.documentElement.style.setProperty(varName, `url("${url}")`);
    cache.set(varName, url);
  } catch {}
  return url;
}
