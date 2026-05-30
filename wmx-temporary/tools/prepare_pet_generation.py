#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageFilter


@dataclass(frozen=True)
class ComponentSpec:
    name: str
    parent: str | None
    guide_suffix: str
    mask_expand: int
    adjacency_mode: str | None
    x_pad: int
    y_pad: int
    band: int


COMPONENTS = [
    ComponentSpec(
        name="torso",
        parent=None,
        guide_suffix="torso",
        mask_expand=24,
        adjacency_mode=None,
        x_pad=0,
        y_pad=0,
        band=0,
    ),
    ComponentSpec(
        name="head",
        parent="torso",
        guide_suffix="head",
        mask_expand=20,
        adjacency_mode="below",
        x_pad=84,
        y_pad=22,
        band=120,
    ),
    ComponentSpec(
        name="face",
        parent="head",
        guide_suffix="face",
        mask_expand=18,
        adjacency_mode="around",
        x_pad=44,
        y_pad=36,
        band=0,
    ),
    ComponentSpec(
        name="legs",
        parent="torso",
        guide_suffix="legs",
        mask_expand=24,
        adjacency_mode="above",
        x_pad=88,
        y_pad=18,
        band=140,
    ),
    ComponentSpec(
        name="tail",
        parent="torso",
        guide_suffix="tail",
        mask_expand=18,
        adjacency_mode="left",
        x_pad=26,
        y_pad=48,
        band=128,
    ),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare masks, adjacency crops, prompts, and a manifest for torso-first pet layer generation."
    )
    parser.add_argument("source", type=Path, help="Source reference image.")
    parser.add_argument(
        "--pet-name",
        default="cat",
        help="Pet name prefix for generated assets. Default: cat",
    )
    parser.add_argument(
        "--guide-dir",
        type=Path,
        required=True,
        help="Directory containing guide layers such as cat_torso.png and cat_head.png.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Directory where the generation kit will be written.",
    )
    return parser.parse_args()


def clamp_box(box: tuple[int, int, int, int], size: tuple[int, int]) -> tuple[int, int, int, int]:
    left, top, right, bottom = box
    width, height = size
    left = max(0, min(left, width))
    top = max(0, min(top, height))
    right = max(left + 1, min(right, width))
    bottom = max(top + 1, min(bottom, height))
    return left, top, right, bottom


def expand_box(
    box: tuple[int, int, int, int],
    size: tuple[int, int],
    *,
    x_pad: int,
    y_pad: int,
) -> tuple[int, int, int, int]:
    left, top, right, bottom = box
    return clamp_box((left - x_pad, top - y_pad, right + x_pad, bottom + y_pad), size)


def alpha_mask(image_path: Path) -> Image.Image:
    return Image.open(image_path).convert("RGBA").getchannel("A")


def expand_mask(mask: Image.Image, pixels: int) -> Image.Image:
    if pixels <= 0:
        return mask.copy()
    size = pixels * 2 + 1
    return mask.filter(ImageFilter.MaxFilter(size=size))


def render_component_mask(mask: Image.Image, source_alpha: Image.Image) -> Image.Image:
    clipped = ImageChops.multiply(mask, source_alpha)
    return clipped.point(lambda value: 255 if value > 0 else 0, mode="L")


def render_crop_preview(parent_path: Path, box: tuple[int, int, int, int], canvas_size: tuple[int, int]) -> Image.Image:
    parent = Image.open(parent_path).convert("RGBA")
    preview = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    preview.alpha_composite(parent.crop(box), dest=(box[0], box[1]))
    return preview


