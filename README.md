# Palander

Calendar planner for daily task and event planning

[![Version](https://img.shields.io/badge/version-0.3.0-blue)](CHANGELOG.md)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Pydantic](https://img.shields.io/badge/Pydantic-2.6+-E92063?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-1.14+-000000)](https://alembic.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

## Table of contents

- [Design](#design)
  - [Database schema](#database-schema)
  - [UI views](#ui-views)
  - [CRUD modal](#crud-modal)
- [Data flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Versioning](#versioning)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Docker (recommended)](#docker-recommended)
  - [Backend (native)](#backend-native)
  - [Frontend](#frontend)
- [CI/CD](#cicd)

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

## Data flow

Events and tasks persist through the React UI → FastAPI → PostgreSQL stack. The frontend authenticates with JWT Bearer tokens (`POST /auth/login`); the dev user is `dev` / `dev`.

**Architecture (component flow):**

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

  CalendarView --> apiTs
  DailyView --> apiTs
  EventModal --> mappers
  EventModal --> apiTs
  mappers --> apiTs
  apiTs --> domainsRouter
  apiTs --> eventsRouter
  apiTs --> tasksRouter
  domainsRouter --> pydantic
  eventsRouter --> pydantic
  tasksRouter --> pydantic
  pydantic --> sqlalchemy
  sqlalchemy --> DB
```

**CRUD sequence (list → modal → save → refetch):**

```mermaid
sequenceDiagram
  participant View as CalendarView / DailyView
  participant Modal as EventModal
  participant API as api.ts
  participant BE as FastAPI
  participant DB as PostgreSQL

  View->>API: GET /events and /tasks
  API->>BE: list by user_id + date range
  BE->>DB: SELECT
  DB-->>View: render markers / blocks

  View->>Modal: open create or edit
  Modal->>API: GET /domains
  alt Create or update
    Modal->>API: POST or PATCH
    API->>BE: write
    BE->>DB: INSERT or UPDATE
  else Delete
    Modal->>API: DELETE
    BE->>DB: DELETE
  end
  Modal->>View: onSaved / onDeleted
  View->>API: refetch lists
```

Full detail (field mapping, file index, out-of-scope items): [`docs/data-flow.md`](docs/data-flow.md).

## Tech Stack

See the badges above for the main technologies. Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic. Frontend: React, TypeScript, Vite, Tailwind CSS, Headless UI.

## Versioning

The project version lives in [`VERSION`](VERSION) at the repo root (currently **0.3.0**). Release notes are in [`CHANGELOG.md`](CHANGELOG.md). The backend exposes the version at `/health` and in the OpenAPI docs; the frontend mirrors it in `frontend/package.json`.

## Project structure

- `backend/` — FastAPI API, SQLAlchemy models, Alembic migrations, Dockerfile
- `frontend/` — Vite + Tailwind UI (calendar and daily views)
- `docs/` — design artifacts
- `docker-compose.yml` — PostgreSQL + API for local development
- `.github/workflows/` — CI (pytest, frontend build, compose smoke test) and release (GHCR)

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

### Docker (recommended)

Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2.

```bash
docker compose up --build
```

This starts PostgreSQL and the API on http://localhost:8000. Migrations run automatically on startup. Optional overrides: copy [`docker-compose.env.example`](docker-compose.env.example) to `docker-compose.env` and pass `--env-file docker-compose.env`.

Then run the frontend locally (see [Frontend](#frontend)). Sign in with **dev** / **dev**.

### Backend (native)

Alternative to Docker — run Postgres yourself (see below), then:

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

Sign in with the seeded dev account: **username** `dev`, **password** `dev`. The JWT is stored in `localStorage` and sent as `Authorization: Bearer …` on API requests.

## CI/CD

**CI** (`.github/workflows/ci.yml`) runs on every push to `main` and on pull requests:

- Backend: `pytest` (44 tests)
- Frontend: `npm ci` + `npm run build`
- Docker: `docker compose up --build --wait`, then `curl /health`

**Release** (`.github/workflows/release.yml`) runs when a version tag is pushed (e.g. `v0.3.0`):

- Builds the backend image and publishes to GHCR:

```bash
docker pull ghcr.io/trevor5008/palander-api:0.3.0
```

For private repositories, authenticate with `docker login ghcr.io` using a GitHub personal access token with `read:packages`. Set `JWT_SECRET` to at least 32 bytes in production deployments.
