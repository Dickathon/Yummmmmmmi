#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops


EXPECTED_SIZE = (1254, 1254)
DEFAULT_ALPHA_THRESHOLD = 12
DEFAULT_DIFF_THRESHOLD = 28


def default_base_path() -> Path:
    return Path(__file__).resolve().parent.parent / "装扮" / "pictures" / "标准底图" / "head_1254.png"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Finalize a built-in generated head image by removing the chroma-key "
            "background and compositing accessory pixels back onto the original head."
        )
    )
    parser.add_argument("--source", required=True, type=Path, help="Raw built-in generated PNG.")
    parser.add_argument("--out", required=True, type=Path, help="Final transparent head PNG.")
    parser.add_argument(
        "--base",
        type=Path,
        default=default_base_path(),
        help=f"Original head reference PNG. Default: {default_base_path()}",
    )
    parser.add_argument(
        "--remove-script",
        required=True,
        type=Path,
        help="Path to remove_chroma_key.py.",
    )
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=DEFAULT_ALPHA_THRESHOLD,
        help=f"Visible-alpha threshold. Default: {DEFAULT_ALPHA_THRESHOLD}",
    )
    parser.add_argument(
        "--diff-threshold",
        type=int,
        default=DEFAULT_DIFF_THRESHOLD,
        help=f"Minimum RGB delta treated as accessory overlay. Default: {DEFAULT_DIFF_THRESHOLD}",
    )
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="Keep the intermediate chroma-key-removed image next to the output for debugging.",
    )
    return parser.parse_args()


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def alpha_mask(image: Image.Image, threshold: int) -> Image.Image:
    return image.getchannel("A").point(lambda value: 255 if value > threshold else 0, mode="L")


def validate_png(path: Path) -> None:
    with Image.open(path) as image:
        if image.size != EXPECTED_SIZE:
            raise RuntimeError(f"Invalid size for {path.name}: {image.size}, expected {EXPECTED_SIZE}.")

        rgba = image.convert("RGBA")
        corners = [(0, 0), (rgba.width - 1, 0), (0, rgba.height - 1), (rgba.width - 1, rgba.height - 1)]
        for point in corners:
            if rgba.getpixel(point)[3] != 0:
                raise RuntimeError(f"Corner alpha must be 0 for {path.name} at {point}.")


def ensure_exists(path: Path, label: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")


def remove_background(source: Path, destination: Path, remove_script: Path) -> None:
    command = [
        sys.executable,
        str(remove_script),
        "--input",
        str(source),
        "--out",
        str(destination),
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


def max_channel_difference(candidate: Image.Image, base: Image.Image) -> Image.Image:
    diff = ImageChops.difference(candidate.convert("RGB"), base.convert("RGB"))
    red, green, blue = diff.split()
    return ImageChops.lighter(ImageChops.lighter(red, green), blue)


def build_overlay_mask(
    *,
    base_image: Image.Image,
    candidate_image: Image.Image,
    alpha_threshold: int,
    diff_threshold: int,
) -> Image.Image:
    base_visible = alpha_mask(base_image, alpha_threshold)
    candidate_visible = alpha_mask(candidate_image, alpha_threshold)
    outside_base = ImageChops.subtract(candidate_visible, base_visible)

    rgb_delta = max_channel_difference(candidate_image, base_image)
    overlay_inside = rgb_delta.point(
        lambda value: 255 if value >= diff_threshold else 0,
        mode="L",
    )
    overlay_inside = ImageChops.multiply(overlay_inside, base_visible)
    overlay_inside = ImageChops.multiply(overlay_inside, candidate_visible)

    return ImageChops.lighter(outside_base, overlay_inside)


def apply_overlay(base_image: Image.Image, candidate_image: Image.Image, overlay_mask: Image.Image) -> Image.Image:
    overlay = candidate_image.copy()
    overlay.putalpha(ImageChops.multiply(candidate_image.getchannel("A"), overlay_mask))
    final = base_image.copy()
    final.alpha_composite(overlay)
    return final


def main() -> None:
    args = parse_args()
    source = args.source.expanduser().resolve()
    out = args.out.expanduser().resolve()
    base = args.base.expanduser().resolve()
    remove_script = args.remove_script.expanduser().resolve()

    if not 0 <= args.alpha_threshold <= 255:
        raise SystemExit("--alpha-threshold must be between 0 and 255")
    if not 0 <= args.diff_threshold <= 255:
        raise SystemExit("--diff-threshold must be between 0 and 255")

    ensure_exists(source, "Source image")
    ensure_exists(base, "Base image")
    ensure_exists(remove_script, "remove_chroma_key.py")

    out.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="head_builtin_") as tmp_dir:
        chroma_removed = Path(tmp_dir) / "candidate.png"
        remove_background(source, chroma_removed, remove_script)

        with load_rgba(base) as base_image, load_rgba(chroma_removed) as candidate_image:
            if base_image.size != EXPECTED_SIZE:
                raise RuntimeError(f"Base image must be {EXPECTED_SIZE}, got {base_image.size}")
            if candidate_image.size != EXPECTED_SIZE:
                raise RuntimeError(f"Candidate image must be {EXPECTED_SIZE}, got {candidate_image.size}")

            overlay_mask = build_overlay_mask(
                base_image=base_image,
                candidate_image=candidate_image,
                alpha_threshold=args.alpha_threshold,
                diff_threshold=args.diff_threshold,
            )
            final = apply_overlay(base_image, candidate_image, overlay_mask)
            final.save(out)

            if args.keep_temp:
                debug_candidate = out.with_name(out.stem + "_candidate.png")
                debug_mask = out.with_name(out.stem + "_overlay_mask.png")
                shutil.copy2(chroma_removed, debug_candidate)
                overlay_mask.save(debug_mask)

    validate_png(out)
    print(out)


if __name__ == "__main__":
    main()