def build_adjacency_box(
    spec: ComponentSpec,
    child_box: tuple[int, int, int, int],
    parent_box: tuple[int, int, int, int],
    canvas_size: tuple[int, int],
) -> tuple[int, int, int, int]:
    child_left, child_top, child_right, child_bottom = child_box
    parent_left, parent_top, parent_right, parent_bottom = parent_box

    if spec.adjacency_mode == "below":
        return clamp_box(
            (
                child_left - spec.x_pad,
                max(parent_top, child_bottom - spec.y_pad),
                child_right + spec.x_pad,
                min(parent_bottom, child_bottom + spec.band),
            ),
            canvas_size,
        )

    if spec.adjacency_mode == "above":
        return clamp_box(
            (
                child_left - spec.x_pad,
                max(parent_top, child_top - spec.band),
                child_right + spec.x_pad,
                min(parent_bottom, child_top + spec.y_pad),
            ),
            canvas_size,
        )

    if spec.adjacency_mode == "left":
        return clamp_box(
            (
                max(parent_left, child_left - spec.band),
                child_top - spec.y_pad,
                min(parent_right, child_left + spec.x_pad),
                child_bottom + spec.y_pad,
            ),
            canvas_size,
        )

    if spec.adjacency_mode == "around":
        expanded = expand_box(child_box, canvas_size, x_pad=spec.x_pad, y_pad=spec.y_pad)
        left = max(parent_left, expanded[0])
        top = max(parent_top, expanded[1])
        right = min(parent_right, expanded[2])
        bottom = min(parent_bottom, expanded[3])
        return clamp_box((left, top, right, bottom), canvas_size)

    raise ValueError(f"Unsupported adjacency mode: {spec.adjacency_mode}")


def build_prompt(spec: ComponentSpec, pet_name: str) -> str:
    base = [
        "Use case: identity-preserve",
        "Asset type: pet layer for a dress-up compositing system",
        f"Primary request: Generate only the {spec.name} component of the {pet_name}.",
        "Input images:",
        "- Image 1: transparent target canvas; generate only inside the mask and keep everything outside the mask fully transparent.",
        "- Image 2: original full reference image; preserve pose, position, scale, line art, stripes, shading, and color exactly.",
    ]

    if spec.parent is not None:
        base.append(
            f"- Image 3: local adjacency crop from the generated {spec.parent}; preserve that connection area and continue the new component from it."
        )

    base.extend(
        [
            "Canvas/layout: keep the 1024x1024 canvas and keep the component at the exact same coordinates as the original reference. Do not recenter, resize, rotate, or re-stage the character.",
            "Style/medium: keep the exact original illustrated cat design, line quality, stripe pattern language, color palette, and shading.",
        ]
    )

    if spec.name == "torso":
        base.append(
            "Constraints: generate only the neck-to-body torso mass. Exclude the head, face details, all legs, and the tail. Small overlap around the neck root and leg root is allowed."
        )
    elif spec.name == "head":
        base.append(
            "Constraints: generate only the head base layer, including outer head silhouette, ears, top of head, and side contours. Exclude eyes, nose, mouth, whiskers, muzzle markings, and other face-detail overlays."
        )
    elif spec.name == "face":
        base.append(
            "Constraints: generate only the face detail layer, including eyes, nose, mouth, whiskers, cheek dots, muzzle area, face stripes, and expression details. It must align perfectly over the head base layer."
        )
    elif spec.name == "legs":
        base.append(
            "Constraints: generate all four legs as one combined layer. Keep the original front/back occlusion order and allow slight overlap into the torso at the leg roots."
        )
    elif spec.name == "tail":
        base.append(
            "Constraints: generate only the full tail. Keep the original bend direction, length, thickness, stripe flow, and tail-root connection."
        )

    base.extend(
        [
            "Avoid: no background, no white fill, no black fill, no watermark, no text, no extra anatomy, no style drift, no pose drift, and no cropping.",
            "Output: a single transparent PNG-sized layer that can be stacked back with the other layers to reconstruct the original cat.",
        ]
    )
    return "\n".join(base) + "\n"


def normalize_source(source: Path, reference_dir: Path) -> Path:
    reference_dir.mkdir(parents=True, exist_ok=True)
    destination = reference_dir / source.name
    if source.resolve() != destination.resolve():
        shutil.copy2(source, destination)
    return destination


def manifest_path_data(path: Path, base_dir: Path) -> str:
    return str(path.relative_to(base_dir)).replace("\\", "/")


