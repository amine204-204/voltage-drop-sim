#!/usr/bin/env python3
"""Set the newTag of a single image entry in a kustomization.yaml, in place.

Usage:
    bump-image-tag.py <kustomization.yaml> <image-name> <new-tag>

The rewrite is surgical: only the `newTag` line belonging to <image-name>
changes, so every other line -- including comments and formatting -- is
preserved. Exits non-zero unless exactly one matching entry is found, so an
unexpected file shape fails loudly instead of silently doing nothing.
"""

import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 4:
        print(
            f"usage: {sys.argv[0]} <kustomization.yaml> <image-name> <new-tag>",
            file=sys.stderr,
        )
        return 2

    path = Path(sys.argv[1])
    image = sys.argv[2]
    tag = sys.argv[3]

    text = path.read_text(encoding="utf-8")
    # Matches "  - name: <image>\n    newTag: <value>" across the newline,
    # capturing everything up to (but not including) the current tag value.
    pattern = re.compile(r"(name:\s*" + re.escape(image) + r"\s*\n\s*newTag:\s*)\S+")
    new_text, count = pattern.subn(rf"\g<1>{tag}", text)

    if count != 1:
        print(
            f"error: expected exactly one newTag for {image!r}, found {count}",
            file=sys.stderr,
        )
        return 1

    path.write_text(new_text, encoding="utf-8")
    print(f"set {image} newTag -> {tag}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
