#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


DEFAULT_ALPHA_THRESHOLD = 12
DEFAULT_OUTWARD_ALLOWANCE = 14


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Clamp a generated component back to the reference silhouette while "
            "preserving a small amount of outward decorative growth."
        )
    )
    parser.add_argument("--reference", required=True, type=Path, help="Reference component PNG.")
    parser.add_argument("--candidate", required=True, type=Path, help="Generated component PNG.")
    parser.add_argument("--out", required=True, type=Path, help="Final clamped output PNG.")
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=DEFAULT_ALPHA_THRESHOLD,
        help=f"Alpha threshold used to build the reference mask. Default: {DEFAULT_ALPHA_THRESHOLD}",
    )
    parser.add_argument(
        "--outward-allowance",
        type=int,
        default=DEFAULT_OUTWARD_ALLOWANCE,
        help=(
            "How many pixels the generated asset may extend beyond the reference "
            f"silhouette. Default: {DEFAULT_OUTWARD_ALLOWANCE}"
        ),
    )
    return parser.parse_args()


def binary_alpha_mask(image: Image.Image, threshold: int) -> Image.Image:
    return image.getchannel("A").point(lambda value: 255 if value > threshold else 0, mode="L")


def dilate_mask(mask: Image.Image, radius: int) -> Image.Image:
    if radius <= 0:
        return mask.copy()
    size = radius * 2 + 1
    return mask.filter(ImageFilter.MaxFilter(size=size))


def clamp_candidate_alpha(candidate: Image.Image, allowed_mask: Image.Image) -> Image.Image:
    candidate_rgba = candidate.convert("RGBA")
    rgb = Image.new("RGBA", candidate_rgba.size, (0, 0, 0, 0))
    rgb.alpha_composite(candidate_rgba)

    candidate_alpha = candidate_rgba.getchannel("A")
    clamped_alpha = ImageChops.multiply(candidate_alpha, allowed_mask)
    rgb.putalpha(clamped_alpha)
    return rgb


def main() -> int:
    args = parse_args()

    reference_path = args.reference.expanduser().resolve()
    candidate_path = args.candidate.expanduser().resolve()
    output_path = args.out.expanduser().resolve()

    with Image.open(reference_path).convert("RGBA") as reference_image, Image.open(
        candidate_path
    ).convert("RGBA") as candidate_image:
        if reference_image.size != candidate_image.size:
            raise SystemExit(
                f"Reference and candidate must have the same size: "
                f"{reference_image.size} vs {candidate_image.size}"
            )

        reference_mask = binary_alpha_mask(reference_image, args.alpha_threshold)
        allowed_mask = dilate_mask(reference_mask, args.outward_allowance)
        clamped_candidate = clamp_candidate_alpha(candidate_image, allowed_mask)

        final_image = Image.new("RGBA", reference_image.size, (0, 0, 0, 0))
        final_image.alpha_composite(reference_image)
        final_image.alpha_composite(clamped_candidate)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        final_image.save(output_path)
        print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
