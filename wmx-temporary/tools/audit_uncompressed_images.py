#!/usr/bin/env python3
"""Audit raster images without a 10kb WebP backup in the repo."""

from __future__ import annotations

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
WMX = REPO / "wmx-temporary"
COMP = WMX / "compressed" / "10kb"
ASSETS_PARTS = REPO / "assets" / "modules" / "dress" / "parts" / "10kb"
ASSETS_PLACARDS = REPO / "assets" / "modules" / "dress" / "placards" / "10kb"
ASSETS_POSTER = REPO / "assets" / "modules" / "order" / "poster" / "10kb"
SOURCE_COMP = REPO / "source" / "compressed" / "10kb"

RASTER = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tif", ".tiff"}
SKIP_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "__pycache__",
    "test-results",
    "compressed",
    "compressed-output",
}


def webp_name(stem: str) -> str:
    return f"{stem}-10kb.webp"


def has_any_webp(src: Path) -> list[Path]:
    name = webp_name(src.stem)
    hits: list[Path] = []

    def add(p: Path) -> None:
        if p.is_file() and p not in hits:
            hits.append(p)

    # Mirror under wmx compressed
    try:
        rel = src.relative_to(WMX)
        add(COMP / rel.parent / name)
    except ValueError:
        pass

    # Dress parts
    try:
        rel = src.relative_to(WMX / "装扮" / "pictures")
        if len(rel.parts) == 2 and rel.parts[0] in ("头部", "躯干", "四肢", "尾巴", "毯子"):
            add(ASSETS_PARTS / rel.parts[0] / name)
    except ValueError:
        pass

    # source/food* style: food1/foo.png -> source/compressed/10kb/food1/foo-10kb.webp
    try:
        rel = src.relative_to(REPO)
        if rel.parts[0] in ("food1", "food2", "food3", "source"):
            parts = rel.parts
            if parts[0] in ("food1", "food2", "food3"):
                add(SOURCE_COMP / parts[0] / name)
            elif parts[0] == "source" and len(parts) > 2 and parts[1] in ("food1", "food2", "food3"):
                add(SOURCE_COMP / parts[1] / name)
    except ValueError:
        pass

    for base in (ASSETS_PLACARDS, ASSETS_POSTER, SOURCE_COMP):
        add(base / name)
        if src.parent.name in ("food1", "food2", "food3"):
            add(base / src.parent.name / name)

    return hits


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def area_label(path: Path) -> str:
    try:
        rel = path.relative_to(REPO)
        parts = rel.parts
        if parts[0] == "wmx-temporary":
            if len(parts) > 1:
                return "wmx-temporary/" + "/".join(parts[1:3])
            return "wmx-temporary"
        return "/".join(parts[:2]) if len(parts) > 1 else parts[0]
    except ValueError:
        return str(path)


def main() -> int:
    all_raster: list[Path] = []
    for root in (REPO,):
        for p in root.rglob("*"):
            if not p.is_file() or p.suffix.lower() not in RASTER:
                continue
            if should_skip(p):
                continue
            all_raster.append(p)

    no_webp: list[tuple[Path, int]] = []
    has_webp: list[Path] = []
    for src in sorted(all_raster):
        if has_any_webp(src):
            has_webp.append(src)
        else:
            no_webp.append((src, src.stat().st_size))

    no_webp.sort(key=lambda x: -x[1])
    total_mb = sum(s for _, s in no_webp) / 1024 / 1024

    print(f"Raster files scanned: {len(all_raster)}")
    print(f"  With 10kb WebP backup: {len(has_webp)}")
    print(f"  WITHOUT WebP backup:   {len(no_webp)} ({total_mb:.2f} MB)\n")

    if not no_webp:
        print("No uncompressed-only raster files found.")
        return 0

    # Group by area
    from collections import defaultdict

    groups: dict[str, list[tuple[Path, int]]] = defaultdict(list)
    for p, sz in no_webp:
        groups[area_label(p)].append((p, sz))

    print("=== By area (no WebP backup) ===")
    for area in sorted(groups, key=lambda a: -sum(s for _, s in groups[a])):
        items = groups[area]
        mb = sum(s for _, s in items) / 1024 / 1024
        print(f"\n{area}  —  {len(items)} files, {mb:.2f} MB")
        for p, sz in sorted(items, key=lambda x: -x[1])[:12]:
            rel = p.relative_to(REPO)
            print(f"  {sz/1024:7.1f} KB  {rel}")
        if len(items) > 12:
            print(f"  ... +{len(items) - 12} more")

    print("\n=== Largest 15 (no backup) ===")
    for p, sz in no_webp[:15]:
        print(f"  {sz/1024/1024:6.2f} MB  {p.relative_to(REPO)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
