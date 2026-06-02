#!/usr/bin/env python3
"""CLI entrypoint for Pinecone smoke test.

Usage (from repo root, with .venv active):
    python -m scripts.pinecone.smoke
or via Make:
    make pinecone-smoke
"""
import json
import sys

from .client import smoke_test


def main() -> None:
    try:
        result = smoke_test()
        print(json.dumps(result, indent=2))
        sys.exit(0)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"ok": False, "error": str(exc)}, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
