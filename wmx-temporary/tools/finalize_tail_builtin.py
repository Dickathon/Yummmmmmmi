#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Copy a built-in generated tail image, remove the chroma-key background, and validate the final PNG."
    )
    parser.add_argument("--source", required=True, type=Path, help="Raw generated image path.")
    parser.add_argument("--food", required=True, help="Formal food name used in the final filename.")
    parser.add_argument(
        "--pictures-dir",
        required=True,
        type=Path,
        help="Target pictures directory.",
    )
    parser.add_argument(
        "--tmp-dir",
        required=True,
        type=Path,
        help="Directory for preserved raw built-in outputs.",
    )
    parser.add_argument(
        "--remove-script",
        required=True,
        type=Path,
        help="Path to remove_chroma_key.py.",
    )
    return parser.parse_args()


def ensure_exists(path: Path, label: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")


def validate_png(path: Path) -> None:
    with Image.open(path) as image:
        if image.size != (1024, 1024):
            raise RuntimeError(f"Invalid size for {path.name}: {image.size}")
        rgba = image.convert("RGBA")
        corners = [(0, 0), (1023, 0), (0, 1023), (1023, 1023)]
        for x, y in corners:
            if rgba.getpixel((x, y))[3] != 0:
                raise RuntimeError(f"Corner alpha is not 0 for {path.name} at {(x, y)}")


def normalize_canvas(source: Path, destination: Path) -> Path:
    with Image.open(source) as image:
        rgba = image.convert("RGBA")
        if rgba.size == (1024, 1024):
            shutil.copy2(source, destination)
            return destination

        resized = rgba.resize((1024, 1024), Image.LANCZOS)
        resized.save(destination)
        return destination


def main() -> None:
    args = parse_args()
    source = args.source.expanduser().resolve()
    pictures_dir = args.pictures_dir.expanduser().resolve()
    tmp_dir = args.tmp_dir.expanduser().resolve()
    remove_script = args.remove_script.expanduser().resolve()

    ensure_exists(source, "Source image")
    ensure_exists(remove_script, "remove_chroma_key.py")

    pictures_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    raw_path = tmp_dir / f"tail_1024_{args.food}_raw.png"
    normalized_raw_path = tmp_dir / f"tail_1024_{args.food}_raw_1024.png"
    final_path = pictures_dir / f"tail_1024_{args.food}.png"

    shutil.copy2(source, raw_path)
    normalize_canvas(raw_path, normalized_raw_path)

    command = [
        sys.executable,
        str(remove_script),
        "--input",
        str(normalized_raw_path),
        "--out",
        str(final_path),
        "--auto-key",
        "border",
        "--soft-matte",
        "--transparent-threshold",
        "12",
        "--opaque-threshold",
        "220",
        "--despill",
        "--force",
    ]
    subprocess.run(command, check=True)
    validate_png(final_path)
    print(final_path)


if __name__ == "__main__":
    main()
