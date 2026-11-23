# Palander — engineering case study (source)

Concise, evidence-linked narrative for a future portfolio page. Repository version **0.13.0** ([`VERSION`](../VERSION)). Sprint story: [PAL-S1-005](https://github.com/Trevor5008/Palander/issues/17).

**Evidence convention:** Technical claims below point to implementation, tests, documentation, or captured visuals in this repo—not to memory or commit archaeology.

## Problem and intended user

- Palander is a personal **execution planner**: organize work by **Domains** and **Objectives**, run the day with **Tasks** and calendar **Events**, and review progress in **Planning**—without becoming a general-purpose notes vault ([`README.md`](../README.md)).
- The primary intended user is a **solo operator** balancing engineering, coursework, and portfolio work (domains such as Engineering, Coursework, Portfolio in the seeded demo). Demo content is **synthetic** only ([`backend/app/demo_seed.py`](../backend/app/demo_seed.py), [`docs/demo/walkthrough.md`](demo/walkthrough.md)).

## Execution vs knowledge (Obsidian boundary)

### Current behavior

- **Palander owns** dated execution state: what is on the calendar, what is due or overdue, recurrence exceptions, and planning rollups ([`docs/data-flow.md`](data-flow.md)).
- **Version 0.12** removed in-app daily and per-event **notes** tables and APIs in favor of execution focus; upgraders export note data from 0.11 first ([`CHANGELOG.md`](../CHANGELOG.md) §0.12.0, [`docs/legacy-notes-export.md`](legacy-notes-export.md)).
- Long-form knowledge (e.g. Obsidian) stays **external**. Obsidian sync and knowledge-graph features are listed as **not wired** and out of product scope ([`docs/data-flow.md`](data-flow.md) — Not wired yet).

## Role and ownership

- **Sole human product and engineering owner:** Trevor C Werner (copyright holder, [`LICENSE`](../LICENSE)). Design through demo capture are not described as team-owned work ([PAL-S1-005 #17](https://github.com/Trevor5008/Palander/issues/17) acceptance criteria).

## Architecture and data flow

- **Stack:** React (Vite) UI → JWT Bearer auth → FastAPI → SQLAlchemy → PostgreSQL 16 ([`README.md`](../README.md#tech-stack), [`docker-compose.yml`](../docker-compose.yml)).
- **Canonical diagrams and request paths:** [`docs/data-flow.md`](data-flow.md) (mermaid flow + daily-workspace sequence).
- **Schema reference:** [`docs/schema.md`](schema.md) (ER diagram; Alembic revision **009**).
- **Integration surfaces:** HTTP client [`frontend/src/api.ts`](../frontend/src/api.ts); API routers under [`backend/app/routers/`](../backend/app/routers/); persistence in [`backend/app/models/`](../backend/app/models/).

## Relational and recurrence decisions

### Relational model

- Users own domains; objectives belong to a domain; tasks and events require a domain and link to one or more objectives in that domain via junction tables (migration **009**, multi-objective) ([`docs/schema.md`](schema.md), [`CHANGELOG.md`](../CHANGELOG.md) §0.13.0).
- Link consistency is enforced server-side ([`backend/app/services/link_validation.py`](../backend/app/services/link_validation.py)).

### Recurring events

- Series stored with `rrule`; reads expand occurrences for a window; edits/deletes accept `scope` (`occurrence` | `future` | `series`) and `occurrence_start_at` ([`docs/data-flow.md`](data-flow.md) — Recurrence, [`backend/app/recurrence/expand.py`](../backend/app/recurrence/expand.py), [`backend/app/services/recurrence_edit.py`](../backend/app/services/recurrence_edit.py)).
- Tests: [`backend/tests/test_events_recurring.py`](../backend/tests/test_events_recurring.py), [`backend/tests/test_events.py`](../backend/tests/test_events.py).

### Recurring tasks (0.13)

- Per-occurrence state lives in **`task_occurrences`** (complete, move, skip) while the series row holds RRULE and **overdue policy** (`keep_overdue`, `skip_expired`, `carry_forward`) ([`backend/app/models/task_occurrence.py`](../backend/app/models/task_occurrence.py), [`backend/app/recurrence/task_expand.py`](../backend/app/recurrence/task_expand.py), [`backend/app/services/task_recurrence_edit.py`](../backend/app/services/task_recurrence_edit.py)).
- Tests: [`backend/tests/test_tasks.py`](../backend/tests/test_tasks.py).

### Daily workspace aggregation

- `GET /daily-workspace` composes timeline context, Today / Overdue / Completed sections, and domain/objective rollups for a single date ([`backend/app/routers/daily_workspace.py`](../backend/app/routers/daily_workspace.py), [`docs/data-flow.md`](data-flow.md) — Daily workspace).
- Frontend contract (overdue pagination, occurrence-scoped complete): [`frontend/src/components/DailyExecutionPane.test.tsx`](../frontend/src/components/DailyExecutionPane.test.tsx).

## Tradeoffs and rejected scope

- **Notes retired (0.12)** — traded embedded Markdown notes for a smaller execution surface and clearer product boundary ([`CHANGELOG.md`](../CHANGELOG.md) §0.12.0).
- **Explicit recurrence scopes** — occurrence vs future vs series edits add API and UI complexity but avoid ambiguous “edit this instance” behavior ([`docs/data-flow.md`](data-flow.md) — Recurrence).
- **Schedule import** — product supports paste/PDF import with an FIU-oriented profile in README; **demo fixtures are generic** (no real school account data in repo) ([`README.md`](../README.md#core-capabilities), [`backend/fixtures/demo/`](../backend/fixtures/demo/)).
- **Sprint 1 non-goals** (not promises): Daily pane collapse tweaks, bulk overdue cleanup, dark mode, chat, and similar candidates stayed outside PAL-S1 unless explicitly traded in ([Sprint #13](https://github.com/Trevor5008/Palander/issues/13) — Planning rules).

## Visual and walkthrough evidence

- **No public hosted demo** — run locally ([`docs/clean-checkout.md`](clean-checkout.md)), seed with [`scripts/reset_demo.sh`](../scripts/reset_demo.sh), anchor date **`2026-10-28`** ([`docs/demo/walkthrough.md`](demo/walkthrough.md)).
- Screenshots and GIF: [`docs/demo/images/`](demo/images/) (hero, planning, recurrence, schedule import, [`walkthrough.gif`](demo/images/walkthrough.gif)).
- Capture procedure: [`docs/demo/CAPTURE.md`](demo/CAPTURE.md).
- README demo table: [`README.md`](../README.md#demo).

## Setup, tests, CI, and release

### Current behavior

| Area | Evidence |
|------|----------|
| Reproducible setup | [`docs/clean-checkout.md`](clean-checkout.md) (Compose + native paths) |
| Dependency audit log | [`docs/dependency-audit.md`](dependency-audit.md) |
| Backend tests | `pytest` in [`backend/`](../backend/) (CI job `backend-test`) |
| Frontend tests + build | `npm test`, `npm run build` ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml) job `frontend-build`) |
| Docker smoke | Compose health check in CI (same workflow) |
| Demo seed | [`backend/app/demo_seed.py`](../backend/app/demo_seed.py) |

### Deferred release work

- **PAL-S1-004 ([#18](https://github.com/Trevor5008/Palander/issues/18))** is **deferred / Backlog** (not active sprint work): first verified public release—tag strategy, aligned version surfaces, full verification on the candidate, `v*.*.*` tag, GHCR publish, package visibility, and GitHub Release notes. When that work ships, consumers may need `docker login ghcr.io` with `read:packages` unless the package is public ([`README.md`](../README.md#cicd)).

### Release status as of November 23, 2026

- **Pending:** No `v*.*.*` git tag has been pushed; the [Release workflow](../.github/workflows/release.yml) has not produced a verified image.
- **Do not claim** a published `ghcr.io/trevor5008/palander-api` artifact until #18 completes. The README `docker pull` example documents the **intended** pipeline after tagging ([`README.md`](../README.md#cicd)).

## Limitations and deferred work

### Current limitations

- PDF schedule import does not OCR scanned PDFs; reminders are not exposed in the UI ([`docs/data-flow.md`](data-flow.md) — Not wired yet).
- Frontend unit coverage is intentionally narrow (core Daily occurrence-complete flow); broader UI regression still relies on manual demo and backend tests ([`frontend/src/components/DailyExecutionPane.test.tsx`](../frontend/src/components/DailyExecutionPane.test.tsx)).

### Future candidates (not scheduled)

- Product ideas deferred from Sprint 1: Daily collapse UX, bulk overdue cleanup, dark mode, chat ([Sprint #13](https://github.com/Trevor5008/Palander/issues/13)).

## Links

| Link | Status |
|------|--------|
| [github.com/Trevor5008/Palander](https://github.com/Trevor5008/Palander) | Public source |
| Portfolio case-study page | **Not published yet** — adapt from this document |
| Hosted Palander demo | **Does not exist** — local walkthrough only ([`docs/demo/walkthrough.md`](demo/walkthrough.md)) |

Setup entry point: [`README.md`](../README.md). Release history: [`CHANGELOG.md`](../CHANGELOG.md).