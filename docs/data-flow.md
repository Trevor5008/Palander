# Data flow

How events and tasks move between the React UI, FastAPI API, and PostgreSQL today (v0.2.0). Auth is not implemented yet — the frontend sends `user_id=1` on every request (dev user seeded by migration `002`).

## Architecture flow

```mermaid
flowchart TB
  subgraph frontend [Frontend — React / Vite]
    CalendarView[CalendarView]
    DailyView[DailyView]
    EventModal[EventModal]
    mappers[apiMappers.ts]
    apiTs[api.ts]
  end

  subgraph backend [Backend — FastAPI]
    domainsRouter["GET /domains"]
    eventsRouter["/events CRUD"]
    tasksRouter["/tasks CRUD"]
    pydantic[Pydantic schemas]
    sqlalchemy[SQLAlchemy models]
  end

  DB[(PostgreSQL)]

  CalendarView -->|"fetchEvents / fetchTasks"| apiTs
  DailyView -->|"fetchEvents / fetchTasks"| apiTs
  EventModal -->|"form ↔ API payloads"| mappers
  EventModal -->|"create / update / delete"| apiTs
  mappers --> apiTs

  apiTs -->|"HTTP JSON"| domainsRouter
  apiTs -->|"HTTP JSON"| eventsRouter
  apiTs -->|"HTTP JSON"| tasksRouter

  domainsRouter --> pydantic
  eventsRouter --> pydantic
  tasksRouter --> pydantic
  pydantic --> sqlalchemy
  sqlalchemy --> DB
```

| Layer | Key files |
|-------|-----------|
| Views | `frontend/src/pages/CalendarView.tsx`, `DailyView.tsx` |
| Modal | `frontend/src/modals/EventModal.tsx` |
| Client | `frontend/src/api.ts`, `frontend/src/utils/apiMappers.ts` |
| API | `backend/app/routers/domains.py`, `events.py`, `tasks.py` |
| Validation | `backend/app/schemas/event.py`, `task.py`, `domain.py` |
| Persistence | `backend/app/models/event.py`, `task.py`, `domain.py` |

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
  View->>API: GET /events?user_id=1&start&end
  View->>API: GET /tasks?user_id=1&start&end
  API->>BE: list_events / list_tasks
  BE->>DB: SELECT WHERE user_id AND date range
  DB-->>View: EventRead[] + TaskRead[]
  View->>View: Render day markers or timeline blocks

  Note over View,DB: Open modal — create or click existing item
  View->>Modal: open (defaultDate or editEvent / editTask)
  Modal->>API: GET /domains?user_id=1
  API->>BE: list_domains
  BE->>DB: SELECT domains for user
  DB-->>Modal: domain name → domain_id map
  Modal->>API: GET /events (month range, task linked-event dropdown)

  Note over View,DB: Save
  Modal->>Mappers: eventFormToCreate / taskFormToCreate (or Update)
  Mappers-->>Modal: JSON body with start_at, due_date, domain_id, …
  alt Create
    Modal->>API: POST /events or POST /tasks
    API->>BE: create_event / create_task
    BE->>DB: INSERT
  else Edit
    Modal->>API: PATCH /events/{id} or PATCH /tasks/{id}
    API->>BE: update_event / update_task
    BE->>DB: UPDATE
  else Delete
    Modal->>API: DELETE /events/{id} or DELETE /tasks/{id}
    API->>BE: delete_event / delete_task
    BE->>DB: DELETE
  end
  DB-->>Modal: OK
  Modal->>View: onSaved() or onDeleted()
  View->>API: refetch events + tasks
  View->>View: Re-render calendar / daily timeline
```

## Field mapping (modal → API)

The modal collects human-friendly form fields; `apiMappers.ts` converts them to the backend schema before POST/PATCH.

| Modal field | Event API | Task API |
|-------------|-----------|----------|
| `title` | `title` | `name` |
| `date` + times | `start_at`, `end_at` | `due_date` |
| `allDay` | 00:00 – 23:59 same day | — |
| `domain` (slug) | `domain_id` via GET /domains | `domain_id` |
| `isRecurring` | `is_recurring` | — |
| `linkedEventId` | — | `event_id` |
| — | `user_id: 1` | `user_id: 1` |

## Not wired yet

- Authentication (hardcoded dev user)
- RRULE expansion / recurrence instances
- Objective linking in the UI
- Notes and reminders
