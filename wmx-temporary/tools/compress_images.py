#!/usr/bin/env python3
from __future__ import annotations

import argparse
import io
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


@dataclass
class Candidate:
    width: int
    height: int
    quality: int
    size_bytes: int
    data: bytes


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compress one image or a whole directory to target sizes."
    )
    parser.add_argument("input", help="Input image file or directory.")
    parser.add_argument(
        "--targets-kb",
        nargs="+",
        type=int,
        default=[5, 10, 20],
        help="Target sizes in KB. Default: 5 10 20",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Optional output directory. Defaults to a folder next to the script input.",
    )
    parser.add_argument(
        "--format",
        choices=["webp"],
        default="webp",
        help="Output format. Default: webp",
    )
    parser.add_argument(
        "--min-width",
        type=int,
        default=96,
        help="Smallest width the search is allowed to try. Default: 96",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing output files.",
    )
    return parser.parse_args()


def collect_inputs(input_path: Path) -> list[Path]:
    if input_path.is_file():
        return [input_path]

    if input_path.is_dir():
        return sorted(
            path
            for path in input_path.iterdir()
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        )

    raise FileNotFoundError(f"Input path does not exist: {input_path}")


def build_output_dir(cli_output_dir: Path | None, source_input: Path) -> Path:
    if cli_output_dir is not None:
        return cli_output_dir

    if source_input.is_file():
        return source_input.parent / "compressed-output"

    return source_input / "compressed-output"


def open_image(path: Path) -> Image.Image:
    image = Image.open(path)
    if "A" in image.getbands():
        return image.convert("RGBA")
    return image.convert("RGB")


def candidate_widths(original_width: int, min_width: int) -> list[int]:
    floor = min(min_width, original_width)
    widths = {original_width, floor}
    step = max(4, original_width // 32)

    current = original_width
    while current > floor:
        current = max(floor, current - step)
        widths.add(current)

    scales = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3]
    for scale in scales:
        widths.add(max(floor, round(original_width * scale)))

    return sorted(widths, reverse=True)


def candidate_qualities() -> Iterable[int]:
    return [90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10]


def resize_image(image: Image.Image, width: int) -> Image.Image:
    if width == image.width:
        return image
    height = max(1, round(image.height * width / image.width))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def encode_webp(image: Image.Image, quality: int) -> bytes:
    buffer = io.BytesIO()
    save_kwargs = {
        "format": "WEBP",
        "quality": quality,
        "method": 6,
    }
    if image.mode == "RGBA":
        save_kwargs["alpha_quality"] = max(quality, 70)
    image.save(buffer, **save_kwargs)
    return buffer.getvalue()


def find_best_candidate(image: Image.Image, target_kb: int, min_width: int) -> Candidate:
    target_bytes = target_kb * 1024
    smallest: Candidate | None = None

    for width in candidate_widths(image.width, min_width):
        resized = resize_image(image, width)
        for quality in candidate_qualities():
            data = encode_webp(resized, quality)
            candidate = Candidate(
                width=resized.width,
                height=resized.height,
                quality=quality,
                size_bytes=len(data),
                data=data,
            )

            if smallest is None or candidate.size_bytes < smallest.size_bytes:
                smallest = candidate

            if candidate.size_bytes <= target_bytes:
                return candidate

    if smallest is None:
        raise RuntimeError("Failed to generate any compressed candidate.")

    return smallest


def output_name(source: Path, target_kb: int) -> str:
    return f"{source.stem}-{target_kb}kb.webp"


def compress_one_image(
    source: Path,
    output_dir: Path,
    targets_kb: list[int],
    min_width: int,
    overwrite: bool,
) -> list[str]:
    image = open_image(source)
    reports: list[str] = []

    for target_kb in sorted(set(targets_kb)):
        candidate = find_best_candidate(image, target_kb, min_width)
        destination = output_dir / output_name(source, target_kb)

        if destination.exists() and not overwrite:
            raise FileExistsError(
                f"Output already exists: {destination}. Use --overwrite to replace it."
            )

        destination.write_bytes(candidate.data)
        reports.append(
            f"{source.name} -> {destination.name} | "
            f"{candidate.width}x{candidate.height} | "
            f"q{candidate.quality} | "
            f"{candidate.size_bytes / 1024:.1f}KB"
        )

    return reports


def main() -> None:
    args = parse_args()
    input_path = Path(args.input).expanduser().resolve()
    sources = collect_inputs(input_path)
    output_dir = build_output_dir(args.output_dir, input_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    for source in sources:
        for report in compress_one_image(
            source=source,
            output_dir=output_dir,
            targets_kb=args.targets_kb,
            min_width=args.min_width,
            overwrite=args.overwrite,
        ):
            print(report)


if __name__ == "__main__":
    main()
