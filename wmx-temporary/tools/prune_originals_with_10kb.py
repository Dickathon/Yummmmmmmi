#!/usr/bin/env python3
"""Remove raster originals under wmx-temporary when a 10kb WebP backup exists."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
WMX = REPO / "wmx-temporary"
COMP = WMX / "compressed" / "10kb"
ASSETS_PARTS = REPO / "assets" / "modules" / "dress" / "parts" / "10kb"
ASSETS_PLACARDS = REPO / "assets" / "modules" / "dress" / "placards" / "10kb"
ASSETS_POSTER = REPO / "assets" / "modules" / "order" / "poster" / "10kb"

RASTER = {".png", ".jpg", ".jpeg", ".bmp"}
SKIP_DIR_NAMES = {
    "node_modules",
    "compressed",
    "compressed-output",
    "__pycache__",
}
# Keep PNG masters for regeneration / derive_* tools.
KEEP_PREFIXES = (
    WMX / "装扮" / "latest-pictures",
)
# Intermediate AI / pipeline outputs — never auto-delete.
SKIP_PATH_PARTS = {"_tmp_head_builtin", "_tmp_legs_builtin", "_tmp_tail_builtin",
                   "_tmp_body_builtin", "_tmp_blanket_builtin"}


def webp_name(stem: str) -> str:
    return f"{stem}-10kb.webp"


def has_backup(src: Path) -> Path | None:
    name = webp_name(src.stem)
    try:
        rel = src.relative_to(WMX)
        mirrored = COMP / rel.parent / name
        if mirrored.is_file():
            return mirrored
    except ValueError:
        pass

    # Dress costume finals → assets/modules/dress/parts/10kb/{组件}/...
    try:
        rel = src.relative_to(WMX / "装扮" / "pictures")
        parts = rel.parts
        if len(parts) == 2 and parts[0] in ("头部", "躯干", "四肢", "尾巴", "毯子"):
            candidate = ASSETS_PARTS / parts[0] / name
            if candidate.is_file():
                return candidate
    except ValueError:
        pass

    # Placards / poster in assets/modules
    for base in (ASSETS_PLACARDS, ASSETS_POSTER):
        hit = base / name
        if hit.is_file():
            return hit

    return None


def should_skip(path: Path) -> bool:
    if any(part in SKIP_DIR_NAMES for part in path.parts):
        return True
    if any(part in SKIP_PATH_PARTS for part in path.parts):
        return True
    for prefix in KEEP_PREFIXES:
        try:
            path.relative_to(prefix)
            return True
        except ValueError:
            continue
    return False


def collect_deletable() -> list[tuple[Path, Path]]:
    out: list[tuple[Path, Path]] = []
    for src in sorted(WMX.rglob("*")):
        if not src.is_file() or src.suffix.lower() not in RASTER:
            continue
        if should_skip(src):
            continue
        backup = has_backup(src)
        if backup:
            out.append((src, backup))
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Actually delete files.")
    args = parser.parse_args()

    items = collect_deletable()
    if not items:
        print("Nothing to prune.")
        return 0

    total_bytes = sum(s.stat().st_size for s, _ in items)
    print(f"{'DELETE' if args.apply else 'DRY-RUN'}: {len(items)} files ({total_bytes / 1024 / 1024:.2f} MB)")
    for src, backup in items:
        rel = src.relative_to(REPO)
        print(f"  {rel}  <- {backup.relative_to(REPO)}")

    if not args.apply:
        print("\nRe-run with --apply to delete.")
        return 0

    for src, _ in items:
        src.unlink()
    print(f"\nDeleted {len(items)} files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
