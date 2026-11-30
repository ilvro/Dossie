#!/usr/bin/env python3
"""
Gera a arte própria do modelo de ficha Solace em public/assets/solace/.

O Solace é a ficha da Vigília virada para sépia (as faixas, medalhões e palavras vêm de
public/assets/vigilia/ e são tingidas no CSS). Aqui saem só as peças do deserto:
  solace-bg.webp   pergaminho sépia com pirâmide, palmeiras e ruínas em aguada
  frame.png        moldura entalhada (9 fatias) com faixa de pseudo-hieróglifos
  disco-alado.png  disco solar alado em relevo, no alto da moldura
Qualquer uma pode ser trocada por uma pintura com o mesmo nome e proporção.

Uso: python3 scripts/solace-arte.py   (precisa de numpy e Pillow)
"""
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'solace')
os.makedirs(OUT, exist_ok=True)

INK = (46, 28, 16)
SAND_HI = (232, 206, 160)


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


def stone(h, w, seed, light=1.0):
    """Arenito/pergaminho: manchas, fibras e grão em sépia."""
    base = fbm(h, w, seed, 4, 3)
    detail = fbm(h, w, seed + 2, 4, 48)
    fib = fbm(h, w, seed + 1, 5, 40, aspect=0.12)
    pits = fbm(h, w, seed + 3, 3, 90)
    grain = np.random.default_rng(seed).random((h, w))
    t = 0.3 + base * 0.32 + (detail - 0.5) * 0.45 + (fib - 0.5) * 0.3 + (grain - 0.5) * 0.14
    t = t - np.clip(0.3 - pits, 0, 1) * 0.35         # poros escuros da pedra
    t = np.clip(t, 0, 1) * light
    c0, c1 = np.array([70, 46, 28], np.float32), np.array(SAND_HI, np.float32)
    return c0 + (c1 - c0) * t[..., None]


def carve(img, depth=1):
    """Relevo entalhado: luz acima/à esquerda do traço, sombra abaixo/à direita."""
    a = img.split()[-1]
    sh = Image.new('RGBA', img.size, INK + (0,))
    sh.putalpha(a)
    hi = Image.new('RGBA', img.size, SAND_HI + (0,))
    hi.putalpha(a.point(lambda v: int(v * 0.55)))
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.alpha_composite(hi, (0, 0), (depth, depth))
    out.alpha_composite(sh, (depth, depth))
    out.alpha_composite(img)
    return out


# ── pseudo-hieróglifos ───────────────────────────────────────────────────
def glyph(d, x, y, s, kind, col):
    w = max(2, int(s * 0.09))
    if kind == 0:     # junco
        d.line([(x + s * .5, y + s), (x + s * .5, y + s * .2)], fill=col, width=w)
        d.polygon([(x + s * .5, y), (x + s * .75, y + s * .35), (x + s * .5, y + s * .3)], fill=col)
    elif kind == 1:   # água
        d.line([(x + s * i / 6, y + s * (.45 if i % 2 else .6)) for i in range(7)], fill=col, width=w)
    elif kind == 2:   # pão (meio disco)
        d.chord([x + s * .1, y + s * .45, x + s * .9, y + s * 1.15], 180, 360, fill=col)
    elif kind == 3:   # sol
        d.ellipse([x + s * .2, y + s * .2, x + s * .8, y + s * .8], outline=col, width=w)
        d.ellipse([x + s * .44, y + s * .44, x + s * .56, y + s * .56], fill=col)
    elif kind == 4:   # olho
        d.arc([x + s * .05, y + s * .25, x + s * .95, y + s * .75], 180, 360, fill=col, width=w)
        d.arc([x + s * .05, y + s * .25, x + s * .95, y + s * .75], 0, 180, fill=col, width=w)
        d.ellipse([x + s * .4, y + s * .38, x + s * .6, y + s * .62], fill=col)
        d.line([(x + s * .45, y + s * .75), (x + s * .35, y + s)], fill=col, width=w)
    elif kind == 5:   # pássaro
        d.ellipse([x + s * .25, y + s * .3, x + s * .75, y + s * .7], fill=col)
        d.ellipse([x + s * .62, y + s * .12, x + s * .86, y + s * .36], fill=col)
        d.line([(x + s * .3, y + s * .6), (x, y + s * .8)], fill=col, width=w)
        d.line([(x + s * .45, y + s * .7), (x + s * .45, y + s)], fill=col, width=w)
    elif kind == 6:   # ankh
        d.ellipse([x + s * .32, y, x + s * .68, y + s * .38], outline=col, width=w)
        d.line([(x + s * .5, y + s * .38), (x + s * .5, y + s)], fill=col, width=w)
        d.line([(x + s * .2, y + s * .48), (x + s * .8, y + s * .48)], fill=col, width=w)
    elif kind == 7:   # pena
        d.polygon([(x + s * .45, y + s), (x + s * .35, y + s * .3), (x + s * .5, y), (x + s * .62, y + s * .3), (x + s * .55, y + s)], fill=col)
    else:             # traços (numerais)
        for i in range(3):
            d.line([(x + s * (.25 + i * .25), y + s * .15), (x + s * (.25 + i * .25), y + s * .85)], fill=col, width=w)


