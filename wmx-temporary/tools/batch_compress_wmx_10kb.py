#!/usr/bin/env python3
"""Batch-compress all images under wmx-temporary to 10kb WebP."""

from __future__ import annotations

import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent.parent
SOURCE_TOOLS = REPO_ROOT / "source" / "tools"
WMX_ROOT = REPO_ROOT / "wmx-temporary"
OUT_ROOT = WMX_ROOT / "compressed" / "10kb"

sys.path.insert(0, str(SOURCE_TOOLS))
from compress_images import SUPPORTED_EXTENSIONS, compress_one_image  # noqa: E402


def should_skip(path: Path) -> bool:
    parts = {part.lower() for part in path.parts}
    if "node_modules" in parts:
        return True
    if "compressed" in parts:
        return True
    if "compressed-output" in parts:
        return True
    return False


def collect_images() -> list[Path]:
    images: list[Path] = []
    for path in WMX_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        if should_skip(path):
            continue
        images.append(path)
    return sorted(images)


def output_dir_for(source: Path) -> Path:
    rel_parent = source.parent.relative_to(WMX_ROOT)
    if rel_parent == Path("."):
        return OUT_ROOT
    return OUT_ROOT / rel_parent


def main() -> None:
    sources = collect_images()
    print(f"Compressing {len(sources)} images -> {OUT_ROOT}")
    ok = 0
    for source in sources:
        out_dir = output_dir_for(source)
        out_dir.mkdir(parents=True, exist_ok=True)
        try:
            reports = compress_one_image(
                source=source,
                output_dir=out_dir,
                targets_kb=[10],
                min_width=96,
                overwrite=True,
            )
            for line in reports:
                print(line)
            ok += 1
        except Exception as exc:
            print(f"FAIL {source}: {exc}", file=sys.stderr)
    print(f"Done: {ok}/{len(sources)} files written under {OUT_ROOT}")


if __name__ == "__main__":
    main()
