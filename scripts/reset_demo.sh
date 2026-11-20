#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Resetting Docker volumes and starting API + Postgres..."
docker compose down -v
docker compose up -d --build --wait

echo "Seeding demo dataset (API container DB)..."
docker compose exec -T api python -m app.demo_seed

echo "Start the UI: cd frontend && npm ci && npm run dev"
echo "Open: http://localhost:5173/?date=2026-10-28  (login dev / dev)"