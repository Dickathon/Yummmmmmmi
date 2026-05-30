#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Compose a validated legs decor asset by alpha-compositing an AI-generated "
            "legs decoration image over the original 1254x1254 legs base."
        )
    )
    parser.add_argument("--base", required=True, type=Path, help="Original legs base image.")
    parser.add_argument("--decor", required=True, type=Path, help="AI-generated decor image.")
    parser.add_argument("--out", required=True, type=Path, help="Output composed PNG path.")
    return parser.parse_args()


def ensure_same_size(base: Image.Image, decor: Image.Image, base_path: Path, decor_path: Path) -> None:
    if base.size != decor.size:
        raise RuntimeError(
            f"Image sizes must match: {base_path.name}={base.size}, {decor_path.name}={decor.size}"
        )


def main() -> None:
    args = parse_args()
    base_path = args.base.expanduser().resolve()
    decor_path = args.decor.expanduser().resolve()
    out_path = args.out.expanduser().resolve()

    with Image.open(base_path).convert("RGBA") as base_image, Image.open(decor_path).convert("RGBA") as decor_image:
        ensure_same_size(base_image, decor_image, base_path, decor_path)
        composed = base_image.copy()
        composed.alpha_composite(decor_image)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    composed.save(out_path)
    print(out_path)


if __name__ == "__main__":
    main()
