# Database schema (PostgreSQL)

Canonical entity-relationship reference for Palander **v0.12.0** (Alembic revision **008**). Source of truth: SQLAlchemy models in [`backend/app/models/`](../backend/app/models/) and migrations in [`backend/alembic/versions/`](../backend/alembic/versions/).

Legacy `daily_notes` and `notes` tables were removed in revision **008**. Export before upgrading from 0.11: [`legacy-notes-export.md`](legacy-notes-export.md).

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

  objectives ||--o{ events : optional
  objectives ||--o{ tasks : optional

  events ||--o{ tasks : optional
  events ||--o{ reminders : has

  tasks ||--o{ reminders : has

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
```

## Constraints (not shown in ER diagram)

| Table | Constraint | Rule |
|-------|------------|------|
| `reminders` | `check_reminder_owner` | Exactly one of `task_id` or `event_id` is set |

## Objective and task status values

| Entity | `status` values |
|--------|-----------------|
| `objectives` | `active`, `paused`, `completed`, `cancelled` |
| `tasks` | `active`, `completed`, `cancelled` |

## Recurrence (events)

Stored as `is_recurring`, `rrule` (max 255 chars), `timezone`, and `recurrence_until`. Supported RRULE scopes: `FREQ=DAILY|WEEKLY|MONTHLY` with optional `INTERVAL` and required `UNTIL`; weekly series require `BYDAY`.

## Maintenance

Update this file in the same change set as any Alembic revision that changes columns or relationships.