def main() -> None:
    args = parse_args()

    source = args.source.expanduser().resolve()
    guide_dir = args.guide_dir.expanduser().resolve()
    output_dir = args.output_dir.expanduser().resolve()
    base_assets_dir = output_dir.parent.parent

    prompts_dir = output_dir / "prompts"
    masks_dir = output_dir / "masks"
    previews_dir = output_dir / "previews"
    outputs_dir = output_dir / "outputs"
    temp_dir = output_dir / "tmp"

    for path in (prompts_dir, masks_dir, previews_dir, outputs_dir, temp_dir):
        path.mkdir(parents=True, exist_ok=True)

    reference_path = normalize_source(source, base_assets_dir / "reference")

    source_image = Image.open(reference_path).convert("RGBA")
    canvas_size = source_image.size
    source_alpha = source_image.getchannel("A")
    blank_canvas_path = output_dir / "blank_canvas.png"
    Image.new("RGBA", canvas_size, (0, 0, 0, 0)).save(blank_canvas_path)

    component_records: list[dict[str, Any]] = []
    guide_boxes: dict[str, tuple[int, int, int, int]] = {}
    guide_paths: dict[str, Path] = {}

    for spec in COMPONENTS:
        guide_path = guide_dir / f"{args.pet_name}_{spec.guide_suffix}.png"
        guide_mask = alpha_mask(guide_path)
        box = guide_mask.getbbox()
        if box is None:
            raise RuntimeError(f"Guide layer is empty: {guide_path}")
        guide_boxes[spec.name] = box
        guide_paths[spec.name] = guide_path

    for order, spec in enumerate(COMPONENTS, start=1):
        guide_path = guide_paths[spec.name]
        guide_mask = alpha_mask(guide_path)
        expanded = expand_mask(guide_mask, spec.mask_expand)
        render_mask = render_component_mask(expanded, source_alpha)
        mask_path = masks_dir / f"{args.pet_name}_{spec.name}_mask.png"
        render_mask.save(mask_path)

        adjacency_box = None
        adjacency_preview_path = None
        if spec.parent is not None:
            adjacency_box = build_adjacency_box(
                spec,
                guide_boxes[spec.name],
                guide_boxes[spec.parent],
                canvas_size,
            )
            adjacency_preview = render_crop_preview(
                guide_paths[spec.parent],
                adjacency_box,
                canvas_size,
            )
            adjacency_preview_path = previews_dir / f"{order:02d}_{spec.name}_adjacency_preview.png"
            adjacency_preview.save(adjacency_preview_path)

        prompt_path = prompts_dir / f"{order:02d}_{spec.name}.txt"
        prompt_path.write_text(build_prompt(spec, args.pet_name), encoding="utf-8")

        component_records.append(
            {
                "order": order,
                "name": spec.name,
                "parent": spec.parent,
                "guide_layer": manifest_path_data(guide_path, output_dir),
                "guide_bbox": list(guide_boxes[spec.name]),
                "mask": manifest_path_data(mask_path, output_dir),
                "mask_bbox": list(render_mask.getbbox() or (0, 0, 0, 0)),
                "prompt": manifest_path_data(prompt_path, output_dir),
                "adjacency_box": list(adjacency_box) if adjacency_box else None,
                "adjacency_preview": manifest_path_data(adjacency_preview_path, output_dir)
                if adjacency_preview_path
                else None,
                "output": manifest_path_data(outputs_dir / f"{args.pet_name}_{spec.name}.png", output_dir),
            }
        )

    manifest = {
        "pet_name": args.pet_name,
        "canvas_size": list(canvas_size),
        "reference_image": manifest_path_data(reference_path, output_dir),
        "blank_canvas": manifest_path_data(blank_canvas_path, output_dir),
        "temp_dir": manifest_path_data(temp_dir, output_dir),
        "components": component_records,
        "stack_order": ["tail", "torso", "legs", "head", "face"],
    }

    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {manifest_path}")


if __name__ == "__main__":
    main()
