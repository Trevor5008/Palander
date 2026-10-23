#!/usr/bin/env bash
# One-time: GH="$PWD/.tools/gh_2.63.2_linux_amd64/bin/gh" && "$GH" auth login
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -z "${GH:-}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    GH="$(command -v gh)"
  elif [[ -x "$ROOT/.tools/gh_2.63.2_linux_amd64/bin/gh" ]]; then
    GH="$ROOT/.tools/gh_2.63.2_linux_amd64/bin/gh"
  else
    echo "Install gh (github-cli) or set GH= path to gh binary"
    exit 1
  fi
fi

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "Run: $GH auth login"
  exit 1
fi

cd "$ROOT"
"$GH" pr create --base main --head mvp-0.7-ingestion --title "MVP 0.6–0.7: recurrence, schedule import, and flexible paste formats" --body "$(cat <<'EOF'
## Summary

Ships **0.6.0** (weekly recurrence + schedule import) and **0.7.0** (flexible paste parsing, format feedback, import UX) on top of `main`.

- **Recurrence (0.6):** Timezone, RRULE, `recurrence_until`; occurrence expansion in `GET /events`; weekly controls in EventModal.
- **Schedule import (0.6):** `POST /schedule/parse` and `/schedule/import`; heuristic + optional OpenAI-compatible structured JSON parser.
- **Flexible ingestion (0.7):** Term start / repeat-until; format hints; composite plain + CSV parsers; `app/utils/schedule_*` for weekday aliases (M W) and times (0900 / 09:00).
- **Format feedback (0.7):** `format_issues` in API; red alerts + help dialog in import modal.
- **Import UX:** Global repeat-until; editable preview (weekdays, times, title, domain).

## Commits

1. `a62e342` — 0.6.0 recurrence and schedule import
2. `3088df2` — 0.7.0 flexible import and format feedback

## Test plan

- [ ] `cd backend && .venv/bin/pytest -q`
- [ ] `cd frontend && npm run build`
- [ ] `docker compose up -d --build api` and migration 004
- [ ] Manual weekly event; occurrences in calendar views
- [ ] Import: `Chemistry Lab M W 0900 1145` and `Mon,Wed 09:00-10:30`
- [ ] Invalid weekdays → format alert + help dialog
- [ ] Term start / repeat until on imported series

## Ops

- Optional `SCHEDULE_PARSER_*` in backend `.env`
EOF
)"
