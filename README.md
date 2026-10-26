# Palander

Palander is a personal **execution planner**: organize work by **Domains** and **Objectives**, run your day with **Tasks** and calendar **Events**, and review progress in **Planning** without turning the app into a general-purpose notes vault.

**Status:** Active development ([`CHANGELOG.md`](CHANGELOG.md)).

[![Version](https://img.shields.io/badge/version-0.12.0-blue)](CHANGELOG.md)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Core capabilities

- **Daily execution** — timeline plus Today / Overdue / Completed task sections with domain and objective context
- **Planning** — objectives by domain, weekly domain allocation review, carry-forward, and progress history
- **Calendar views** — weekly and monthly timelines with domain-colored entries
- **Recurring events** — daily, weekly, or monthly patterns with custom intervals (RRULE-backed)
- **Schedule import** — paste or PDF import for recurring class schedules (FIU profile)

## Table of contents

- [Design](#design)
- [Data flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Versioning](#versioning)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [CI/CD](#cicd)
- [License](#license)

## Design

Routes: **Daily** `/`, **Planning** `/planning`, **Weekly** `/weekly`, **Monthly** `/monthly` (optional shared `?date=YYYY-MM-DD`).

| Doc | Contents |
|-----|----------|
| [`schema.md`](docs/schema.md) | PostgreSQL ER diagram |
| [`data-flow.md`](docs/data-flow.md) | API and UI data paths |
| [`legacy-notes-export.md`](docs/legacy-notes-export.md) | Pre-0.12 note archive (if upgrading from 0.11) |

Release history: [`CHANGELOG.md`](CHANGELOG.md).

## Data flow

The React UI talks to FastAPI over JWT. See [`docs/data-flow.md`](docs/data-flow.md).

## Tech Stack

Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL. Frontend: React, TypeScript, Vite, Tailwind CSS, Headless UI.

## Versioning

Version in [`VERSION`](VERSION) (currently **0.12.0**). Backend `/health` and OpenAPI expose the same value.

## Project structure

- `backend/` — FastAPI API, models, Alembic migrations
- `frontend/` — Vite UI: **Daily**, **Planning**, **Weekly**, and **Monthly** views
- `docs/` — schema, data-flow, design artifacts
- `docker-compose.yml` — PostgreSQL + API for local development

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

### Docker (recommended)

```bash
docker compose up --build
```

API: http://localhost:8000 (migrations run on startup). Then start the [frontend](#frontend).

### Backend (native)

Run Postgres first (see [Prerequisites](#prerequisites)), then:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Tests (venv required):

```bash
cd backend && source .venv/bin/activate && pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Dev server: http://localhost:5173 → API at `VITE_API_URL` (default http://localhost:8000).

**Local development credentials only** — seeded user `dev` / `dev`. Do **not** use these in deployed environments; set a strong `JWT_SECRET` and proper user accounts in production.

After login, the client stores a JWT and sends:

```http
Authorization: Bearer <access_token>
```

## CI/CD

**CI** (`.github/workflows/ci.yml`): backend `pytest`, frontend build, Docker smoke test.

**Release** (tag `v*.*.*`): publishes `ghcr.io/trevor5008/palander-api` images.

```bash
docker pull ghcr.io/trevor5008/palander-api:$(cat VERSION)
```

Private repos: `docker login ghcr.io` with a PAT that has `read:packages`. Use a `JWT_SECRET` of at least 32 bytes in production.

## License

[MIT](LICENSE) — Copyright (c) 2026 Trevor C Werner
