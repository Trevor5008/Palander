# Clean checkout verification

Reproducible Palander setup from a fresh clone (PAL-S1-002). Commands below assume repo root.

## Prerequisites

| Tool | Supported / tested |
|------|-------------------|
| Python | 3.12+ (CI uses 3.12; local verification also passed on 3.14) |
| Node.js | 20+ (local verification: v24.x) |
| PostgreSQL | 16 (via Docker or local) |
| Docker | Optional but recommended for API + DB |

**Local-only defaults:** migrations seed user `dev` / `dev`, example JWT in [`.env.example`](../backend/.env.example) and [`docker-compose.yml`](../docker-compose.yml). Do **not** use these outside a private dev machine. See [README](../README.md#local-development-credentials-only).

## Path A — Docker Compose (recommended)

Matches CI `docker-compose` job.

```bash
git clone https://github.com/Trevor5008/Palander.git
cd Palander

docker compose up -d --build --wait
curl -sf http://localhost:8000/health
# {"status":"ok","version":"0.13.0"}

curl -sf -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"dev","password":"dev"}'
```

Frontend (separate terminal):

```bash
cd frontend
npm ci
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173 → log in as `dev` / `dev` → **Daily** view should load (timeline + execution pane).

Optional API check after login:

```bash
TOKEN="<paste access_token>"
curl -sf "http://localhost:8000/daily-workspace?date=$(date +%F)" \
  -H "Authorization: Bearer $TOKEN"
```

Teardown: `docker compose down -v`

## Path B — Native backend + Postgres

Requires a running Postgres on `localhost:5432` with database `palander` (see [README](../README.md#getting-started)).

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
pytest
uvicorn app.main:app --reload
```

In another terminal, use the [frontend steps](#path-a--docker-compose-recommended) above.

## Verification CI parity

From a clean clone with tools installed:

```bash
cd backend && source .venv/bin/activate && pytest
cd ../frontend && npm ci && npm test && npm run build
docker compose up -d --build --wait && curl -f http://localhost:8000/health
```

## Recorded run

| Field | Value |
|-------|--------|
| Date | 2026-11-20 |
| OS | Linux (Arch) |
| Python | 3.14.10 |
| Node | v24.22.3 |
| App version | 0.13.0 (from [`VERSION`](../VERSION)) |

| Step | Result |
|------|--------|
| `pip install -r requirements-dev.txt` (after removing erroneous `httpx2` line) | Pass |
| `pytest` | 83 passed |
| `npm ci` | Pass |
| `npm test` | 3 passed |
| `npm run build` | Pass |
| `docker compose up --build --wait` | Pass |
| `GET /health` | `{"status":"ok","version":"0.13.0"}` |
| `POST /auth/login` (`dev`/`dev`) | Access token returned |
| `GET /daily-workspace` (authenticated) | JSON with `today` / `overdue` / `completed` |

## Dependency and secret posture

- Audit summary: [`dependency-audit.md`](dependency-audit.md)
- JWT: use 32+ byte secret in any shared or deployed environment; dev defaults are aligned across `.env.example`, Compose, and `config.py`.