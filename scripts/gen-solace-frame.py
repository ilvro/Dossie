"""Vetoriza a moldura de Solace a partir da pintura de referência (scripts/data/solace-moldura-ref.webp).

Os recortes em raster saíam borrados (a referência tem só 1610 px) e presos ao tamanho dela.
Aqui o traço de areia da pintura vira caminho SVG: o desenho é o da referência (glifos tortos,
penas irregulares), mas nítido em qualquer tela e livre para o CSS dimensionar e posicionar.

- traço: a "tinta" de areia é medida em cada pixel, ampliada 4x, suavizada e contornada
  (marching squares + simplificação), e sai como caminho com furos (evenodd);
- faixa e colunas: os glifos são cortados em grupos nos vãos sem traço; o CSS enche a largura
  com quantos grupos couberem e estica todos um pouco para fechar a conta. Os filetes e a pedra
  são desenhados em código (contínuos, sem emenda);
- cantos e disco alado: o traço inteiro, mais a silhueta (o corpo escuro das penas e do disco).

Uso (na pasta Dossie): python3 scripts/gen-solace-frame.py
Gera src/systems/solace/solace-frame-data.js.
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REF = 'scripts/data/solace-moldura-ref.webp'
DATA = 'src/systems/solace/solace-frame-data.js'
UP = 4  # ampliação antes de contornar

A = np.asarray(Image.open(REF).convert('RGB')).astype(np.float32)
R, G, B = A[..., 0], A[..., 1], A[..., 2]
INK = (R > 165) & (R - B > 55)
# tinta contínua (0..1): areia clara e saturada
SOFT = np.clip((R - 128) / 45, 0, 1) * np.clip((R - B - 34) / 30, 0, 1)

# Faixa: borda escura 4–9, filete 10–13, glifos 14–55, filete 56–59, borda 60–65, filete 66–67
BAND = (4, 69)
GLYPH_ROWS = (14, 56)
COL = (3, 45)          # coluna da esquerda (filetes em 5–7 e 39–42)
COL_ROWS = (69, 977)
RIGHT_EDGE = 1609


# ── Contorno ────────────────────────────────────────────────────────────────
SEGS = {
    1: [('L', 'B')], 2: [('B', 'R')], 3: [('L', 'R')], 4: [('R', 'T')],
    6: [('B', 'T')], 7: [('L', 'T')], 8: [('T', 'L')], 9: [('T', 'B')],
    11: [('T', 'R')], 12: [('R', 'L')], 13: [('R', 'B')], 14: [('B', 'L')],
}


def trace(field, ox=0.0, oy=0.0, blur=1.6, eps=0.35, min_area=1.5, clean=0):
    """Contorna field (0..1, em px da referência) e devolve o 'd' de um caminho.
    Coordenadas na unidade da referência, deslocadas por (ox, oy).
    clean > 0: fechamento e abertura (em px ampliados) antes de contornar, para tapar as
    falhas do traço e tirar os pontinhos da textura da pintura."""
    h, w = field.shape
    img = Image.fromarray((np.clip(field, 0, 1) * 255).astype(np.uint8))
    img = img.resize((w * UP, h * UP), Image.BICUBIC).filter(ImageFilter.GaussianBlur(blur))
    if clean:
        img = img.filter(ImageFilter.MaxFilter(clean)).filter(ImageFilter.MinFilter(clean))
        img = img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
        img = img.filter(ImageFilter.GaussianBlur(1.2))
    f = np.pad(np.asarray(img).astype(np.float32) / 255, 1)
    t = 0.5
    b = (f >= t).astype(np.int32)
    case = (b[:-1, :-1] * 8) | (b[:-1, 1:] * 4) | (b[1:, 1:] * 2) | (b[1:, :-1] * 1)
    ys, xs = np.nonzero((case != 0) & (case != 15))

    def pt(edge):
        kind, y, x = edge
        if kind == 'h':   # entre (y,x) e (y,x+1)
            a, c = f[y, x], f[y, x + 1]
            return (x + (t - a) / (c - a), y)
        a, c = f[y, x], f[y + 1, x]
        return (x, y + (t - a) / (c - a))

    nxt = {}
    for y, x in zip(ys.tolist(), xs.tolist()):
        c = int(case[y, x])
        E = {'T': ('h', y, x), 'R': ('v', y, x + 1), 'B': ('h', y + 1, x), 'L': ('v', y, x)}
        segs = SEGS.get(c)
        if segs is None:  # selas (5, 10): decide pelo centro
            center = (f[y, x] + f[y, x + 1] + f[y + 1, x] + f[y + 1, x + 1]) / 4 >= t
            if c == 5:
                segs = [('L', 'T'), ('R', 'B')] if center else [('L', 'B'), ('R', 'T')]
            else:
                segs = [('T', 'R'), ('B', 'L')] if center else [('T', 'L'), ('B', 'R')]
        for a, z in segs:
            nxt[E[a]] = E[z]

    paths, seen = [], set()
    for start in list(nxt):
        if start in seen:
            continue
        loop, e = [], start
        while e not in seen and e in nxt:
            seen.add(e)
            loop.append(pt(e))
            e = nxt[e]
        if len(loop) < 4:
            continue
        P = (np.array(loop) - 1) / UP + (ox, oy)
        area = 0.5 * abs(np.dot(P[:, 0], np.roll(P[:, 1], 1)) - np.dot(P[:, 1], np.roll(P[:, 0], 1)))
        if area < min_area:
            continue
        P = rdp_closed(P, eps / UP * 2)
        if len(P) < 3:
            continue
        paths.append('M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in P) + 'Z')
    return ''.join(paths)


def rdp(P, eps):
    if len(P) < 3:
        return P
    a, b = P[0], P[-1]
    d = b - a
    n = np.hypot(*d)
    v = P - a
    dist = np.abs(d[0] * v[:, 1] - d[1] * v[:, 0]) / n if n > 1e-9 else np.hypot(v[:, 0], v[:, 1])
    i = int(np.argmax(dist))
    if dist[i] > eps:
        return np.vstack([rdp(P[:i + 1], eps)[:-1], rdp(P[i:], eps)])
    return np.vstack([a, b])


def rdp_closed(P, eps):
    i = int(np.argmax(np.hypot(*(P - P[0]).T)))
    return np.vstack([rdp(P[:i + 1], eps)[:-1], rdp(np.vstack([P[i:], P[:1]]), eps)[:-1]])


# ── Grupos ──────────────────────────────────────────────────────────────────
def runs(has_ink, lo, hi, min_gap=2, min_w=10):
    """Grupos de traço entre lo e hi, cortados no meio dos vãos vazios."""
    cuts, gap_start = [], None
    for x in range(lo, hi):
        if not has_ink[x]:
            if gap_start is None:
                gap_start = x
        else:
            if gap_start is not None and x - gap_start >= min_gap:
                cuts.append((gap_start + x) // 2)
            gap_start = None
    cuts = [lo] + [c for c in cuts if lo < c < hi] + [hi]
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


y0, y1 = BAND
g0, g1 = GLYPH_ROWS
col_ink = INK[g0 + 1:g1 - 1].sum(0) >= 2
tl_end = first_gap(col_ink, 262, 320)
tr_start = first_gap(col_ink, 1352, 1300, -1)
c_left = first_gap(col_ink, 604, 560, -1)
c_right = first_gap(col_ink, 1004, 1050)

# Faixa: só os glifos (os filetes são contínuos, em código); y relativo ao topo da faixa
band = []
for a, b in runs(col_ink, tl_end, c_left) + runs(col_ink, c_right, tr_start):
    d = trace(SOFT[g0:g1, a:b], 0, g0 - y0)
    if d:
        band.append({'w': b - a, 'd': d})

# Colunas: só os glifos, entre os filetes; x relativo à borda de fora da coluna
cx0, cx1 = COL
row_ink = INK[:, cx0 + 7:cx1 - 6].sum(1) >= 2
col = []
for a, b in runs(row_ink, COL_ROWS[0], COL_ROWS[1], min_gap=2, min_w=12):
    d = trace(SOFT[a:b, cx0 + 6:cx1 - 5], 6, 0)
    if d:
        col.append({'h': b - a, 'd': d})


# Cantos: o traço inteiro (disco, asa, filetes e a cabeça da coluna)
def corner(x0, x1):
    return {'w': x1 - x0, 'd': trace(SOFT[y0:y1, x0:x1], 0, 0, blur=1.4, min_area=5)}


cornerL = corner(cx0, tl_end)
cornerR = corner(tr_start, RIGHT_EDGE)

# ── Disco alado do centro ───────────────────────────────────────────────────
# Silhueta: o traço fecha o contorno; vem da metade direita, espelhada no eixo do disco (x=802),
# porque na pintura o contorno esquerdo tem falhas.
AXIS, HALF = 802, 214
DISK_Y, DISK_R = 51.5, 22.5   # centro e miolo do disco (anel de areia em r≈26)
WX, WY = (AXIS - HALF, AXIS + HALF), (8, 114)
ink = Image.fromarray((INK[WY[0]:WY[1], WX[0]:WX[1]] * 255).astype(np.uint8))
ink = ink.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
pad = Image.new('L', (ink.width + 2, ink.height + 2), 0)
pad.paste(ink, (1, 1))
ImageDraw.floodfill(pad, (pad.width - 1, pad.height - 1), 128)
inside = Image.fromarray(((np.asarray(pad)[1:-1, 1:-1] != 128) * 255).astype(np.uint8))
body = inside.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MaxFilter(5))
mask = np.minimum(np.asarray(body), np.asarray(inside)).astype(np.float32) / 255
mask = np.concatenate([mask[:, HALF:][:, ::-1], mask[:, HALF:]], 1)
mask[:14 - WY[0]] = 0
ys, xs = np.nonzero(mask > 0.5)
top, bot, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
m = mask[top:bot, left:right]
# o traço só dentro da silhueta, também espelhado (a metade esquerda pintada é mais falha).
# Limiar mais alto que o da faixa: só a areia de verdade, para as linhas das penas saírem finas
soft = (np.clip((R - 148) / 35, 0, 1) * np.clip((R - B - 48) / 25, 0, 1))[WY[0]:WY[1], WX[0]:WX[1]]
soft = np.concatenate([soft[:, HALF:][:, ::-1], soft[:, HALF:]], 1)[top:bot, left:right]
# dentro do disco não há traço (o reflexo pintado, espelhado, virava dois olhos): o CSS pinta o disco
dy_, dx_ = np.mgrid[0:bot - top, 0:right - left]
inner_disk = np.hypot(dx_ - (AXIS - WX[0] - left), dy_ - (DISK_Y - WY[0] - top)) < DISK_R
soft = np.where(inner_disk, 0, soft)
m_in = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) / 255
wing = {
    'w': int(right - left), 'h': int(bot - top),
    'diskX': float(AXIS - (WX[0] + left)), 'diskY': float(DISK_Y - (WY[0] + top)), 'diskR': DISK_R + 1,
    'body': trace(m, 0, 0, blur=2.4, eps=0.5),
    'd': trace(soft * m_in, 0, 0, blur=1.2, eps=0.35, min_area=3, clean=3),
}

data = {
    'bandH': y1 - y0,
    'colW': cx1 - cx0,
    'band': band,
    'col': col,
    'cornerL': cornerL,
    'cornerR': cornerR,
    'wing': wing,
}
with open(DATA, 'w') as f:
    f.write('// Gerado por scripts/gen-solace-frame.py: o traço da moldura da referência, vetorizado.\n')
    f.write('// Unidades = px da referência (1610 px de largura); o CSS escala.\n')
    f.write('export const FRAME = ' + json.dumps(data, separators=(',', ':')) + ';\n')
size = len(json.dumps(data))
print(f'faixa {len(band)} grupos, coluna {len(col)} grupos, {size / 1024:.0f} KB; cortes {tl_end} {c_left} {c_right} {tr_start}')
