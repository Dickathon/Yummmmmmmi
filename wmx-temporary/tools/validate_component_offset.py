#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


DEFAULT_MAX_SHIFT = 3
DEFAULT_ALPHA_THRESHOLD = 12
DEFAULT_MAX_MISSING_RATIO = 0.02
DEFAULT_COMPONENT = "legs"
COMPONENT_CHOICES = ("legs", "head", "body", "tail", "blanket")
STANDARD_FILENAMES = {
    "legs": "legs_1254.png",
    "head": "head_1254.png",
    "body": "body_1254.png",
    "tail": "tail_1254.png",
    "blanket": "blanket_1254.png",
}


def default_standard_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "装扮" / "pictures" / "标准底图"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Validate whether a generated component image kept the original anchor "
            "position while allowing small outward decorative growth."
        )
    )
    parser.add_argument(
        "--component",
        choices=COMPONENT_CHOICES,
        default=DEFAULT_COMPONENT,
        help=(
            "Component type used to resolve the default reference image. "
            f"Default: {DEFAULT_COMPONENT}"
        ),
    )
    parser.add_argument(
        "--reference",
        "--base",
        type=Path,
        default=None,
        help=(
            "Optional original component image. Overrides --component and --standard-dir "
            "when provided."
        ),
    )
    parser.add_argument("--candidate", required=True, type=Path, help="Generated component image.")
    parser.add_argument(
        "--standard-dir",
        type=Path,
        default=default_standard_dir(),
        help=(
            "Directory containing standard component images such as legs_1254.png. "
            f"Default: {default_standard_dir()}"
        ),
    )
    parser.add_argument(
        "--max-shift",
        type=int,
        default=DEFAULT_MAX_SHIFT,
        help=f"Maximum inward edge shift in pixels. Default: {DEFAULT_MAX_SHIFT}",
    )
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=DEFAULT_ALPHA_THRESHOLD,
        help=f"Alpha threshold used to binarize masks. Default: {DEFAULT_ALPHA_THRESHOLD}",
    )
    parser.add_argument(
        "--max-missing-ratio",
        type=float,
        default=DEFAULT_MAX_MISSING_RATIO,
        help=(
            "Maximum allowed ratio of reference pixels not covered by the candidate "
            "after tolerance expansion. Default: 0.02"
        ),
    )
    parser.add_argument("--report", type=Path, default=None, help="Optional path for the JSON report.")
    parser.add_argument("--diff", type=Path, default=None, help="Optional path for a visual diff PNG.")
    return parser.parse_args()


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def binary_alpha_mask(image: Image.Image, threshold: int) -> Image.Image:
    return image.getchannel("A").point(lambda value: 255 if value > threshold else 0, mode="L")


def dilate_mask(mask: Image.Image, radius: int) -> Image.Image:
    if radius <= 0:
        return mask.copy()
    return mask.filter(ImageFilter.MaxFilter(size=radius * 2 + 1))


def invert_binary_mask(mask: Image.Image) -> Image.Image:
    return mask.point(lambda value: 0 if value else 255, mode="L")


def count_mask_pixels(mask: Image.Image) -> int:
    histogram = mask.histogram()
    return histogram[255] if len(histogram) > 255 else 0


def bbox_to_list(bbox: tuple[int, int, int, int] | None) -> list[int] | None:
    return list(bbox) if bbox else None


def signed_bbox_delta(
    reference_bbox: tuple[int, int, int, int],
    candidate_bbox: tuple[int, int, int, int],
) -> dict[str, int]:
    return {
        "left": candidate_bbox[0] - reference_bbox[0],
        "top": candidate_bbox[1] - reference_bbox[1],
        "right": candidate_bbox[2] - reference_bbox[2],
        "bottom": candidate_bbox[3] - reference_bbox[3],
    }


