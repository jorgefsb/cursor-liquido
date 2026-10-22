"""Render editorial docs only. Usage: python scripts/docs-render.py BRAND_ASSET_ROOT.
Requires Pillow and Python-Markdown; does not touch runtime, dist or tests.
"""
from pathlib import Path
import sys
import shutil
import json
import hashlib
from PIL import Image, ImageDraw, ImageFont
import markdown

root = Path(__file__).resolve().parents[1]
brand = Path(sys.argv[1])
media = root / 'docs/media'
fonts = media / 'brand'
fonts.mkdir(exist_ok=True)
for name in ['Outfit-static.ttf', 'Inter-static.ttf', 'Outfit-OFL.txt', 'Inter-OFL.txt']:
    shutil.copyfile(brand / 'assets' / name, fonts / name)
sigpath = brand / 'assets/masters-1.0/signature/png/JorgeSuarez-A-oscuro-bicolor-screen-240px-visible.png'
signature = Image.open(sigpath).convert('RGBA')
screenshot = Image.open(media / 'hardcore-real.png').convert('RGB')
head = lambda n: ImageFont.truetype(str(fonts / 'Outfit-static.ttf'), n)
body = lambda n: ImageFont.truetype(str(fonts / 'Inter-static.ttf'), n)
muted = '#B7B3AD'
for lang in ['es', 'en']:
    es = lang == 'es'
    for mobile in [False, True]:
        size = (900, 1420) if mobile else (1600, 900)
        im = Image.new('RGB', size, '#0A0A0A')
        d = ImageDraw.Draw(im)
        im.paste(signature, (64, 54), signature)
        if mobile:
            d.text((60, 155), 'Cursor líquido', font=head(76), fill='white')
            lines = ['Una estela de color', 'que sigue tu puntero.'] if es else ['A colored trail', 'that follows your pointer.']
            for i, line in enumerate(lines):
                d.text((64, 264 + i * 45), line, font=body(34), fill=muted)
            d.rectangle((64, 390, 836, 393), fill='#FF6B35')
            demo = screenshot.resize((772, 656), Image.Resampling.LANCZOS)
            im.paste(demo, (64, 430))
            d.text((64, 1140), 'Hardcore · WebGL2 · 18 px CSS', font=head(30), fill='white')
            d.text((64, 1200), 'Captura real de la demo aprobada.' if es else 'Real capture of the approved demo.', font=body(27), fill=muted)
            d.text((64, 1250), '1.0.1 · Código MIT · Sin dependencias' if es else '1.0.1 · MIT code · No dependencies', font=body(25), fill=muted)
        else:
            d.text((64, 262), 'Cursor líquido', font=head(86), fill='white')
            lines = ['Una estela de color', 'que sigue tu puntero.'] if es else ['A colored trail', 'that follows your pointer.']
            for i, line in enumerate(lines):
                d.text((68, 390 + i * 54), line, font=body(36), fill=muted)
            d.rectangle((68, 560, 625, 564), fill='#FF6B35')
            d.text((68, 610), '1.0.1 · Código MIT' if es else '1.0.1 · MIT code', font=head(28), fill='white')
            d.text((68, 658), 'Sin dependencias en runtime.' if es else 'No runtime dependencies.', font=body(26), fill=muted)
            # Crop only from a genuine baseline screenshot, keeping controls and trail.
            crop = screenshot.crop((0, 170, 985, 850))
            crop.thumbnail((820, 640), Image.Resampling.LANCZOS)
            im.paste(crop, (730, 200))
            d.text((730, 150), 'Hardcore · WebGL2 · 18 px CSS', font=head(27), fill='white')
            d.text((730, 795), 'Demo real · SwiftShader · Recorte' if es else 'Real demo · SwiftShader · Cropped', font=body(24), fill=muted)
        out = media / f'cover-{lang}{"-mobile" if mobile else ""}.png'
        im.save(out, optimize=True)

