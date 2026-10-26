# Database schema (PostgreSQL)

Canonical entity-relationship reference for Palander **v0.11.0** (Alembic revision **007**). Source of truth: SQLAlchemy models in [`backend/app/models/`](../backend/app/models/) and migrations in [`backend/alembic/versions/`](../backend/alembic/versions/).

**Product boundary (0.11):** `daily_notes` and contextual `notes` rows are retained for export (`GET /export/legacy-notes`); the active UI focuses on execution (tasks, events, objectives). Knowledge-style note authoring is out of scope.

## Entity-relationship diagram

```mermaid
erDiagram
  users ||--o{ domains : owns
  users ||--o{ objectives : owns
  users ||--o{ events : owns
  users ||--o{ tasks : owns
  users ||--o{ daily_notes : owns

  domains ||--o{ objectives : contains
  domains ||--o{ events : tags
  domains ||--o{ tasks : requires

  objectives ||--o{ events : optional
  objectives ||--o{ tasks : optional

  events ||--o{ tasks : optional
  events ||--o{ reminders : has
  events ||--o{ notes : legacy

  tasks ||--o{ reminders : has
  tasks ||--o{ notes : legacy

  users {
    int id PK
    string username UK
    string email UK
    string password_hash
  }

  domains {
    int id PK
    string name
    int user_id FK
  }

  objectives {
    int id PK
    string title
    datetime target_date
    string status
    datetime completed_at
    datetime created_at
    datetime updated_at
    int domain_id FK
    int user_id FK
  }

  events {
    int id PK
    string title
    datetime start_at
    datetime end_at
    bool is_recurring
    string rrule
    string timezone
    datetime recurrence_until
    int domain_id FK
    int user_id FK
    int objective_id FK
  }

  tasks {
    int id PK
    string name
    date planned_for
    datetime due_at
    string status
    datetime completed_at
    bool is_recurring
    string rrule
    int domain_id FK
    int user_id FK
    int objective_id FK
    int event_id FK
  }

  reminders {
    int id PK
    string text
    int task_id FK
    int event_id FK
  }

  notes {
    int id PK
    text content
    datetime created_at
    datetime updated_at
    int task_id FK
    int event_id FK
    datetime occurrence_start_at
  }

  daily_notes {
    int id PK
    int user_id FK
    date note_date
    text content
    datetime created_at
    datetime updated_at
  }
```

## Constraints (not shown in ER diagram)

| Table | Constraint | Rule |
|-------|------------|------|
| `reminders` | `check_reminder_owner` | Exactly one of `task_id` or `event_id` is set |
| `notes` | `check_note_owner` | Exactly one of `task_id` or `event_id` is set |
| `notes` | `uq_notes_event_occurrence` | Unique `(event_id, occurrence_start_at)` for per-occurrence event notes |
| `daily_notes` | `uq_daily_notes_user_date` | One row per `(user_id, note_date)` |

## Objective and task status values

| Entity | `status` values |
|--------|-----------------|
| `objectives` | `active`, `paused`, `completed`, `cancelled` |
| `tasks` | `active`, `completed`, `cancelled` |

## Maintenance

Update this file in the same change set as any Alembic revision that adds, renames, or drops columns or relationships.
