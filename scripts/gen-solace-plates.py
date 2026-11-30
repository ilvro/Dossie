"""Gera as placas de Solace a partir das artes da Vigília (mesmo tamanho, forma e inclinação).

Medido na referência: o miolo da placa é marrom-escuro (~60,40,25) e levemente translúcido,
as linhas da borda são cor de areia (~205,170,128) e o entrelaçado de dentro fica apagado.

Uso (na pasta Dossie): python3 scripts/gen-solace-plates.py
"""
import numpy as np
from PIL import Image, ImageFilter

SRC = 'public/assets/vigilia/'
DST = 'public/assets/solace/'
FILL = np.array([58, 38, 24], np.float32)
LINE = np.array([212, 176, 132], np.float32)
KNOT = np.array([112, 80, 52], np.float32)

# arquivo: (fechamento em px, largura da faixa de borda, opacidade do miolo, opacidade do entrelaçado)
ARTS = {
    'banner-atributos.png': (41, 22, 0.88, 0.28),
    'banner-pericias.png': (41, 20, 0.88, 0.28),
    'banner-power.png': (41, 20, 0.88, 0.28),
    'banner-profile.png': (41, 20, 0.82, 0.3),
    'banner-relacoes.png': (41, 20, 0.86, 0.28),
    'badge-pv.png': (31, 16, 0.9, 0.62),
    'badge-pd.png': (31, 16, 0.9, 0.62),
}


def fill_holes(mask):
    """Preenche o que não alcança a borda da imagem (miolo fechado pela silhueta)."""
    h, w = mask.shape
    out = Image.fromarray((~mask).astype(np.uint8) * 255).convert('L')
    padded = Image.new('L', (w + 2, h + 2), 255)
    padded.paste(out, (1, 1))
    from PIL import ImageDraw
    ImageDraw.floodfill(padded, (0, 0), 128)
    outside = np.asarray(padded)[1:-1, 1:-1] == 128
    return ~outside


def make(name, close, band, fill_a, knot_a):
    im = Image.open(SRC + name).convert('RGBA')
    alpha = np.asarray(im)[:, :, 3].astype(np.float32) / 255
    m = Image.fromarray(((alpha > 0.3) * 255).astype(np.uint8))
    closed = m.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    shape = fill_holes(np.asarray(closed) > 127)
    shape_img = Image.fromarray((shape * 255).astype(np.uint8))
    inner = np.asarray(shape_img.filter(ImageFilter.MinFilter(band * 2 + 1))) > 127
    soft = np.asarray(shape_img.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255

    # camadas: miolo escuro → entrelaçado apagado (dentro) → linhas de areia (borda)
    rgb = np.zeros(alpha.shape + (3,), np.float32)
    a = soft * fill_a
    rgb[:] = FILL
    def over(color, src_a):
        nonlocal rgb, a
        out_a = src_a + a * (1 - src_a)
        rgb = (color * src_a[..., None] + rgb * (a * (1 - src_a))[..., None]) / np.maximum(out_a, 1e-4)[..., None]
        a = out_a
    over(KNOT, alpha * inner * knot_a)
    over(LINE, alpha * (~inner))
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(DST + name, optimize=True)
    print(name, im.size)


for n, args in ARTS.items():
    make(n, *args)