def glyph_band(w, h, seed, s):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(seed)
    x = 4
    while x < w - s:
        glyph(d, x, (h - s) / 2, s, int(rng.integers(0, 9)), (58, 36, 20, 235))
        x += s * rng.uniform(1.05, 1.35)
    return img


# ── moldura (9 fatias para border-image) ─────────────────────────────────
def frame():
    C = 120                    # célula: 60 px na tela
    S = C * 3
    band = 74                  # faixa de pedra (37 px na tela)
    a = np.zeros((S, S, 4), np.float32)
    a[..., :3] = stone(S, S, 41, 1.05)
    m = np.zeros((S, S), np.float32)
    m[:band, :] = m[-band:, :] = m[:, :band] = m[:, -band:] = 255
    a[..., 3] = m
    img = Image.fromarray(a.astype(np.uint8), 'RGBA')
    d = ImageDraw.Draw(img)
    for off in (6, band - 8):
        d.line([(0, off), (S, off)], fill=INK, width=3)
        d.line([(0, S - off), (S, S - off)], fill=INK, width=3)
        d.line([(off, 0), (off, S)], fill=INK, width=3)
        d.line([(S - off, 0), (S - off, S)], fill=INK, width=3)
    gh = band - 24
    img.alpha_composite(carve(glyph_band(C, gh, 7, 38)), (C, 12))
    img.alpha_composite(carve(glyph_band(C, gh, 8, 38)), (C, S - band + 12))
    img.alpha_composite(carve(glyph_band(C, gh, 9, 38)).rotate(90, expand=True), (12, C))
    img.alpha_composite(carve(glyph_band(C, gh, 10, 38)).rotate(-90, expand=True), (S - band + 12, C))
    d = ImageDraw.Draw(img)
    # cantos: disco solar entalhado
    for (ox, oy) in [(0, 0), (S - C, 0), (0, S - C), (S - C, S - C)]:
        cx = ox + (band / 2 if ox == 0 else C - band / 2)
        cy = oy + (band / 2 if oy == 0 else C - band / 2)
        d.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=(150, 108, 66), outline=INK, width=3)
        d.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=(110, 70, 38), outline=INK, width=2)
    arr = np.asarray(img).astype(np.float32)
    wear = fbm(S, S, 44, 6, 8)
    arr[..., 3] *= np.where(wear < 0.2, 0.0, 1.0)
    edge = np.asarray(Image.fromarray(arr[..., 3].astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)), np.float32) / 255
    arr[..., :3] *= (0.62 + 0.38 * edge)[..., None]
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'frame.png'))


# ── disco solar alado (relevo) ───────────────────────────────────────────
def winged_sun():
    W, H = 1100, 230
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = W / 2, 108
    tone = (150, 104, 60, 255)
    line = (58, 36, 20, 255)
    for side in (-1, 1):
        n = 26
        for k in range(n):
            t = k / (n - 1)
            x0 = cx + side * (58 + t * 440)
            y0 = cy - 30 + 26 * t ** 1.6
            ln = 70 + 40 * math.sin(t * math.pi) - 30 * t
            wdt = 20
            d.polygon([(x0, y0), (x0 + side * wdt, y0 + 4), (x0 + side * (wdt - 2), y0 + ln), (x0 + side * 4, y0 + ln + 6)], fill=tone, outline=line)
            d.line([(x0 + side * wdt / 2, y0 + 6), (x0 + side * wdt / 2, y0 + ln - 4)], fill=line, width=2)
        for k in range(14):
            x0 = cx + side * (52 + k * 22)
            y0 = cy - 44 + 6 * (k / 14) ** 2
            box = sorted([x0, x0 + side * 26])
            d.chord([box[0], y0 - 10, box[1], y0 + 22], 0, 180, fill=(176, 128, 76, 255), outline=line)
        d.line([(cx + side * 50, cy + 40), (cx + side * 54, cy - 8), (cx + side * 46, cy - 34)], fill=line, width=9)
        d.ellipse([cx + side * 46 - 9, cy - 46, cx + side * 46 + 9, cy - 28], fill=line)
    d.ellipse([cx - 46, cy - 46, cx + 46, cy + 46], fill=(126, 78, 40, 255), outline=line, width=4)
    d.ellipse([cx - 34, cy - 34, cx + 34, cy + 34], outline=(214, 180, 130, 255), width=3)
    img = carve(img, 2)
    arr = np.asarray(img).astype(np.float32)
    wear = fbm(H, W, 51, 6, 8)
    arr[..., 3] *= np.where(wear < 0.25, 0.25, 1.0)
    arr[..., :3] *= (0.85 + 0.3 * fbm(H, W, 52, 5, 10))[..., None]
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'disco-alado.png'))


