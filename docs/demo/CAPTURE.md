# Demo capture metadata

| Field | Value |
|-------|--------|
| Palander version | 0.13.0 |
| Anchor date | 2026-10-28 |
| Viewport | 1440×900 |
| Browser | Chromium (Playwright headless) |
| OS | Linux |
| API | Docker Compose (`localhost:8000`) |
| UI | Vite dev server (`localhost:5173`) |
| Login | `dev` / `dev` (local seed only) |
| Theme | Default **dark**; record GIF with dark-first UI (optionally show header toggle → light) |

**No public hosted demo** — screenshots and GIF reflect a local developer environment only.

Assets live in [`images/`](images/):

| File | Scene |
|------|--------|
| `hero.png` | Daily — timeline + execution pane |
| `planning.png` | Planning — objectives |
| `recurrence.png` | Task/event modal — recurrence |
| `schedule-import.png` | Monthly schedule import (paste text) |
| `walkthrough.gif` | Short Daily → Planning → modal → import loop |

**Capture commit:** `0a77077` (re-seed after UI changes: `cd frontend && node scripts/capture_demo_preview.mjs`; document hash with `git rev-parse HEAD` on the branch you merge).

Re-capture steps: `./scripts/reset_demo.sh`, `npm run dev` at `http://localhost:5173` (use **localhost**, not `127.0.0.1`, so API CORS matches), then `node scripts/capture_demo_preview.mjs`.