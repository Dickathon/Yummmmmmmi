#!/usr/bin/env python3
"""Derive oval blanket anchor from legs_1254.png — Python mirror of derive_blanket_anchor.mjs."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
STANDARD_DIR = ROOT / "装扮" / "latest-pictures" / "标准底图"
LEGS_PATH = STANDARD_DIR / "legs_1254.png"
CANVAS = 1254
ALPHA_THRESHOLD = 12


def alpha_at(img: Image.Image, x: int, y: int) -> int:
    if x < 0 or y < 0 or x >= img.width or y >= img.height:
        return 0
    return img.getpixel((x, y))[3]


def legs_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    mask = img.getchannel("A").point(lambda v: 255 if v > ALPHA_THRESHOLD else 0)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError("legs alpha bbox empty")
    return bbox


def find_paw_centers(img: Image.Image, bbox: tuple[int, int, int, int]) -> list[dict]:
    min_x, _, max_x, max_y = bbox
    band_top = max_y - int((bbox[3] - bbox[1]) * 0.32)
    span = max_x - min_x
    band_width = span / 4
    paws: list[dict] = []
    for i in range(4):
        x0 = int(min_x + i * band_width)
        x1 = int(min_x + (i + 1) * band_width)
        pts = [
            (x, y)
            for y in range(band_top, max_y + 1)
            for x in range(x0, x1 + 1)
            if alpha_at(img, x, y) > ALPHA_THRESHOLD
        ]
        if len(pts) < 12:
            continue
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        bottom_y = max(ys)
        paws.append(
            {
                "centerX": round((min(xs) + max(xs)) / 2),
                "centerY": round((min(ys) + max(ys)) / 2),
                "bottomY": bottom_y,
                "left": min(xs),
                "right": max(xs),
            }
        )
    return sorted(paws, key=lambda p: p["centerX"])


def derive_ellipse(paws: list[dict]) -> dict:
    left = min(p["left"] for p in paws)
    right = max(p["right"] for p in paws)
    span_x = right - left
    center_x = round((min(p["centerX"] for p in paws) + max(p["centerX"] for p in paws)) / 2)
    center_y = round(sum(p["bottomY"] for p in paws) / len(paws) - span_x * 0.06)
    margin = round(span_x * 0.08)
    semi_a = round(span_x / 2 + margin)
    semi_b = round(semi_a * 0.56)
    return {
        "centerX": center_x,
        "centerY": center_y,
        "semiA": semi_a,
        "semiB": semi_b,
        "pawSpan": {"left": left, "right": right, "spanX": span_x},
    }


def ellipse_bbox(cx: int, cy: int, a: int, b: int) -> list[int]:
    return [
        max(0, cx - a),
        max(0, cy - b),
        min(CANVAS - 1, cx + a),
        min(CANVAS - 1, cy + b),
    ]


def create_template(ellipse: dict) -> Image.Image:
    cx, cy, a, b = ellipse["centerX"], ellipse["centerY"], ellipse["semiA"], ellipse["semiB"]
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((cx - a, cy - b, cx + a, cy + b), fill=(245, 240, 232, 240), outline=(196, 168, 130, 255))
    return img


def main() -> int:
    with Image.open(LEGS_PATH).convert("RGBA") as legs:
        bbox = legs_bbox(legs)
        paws = find_paw_centers(legs, bbox)
        ellipse = derive_ellipse(paws)
        template = create_template(ellipse)
        template.save(STANDARD_DIR / "blanket_1254.png")
        payload = {
            "source": str(LEGS_PATH),
            "legs_bbox": list(bbox),
            "paws": paws,
            "ellipse": ellipse,
            "bbox": ellipse_bbox(ellipse["centerX"], ellipse["centerY"], ellipse["semiA"], ellipse["semiB"]),
            "canvas": CANVAS,
        }
        (STANDARD_DIR / "blanket_anchor.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
