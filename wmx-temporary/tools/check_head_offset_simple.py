#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


EXPECTED_SIZE = (1254, 1254)
DEFAULT_MAX_SHIFT = 3
DEFAULT_ALPHA_THRESHOLD = 12
DEFAULT_MAX_MISSING_RATIO = 0.02


def default_base_path() -> Path:
    tools_dir = Path(__file__).resolve().parent
    return (
        tools_dir.parent
        / "\u88c5\u626e"
        / "pictures"
        / "\u6807\u51c6\u5e95\u56fe"
        / "head_1254.png"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Quickly check whether a generated head component kept the original "
            "1254x1254 anchor position."
        )
    )
    parser.add_argument("--new", required=True, type=Path, help="Generated head image to check.")
    parser.add_argument(
        "--base",
        type=Path,
        default=default_base_path(),
        help=f"Original head reference image. Default: {default_base_path()}",
    )
    parser.add_argument(
        "--max-shift",
        type=int,
        default=DEFAULT_MAX_SHIFT,
        help=f"Maximum allowed inward bbox shift in pixels. Default: {DEFAULT_MAX_SHIFT}",
    )
    parser.add_argument(
        "--max-missing-ratio",
        type=float,
        default=DEFAULT_MAX_MISSING_RATIO,
        help=(
            "Maximum allowed ratio of original head pixels not covered by the new image. "
            f"Default: {DEFAULT_MAX_MISSING_RATIO}"
        ),
    )
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=DEFAULT_ALPHA_THRESHOLD,
        help=f"Alpha value above this is treated as visible. Default: {DEFAULT_ALPHA_THRESHOLD}",
    )
    return parser.parse_args()


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def alpha_mask(image: Image.Image, threshold: int) -> Image.Image:
    return image.getchannel("A").point(lambda value: 255 if value > threshold else 0, mode="L")


def dilate(mask: Image.Image, radius: int) -> Image.Image:
    if radius <= 0:
        return mask.copy()
    return mask.filter(ImageFilter.MaxFilter(radius * 2 + 1))


def invert(mask: Image.Image) -> Image.Image:
    return mask.point(lambda value: 0 if value else 255, mode="L")


def count_visible(mask: Image.Image) -> int:
    histogram = mask.histogram()
    return histogram[255] if len(histogram) > 255 else 0


def bbox_to_text(bbox: tuple[int, int, int, int] | None) -> str:
    return str(list(bbox)) if bbox else "None"


def inward_shift(
    base_bbox: tuple[int, int, int, int],
    new_bbox: tuple[int, int, int, int],
) -> dict[str, int]:
    return {
        "left": max(0, new_bbox[0] - base_bbox[0]),
        "top": max(0, new_bbox[1] - base_bbox[1]),
        "right": max(0, base_bbox[2] - new_bbox[2]),
        "bottom": max(0, base_bbox[3] - new_bbox[3]),
    }


def check(args: argparse.Namespace) -> tuple[bool, list[str], dict[str, object]]:
    base_path = args.base.expanduser().resolve()
    new_path = args.new.expanduser().resolve()
    reasons: list[str] = []
    metrics: dict[str, object] = {
        "base": str(base_path),
        "new": str(new_path),
        "base_bbox": None,
        "new_bbox": None,
        "max_inward_shift": "n/a",
        "missing_ratio": "n/a",
    }

    with load_rgba(base_path) as base_image, load_rgba(new_path) as new_image:
        metrics["base_size"] = list(base_image.size)
        metrics["new_size"] = list(new_image.size)

        if base_image.size != EXPECTED_SIZE:
            reasons.append(f"Base image must be {EXPECTED_SIZE[0]}x{EXPECTED_SIZE[1]}, got {base_image.size}.")
        if new_image.size != EXPECTED_SIZE:
            reasons.append(f"New image must be {EXPECTED_SIZE[0]}x{EXPECTED_SIZE[1]}, got {new_image.size}.")
        if base_image.size != new_image.size:
            reasons.append("Base and new image sizes must match.")
            return False, reasons, metrics

        width, height = new_image.size
        corners = {
            "top_left": (0, 0),
            "top_right": (width - 1, 0),
            "bottom_left": (0, height - 1),
            "bottom_right": (width - 1, height - 1),
        }
        corner_alpha: dict[str, int] = {}
        for label, point in corners.items():
            alpha = new_image.getpixel(point)[3]
            corner_alpha[label] = alpha
            if alpha != 0:
                reasons.append(f"New image corner alpha must be 0 at {label}, got {alpha}.")
        metrics["corner_alpha"] = corner_alpha

        base_mask = alpha_mask(base_image, args.alpha_threshold)
        new_mask = alpha_mask(new_image, args.alpha_threshold)
        base_bbox = base_mask.getbbox()
        new_bbox = new_mask.getbbox()
        metrics["base_bbox"] = list(base_bbox) if base_bbox else None
        metrics["new_bbox"] = list(new_bbox) if new_bbox else None

        if base_bbox is None:
            reasons.append("Base image alpha mask is empty.")
        if new_bbox is None:
            reasons.append("New image alpha mask is empty.")
        if base_bbox is None or new_bbox is None:
            return False, reasons, metrics

        shifts = inward_shift(base_bbox, new_bbox)
        max_inward_shift = max(shifts.values())
        metrics["inward_shift"] = shifts
        metrics["max_inward_shift"] = max_inward_shift
        if max_inward_shift > args.max_shift:
            reasons.append(
                f"New image bbox shifts inward by {max_inward_shift}px, "
                f"exceeding the allowed {args.max_shift}px."
            )

        expanded_new_mask = dilate(new_mask, args.max_shift)
        missing_mask = ImageChops.multiply(base_mask, invert(expanded_new_mask))
        missing_pixels = count_visible(missing_mask)
        base_pixels = count_visible(base_mask)
        missing_ratio = (missing_pixels / base_pixels) if base_pixels else 1.0
        metrics["missing_pixels"] = missing_pixels
        metrics["base_pixels"] = base_pixels
        metrics["missing_ratio"] = round(missing_ratio, 6)

        if missing_ratio > args.max_missing_ratio:
            reasons.append(
                "Original head coverage is too low after tolerance expansion: "
                f"{missing_ratio:.4%} missing, allowed {args.max_missing_ratio:.4%}."
            )

    return not reasons, reasons, metrics


def print_result(passed: bool, reasons: list[str], metrics: dict[str, object]) -> None:
    status = "PASS" if passed else "FAIL"
    new_name = Path(str(metrics["new"])).name
    print(f"{status} head_offset {new_name}")
    print(f"base_bbox={metrics.get('base_bbox')} new_bbox={metrics.get('new_bbox')}")
    print(
        "max_inward_shift="
        f"{metrics.get('max_inward_shift')} "
        f"missing_ratio={metrics.get('missing_ratio')}"
    )
    if not passed:
        for reason in reasons:
            print(f"reason: {reason}")
        print("action: regenerate this head image before using it as a final asset.")


def main() -> int:
    args = parse_args()
    if args.max_shift < 0:
        raise SystemExit("--max-shift must be >= 0")
    if not 0 <= args.alpha_threshold <= 255:
        raise SystemExit("--alpha-threshold must be between 0 and 255")
    if not 0 <= args.max_missing_ratio <= 1:
        raise SystemExit("--max-missing-ratio must be between 0 and 1")

    try:
        passed, reasons, metrics = check(args)
    except Exception as exc:
        print(f"FAIL head_offset {args.new}")
        print(f"reason: {exc}")
        print("action: regenerate this head image before using it as a final asset.")
        return 1

    print_result(passed, reasons, metrics)
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
