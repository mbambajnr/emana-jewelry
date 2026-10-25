"""Build responsive WebP assets from the checked-in hero originals.

Requires Pillow: python3 -m pip install Pillow
Run from the repository root: python3 scripts/optimize-hero-images.py
"""
from pathlib import Path
import hashlib
import json
from io import BytesIO
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
output = root / "public/hero/optimized"
output.mkdir(parents=True, exist_ok=True)
manifest = {}
for name in ("artisan_goldsmith", "lion_medallion", "bear_pendant"):
    source = root / "public/hero" / f"{name}.jpg"
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        variants = []
        for width in sorted({min(size, image.width) for size in (640, 960, 1400)}):
            resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            # Content-hashed names allow replacing originals without stale URLs.
            buffer = BytesIO()
            resized.save(buffer, format="WEBP", quality=78, method=6)
            data = buffer.getvalue()
            digest = hashlib.sha256(data).hexdigest()[:12]
            filename = f"{name}-{width}-{digest}.webp"
            (output / filename).write_bytes(data)
            variants.append({"src": f"/hero/optimized/{filename}", "width": width})
            print(f"{name}: {width}px, {len(data) / 1024:.1f} KB")
        manifest[name] = {
            "src": variants[-1]["src"],
            "srcSet": ", ".join(f'{v["src"]} {v["width"]}w' for v in variants),
            "sizes": "100vw",
        }
(root / "src/components/remotion/hero-images.json").write_text(json.dumps(manifest, indent=2) + "\n")
