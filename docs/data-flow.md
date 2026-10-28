# Data flow

How events, tasks, and objectives move between the React UI, FastAPI API, and PostgreSQL (v0.13.0). Auth uses JWT Bearer tokens (`POST /auth/login`).

## Schema

Entity-relationship reference: [`schema.md`](schema.md).

## Architecture flow

```mermaid
flowchart TB
  subgraph frontend [Frontend — React / Vite]
    DailyView[DailyView]
    PlanningView[PlanningView]
    CalendarView[CalendarView]
    EventModal[EventModal]
    mappers[apiMappers.ts]
    apiTs[api.ts]
  end

  subgraph backend [Backend — FastAPI]
    domainsRouter["GET /domains"]
    objectivesRouter["/objectives CRUD"]
    eventsRouter["/events CRUD"]
    tasksRouter["/tasks CRUD"]
    dailyWorkspaceRouter["GET /daily-workspace"]
    pydantic[Pydantic schemas]
    sqlalchemy[SQLAlchemy models]
  end

  DB[(PostgreSQL)]

  DailyView --> apiTs
  PlanningView --> apiTs
  CalendarView --> apiTs
  EventModal --> mappers
  EventModal --> apiTs
  mappers --> apiTs

  apiTs --> domainsRouter
  apiTs --> objectivesRouter
  apiTs --> eventsRouter
  apiTs --> tasksRouter
  apiTs --> dailyWorkspaceRouter

  domainsRouter --> pydantic
  objectivesRouter --> pydantic
  eventsRouter --> pydantic
  tasksRouter --> pydantic
  dailyWorkspaceRouter --> pydantic
  pydantic --> sqlalchemy
  sqlalchemy --> DB
```

| Layer | Key files |
|-------|-----------|
| Views | `frontend/src/pages/DailyView.tsx`, `PlanningView.tsx`, `CalendarView.tsx` |
| Modal | `frontend/src/modals/EventModal.tsx` |
| Client | `frontend/src/api.ts`, `frontend/src/utils/apiMappers.ts` |
| API | `backend/app/routers/domains.py`, `objectives.py`, `events.py`, `tasks.py`, `daily_workspace.py` |
| Validation | `backend/app/schemas/*.py`, `backend/app/services/link_validation.py` |
| Persistence | `backend/app/models/*.py` |

## CRUD sequence

Typical path when a user opens a view, creates or edits an entry, and sees it reflected in the UI.

```mermaid
sequenceDiagram
  participant View as CalendarView / DailyView
  participant Modal as EventModal
  participant Mappers as apiMappers.ts
  participant API as api.ts
  participant BE as FastAPI routers
  participant DB as PostgreSQL

  Note over View,DB: Page load — list entries for date range
  View->>API: GET /events?start&end
  View->>API: GET /tasks?start&end
  API->>BE: list_events / list_tasks
  BE->>DB: SELECT WHERE user_id AND date range
  DB-->>View: EventRead[] + TaskRead[]
  View->>View: Render day markers or timeline blocks

  Note over View,DB: Daily execution pane
  View->>API: GET /daily-workspace?date=
  BE->>DB: tasks by planned_for / overdue / completed
  DB-->>View: Today / Overdue / Completed sections

  Note over View,DB: Open modal — create or click existing item
  View->>Modal: open (defaultDate or editEvent / editTask)
  Modal->>API: GET /domains, GET /objectives?domain_id=
  Modal->>API: GET /events (month range, task linked-event dropdown)

  Note over View,DB: Save
  Modal->>Mappers: eventFormToCreate / taskFormToCreate (or Update)
  Mappers-->>Modal: JSON body with start_at, planned_for, due_at, domain_id, objective_ids
  alt Create
    Modal->>API: POST /events or POST /tasks
    API->>BE: create (link validation)
    BE->>DB: INSERT
  else Edit
    Modal->>API: PATCH
    BE->>DB: UPDATE
  end
  DB-->>Modal: OK
  Modal->>View: onSaved()
  View->>API: refetch lists + daily-workspace
```

## Field mapping (modal → API)

| Modal field | Event API | Task API |
|-------------|-----------|----------|
| `title` | `title` | `name` |
| date + times | `start_at`, `end_at` | `planned_for`, `due_at` |
| `domain` (slug) | `domain_id` | `domain_id` (required) |
| objective checkboxes | `objective_ids` | `objective_ids` |
| `linkedEventId` | — | `event_id` |

## Daily execution (0.11+)

```mermaid
sequenceDiagram
  participant DailyView
  participant API as GET /daily-workspace
  participant DB as PostgreSQL

  DailyView->>API: date from URL
  API->>DB: active tasks planned_for = date
  API->>DB: active tasks due_at before date start
  API->>DB: completed tasks on date
  API->>DB: event minutes + counts by domain/objective
  API-->>DailyView: structured sections
  DailyView->>API: PATCH /tasks/{id} complete / reschedule
```

**UI (0.13):** `DailyExecutionPane` renders API sections in block order inside a bounded scroll area. **Completed today** is collapsed until expanded. **Overdue** shows the first 10 rows, then **Show more** (client-side pagination; full list still comes from `GET /daily-workspace`). Recurring task rows may include `occurrence_date` and scope parameters on PATCH.

| Route | View |
|-------|------|
| `/` | Daily (timeline + execution pane) |
| `/planning` | Objectives, weekly review, progress tabs |
| `/daily` | Redirect to `/` |
| `/weekly` | Week timeline |
| `/monthly` | Month grid + schedule import |

## Planning review (0.12+)

- `GET /planning/weekly-review?week_start=` — domain allocation, objective warnings, carry-forward tasks
- `GET /planning/progress?weeks=` — completed objectives and weekly task activity
- `POST /planning/carry-forward` — bulk `planned_for` updates

## Legacy notes

Removed in 0.12 (migration 008). Upgrading from 0.11: see [`legacy-notes-export.md`](legacy-notes-export.md).

## Recurrence (0.6+ / 0.12 events / 0.13 tasks)

- Events: RRULE expansion on `GET /events`; PATCH/DELETE accept `scope=occurrence|future|series` and `occurrence_start_at` for instance edits
- Tasks: recurring series expand on `GET /tasks` and daily workspace; per-date state in `task_occurrences`; PATCH/DELETE use `occurrence_date` + `scope`; series fields include `timezone`, `recurrence_until`, `estimated_duration_minutes`, `overdue_policy` (`keep_overdue`, `skip_expired`, `carry_forward`)
- Event modal: multi-select objectives; task recurrence mirrors event scope UX (**Starting on** for series, **Planned for** when editing one occurrence)
- Multi-objective links: `objective_ids[]` on create/update (all objectives must belong to the entity domain)

## Schedule import (0.6+ / PDF 0.8+)

Unchanged — see prior release notes in [`CHANGELOG.md`](../CHANGELOG.md).

## Not wired yet

- PDF OCR for scanned schedules
- Task/event reminders in the UI
- Obsidian sync and knowledge-graph features (out of product scope)
