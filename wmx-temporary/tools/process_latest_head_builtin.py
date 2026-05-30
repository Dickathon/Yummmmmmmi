#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def default_generated_images_dir() -> Path:
    return Path.home() / ".codex" / "generated_images"


def default_pipeline_dir() -> Path:
    return Path.home() / ".codex" / "head_pipeline"


def default_pictures_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "装扮" / "pictures"


def default_base_path() -> Path:
    return default_pictures_dir() / "标准底图" / "head_1254.png"


def default_finalize_script() -> Path:
    return Path(__file__).resolve().parent / "finalize_head_builtin.py"


def default_simple_validator() -> Path:
    return Path(__file__).resolve().parent / "check_head_offset_simple.py"


def default_full_validator() -> Path:
    return Path(__file__).resolve().parent / "validate_component_offset.py"


def default_remove_script() -> Path:
    return Path.home() / ".codex" / "skills" / ".system" / "imagegen" / "scripts" / "remove_chroma_key.py"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Copy the newest built-in generated image, finalize it as a head accessory "
            "component, validate it, and write the final Chinese-named PNG into pictures."
        )
    )
    parser.add_argument("--food", required=True, help="Formal food name used in the final filename.")
    parser.add_argument("--slug", required=True, help="ASCII slug used for intermediate filenames.")
    parser.add_argument(
        "--source-file",
        type=Path,
        default=None,
        help="Optional exact built-in generated PNG to process. Overrides --generated-images-dir when provided.",
    )
    parser.add_argument(
        "--generated-images-dir",
        type=Path,
        default=default_generated_images_dir(),
        help=f"Directory containing built-in generated images. Default: {default_generated_images_dir()}",
    )
    parser.add_argument(
        "--pipeline-dir",
        type=Path,
        default=default_pipeline_dir(),
        help=f"ASCII-only temp working directory. Default: {default_pipeline_dir()}",
    )
    parser.add_argument(
        "--pictures-dir",
        type=Path,
        default=default_pictures_dir(),
        help=f"Final pictures directory. Default: {default_pictures_dir()}",
    )
    parser.add_argument(
        "--base",
        type=Path,
        default=default_base_path(),
        help=f"Original head base PNG. Default: {default_base_path()}",
    )
    parser.add_argument(
        "--finalize-script",
        type=Path,
        default=default_finalize_script(),
        help=f"Path to finalize_head_builtin.py. Default: {default_finalize_script()}",
    )
    parser.add_argument(
        "--simple-validator",
        type=Path,
        default=default_simple_validator(),
        help=f"Path to check_head_offset_simple.py. Default: {default_simple_validator()}",
    )
    parser.add_argument(
        "--full-validator",
        type=Path,
        default=default_full_validator(),
        help=f"Path to validate_component_offset.py. Default: {default_full_validator()}",
    )
    parser.add_argument(
        "--remove-script",
        type=Path,
        default=default_remove_script(),
        help=f"Path to remove_chroma_key.py. Default: {default_remove_script()}",
    )
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="Keep candidate and overlay-mask debug outputs.",
    )
    return parser.parse_args()


def ensure_exists(path: Path, label: str) -> None:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")


def newest_png(directory: Path) -> Path:
    candidates = sorted(
        directory.rglob("*.png"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(f"No PNG files found under {directory}")
    return candidates[0]


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def main() -> None:
    args = parse_args()
    generated_images_dir = args.generated_images_dir.expanduser().resolve()
    source_file = args.source_file.expanduser().resolve() if args.source_file is not None else None
    pipeline_dir = args.pipeline_dir.expanduser().resolve()
    pictures_dir = args.pictures_dir.expanduser().resolve()
    base = args.base.expanduser().resolve()
    finalize_script = args.finalize_script.expanduser().resolve()
    simple_validator = args.simple_validator.expanduser().resolve()
    full_validator = args.full_validator.expanduser().resolve()
    remove_script = args.remove_script.expanduser().resolve()

    if source_file is None:
        ensure_exists(generated_images_dir, "Generated images directory")
    else:
        ensure_exists(source_file, "Source image")
    ensure_exists(base, "Base image")
    ensure_exists(finalize_script, "finalize_head_builtin.py")
    ensure_exists(simple_validator, "check_head_offset_simple.py")
    ensure_exists(full_validator, "validate_component_offset.py")
    ensure_exists(remove_script, "remove_chroma_key.py")

    raw_dir = pipeline_dir / "raw"
    final_dir = pipeline_dir / "final"
    raw_dir.mkdir(parents=True, exist_ok=True)
    final_dir.mkdir(parents=True, exist_ok=True)
    pictures_dir.mkdir(parents=True, exist_ok=True)

    latest = source_file if source_file is not None else newest_png(generated_images_dir)
    raw_path = raw_dir / f"{args.slug}_head_raw.png"
    final_path = final_dir / f"{args.slug}_head_final.png"
    destination = pictures_dir / f"{args.food}_头部.png"

    shutil.copy2(latest, raw_path)

    finalize_command = [
        sys.executable,
        str(finalize_script),
        "--source",
        str(raw_path),
        "--out",
        str(final_path),
        "--base",
        str(base),
        "--remove-script",
        str(remove_script),
    ]
    if args.keep_temp:
        finalize_command.append("--keep-temp")
    run(finalize_command)

    run(
        [
            sys.executable,
            str(simple_validator),
            "--base",
            str(base),
            "--new",
            str(final_path),
        ]
    )
    run(
        [
            sys.executable,
            str(full_validator),
            "--component",
            "head",
            "--reference",
            str(base),
            "--candidate",
            str(final_path),
        ]
    )

    shutil.copy2(final_path, destination)
    print(destination)


if __name__ == "__main__":
    main()