css = '''@font-face{font-family:Outfit;src:url(media/brand/Outfit-static.ttf);font-weight:700}@font-face{font-family:Inter;src:url(media/brand/Inter-static.ttf);font-weight:400}
*{box-sizing:border-box}body{margin:0;background:#0A0A0A;color:#FFFFFF;font:400 18px/1.65 Inter,Arial,sans-serif;font-synthesis:none}main{max-width:1120px;margin:auto;padding:36px 36px 90px}h1,h2,h3,strong,th{font-family:Outfit,Arial,sans-serif;font-weight:700}h1{font-size:48px;line-height:1.12}h2{font-size:30px;margin-top:48px;line-height:1.25}p{max-width:78ch}a{color:#FF6B35;text-underline-offset:4px}a:focus-visible,button:focus-visible,video:focus-visible{outline:3px solid #FFA500;outline-offset:5px}img,video{max-width:100%;height:auto;display:block}video{background:#161616;width:100%;max-height:76vh}pre{background:#161616;overflow:auto;padding:20px;font-size:14px}code{overflow-wrap:anywhere}table{display:block;overflow:auto;border-collapse:collapse;font-size:16px}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #34312e;padding:12px}blockquote{border-left:3px solid #FF6B35;padding-left:20px;color:#B7B3AD}.lead{font-size:24px;color:#B7B3AD}.note{color:#B7B3AD;font-size:15px}.hero{margin:24px 0}.player{margin:44px 0}nav{display:flex;gap:24px;flex-wrap:wrap}::cue{background:#0A0A0A;color:#FFFFFF;font-family:Arial,sans-serif}@media(max-width:600px){main{padding:24px 20px 64px}body{font-size:17px}h1{font-size:38px}h2{font-size:27px}th,td{padding:10px;min-width:125px}.lead{font-size:21px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}'''
(root / 'docs/reading.css').write_text(css)
for lang in ['es', 'en']:
    es = lang == 'es'
    other = 'en' if es else 'es'
    suffix = '' if es else '.en'
    other_suffix = '.en' if es else ''
    tracks = ''.join(f'<track kind="captions" srclang="{l}" label="{label}" data-vtt="{l}" {"default" if l == lang else ""}>' for l, label in [('es', 'Español'), ('en', 'English')])
    cues = {l: (media / f'walkthrough.{l}.vtt').read_text() for l in ['es', 'en']}
    # Blob tracks allow offline file:// playback without cross-file VTT restrictions.
    script = '<script>const cues=' + json.dumps(cues, ensure_ascii=False) + ';document.querySelectorAll("track").forEach(t=>{t.src=URL.createObjectURL(new Blob([cues[t.dataset.vtt]],{type:"text/vtt"}));});</script>'
    title = 'Mueve el mouse. Mira la estela.' if es else 'Move the mouse. Watch the trail.'
    lead = 'Cuatro intensidades para una página web. Aquí ves el motor real, no una interfaz inventada.' if es else 'Four intensities for a web page. This is the real engine, not a fabricated interface.'
    guide = markdown.markdown((root / f'docs/walkthrough{suffix}.md').read_text(), extensions=['tables'])
    html = f'''<!doctype html><html lang="{lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cursor líquido · {title}</title><link rel="stylesheet" href="reading.css"><main><nav><a href="../README{suffix}.md">{'Guía completa' if es else 'Full guide'}</a><a href="showcase{other_suffix}.html">{'English' if es else 'Español'}</a><a href="../demo/index.html">{'Abrir demo real' if es else 'Open real demo'}</a></nav><picture class="hero"><source media="(max-width:600px)" srcset="media/cover-{lang}-mobile.png"><img src="media/cover-{lang}.png" alt="Cursor líquido, {'captura real de Hardcore' if es else 'real Hardcore screenshot'}"></picture><h1>{title}</h1><p class="lead">{lead}</p><section class="player" aria-label="{'Video con subtítulos' if es else 'Captioned video'}"><video controls preload="metadata" playsinline poster="media/hardcore-real.png"> <source src="media/cursor-liquido-restaurado-real.mp4" type="video/mp4">{tracks}</video><p class="note">{'13.04 s · Sin audio · Subtítulos ES/EN en el control CC del video.' if es else '13.04 s · No audio · Choose ES/EN captions in the video CC menu.'}</p></section>{guide}<footer><a href="ASSET-NOTICE{suffix}.md">{'Aviso de marca y fuentes' if es else 'Brand and font notice'}</a> · <a href="https://brandkit.jorgesuarez.com.mx/">Jorge Suárez</a></footer></main>{script}</html>'''
    (root / f'docs/showcase{suffix}.html').write_text(html)
    readme = root / ('README.md' if es else 'README.en.md')
    md = markdown.markdown(readme.read_text(), extensions=['tables', 'fenced_code'])
    # Faithful static Markdown rendering. Base keeps README-root-relative links exact.
    preview = f'<!doctype html><html lang="{lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="../"><title>README {lang} · Cursor líquido</title><link rel="stylesheet" href="docs/reading.css"><main>{md}</main></html>'
    (root / f'docs/preview.{lang}.html').write_text(preview)
source_hashes = {}
for p in [sigpath, brand / 'assets/Outfit-static.ttf', brand / 'assets/Inter-static.ttf', brand / 'assets/Outfit-OFL.txt', brand / 'assets/Inter-OFL.txt']:
    source_hashes[str(p.relative_to(brand))] = hashlib.sha256(p.read_bytes()).hexdigest()
(root / 'reports/docs-brand-source-hashes.json').write_text(json.dumps(source_hashes, indent=2) + '\n')
print('Rendered 4 covers, 2 captioned players and 2 faithful README previews; copied OFL fonts only.')