# ── fundo: pergaminho sépia com o deserto em aguada ─────────────────────
def palm(d, x, base, h, lean, col, scale=1.0):
    pts = [(x + lean * h * (i / 29) ** 2, base - h * i / 29) for i in range(30)]
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=col, width=int((14 - 8 * i / 30) * scale))
    cx, cy = pts[-1]
    for k in range(11):
        ang = -math.pi * (0.05 + 0.9 * k / 10)
        L = h * (0.3 + 0.1 * math.sin(k * 1.7))
        prev = (cx, cy)
        for s in range(1, 16):
            t = s / 15
            px = cx + math.cos(ang) * L * t
            py = cy + math.sin(ang) * L * t + (L * 0.55) * t ** 2
            d.line([prev, (px, py)], fill=col, width=max(2, int(7 * (1 - t) * scale)))
            nx, ny = -(py - prev[1]), (px - prev[0])
            nn = math.hypot(nx, ny) or 1
            for sg in (-1, 1):
                d.line([(px, py), (px + sg * nx / nn * 22 * (1 - t) * scale + (px - prev[0]) * 0.8,
                                   py + sg * ny / nn * 22 * (1 - t) * scale + 10 * scale)], fill=col, width=2)
            prev = (px, py)


def background(W=2436, H=1816, seed=5):
    img = stone(H, W, seed, 1.0)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = xx / W, yy / H
    glow = np.exp(-(((u - 0.82) / 0.25) ** 2 + ((v - 0.35) / 0.3) ** 2))
    img = img * (1 + glow[..., None] * 0.28)

    wash = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(wash)
    hz = int(H * 0.66)
    px, ptop, pw = int(W * 0.84), int(H * 0.16), int(W * 0.24)
    d.polygon([(px, ptop), (px + pw, hz), (px - pw, hz)], fill=70)
    d.polygon([(px, ptop), (px - pw, hz), (px - int(pw * 0.15), hz)], fill=120)
    d.polygon([(int(W * 0.63), int(H * 0.40)), (int(W * 0.70), hz), (int(W * 0.56), hz)], fill=55)
    for cx0 in (0.66, 0.70, 0.74):
        x0 = int(W * cx0)
        d.rectangle([x0, int(H * 0.46), x0 + 26, hz], fill=95)
        d.rectangle([x0 - 8, int(H * 0.45), x0 + 34, int(H * 0.465)], fill=95)
    d.polygon([(int(W * .90), hz), (int(W * .905), int(H * .38)), (int(W * .96), int(H * .38)), (int(W * .965), hz)], fill=85)
    d.rectangle([int(W * .54), int(H * .55), int(W * 1.0), hz], fill=60)
    pts = [(0, H)] + [(x, int(H * 0.74 + 40 * math.sin(x / 260) + 25 * math.sin(x / 97))) for x in range(0, W + 20, 20)] + [(W, H)]
    d.polygon(pts, fill=60)
    palm(d, int(W * 0.60), hz + 40, int(H * 0.40), 0.10, 150)
    palm(d, int(W * 0.66), hz + 70, int(H * 0.25), -0.08, 135, 0.8)
    palm(d, int(W * 0.50), hz + 60, int(H * 0.18), 0.05, 110, 0.7)
    wash = wash.filter(ImageFilter.GaussianBlur(1.2))
    wv = np.asarray(wash, np.float32) / 255 * (0.75 + 0.5 * fbm(H, W, seed + 30, 5, 10))
    img = img * (1 - wv[..., None] * 0.6) + np.array(INK, np.float32) * (wv[..., None] * 0.6)

    # leitura: escurece a área do texto e as bordas, como a ardósia da Vigília
    shade = 0.52 + 0.48 * np.clip((u - 0.05) / 0.6, 0, 1) ** 1.8
    top = 0.7 + 0.3 * np.clip(v / 0.3, 0, 1)
    vg = 1 - 0.5 * np.clip((np.sqrt((u - 0.55) ** 2 + (v - 0.5) ** 2 * 1.3) - 0.4) / 0.45, 0, 1)
    img = img * (shade * top * vg)[..., None]
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').save(os.path.join(OUT, 'solace-bg.webp'), quality=88)


if __name__ == '__main__':
    frame()
    winged_sun()
    background()
    print('arte do Solace gerada em', os.path.abspath(OUT))
