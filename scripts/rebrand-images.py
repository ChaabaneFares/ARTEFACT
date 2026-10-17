"""Rebuild branded website images from the original files and the reviewed plan.
Requires Pillow, numpy and opencv-python-headless. Logo PNGs are rendered from
public/assets/brand/*.svg with sharp before running this script.
"""
import argparse
import base64
import hashlib
import io
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


def process(entry, source_root, logo_root):
    source = source_root / entry['path']
    if hashlib.sha256(source.read_bytes()).hexdigest() != entry['originalSha256']:
        raise ValueError(f"Original asset hash does not match: {source}")
    image = Image.open(source).convert('RGB')
    pixels = np.array(image)
    for removal in entry['remove']:
        x, y, width, height = removal['box']
        mask = np.zeros(pixels.shape[:2], dtype=np.uint8)
        if removal['mask'] == 'template':
            ink = cv2.resize(source_mask, (width, height), interpolation=cv2.INTER_LINEAR)
            ink = (ink > 30).astype(np.uint8) * 255
        else:
            patch = pixels[y:y+height, x:x+width]
            # These reviewed regions contain white lettering over the photo.
            gray = cv2.cvtColor(patch, cv2.COLOR_RGB2GRAY)
            ink = ((patch.min(axis=2) > 170) &
                   (patch.max(axis=2).astype(np.int16) - patch.min(axis=2).astype(np.int16) < 35) &
                   (gray.astype(np.int16) - cv2.GaussianBlur(gray, (0, 0), 2).astype(np.int16) > 3)).astype(np.uint8) * 255
        ink = cv2.dilate(ink, np.ones((5, 5), np.uint8), iterations=1)
        mask[y:y+height, x:x+width] = ink
        pixels = cv2.inpaint(pixels, mask, 4, cv2.INPAINT_TELEA)
    image = Image.fromarray(pixels).convert('RGBA')
    if entry['placement']:
        x, y, width, height = entry['placement']
        name = 'artefact-copyright-rail' if entry['kind'] == 'side-rail' else 'artefact-lockup'
        logo = Image.open(logo_root / (name + '.png')).convert('RGBA').resize((width, height), Image.Resampling.LANCZOS)
        shadow = Image.new('RGBA', logo.size, (0, 0, 0, 0))
        shadow.putalpha(logo.getchannel('A').point(lambda alpha: round(alpha*.55)))
        shadow = shadow.filter(ImageFilter.GaussianBlur(.8))
        image.alpha_composite(shadow, (x+1, y+1))
        image.alpha_composite(logo, (x, y))
    if entry['instagram']:
        draw = ImageDraw.Draw(image)
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
        draw.text((129, 307), '@artefact_studio_design', fill=(245,245,247), font=font)
    return image.convert('RGB')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, required=True)
    parser.add_argument('--output-root', type=Path, required=True)
    parser.add_argument('--logo-root', type=Path, required=True)
    parser.add_argument('--only', nargs='*')
    args = parser.parse_args()
    plan = json.loads(Path('scripts/media-branding-plan.json').read_text())
    source_mask = np.array(Image.open(io.BytesIO(base64.b64decode(plan['sourceWatermarkMaskPng']))))
    count = 0
    for entry in plan['images']:
        if args.only and entry['path'] not in args.only:
            continue
        output = args.output_root / entry['path']
        output.parent.mkdir(parents=True, exist_ok=True)
        if entry['kind'] in {'scene-placeholder', 'viewer-overlay'}:
            source = args.source_root / entry['path']
            if hashlib.sha256(source.read_bytes()).hexdigest() != entry['originalSha256']:
                raise ValueError(f"Original asset hash does not match: {source}")
            if source.resolve() != output.resolve():
                shutil.copy2(source, output)
            count += 1
            continue
        image = process(entry, args.source_root, args.logo_root)
        options = {'quality': 90, 'subsampling': 0} if output.suffix.lower() in {'.jpg', '.jpeg'} else {'quality': 75 if '/echo-view/' in str(output) else 85, 'method': 6} if output.suffix.lower() == '.webp' else {}
        image.save(output, **options)
        count += 1
    print(f'Processed {count} images')
