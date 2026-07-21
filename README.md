# Palander
Calender planner for daily task and event planning

### Design

![Design whiteboard](docs/design-whiteboard.png)

#### Database schema

| Entity | Fields | Relationships |
|--------|--------|---------------|
| **USER** | `id` (uuid, PK), `name`, `email` | One user has many tasks and events |
| **TASK** | `id` (PK), `name`, `date`, `domain`, `event_id` (FK), `user_id` (FK) | Belongs to a user; optionally linked to an event; has reminders, notes, and recurrence |
| **EVENT** | `id` (PK), `date`, `title`, `domain`, `user_id` (FK) | Belongs to a user; has many tasks, reminders, notes, and recurrence |
| **REMINDER** | `id` (PK), `text`, `task_id` (FK), `event_id` (FK) | Attached to a task or event |
| **NOTE** | `id` (PK), `task_id` (FK), `event_id` (FK) | Attached to a task or event |
| **RECURRENCE** | `id` (PK), `periodicity` (day, week, etc.), `starts`, `ends`, `task_id` (FK), `event_id` (FK) | Defines repeating patterns for tasks or events |

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
- PostgreSQL (DB)
- FastAPI (Backend)
- Vite.js (Frontend)
- Tailwind (Styling)

## Project structure

- `backend/` — FastAPI API and SQLAlchemy models
- `frontend/` — Vite + Tailwind UI (calendar and daily views)
- `docs/` — design artifacts

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend dev server runs at http://localhost:5173 and calls the backend at `VITE_API_URL` (default http://localhost:8000).
