#!/usr/bin/env python3
"""
Gera a arte do modelo de ficha Solace em public/assets/solace/.

Direção: Egito ptolomaico ao pôr do sol (clima de Assassin's Creed Origins).
Tudo é pintura chapada com desgaste de impressão (lascas, pontilhado e bordas
irregulares), sem gradiente metálico nem brilho: frisos de blocos coloridos,
colar wesekh nos medalhões, disco solar alado no verso.

Uso: python3 scripts/solace-arte.py   (precisa de numpy e Pillow)
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'solace')
os.makedirs(OUT, exist_ok=True)

# Pigmentos (pintura de tumba, não metal)
INK = (27, 16, 11)
UMBER = (40, 24, 17)
BONE = (238, 224, 196)
OCHRE = (204, 154, 72)
RED = (166, 72, 48)
LAPIS = (58, 88, 138)
TURQ = (64, 136, 124)
FRIEZE = [LAPIS, OCHRE, RED, OCHRE, TURQ, OCHRE, RED, OCHRE]


# ── ruído ────────────────────────────────────────────────────────────────
def fbm(h, w, seed, octaves=5, base=4, aspect=1.0):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        gx = max(2, int(base * 2 ** o * aspect))
        gy = max(2, int(base * 2 ** o))
        g = rng.random((gy, gx)).astype(np.float32)
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += np.asarray(img, np.float32) / 255 * amp
        tot += amp
        amp *= 0.5
    return out / tot


def displace(img, amp, seed, base=10):
    """Bordas irregulares: desloca os pixels por um campo de ruído."""
    a = np.asarray(img)
    h, w = a.shape[:2]
    nx = (fbm(h, w, seed, 4, base) - 0.5) * 2 * amp
    ny = (fbm(h, w, seed + 1, 4, base) - 0.5) * 2 * amp
    yy, xx = np.mgrid[0:h, 0:w]
    sx = np.clip((xx + nx).round().astype(int), 0, w - 1)
    sy = np.clip((yy + ny).round().astype(int), 0, h - 1)
    return Image.fromarray(a[sy, sx])


def wear(img, seed, chips=0.3, speck=0.07, scale=10):
    """Desgaste de impressão: lascas grandes, pontilhado e manchas mais claras."""
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]
    rng = np.random.default_rng(seed)
    f = fbm(h, w, seed, 6, scale)
    g = rng.random((h, w))
    alpha = a[..., 3] / 255
    m = np.ones((h, w), np.float32)
    m[f < chips] = 0.0
    m[(f < chips + 0.06) & (g < 0.5)] = 0.25
    m[g < speck] = 0.2
    a[..., 3] = alpha * m * 255
    # tinta irregular: varia levemente o tom
    t = fbm(h, w, seed + 7, 5, scale * 2)
    a[..., :3] *= (0.86 + 0.22 * t)[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


def plaster(h, w, seed, color, var=0.18):
    """Superfície pintada com textura de reboco."""
    t = fbm(h, w, seed, 6, 6)
    g = np.random.default_rng(seed).random((h, w)) * 0.025
    k = (1 - var / 2) + var * t + g
    rgb = np.clip(np.array(color, np.float32)[None, None] * k[..., None], 0, 255)
    return rgb


def finish(img, seed, amp=2.2, **kw):
    return wear(displace(img, amp, seed), seed + 3, **kw)


# ── friso de blocos ──────────────────────────────────────────────────────
def frieze(d, x0, y0, x1, y1, block, sep, offset=0):
    d.rectangle([x0, y0, x1, y1], fill=INK)
    x, i = x0 + sep, offset
    while x < x1 - sep - 2:
        d.rectangle([x, y0 + sep, min(x + block, x1 - sep), y1 - sep], fill=FRIEZE[i % len(FRIEZE)])
        x += block + sep
        i += 1


# ── faixa (banner) ───────────────────────────────────────────────────────
def banner(name, w=760, h=116, seed=1):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    a = np.zeros((h, w, 4), np.float32)
    a[..., :3] = plaster(h, w, seed, UMBER, 0.14)
    # silhueta: retângulo com pontas pinceladas
    mask = Image.new('L', (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([26, 12, w - 26, h - 12], fill=255)
    md.polygon([(26, 12), (4, 30), (14, h // 2), (2, h - 26), (26, h - 12)], fill=255)
    md.polygon([(w - 26, 12), (w - 6, 26), (w - 14, h // 2), (w - 3, h - 30), (w - 26, h - 12)], fill=255)
    a[..., 3] = np.asarray(mask, np.float32)
    img = Image.fromarray(a.astype(np.uint8), 'RGBA')
    d = ImageDraw.Draw(img)
    frieze(d, 30, 13, w - 30, 25, 24, 3, seed)
    frieze(d, 30, h - 25, w - 30, h - 13, 24, 3, seed + 3)
    d.line([(30, 28), (w - 30, 28)], fill=BONE, width=2)
    d.line([(30, h - 28), (w - 30, h - 28)], fill=BONE, width=2)
    img = finish(img, seed, 2.0, chips=0.16, speck=0.03)
    img.save(os.path.join(OUT, name))


# ── colar wesekh (medalhões de PV, PD e nível) ───────────────────────────
def collar(d, cx, cy, r_out, r_in, n, colors, sep=3):
    """Anel de pingentes em gota (colar wesekh): ponta para dentro, base redonda para fora."""
    for k in range(n):
        mid = 2 * math.pi * (k + 0.5) / n
        half = math.pi / n * 0.78
        rb = (r_out - r_in) * 0.36                       # raio da base redonda
        rc = r_out - rb                                  # centro da base
        bx, by = cx + rc * math.cos(mid), cy + rc * math.sin(mid)
        tip = (cx + r_in * math.cos(mid), cy + r_in * math.sin(mid))
        side = rc * math.sin(half)
        rb = min(rb, side)
        pts = [tip]
        for s in range(13):
            t = mid - math.pi / 2 + math.pi * s / 12
            pts.append((bx + rb * math.cos(t), by + rb * math.sin(t)))
        d.polygon(pts, fill=colors[k % len(colors)], outline=INK, width=sep)


def ring_blocks(d, cx, cy, r_out, r_in, n, colors, sep=3):
    for k in range(n):
        a0 = 2 * math.pi * k / n
        a1 = 2 * math.pi * (k + 0.82) / n
        pts = [(cx + r_out * math.cos(a0 + (a1 - a0) * s / 4), cy + r_out * math.sin(a0 + (a1 - a0) * s / 4)) for s in range(5)]
        pts += [(cx + r_in * math.cos(a1 - (a1 - a0) * s / 4), cy + r_in * math.sin(a1 - (a1 - a0) * s / 4)) for s in range(5)]
        d.polygon(pts, fill=colors[k % len(colors)])


def medallion(d, cx, cy, R, accent, seed):
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=INK)
    collar(d, cx, cy, R - 3, R * 0.72, 22, [accent, OCHRE, accent, TURQ if accent != TURQ else LAPIS])
    d.ellipse([cx - R * 0.74, cy - R * 0.74, cx + R * 0.74, cy + R * 0.74], fill=INK)
    d.ellipse([cx - R * 0.7, cy - R * 0.7, cx + R * 0.7, cy + R * 0.7], fill=BONE)
    d.ellipse([cx - R * 0.66, cy - R * 0.66, cx + R * 0.66, cy + R * 0.66], fill=INK)
    ring_blocks(d, cx, cy, R * 0.64, R * 0.56, 32, [OCHRE, accent])
    d.ellipse([cx - R * 0.54, cy - R * 0.54, cx + R * 0.54, cy + R * 0.54], fill=UMBER)


def badge(name, accent, seed):
    W, H = 414, 252          # 3× da caixa de 138×84 do layout
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # placa do rótulo, com friso
    y0, y1 = 76, 176
    a = np.zeros((H, W, 4), np.float32)
    a[..., :3] = plaster(H, W, seed, UMBER, 0.14)
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([(6, y0 + 12), (30, y0), (250, y0), (250, y1), (30, y1), (12, y1 - 16), (18, (y0 + y1) // 2)], fill=255)
    a[..., 3] = np.asarray(m, np.float32)
    img = Image.fromarray(a.astype(np.uint8), 'RGBA')
    d = ImageDraw.Draw(img)
    frieze(d, 32, y0 + 2, 240, y0 + 16, 22, 3, seed)
    frieze(d, 32, y1 - 16, 240, y1 - 2, 22, 3, seed + 2)
    d.line([(32, y0 + 20), (240, y0 + 20)], fill=BONE, width=2)
    d.line([(32, y1 - 20), (240, y1 - 20)], fill=BONE, width=2)
    medallion(d, 288, 126, 122, accent, seed)
    finish(img, seed, 1.8, chips=0.15, speck=0.03).save(os.path.join(OUT, name))


def level_badge():
    S = 132
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    medallion(d, S / 2, S / 2, S / 2 - 2, LAPIS, 11)
    finish(img, 11, 1.4, chips=0.14, speck=0.03).save(os.path.join(OUT, 'badge-level.png'))


# ── disco solar alado (divisor do verso) ─────────────────────────────────
def winged_sun():
    W, H = 1800, 96
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, 46
    # linhas laterais
    d.line([(40, cy), (cx - 330, cy)], fill=BONE, width=3)
    d.line([(cx + 330, cy), (W - 40, cy)], fill=BONE, width=3)
    for side in (-1, 1):
        span = 330
        def wing_y(t):           # a asa sobe um pouco na ponta
            return -10 * t ** 2
        # fileira de baixo: rêmiges longas (ocre), em faixas verticais que afinam
        n = 22
        for k in range(n):
            t0, t1 = k / n, (k + 1) / n
            x0, x1 = cx + side * (30 + span * t0), cx + side * (30 + span * t1)
            hgt = 30 * (1 - 0.55 * t0)
            y0 = cy - 4 + wing_y(t0)
            d.polygon([(x0, y0), (x1, y0 + wing_y(t1) - wing_y(t0)), (x1, y0 + hgt * 0.95), (x0, y0 + hgt)], fill=OCHRE, outline=INK, width=3)
        # fileira do meio: penas médias (turquesa)
        n = 16
        for k in range(n):
            t0, t1 = k / n, (k + 1) / n
            x0, x1 = cx + side * (30 + span * 0.82 * t0), cx + side * (30 + span * 0.82 * t1)
            hgt = 16 * (1 - 0.5 * t0)
            y0 = cy - 18 + wing_y(t0 * 0.82)
            d.polygon([(x0, y0), (x1, y0), (x1, y0 + hgt), (x0, y0 + hgt)], fill=TURQ, outline=INK, width=3)
        # coberteiras em escamas (lápis), junto ao corpo
        n = 11
        for k in range(n):
            t0 = k / n
            x0 = cx + side * (30 + span * 0.55 * t0)
            x1 = cx + side * (30 + span * 0.55 * (k + 1) / n)
            y0 = cy - 30 + wing_y(t0 * 0.55)
            lo, hi = sorted((x0, x1))
            d.chord([lo, y0 - 6, hi, y0 + 16], 0, 180, fill=LAPIS, outline=INK, width=3)
    # disco com uraeus
    d.ellipse([cx - 34, cy - 34, cx + 34, cy + 34], fill=INK)
    d.ellipse([cx - 29, cy - 29, cx + 29, cy + 29], fill=RED)
    d.ellipse([cx - 29, cy - 29, cx + 29, cy + 29], outline=OCHRE, width=4)
    finish(img, 21, 1.8, chips=0.22, speck=0.05).save(os.path.join(OUT, 'divider.png'))


# ── colchete dos atributos (pincelada) ───────────────────────────────────
def bracket():
    W, H = 80, 348
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # pincelada em "<": grossa no vértice, afinando nas pontas
    pts_top = [(70, 4), (12, H / 2)]
    pts_bot = [(12, H / 2), (70, H - 4)]
    for (p0, p1) in (pts_top, pts_bot):
        for s in range(60):
            t = s / 59
            x = p0[0] + (p1[0] - p0[0]) * t
            y = p0[1] + (p1[1] - p0[1]) * t
            near = t if p0[1] < p1[1] and p0 == pts_top[0] else 1 - t
            r = 1.5 + 4.5 * (near if p0 == pts_top[0] else 1 - t)
            d.ellipse([x - r, y - r, x + r, y + r], fill=BONE)
    # pequeno disco solar no vértice
    d.ellipse([2, H / 2 - 9, 20, H / 2 + 9], fill=RED, outline=INK, width=2)
    finish(img, 31, 1.4, chips=0.2, speck=0.06).save(os.path.join(OUT, 'bracket.png'))


# ── moldura (9 fatias para border-image) ─────────────────────────────────
def frame():
    C = 96                     # célula: 48 px na tela
    S = C * 3
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    band0, band1 = 14, 40      # faixa de friso a 7–20 px da borda
    for (x0, y0, x1, y1, horiz) in [
        (C, band0, 2 * C, band1, True), (C, S - band1, 2 * C, S - band0, True),
        (band0, C, band1, 2 * C, False), (S - band1, C, S - band0, 2 * C, False)]:
        d.rectangle([x0, y0, x1, y1], fill=INK)
        n = 4
        for k in range(n):
            col = FRIEZE[k * 2 % len(FRIEZE)] if k % 2 == 0 else OCHRE
            if horiz:
                bx0 = x0 + k * C / n + 3
                d.rectangle([bx0, y0 + 3, bx0 + C / n - 6, y1 - 3], fill=col)
            else:
                by0 = y0 + k * C / n + 3
                d.rectangle([x0 + 3, by0, x1 - 3, by0 + C / n - 6], fill=col)
    # linhas finas de osso por dentro e por fora da faixa
    for off in (band0 - 6, band1 + 6):
        d.line([(C, off), (2 * C, off)], fill=BONE, width=2)
        d.line([(C, S - off), (2 * C, S - off)], fill=BONE, width=2)
        d.line([(off, C), (off, 2 * C)], fill=BONE, width=2)
        d.line([(S - off, C), (S - off, 2 * C)], fill=BONE, width=2)
    # cantos: ladrilho com roseta de oito pétalas
    for (cx, cy) in [(C / 2, C / 2), (S - C / 2, C / 2), (C / 2, S - C / 2), (S - C / 2, S - C / 2)]:
        ox = 0 if cx < S / 2 else S - C
        oy = 0 if cy < S / 2 else S - C
        # continua as linhas e o friso até o ladrilho
        for off in (band0 - 6, band1 + 6):
            yy = oy + (off if oy == 0 else C - off)
            xx = ox + (off if ox == 0 else C - off)
            d.line([(ox, yy), (ox + C, yy)], fill=BONE, width=2)
            d.line([(xx, oy), (xx, oy + C)], fill=BONE, width=2)
        r = 30
        d.rectangle([cx - r, cy - r, cx + r, cy + r], fill=INK)
        d.rectangle([cx - r + 4, cy - r + 4, cx + r - 4, cy + r - 4], fill=OCHRE)
        for k in range(8):
            a = k * math.pi / 4
            px, py = cx + 15 * math.cos(a), cy + 15 * math.sin(a)
            d.ellipse([px - 8, py - 8, px + 8, py + 8], fill=LAPIS if k % 2 == 0 else TURQ, outline=INK, width=2)
        d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=RED, outline=INK, width=2)
    finish(img, 41, 1.4, chips=0.2, speck=0.05).save(os.path.join(OUT, 'frame.png'))


# ── textura de desgaste (máscara CSS para os textos grandes) ────────────
def wear_mask():
    N = 512
    rng = np.random.default_rng(3)
    f = fbm(N, N, 1, 6, 4)
    g = rng.random((N, N))
    a = np.ones((N, N), np.float32)
    a[f < 0.3] = 0.35
    a[g < 0.05] = 0.1
    a[(g < 0.1) & (f < 0.42)] = 0.3
    img = Image.new('RGBA', (N, N), (0, 0, 0, 255))
    img.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    img.save(os.path.join(OUT, 'wear.png'))


# ── fundo: pôr do sol sobre as dunas, cidade de Solace no horizonte ─────
def background(W=2436, H=1816, seed=5):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = xx / W, yy / H
    sunx, suny = 0.79, 0.64

    def lerp(c0, c1, t):
        return np.array(c0, np.float32) + (np.array(c1, np.float32) - np.array(c0, np.float32)) * t[..., None]

    # céu: ferrugem empoeirada no alto, laranja no meio, ouro no horizonte
    sky = lerp((92, 44, 38), (196, 98, 46), np.clip(v / 0.45, 0, 1))
    sky = np.where((v > 0.45)[..., None], lerp((196, 98, 46), (242, 178, 92), np.clip((v - 0.45) / 0.22, 0, 1)), sky)
    # luz do sol espalhada no céu
    dsun = np.sqrt(((u - sunx) * W / H) ** 2 + (v - suny) ** 2)
    sky += (np.exp(-dsun * 3.2) * 70)[..., None] * np.array([1.0, 0.75, 0.4])
    # nuvens em faixas, iluminadas por baixo
    cl = fbm(H, W, seed, 6, 3, aspect=0.2)
    cl = np.clip((cl - 0.52) * 3.2, 0, 1) * (v < 0.6)
    sky = sky * (1 - cl[..., None] * 0.35) + cl[..., None] * np.array([250, 170, 110]) * 0.35
    # disco do sol, baixo no horizonte
    sun = np.clip(1 - (dsun - 0.052) / 0.006, 0, 1)
    sky = sky * (1 - sun[..., None]) + sun[..., None] * np.array([255, 236, 190])
    img = sky

    rng = np.random.default_rng(seed)
    horizon = 0.70

    # cidade de Solace: pirâmides, pilones, obeliscos e casario, enevoados
    city = Image.new('L', (W, H), 0)
    cd = ImageDraw.Draw(city)
    base = int(H * horizon)
    x = -20
    while x < W * 0.74:
        k = rng.random()
        if k < 0.07:
            w = rng.uniform(140, 240)
            cd.polygon([(x, base), (x + w / 2, base - w * 0.62), (x + w, base)], fill=255)
            x += w * 0.8
        elif k < 0.16:
            w = rng.uniform(60, 90); h = rng.uniform(60, 90)
            cd.polygon([(x, base), (x + 6, base - h), (x + w * 0.42, base - h), (x + w * 0.45, base), ], fill=255)
            cd.polygon([(x + w * 0.55, base), (x + w * 0.58, base - h), (x + w - 6, base - h), (x + w, base)], fill=255)
            cd.rectangle([x + w * 0.4, base - h * 0.55, x + w * 0.6, base], fill=255)
            x += w
        elif k < 0.24:
            h = rng.uniform(90, 150)
            cd.polygon([(x, base), (x + 4, base - h), (x + 8, base - h - 10), (x + 12, base - h), (x + 16, base)], fill=255)
            x += rng.uniform(20, 40)
        else:
            w = rng.uniform(30, 80); h = rng.uniform(16, 50)
            cd.rectangle([x, base - h, x + w, base + 4], fill=255)
            x += w
    city = np.asarray(city.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    haze_city = np.array([176, 96, 58], np.float32)
    img = img * (1 - city[..., None] * 0.85) + city[..., None] * 0.85 * haze_city

    # dunas: três camadas, crista iluminada pelo sol (à direita) e face de sombra
    def dune_layer(img, y0, amp, seed, base_col, lit_col, shade_col, n=6):
        r = np.random.default_rng(seed)
        xs = np.linspace(0, 1, W)
        # cristas em cúspide (1 - |sen|), com o x deformado para a encosta ao vento ficar mais longa
        lam = r.uniform(0.22, 0.34)
        warp = xs + 0.05 * np.sin(xs * 2 * math.pi / lam * 0.5 + seed) + 0.03 * np.sin(xs * 11 + seed * 2)
        prof = (1 - np.abs(np.sin(math.pi * warp / lam + r.uniform(0, 3)))) ** 1.6
        prof = prof * (0.55 + 0.45 * fbm(1, W, seed + 4, 3, 3)[0])
        ytop = (y0 - prof * amp + 0.006 * np.sin(xs * 37 + seed)) * H
        slope = np.gradient(ytop)                       # > 0: a face desce para a direita (vira para o sol)
        lit = np.clip(slope * 1.5, 0, 1)
        dark = np.clip(-slope * 1.5, 0, 1)
        inside = yy >= ytop[None, :]
        depth = np.clip((yy - ytop[None, :]) / (H * 0.10), 0, 1)
        col = lerp(base_col, base_col, depth)
        near = (1 - depth) ** 1.5
        col = col + (np.array(lit_col, np.float32) - np.array(base_col, np.float32)) * (lit[None, :] * near)[..., None]
        col = col + (np.array(shade_col, np.float32) - np.array(base_col, np.float32)) * (dark[None, :] * near * 0.8)[..., None]
        crest = np.clip(1 - (yy - ytop[None, :]) / 2.5, 0, 1) * inside
        col = col + crest[..., None] * np.array([50, 34, 18])
        ripple = fbm(H, W, seed + 9, 4, 6, aspect=0.2) - 0.5
        col = col * (1 + ripple[..., None] * 0.12)
        return np.where(inside[..., None], col, img)

    img = dune_layer(img, 0.735, 0.05, 11, (156, 74, 34), (226, 140, 70), (96, 44, 24), 7)
    img = dune_layer(img, 0.80, 0.07, 12, (116, 52, 26), (204, 112, 56), (66, 30, 18), 6)
    img = dune_layer(img, 0.90, 0.09, 13, (70, 32, 18), (150, 74, 38), (40, 18, 12), 5)

    # textura de pintura e grão
    paint = fbm(H, W, seed + 20, 6, 5) - 0.5
    img = img * (1 + paint[..., None] * 0.16)
    img = img + (rng.random((H, W)) - 0.5)[..., None] * 10

    # leitura: escurece a esquerda e o alto (onde vai o texto), deixa o sol aberto atrás do retrato
    shade = 0.34 + 0.66 * np.clip((u - 0.10) / 0.62, 0, 1) ** 2.2
    shade = np.minimum(1, shade + np.exp(-dsun * 4.0) * 0.5)
    top = 0.55 + 0.45 * np.clip(v / 0.35, 0, 1)
    img = img * (shade * top)[..., None]
    # vinheta nas bordas
    vg = 1 - 0.45 * np.clip((np.sqrt((u - 0.55) ** 2 * 1.2 + (v - 0.5) ** 2) - 0.45) / 0.4, 0, 1)
    img = img * vg[..., None]
    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB')
    out.save(os.path.join(OUT, 'solace-bg.webp'), quality=88)


if __name__ == '__main__':
    banner('banner.png')
    badge('badge-pv.png', RED, 51)
    badge('badge-pd.png', LAPIS, 52)
    level_badge()
    winged_sun()
    bracket()
    frame()
    wear_mask()
    background()
    print('arte do Solace gerada em', os.path.abspath(OUT))
