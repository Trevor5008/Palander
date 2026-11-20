#!/usr/bin/env python3
"""Host wrapper — prefer: docker compose exec api python -m app.demo_seed"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.demo_seed import main

if __name__ == "__main__":
    main()