#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops


SOURCE_CANVAS = (1024, 1024)
TARGET_CANVAS = (1254, 1254)
ANCHOR = ((TARGET_CANVAS[0] - SOURCE_CANVAS[0]) // 2, (TARGET_CANVAS[1] - SOURCE_CANVAS[1]) // 2)
STACK_ORDER = ("tail", "body", "legs", "head")
STANDARD_COMPONENTS = {
    "head": "head_1024.png",
    "body": "body_1024.png",
    "legs": "legs_1024.png",
    "tail": "tail_1024.png",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Expand 1024x1024 standard pet component templates to 1254x1254 by "
            "moving the original component block to the visual center and adding "
            "even transparent padding on all four sides."
        )
    )
    parser.add_argument(
        "--standard-dir",
        required=True,
        type=Path,
        help="Directory containing the standard component PNGs.",
    )
    parser.add_argument(
        "--pictures-dir",
        required=True,
        type=Path,
        help="Pictures directory that also contains cat_full.png.",
    )
    return parser.parse_args()


def ensure_exists(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(path)


def expand_canvas(image_path: Path) -> Image.Image:
    with Image.open(image_path) as image:
        rgba = image.convert("RGBA")
        if rgba.size != SOURCE_CANVAS:
            raise RuntimeError(f"Expected {SOURCE_CANVAS} for {image_path.name}, got {rgba.size}")

        expanded = Image.new("RGBA", TARGET_CANVAS, (0, 0, 0, 0))
        expanded.alpha_composite(rgba, dest=ANCHOR)
        return expanded


def alpha_bbox(image: Image.Image) -> list[int] | None:
    bbox = image.getchannel("A").getbbox()
    return list(bbox) if bbox else None


def save_expanded_images(standard_dir: Path, pictures_dir: Path) -> dict[str, Path]:
    outputs: dict[str, Path] = {}

    for component, filename in STANDARD_COMPONENTS.items():
        source = standard_dir / filename
        ensure_exists(source)
        output = standard_dir / f"{component}_1254.png"
        expanded = expand_canvas(source)
        expanded.save(output)
        outputs[component] = output

    cat_full_source = pictures_dir / "cat_full.png"
    ensure_exists(cat_full_source)
    cat_full_output = standard_dir / "cat_full_1254.png"
    expand_canvas(cat_full_source).save(cat_full_output)
    outputs["cat_full"] = cat_full_output
    return outputs


def build_preview(outputs: dict[str, Path], standard_dir: Path) -> dict[str, Path]:
    composite = Image.new("RGBA", TARGET_CANVAS, (0, 0, 0, 0))
    component_images: dict[str, Image.Image] = {}

    try:
        for component in STACK_ORDER:
            image = Image.open(outputs[component]).convert("RGBA")
            component_images[component] = image
            composite.alpha_composite(image)

        preview_path = standard_dir / "cat_recompose_1254.png"
        composite.save(preview_path)

        cat_full = Image.open(outputs["cat_full"]).convert("RGBA")
        diff = ImageChops.difference(composite, cat_full)
        diff_path = standard_dir / "cat_recompose_1254_diff.png"
        diff.save(diff_path)

        report = {
            "source_canvas": list(SOURCE_CANVAS),
            "expanded_canvas": list(TARGET_CANVAS),
            "anchor": list(ANCHOR),
            "padding_left": ANCHOR[0],
            "padding_top": ANCHOR[1],
            "padding_right": TARGET_CANVAS[0] - SOURCE_CANVAS[0] - ANCHOR[0],
            "padding_bottom": TARGET_CANVAS[1] - SOURCE_CANVAS[1] - ANCHOR[1],
            "stack_order": list(STACK_ORDER),
            "component_bboxes": {
                component: alpha_bbox(component_images[component]) for component in STACK_ORDER
            },
            "cat_full_bbox": alpha_bbox(cat_full),
            "diff_bbox": list(diff.getbbox()) if diff.getbbox() else None,
            "max_channel_delta": diff.getextrema(),
        }
        report_path = standard_dir / "cat_recompose_1254_report.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

        return {
            "preview": preview_path,
            "diff": diff_path,
            "report": report_path,
        }
    finally:
        for image in component_images.values():
            image.close()


def main() -> None:
    args = parse_args()
    standard_dir = args.standard_dir.expanduser().resolve()
    pictures_dir = args.pictures_dir.expanduser().resolve()

    outputs = save_expanded_images(standard_dir, pictures_dir)
    preview_outputs = build_preview(outputs, standard_dir)

    result = {
        "expanded": {key: str(path) for key, path in outputs.items()},
        "preview": {key: str(path) for key, path in preview_outputs.items()},
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
