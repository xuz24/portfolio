"""Regenerate responsive previews with cwebp; originals remain untouched.
Run: python3 scripts/optimize-images.py (requires the cwebp command).
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'previews'
OUT.mkdir(exist_ok=True)
pattern = re.compile(r'<img\b[^>]*>', re.I)

def attribute(tag, name):
    match = re.search(r'(?<![\w-])' + re.escape(name) + r'="([^"]*)"', tag)
    return match[1] if match else None

def set_attribute(tag, name, value):
    regex = r'(?<![\w-])' + re.escape(name) + r'="[^"]*"'
    replacement = f'{name}="{value}"'
    return re.sub(regex, replacement, tag) if re.search(regex, tag) else tag[:-1] + ' ' + replacement + '>'

pages = {name: (ROOT / name).read_text() for name in ['index.html', 'gallery.html']}
sources = set()
for text in pages.values():
    for tag in pattern.findall(text):
        src = attribute(tag, 'data-full-src') or attribute(tag, 'src')
        if src and src.startswith('assets/'):
            sources.add(src)

def convert(src):
    source = ROOT / src
    metadata = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(source)], text=True)
    width = int(re.search(r'pixelWidth: (\d+)', metadata)[1])
    height = int(re.search(r'pixelHeight: (\d+)', metadata)[1])
    widths = sorted({min(width, size) for size in ([220, 440] if src.endswith('profile.jpg') else [480, 960])})
    previews = []
    for size in widths:
        target = OUT / f'{source.stem}-{size}.webp'
        if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
            subprocess.run(['cwebp', '-quiet', '-q', '88' if source.suffix == '.png' else '82', '-m', '6', '-metadata', 'none', '-resize', str(size), '0', str(source), '-o', str(target)], check=True)
        previews.append((target.relative_to(ROOT).as_posix(), size))
    return src, (width, height, previews)

with ThreadPoolExecutor(max_workers=4) as pool:
    images = dict(pool.map(convert, sorted(sources)))
for name, text in pages.items():
    def replace(match):
        tag = match[0]
        src = attribute(tag, 'data-full-src') or attribute(tag, 'src')
        if src not in images:
            return tag
        width, height, previews = images[src]
        sizes = ('(min-width: 1000px) 280px, 220px' if src.endswith('profile.jpg') else
                 '(max-width: 700px) calc((100vw - 52px) / 2), (max-width: 1256px) calc((100vw - 136px) / 3), 374px' if name == 'gallery.html' else
                 '(max-width: 999px) min(560px, calc(100vw - 56px)), (max-width: 1199px) 45vw, 480px')
        for key, value in {'src': previews[0][0], 'srcset': ', '.join(f'{path} {size}w' for path, size in previews), 'sizes': sizes, 'width': str(width), 'height': str(height), 'data-full-src': src}.items():
            tag = set_attribute(tag, key, value)
        return tag
    (ROOT / name).write_text(pattern.sub(replace, text))
original = sum((ROOT / src).stat().st_size for src in images)
small = sum((ROOT / info[2][0][0]).stat().st_size for info in images.values())
large = sum((ROOT / info[2][-1][0]).stat().st_size for info in images.values())
print(f'{len(images)} images: originals {original:,} bytes; small previews {small:,}; large previews {large:,}.')
