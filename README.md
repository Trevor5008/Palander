# Palander
Calendar planner for daily task and event planning

### Design

![Design whiteboard](docs/design-whiteboard.png)

#### Database schema

Hierarchy: **User → Domain → Objective → Event / Task**

| Entity | Fields | Relationships |
|--------|--------|---------------|
| **USER** | `id` (int, PK), `username`, `email` | Owns domains, objectives, events, and tasks |
| **DOMAIN** | `id` (PK), `name`, `user_id` (FK) | Life pillars (e.g. career, academics); has objectives, events, and tasks |
| **OBJECTIVE** | `id` (PK), `title`, `target_date`, `domain_id` (FK), `user_id` (FK) | Goals under a domain; has events and tasks |
| **EVENT** | `id` (PK), `title`, `start_at`, `end_at`, `is_recurring`, `rrule`, `domain_id` (FK), `user_id` (FK), `objective_id` (FK, optional) | Calendar block; has tasks, notes, and reminders |
| **TASK** | `id` (PK), `name`, `due_date`, `is_recurring`, `rrule`, `domain_id` (FK), `objective_id` (FK, optional), `event_id` (FK, optional), `user_id` (FK) | Action item; has notes and reminders |
| **REMINDER** | `id` (PK), `text`, `task_id` (FK), `event_id` (FK) | Attached to exactly one task **or** one event |
| **NOTE** | `id` (PK), `content`, `created_at`, `updated_at`, `task_id` (FK), `event_id` (FK) | Attached to exactly one task **or** one event |

Recurring events and tasks use inline `is_recurring` + `rrule` (iCalendar RRULE strings), not a separate recurrence table.

#### UI views

**Calendar view** — A monthly/weekly grid (Sun–Thu) where each day shows tasks and events as distinct markers. Selecting a day (e.g. Thursday the 4th) surfaces items like "TASK 001" and "EVENT 001".

**Daily view** — A vertical timeline from 12am to 11:59pm with a current-time indicator, listing the day's tasks and events in chronological order.

#### CRUD modal

Dynamic add modal triggered by an Add button. Event/Task radio buttons switch the form fields:

- **Event** — date, domain (career, fitness, finances, school), start time, end time
- **Task** — domain, due date, time, optional linked event (filtered select list)

![CRUD modal design](docs/crud-design.png)

## Tech Stack

- SQLAlchemy (ORM)
- Alembic (migrations)
- PostgreSQL (DB)
- FastAPI (Backend)
- Pydantic (data validation)
- Vite.js (Frontend)
- Tailwind (Styling)

## Project structure

- `backend/` — FastAPI API, SQLAlchemy models, Alembic migrations
- `frontend/` — Vite + Tailwind UI (calendar and daily views)
- `docs/` — design artifacts

## Getting started

### Prerequisites

- Python 3.12+
- Node.js / npm
- PostgreSQL (local install or Docker)

**PostgreSQL via Docker (optional):**

```bash
docker run --name palander-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=palander \
  -p 5432:5432 \
  -d postgres:16
```

**PostgreSQL on Arch Linux:**

```bash
sudo pacman -S postgresql
sudo -iu postgres initdb --locale=C.UTF-8 -D /var/lib/postgres/data   # first time only
sudo systemctl enable --now postgresql
sudo -iu postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -iu postgres createdb palander
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL if needed
alembic upgrade head
uvicorn app.main:app --reload
```

Default `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/palander`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend dev server runs at http://localhost:5173 and calls the backend at `VITE_API_URL` (default http://localhost:8000).