def inward_bbox_shift(
    reference_bbox: tuple[int, int, int, int],
    candidate_bbox: tuple[int, int, int, int],
) -> dict[str, int]:
    return {
        "left": max(0, candidate_bbox[0] - reference_bbox[0]),
        "top": max(0, candidate_bbox[1] - reference_bbox[1]),
        "right": max(0, reference_bbox[2] - candidate_bbox[2]),
        "bottom": max(0, reference_bbox[3] - candidate_bbox[3]),
    }


def tint_from_mask(mask: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    tinted = Image.new("RGBA", mask.size, color[:3] + (0,))
    tinted.putalpha(mask.point(lambda value: color[3] if value else 0, mode="L"))
    return tinted


def build_diff_image(
    reference_mask: Image.Image,
    candidate_mask: Image.Image,
    missing_mask: Image.Image,
    extra_mask: Image.Image,
) -> Image.Image:
    diff = Image.new("RGBA", reference_mask.size, (0, 0, 0, 0))
    diff.alpha_composite(tint_from_mask(reference_mask, (255, 255, 255, 56)))
    diff.alpha_composite(tint_from_mask(candidate_mask, (0, 170, 255, 72)))
    diff.alpha_composite(tint_from_mask(extra_mask, (0, 220, 120, 120)))
    diff.alpha_composite(tint_from_mask(missing_mask, (255, 64, 64, 220)))
    return diff


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def resolve_reference_path(args: argparse.Namespace) -> Path:
    if args.reference is not None:
        return args.reference.expanduser().resolve()

    standard_dir = args.standard_dir.expanduser().resolve()
    reference_path = standard_dir / STANDARD_FILENAMES[args.component]
    if not reference_path.exists():
        raise FileNotFoundError(
            f"Standard reference image not found for component '{args.component}': {reference_path}"
        )
    return reference_path


def validate(args: argparse.Namespace) -> tuple[bool, dict[str, object], Image.Image | None]:
    reference_path = resolve_reference_path(args)
    candidate_path = args.candidate.expanduser().resolve()
    standard_dir = args.standard_dir.expanduser().resolve()

    with load_rgba(reference_path) as reference_image, load_rgba(candidate_path) as candidate_image:
        report: dict[str, object] = {
            "component": args.component,
            "reference": str(reference_path),
            "candidate": str(candidate_path),
            "standard_dir": str(standard_dir),
            "max_shift": args.max_shift,
            "alpha_threshold": args.alpha_threshold,
            "max_missing_ratio": args.max_missing_ratio,
            "reference_size": list(reference_image.size),
            "candidate_size": list(candidate_image.size),
            "passed": False,
            "reasons": [],
        }

        reasons: list[str] = []
        diff_image: Image.Image | None = None

        if reference_image.size != candidate_image.size:
            reasons.append("Reference and candidate images must have the same canvas size.")
            report["reasons"] = reasons
            return False, report, diff_image

        candidate_corners: dict[str, int] = {}
        width, height = candidate_image.size
        corners = {
            "top_left": (0, 0),
            "top_right": (width - 1, 0),
            "bottom_left": (0, height - 1),
            "bottom_right": (width - 1, height - 1),
        }
        for label, point in corners.items():
            alpha = candidate_image.getpixel(point)[3]
            candidate_corners[label] = alpha
            if alpha != 0:
                reasons.append(f"Candidate corner alpha must be 0 at {label}, got {alpha}.")
        report["candidate_corner_alpha"] = candidate_corners

        reference_mask = binary_alpha_mask(reference_image, args.alpha_threshold)
        candidate_mask = binary_alpha_mask(candidate_image, args.alpha_threshold)
        reference_bbox = reference_mask.getbbox()
        candidate_bbox = candidate_mask.getbbox()

        report["reference_bbox"] = bbox_to_list(reference_bbox)
        report["candidate_bbox"] = bbox_to_list(candidate_bbox)

        if reference_bbox is None:
            reasons.append("Reference image alpha mask is empty.")
        if candidate_bbox is None:
            reasons.append("Candidate image alpha mask is empty.")
        if reasons:
            report["reasons"] = reasons
            return False, report, diff_image

        bbox_delta = signed_bbox_delta(reference_bbox, candidate_bbox)
        inward_shift = inward_bbox_shift(reference_bbox, candidate_bbox)
        max_inward_shift = max(inward_shift.values())
        report["bbox_delta"] = bbox_delta
        report["inward_shift"] = inward_shift
        report["max_inward_shift"] = max_inward_shift

        if max_inward_shift > args.max_shift:
            reasons.append(
                f"Candidate bbox shifts inward by {max_inward_shift}px, exceeding the allowed {args.max_shift}px."
            )

        dilated_candidate = dilate_mask(candidate_mask, args.max_shift)
        inverse_dilated_candidate = invert_binary_mask(dilated_candidate)
        missing_mask = ImageChops.multiply(reference_mask, inverse_dilated_candidate)
        missing_pixels = count_mask_pixels(missing_mask)
        reference_pixels = count_mask_pixels(reference_mask)
        missing_ratio = (missing_pixels / reference_pixels) if reference_pixels else 1.0

        dilated_reference = dilate_mask(reference_mask, args.max_shift)
        inverse_dilated_reference = invert_binary_mask(dilated_reference)
        extra_mask = ImageChops.multiply(candidate_mask, inverse_dilated_reference)
        extra_pixels = count_mask_pixels(extra_mask)
        candidate_pixels = count_mask_pixels(candidate_mask)
        extra_ratio = (extra_pixels / candidate_pixels) if candidate_pixels else 0.0

        report["reference_pixels"] = reference_pixels
        report["candidate_pixels"] = candidate_pixels
        report["missing_pixels"] = missing_pixels
        report["missing_ratio"] = round(missing_ratio, 6)
        report["extra_pixels"] = extra_pixels
        report["extra_ratio"] = round(extra_ratio, 6)

        if missing_ratio > args.max_missing_ratio:
            reasons.append(
                "Reference coverage is too low after tolerance expansion: "
                f"{missing_ratio:.4%} missing, allowed {args.max_missing_ratio:.4%}."
            )

        diff_image = build_diff_image(reference_mask, candidate_mask, missing_mask, extra_mask)

        report["passed"] = not reasons
        report["reasons"] = reasons
        return not reasons, report, diff_image


def format_summary(report: dict[str, object]) -> str:
    candidate_name = Path(str(report["candidate"])).name
    status = "PASS" if report["passed"] else "FAIL"
    component = str(report.get("component", "component"))
    lines = [
        f"{status} {component} {candidate_name}",
        f"bbox: ref={report.get('reference_bbox')} cand={report.get('candidate_bbox')}",
        "max_inward_shift="
        f"{report.get('max_inward_shift', 'n/a')} "
        f"missing_ratio={report.get('missing_ratio', 'n/a')}",
    ]
    reasons = report.get("reasons", [])
    if isinstance(reasons, list):
        for reason in reasons:
            lines.append(f"reason: {reason}")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()

    if args.max_shift < 0:
        raise SystemExit("--max-shift must be >= 0")
    if not 0 <= args.alpha_threshold <= 255:
        raise SystemExit("--alpha-threshold must be between 0 and 255")
    if not 0 <= args.max_missing_ratio <= 1:
        raise SystemExit("--max-missing-ratio must be between 0 and 1")

    try:
        passed, report, diff_image = validate(args)
    except Exception as exc:  # pragma: no cover - defensive CLI handling
        error_report = {
            "component": args.component,
            "reference": str(args.reference.expanduser().resolve()) if args.reference is not None else None,
            "candidate": str(args.candidate.expanduser().resolve()),
            "passed": False,
            "reasons": [str(exc)],
        }
        if args.report is not None:
            write_json(args.report.expanduser().resolve(), error_report)
        print(format_summary(error_report))
        return 1

    if args.report is not None:
        write_json(args.report.expanduser().resolve(), report)

    if args.diff is not None and diff_image is not None:
        diff_path = args.diff.expanduser().resolve()
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        diff_image.save(diff_path)

    print(format_summary(report))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
