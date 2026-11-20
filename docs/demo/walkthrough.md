# Demo walkthrough (PAL-S1-003)

Synthetic data only — no personal schedules or school-account content. **Anchor date:** `2026-10-28`.

There is **no public hosted demo**; run Palander locally ([`docs/clean-checkout.md`](../clean-checkout.md)).

## 1. Reset and seed

```bash
./scripts/reset_demo.sh
```

Or manually:

```bash
docker compose down -v && docker compose up -d --build --wait
docker compose exec -T api python -m app.demo_seed
```

## 2. Frontend

```bash
cd frontend && npm ci && cp -n .env.example .env && npm run dev
```

Log in: **dev** / **dev**

Open: [http://localhost:5173/?date=2026-10-28](http://localhost:5173/?date=2026-10-28)

## 3. Daily execution

- Timeline shows **Deep work block** and recurring **Team sync**.
- Execution pane: **Today** (“Ship demo walkthrough”), **Overdue** (practice drills occurrences), **Completed today** (expand to see “Morning review”).

## 4. Planning

Navigate to **Planning** (`/planning`).

- **Objectives** — “Portfolio case study”, “Semester rhythm”.
- **Weekly review** — domain allocation for the current week.

## 5. Recurrence

On Daily, open **Practice drills** (overdue recurring task) or **Team sync** on the timeline.

- Event/Task modal shows recurrence fields.
- Edit an occurrence vs series (scope controls) as in MVP 0.13.

## 6. Schedule import

Open **Monthly** view → schedule import (paste flow).

Paste the contents of [`backend/fixtures/demo/schedule_import.txt`](../../backend/fixtures/demo/schedule_import.txt):

```text
Chemistry Lab,Mon;Wed,09:00,10:30
Team Sync,Tue,13:00,14:00
```

Preview and import generic labels (**Chemistry Lab**, **Team Sync**) — not FIU/PDF fixtures.

## Fixture reference

| File | Purpose |
|------|---------|
| [`backend/fixtures/demo/profile.json`](../../backend/fixtures/demo/profile.json) | Anchor date + login metadata |
| [`backend/fixtures/demo/schedule_import.txt`](../../backend/fixtures/demo/schedule_import.txt) | Paste for import step |

Capture metadata: [`CAPTURE.md`](CAPTURE.md)