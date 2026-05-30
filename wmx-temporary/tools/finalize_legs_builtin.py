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
        description=(
            "Finalize a cyan-background built-in legs generation by removing the key color, "
            "compositing it over the standard legs base, and validating the result."
        )
    )
    parser.add_argument("--source", required=True, type=Path, help="Raw cyan-background generated image path.")
    parser.add_argument("--food", required=True, help="Formal food name used in the final filename.")
    parser.add_argument("--pictures-dir", required=True, type=Path, help="Target directory for final legs assets.")
    parser.add_argument("--tmp-dir", required=True, type=Path, help="Directory for preserved intermediates.")
    parser.add_argument("--remove-script", required=True, type=Path, help="Path to remove_chroma_key.py.")
    parser.add_argument("--base-image", required=True, type=Path, help="Standard legs base PNG.")
    parser.add_argument(
        "--validator-script",
        required=True,
        type=Path,
        help="Path to validate_component_offset.py.",
    )
    return parser.parse_args()


def ensure_exists(path: Path, label: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")


def compose_layers(base_image: Path, decor_image: Path, destination: Path) -> None:
    with Image.open(base_image).convert("RGBA") as base_rgba, Image.open(decor_image).convert("RGBA") as decor_rgba:
        if base_rgba.size != decor_rgba.size:
            raise RuntimeError(
                f"Image sizes must match: {base_image.name}={base_rgba.size}, {decor_image.name}={decor_rgba.size}"
            )
        out = base_rgba.copy()
        out.alpha_composite(decor_rgba)
        destination.parent.mkdir(parents=True, exist_ok=True)
        out.save(destination)


def run_remove_chroma(remove_script: Path, source: Path, destination: Path) -> None:
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
        "96",
        "--despill",
        "--force",
    ]
    subprocess.run(command, check=True)


def run_validator(validator_script: Path, candidate: Path) -> None:
    command = [
        sys.executable,
        str(validator_script),
        "--candidate",
        str(candidate),
        "--component",
        "legs",
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    sys.stdout.write(result.stdout)
    if result.stderr:
        sys.stderr.write(result.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"Validation failed for {candidate.name}")


def main() -> None:
    args = parse_args()
    source = args.source.expanduser().resolve()
    pictures_dir = args.pictures_dir.expanduser().resolve()
    tmp_dir = args.tmp_dir.expanduser().resolve()
    remove_script = args.remove_script.expanduser().resolve()
    base_image = args.base_image.expanduser().resolve()
    validator_script = args.validator_script.expanduser().resolve()

    ensure_exists(source, "Source image")
    ensure_exists(remove_script, "remove_chroma_key.py")
    ensure_exists(base_image, "Base image")
    ensure_exists(validator_script, "Validator script")

    pictures_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    raw_path = tmp_dir / f"{args.food}_四肢_cyan_raw.png"
    transparent_path = tmp_dir / f"{args.food}_四肢_decor.png"
    final_path = pictures_dir / f"{args.food}_四肢.png"

    shutil.copy2(source, raw_path)
    run_remove_chroma(remove_script, raw_path, transparent_path)
    compose_layers(base_image, transparent_path, final_path)
    run_validator(validator_script, final_path)
    print(final_path)


if __name__ == "__main__":
    main()
