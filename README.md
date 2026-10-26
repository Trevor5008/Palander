# Palander

Calendar planner for daily task and event planning

[![Version](https://img.shields.io/badge/version-0.11.0-blue)](CHANGELOG.md)
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

## Design

Palander is an execution-focused calendar: **Daily** and **Planning** for tasks and objectives, plus **Weekly** and **Monthly** calendar views. Routes: `/`, `/planning`, `/weekly`, `/monthly` (optional shared `?date=YYYY-MM-DD`).

Detailed design and reference material is in [`docs/`](docs/):

| Doc | Contents |
|-----|----------|
| [`schema.md`](docs/schema.md) | PostgreSQL ER diagram, constraints, status enums |
| [`data-flow.md`](docs/data-flow.md) | Architecture diagrams, API paths, field mapping |
| [`design-whiteboard.png`](docs/design-whiteboard.png) | Early product whiteboard sketch |
| [`crud-design.png`](docs/crud-design.png) | Event/task modal mockup |

Release history and behavior changes: [`CHANGELOG.md`](CHANGELOG.md).

## Data flow

The React UI talks to FastAPI over JWT (`POST /auth/login`; dev user **dev** / **dev**). Request paths, sequences, and modal field mapping are documented in [`docs/data-flow.md`](docs/data-flow.md).

## Tech Stack

See the badges above for the main technologies. Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pydantic. Frontend: React, TypeScript, Vite, Tailwind CSS, Headless UI.

## Versioning

The project version lives in [`VERSION`](VERSION) at the repo root (currently **0.11.0**). Release notes are in [`CHANGELOG.md`](CHANGELOG.md). The backend exposes the version at `/health` and in the OpenAPI docs; the frontend mirrors it in `frontend/package.json`.

## Project structure

- `backend/` — FastAPI API, SQLAlchemy models, Alembic migrations, Dockerfile
- `frontend/` — Vite + Tailwind UI (calendar and daily views)
- `docs/` — design artifacts ([`schema.md`](docs/schema.md), [`data-flow.md`](docs/data-flow.md))
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
pip install -r requirements-dev.txt
cp .env.example .env   # set DATABASE_URL if needed
alembic upgrade head
uvicorn app.main:app --reload
```

Run tests from `backend/` **with the venv activated** (or use `.venv/bin/pytest`). Plain `pytest` from your system Python will fail to load `tests/conftest.py` because FastAPI and other app deps are not installed globally:

```bash
cd backend
source .venv/bin/activate
pytest
# or: .venv/bin/pytest
```

Default `DATABASE_URL`: `postgresql+psycopg2://postgres:postgres@localhost:5432/palander` (explicit driver matches `psycopg2-binary` in requirements)

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

- Backend: `pytest` in `backend/` (after `pip install -r requirements-dev.txt`)
- Frontend: `npm ci` + `npm run build`
- Docker: `docker compose up --build --wait`, then `curl /health`

**Release** (`.github/workflows/release.yml`) runs when a version tag is pushed (e.g. `v0.3.0`):

- Builds the backend image and publishes to GHCR:

```bash
docker pull ghcr.io/trevor5008/palander-api:0.3.0
```

For private repositories, authenticate with `docker login ghcr.io` using a GitHub personal access token with `read:packages`. Set `JWT_SECRET` to at least 32 bytes in production deployments.
