#!/usr/bin/env python3
"""Assemble Blender-rendered PMX frames into a Codex V2 pet package.

Reads ``<output-dir>/frames/rowNN/MM.png`` as produced by ``render_pmx_pet.py``
and writes the spritesheet, ``pet.json``, and ``validation.json`` next to it. No
model assets or rendered frames ship with this script.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

COLUMNS = 8
ROWS = 11
CELL_WIDTH = 192
CELL_HEIGHT = 208
EXPECTED_COUNTS = [6, 8, 8, 4, 5, 8, 6, 6, 6, 8, 8]


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments.

    Returns:
        Parsed arguments.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Directory holding frames/; receives the atlas, pet.json, and validation.json.",
    )
    return parser.parse_args()


def load_frame(path: Path) -> Image.Image:
    """Load and normalize one rendered frame.

    Args:
        path: Rendered frame path.

    Returns:
        RGBA image at the contract cell size.
    """
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        if rgba.size != (CELL_WIDTH, CELL_HEIGHT):
            rgba = rgba.resize((CELL_WIDTH, CELL_HEIGHT), Image.Resampling.LANCZOS)
        return rgba


def main() -> None:
    """Build the spritesheet, manifest, and validation report.

    Returns:
        None.
    """
    args = parse_args()
    output_dir = args.output_dir.resolve()
    frame_dir = output_dir / "frames"
    atlas = Image.new("RGBA", (COLUMNS * CELL_WIDTH, ROWS * CELL_HEIGHT), (0, 0, 0, 0))
    populated: list[str] = []
    for row in range(ROWS):
        for column in range(COLUMNS):
            path = frame_dir / f"row{row:02d}" / f"{column:02d}.png"
            if not path.exists():
                continue
            frame = load_frame(path)
            atlas.alpha_composite(frame, (column * CELL_WIDTH, row * CELL_HEIGHT))
            populated.append(str(path.relative_to(output_dir)))

    png_path = output_dir / "spritesheet.png"
    webp_path = output_dir / "spritesheet.webp"
    atlas.save(png_path, format="PNG", optimize=True)
    atlas.save(webp_path, format="WEBP", lossless=True, quality=100, method=6)
    manifest = {
        "id": "xiaoluobao-blender",
        "displayName": "Xiaoluobao Blender",
        "description": "A PMX-native Xiaoluobao pet rendered deterministically in Blender.",
        "spriteVersionNumber": 2,
        "spritesheetPath": "spritesheet.png",
    }
    (output_dir / "pet.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    report = {
        "spritesheet": str(png_path),
        "webpPreview": str(webp_path),
        "dimensions": list(atlas.size),
        "mode": atlas.mode,
        "populatedFrames": len(populated),
        "expectedFrames": sum(EXPECTED_COUNTS),
        "contractValid": len(populated) == sum(EXPECTED_COUNTS),
        "unusedSlotsTransparent": all(
            atlas.getchannel("A")
            .crop(
                (
                    column * CELL_WIDTH,
                    row * CELL_HEIGHT,
                    (column + 1) * CELL_WIDTH,
                    (row + 1) * CELL_HEIGHT,
                )
            )
            .getbbox()
            is None
            for row, count in enumerate(EXPECTED_COUNTS)
            for column in range(count, COLUMNS)
        ),
        "frames": populated,
    }
    (output_dir / "validation.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
