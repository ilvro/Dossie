"""Recorta a moldura de Solace da pintura de referência (scripts/data/solace-moldura-ref.webp).

A moldura desenhada em código saía "perfeita" demais. Aqui as peças são os próprios pixels da
referência (pedra, traço gasto, asas), e o CSS só as monta no tamanho da página:

- cantos de cima: disco e asa, com a cabeça da coluna (retângulos opacos);
- disco alado do centro: recortado pela silhueta (o traço de areia fecha o contorno);
- faixa: os hieróglifos cortados em grupos nos vãos sem traço; o CSS enche a largura com
  quantos grupos couberem e estica todos um pouco para fechar a conta;
- colunas: o mesmo, de cima para baixo.

Uso (na pasta Dossie): python3 scripts/gen-solace-frame.py
Gera public/assets/solace/moldura-*.webp e src/systems/solace/solace-frame-data.js.
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REF = 'scripts/data/solace-moldura-ref.webp'
DST = 'public/assets/solace/'
DATA = 'src/systems/solace/solace-frame-data.js'

ref = Image.open(REF).convert('RGB')
A = np.asarray(ref).astype(np.int32)
R, G, B = A[..., 0], A[..., 1], A[..., 2]
L = A.mean(2)
INK = (R > 165) & (R - B > 55)       # areia clara do traço

# Faixa de cima: borda escura 4–9, filete 10–13, hieróglifos 14–55, filete 56–59, borda 60–68
BAND = (4, 69)
GLYPH_ROWS = (15, 55)
# Coluna da esquerda: filetes em 5–7 e 39–42. A da direita da pintura muda de estilo
# (traço escuro sobre o céu claro): na página, as duas colunas são a da esquerda (a da
# direita espelhada pelo CSS). O canto direito termina no filete de fora (1604–1606).
COL_L = (3, 45)
RIGHT_EDGE = 1609
COL_ROWS = (69, 977)


def level(strip, axis, sigma=40):
    """Tira o degradê da pintura ao longo da tira (céu claro, sombra), mantendo o traço:
    ganho por canal = média geral / média local muito borrada. Assim os grupos podem
    trocar de lugar sem emenda de brilho."""
    s = strip.astype(np.float32)
    prof = s.mean(axis=1 - axis)                       # (n, 3): média por linha/coluna
    k = np.exp(-0.5 * (np.arange(-3 * sigma, 3 * sigma + 1) / sigma) ** 2)
    k /= k.sum()
    padded = np.pad(prof, ((3 * sigma, 3 * sigma), (0, 0)), mode='reflect')
    smooth = np.stack([np.convolve(padded[:, c], k, mode='valid') for c in range(3)], 1)
    gain = prof.mean(0) / np.maximum(smooth, 1)
    shape = (-1, 1, 3) if axis == 0 else (1, -1, 3)
    return np.clip(s * gain.reshape(shape), 0, 255)


def runs(has_ink, lo, hi, min_gap=2, min_w=10):
    """Grupos de traço entre lo e hi, cortados no meio dos vãos vazios."""
    cuts, x = [], lo
    gap_start = None
    for x in range(lo, hi):
        if not has_ink[x]:
            if gap_start is None:
                gap_start = x
        else:
            if gap_start is not None and x - gap_start >= min_gap:
                cuts.append((gap_start + x) // 2)
            gap_start = None
    cuts = [lo] + [c for c in cuts if lo < c < hi] + [hi]
    # junta pedaços estreitos demais ao vizinho
    out = [cuts[0]]
    for c in cuts[1:]:
        if c - out[-1] < min_w and len(out) > 1:
            out[-1] = c
        else:
            out.append(c)
    return list(zip(out[:-1], out[1:]))


def first_gap(has_ink, lo, hi, step=1):
    x = lo
    while (x < hi if step > 0 else x > hi):
        if not has_ink[x] and not has_ink[x + step]:
            return x
        x += step
    return lo


def save(arr, name):
    Image.fromarray(arr).save(DST + name, quality=92, method=6)
    return name


# ── Faixa ───────────────────────────────────────────────────────────────────
col_ink = (INK[GLYPH_ROWS[0]:GLYPH_ROWS[1]].sum(0) >= 2)
# fim da asa do canto esquerdo, começo da do direito, e as pontas da asa central
tl_end = first_gap(col_ink, 262, 320)
tr_start = first_gap(col_ink, 1352, 1300, -1)
c_left = first_gap(col_ink, 604, 560, -1)
c_right = first_gap(col_ink, 1004, 1050)
groups = runs(col_ink, tl_end, c_left) + runs(col_ink, c_right, tr_start)

y0, y1 = BAND
leveled = A.astype(np.float32).copy()
for a, b in ((tl_end, c_left), (c_right, tr_start)):
    leveled[y0:y1, a:b] = level(A[y0:y1, a:b], axis=1, sigma=50)
slices = [leveled[y0:y1, a:b] for a, b in groups]
band_sprite = np.concatenate(slices, 1).astype(np.uint8)
band_groups, off = [], 0
for a, b in groups:
    band_groups.append([off, b - a])
    off += b - a
save(band_sprite, 'moldura-faixa.webp')

# ── Cantos de cima (com a cabeça da coluna) ─────────────────────────────────
save(A[y0:y1, COL_L[0]:tl_end].astype(np.uint8), 'moldura-canto-e.webp')
save(A[y0:y1, tr_start:RIGHT_EDGE].astype(np.uint8), 'moldura-canto-d.webp')

# ── Colunas ─────────────────────────────────────────────────────────────────
def column(x0, x1, ink, name):
    inner = ink[:, x0 + 7:x1 - 6]
    row_ink = inner.sum(1) >= 2
    gs = runs(row_ink, COL_ROWS[0], COL_ROWS[1], min_gap=2, min_w=12)
    src = np.zeros_like(A, np.float32)
    src[COL_ROWS[0]:COL_ROWS[1], x0:x1] = level(A[COL_ROWS[0]:COL_ROWS[1], x0:x1], axis=0)
    sprite = np.concatenate([src[a:b, x0:x1] for a, b in gs], 0).astype(np.uint8)
    out, off = [], 0
    for a, b in gs:
        out.append([off, b - a])
        off += b - a
    save(sprite, name)
    return out, sprite.shape

col_l, col_l_shape = column(*COL_L, INK, 'moldura-coluna-e.webp')

# ── Disco alado do centro, recortado pela silhueta ──────────────────────────
# O contorno da metade esquerda tem falhas no traço: a silhueta vem da metade direita,
# espelhada no eixo do disco (medido por simetria do traço: x = 802).
AXIS = 802
HALF = 214
WX = (AXIS - HALF, AXIS + HALF)
WY = (8, 114)
ink = Image.fromarray((INK[WY[0]:WY[1], WX[0]:WX[1]] * 255).astype(np.uint8))
ink = ink.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
pad = Image.new('L', (ink.width + 2, ink.height + 2), 0)
pad.paste(ink, (1, 1))
ImageDraw.floodfill(pad, (pad.width - 1, pad.height - 1), 128)
outside = np.asarray(pad)[1:-1, 1:-1] == 128
inside = Image.fromarray(((~outside) * 255).astype(np.uint8))
# abre para tirar os filetes e hieróglifos da faixa (finos), deixando o corpo da asa
body = inside.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9))
body = body.filter(ImageFilter.MaxFilter(5))
mask = np.minimum(np.asarray(body), np.asarray(inside)).astype(np.float32)
right = mask[:, HALF:]
mask = np.concatenate([right[:, ::-1], right], 1)
mask[:14 - WY[0]] = 0                               # o topo é o filete de cima da faixa
soft = Image.fromarray(mask.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
wing = np.dstack([A[WY[0]:WY[1], WX[0]:WX[1]], np.asarray(soft)]).astype(np.uint8)
# corta as margens vazias
alpha = wing[..., 3]
ys, xs = np.nonzero(alpha > 8)
wing = wing[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
disk_y = 45 - (WY[0] + ys.min())                     # centro do disco dentro da peça
Image.fromarray(wing, 'RGBA').save(DST + 'moldura-asa.webp', quality=92, method=6)

data = {
    'band': {'w': band_sprite.shape[1], 'h': band_sprite.shape[0], 'groups': band_groups},
    'cornerL': {'w': tl_end - COL_L[0], 'h': y1 - y0},
    'cornerR': {'w': RIGHT_EDGE - tr_start, 'h': y1 - y0},
    'colL': {'w': col_l_shape[1], 'h': col_l_shape[0], 'groups': col_l},
    'wing': {'w': wing.shape[1], 'h': wing.shape[0], 'diskY': int(disk_y)},
}
with open(DATA, 'w') as f:
    f.write('// Gerado por scripts/gen-solace-frame.py: medidas (px) das peças recortadas da referência.\n')
    f.write('export const FRAME = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != 'groups'} | {'n': len(v.get('groups', []))} for k, v in data.items()}))
print('cortes', tl_end, c_left, c_right, tr_start)
