# Database schema (PostgreSQL)

Canonical entity-relationship reference for Palander **v0.13.0** (Alembic revision **009**). Source of truth: SQLAlchemy models in [`backend/app/models/`](../backend/app/models/) and migrations in [`backend/alembic/versions/`](../backend/alembic/versions/).

## Entity-relationship diagram

```mermaid
erDiagram
  users ||--o{ domains : owns
  users ||--o{ objectives : owns
  users ||--o{ events : owns
  users ||--o{ tasks : owns

  domains ||--o{ objectives : contains
  domains ||--o{ events : tags
  domains ||--o{ tasks : requires

  objectives }o--o{ events : links
  objectives }o--o{ tasks : links

  events ||--o{ tasks : optional
  events ||--o{ reminders : has
  events ||--o{ event_occurrence_exceptions : has

  tasks ||--o{ reminders : has
  tasks ||--o{ task_occurrences : has

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
    string timezone
    datetime recurrence_until
    int estimated_duration_minutes
    string overdue_policy
    int domain_id FK
    int user_id FK
    int event_id FK
  }

  task_occurrences {
    int id PK
    int task_id FK
    date occurrence_date
    string status
    date planned_for
    datetime due_at
    datetime completed_at
    datetime skipped_at
  }

  event_occurrence_exceptions {
    int id PK
    int event_id FK
    datetime occurrence_start_at
    bool cancelled
    string title
    datetime start_at
    datetime end_at
  }

  event_objectives {
    int event_id FK
    int objective_id FK
  }

  task_objectives {
    int task_id FK
    int objective_id FK
  }

  reminders {
    int id PK
    string text
    int task_id FK
    int event_id FK
  }
```

## Constraints (not shown in ER diagram)

| Table | Constraint | Rule |
|-------|------------|------|
| `reminders` | `check_reminder_owner` | Exactly one of `task_id` or `event_id` is set |
| `task_occurrences` | `uq_task_occurrence_date` | One row per `(task_id, occurrence_date)` |
| `event_occurrence_exceptions` | `uq_event_occurrence_exception` | One row per `(event_id, occurrence_start_at)` |

## Objective and task status values

| Entity | `status` values |
|--------|-----------------|
| `objectives` | `active`, `paused`, `completed`, `cancelled` |
| `tasks` | `active`, `completed`, `cancelled` |
| `task_occurrences` | `active`, `completed`, `cancelled`, `skipped` |

## Recurrence

Events and tasks store RRULE (`DAILY` / `WEEKLY` / `MONTHLY`, optional `INTERVAL`, required `UNTIL`). Events expand virtually; recurring tasks merge RRULE dates with `task_occurrences` for per-date complete/move/skip.

## Maintenance

Update this file in the same change set as any Alembic revision that changes columns or relationships.
