# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.0] - 2026-10-24

### Added

- Daily note workspace: Markdown-backed page per calendar day (`daily_notes` table)
- `GET` / `PUT /daily-notes/{date}` with optimistic concurrency (`if_updated_at`, 409 on conflict)
- Daily view split layout (timeline + note pane), autosave, edit/preview with GFM
- Default landing **Daily**; monthly grid at `/monthly`; shared `?date=` across Daily / Weekly / Monthly

## [0.8.0] - 2026-10-24

### Added

- PDF schedule import: `POST /schedule/parse-pdf` (in-memory, no file retention)
- FIU Schedule of Classes profile parser with per-course From/To dates and AM/PM times
- Import modal **Paste | Upload PDF** tabs, format help for PDF, provenance (filename + page)
- OCR-required response for scanned PDFs; TBA/asynchronous sections surfaced as format issues

## [0.7.0] - 2026-10-23

### Added

- Schedule parse: user-defined term start and repeat-until (recurrence cutoff); optional `format_hint` (auto, plain, csv)
- Composite schedule parser registry (heuristic + CSV/TSV table parser) with merge and confidence threshold
- OpenAI-compatible parser structured JSON schema output with composite fallback
- Import preview: edit weekdays, times, per-row series end; client validation before import

## [0.6.0] - 2026-10-22

### Added

- Weekly recurring event series with IANA timezone, RRULE, and recurrence end boundary
- Server-side occurrence expansion in `GET /events` for month/week/day views
- Manual weekly recurrence controls in the event modal (weekdays, repeat-until, timezone)
- Schedule ingestion: `POST /schedule/parse` and `POST /schedule/import` with preview-first workflow
- Provider-neutral `ScheduleParser` with OpenAI-compatible adapter and heuristic fallback
- Import schedule UI on the calendar view with editable candidate review

### Changed

- Editing or deleting a recurring event applies to the entire series (single-occurrence edits deferred)

## [0.5.0] - 2026-10-21

### Added

- Multi-day events: separate start/end dates in the event modal (end date defaults to start date)
- Event list API returns events that **overlap** the requested range (not only those starting in range)
- Shared overlap helpers and per-day clipped rendering for timed events on daily and weekly views
- `AddEntryButton` for consistent add actions across calendar, daily, and weekly views

### Changed

- Monthly, weekly, and daily views show events on every date they overlap; tasks remain single due date
- Calendar month grid uses cell borders instead of gray gap gutters
- Event modal title uses a bordered input; empty month cells are clickable to create an event on that day

### Removed

- Unused `WeekStrip` component (weekly view uses `WeekTimeline`)

## [0.4.0] - 2026-08-26

### Added

- Weekly view with week strip day picker and reused daily timeline for the selected date
- Shared frontend hooks: `useEntriesRange`, `useEventTaskModal`, `useDomains`
- Shared components: `DateNavBar`, `WeekStrip`, `AllDayRow`, `DayTimeline`
- Domain color coding for events and tasks across calendar, daily, and weekly views
- All-day event row on daily and weekly views
- Calendar month navigation (prev/next/today) with refetch on range change

### Changed

- Refactored DailyView and CalendarView to use shared fetch/modal/timeline utilities

## [0.3.0] - 2026-08-18

### Added

- JWT authentication (`POST /auth/login`, `GET /auth/me`); all resource routes require Bearer token
- Full Domain and Objective CRUD APIs with validation and pytest coverage (44 tests)
- Backend Dockerfile with automatic Alembic migrations on startup
- Docker Compose stack (`db` + `api`) for local development
- GitHub Actions CI: pytest, frontend build, and compose smoke test
- GitHub Actions release workflow publishing backend image to `ghcr.io/trevor5008/palander-api`
- Frontend login page, route guard, and JWT storage in `localStorage`

### Changed

- Resource APIs no longer accept `user_id` query params or create payloads; ownership is derived from the JWT
- README documents Docker Compose workflow and CI/CD pipelines

## [0.2.0] - 2026-08-17

### Added

- Event and Task Pydantic schemas and full CRUD REST API (`/events`, `/tasks`, `/domains`)
- Alembic seed migration for dev user (`user_id=1`) and domain pillars
- Frontend API client, TypeScript types, and form-to-API mappers
- Calendar and daily views fetch and display persisted events and tasks; click to edit
- EventModal wired for create, update, and delete with domain lookup and linked-event dropdown
- Data flow architecture and sequence diagrams in README and [`docs/data-flow.md`](docs/data-flow.md)

## [0.1.0] - 2026-07-21

### Added

- Anki-style daily view with date navigation, weekday header, and 16-hour scrollable timeline
- Minute-accurate current-time indicator anchored at 25% of the viewport
- Event/Task CRUD modal (Headless UI) opened from the daily view toolbar
- Domain constants (career, fitness, finances, school) and date/time helpers
- CRUD modal design documentation and screenshot in README

### Changed

- Daily timeline uses viewport-fitted row heights and scroll anchoring on the current time
- Replaced hour-level current-time indicator with minute-level positioning

## [0.0.2] - 2026-07-21

### Changed

- Redesigned backend schema around domains and objectives (int IDs, RRULE recurrence)
- Rewrote initial Alembic migration and added Pydantic schemas for domain and objective

### Added

- Event modal wireframe and rudimentary frontend implementation

## [0.0.1] - 2026-07-21

### Added

- Project scaffold: FastAPI backend, Vite + React frontend, PostgreSQL via SQLAlchemy/Alembic
- Calendar and daily view placeholders, CORS wiring, and development setup docs
- Database schema design and README documentation

[Unreleased]: https://github.com/Trevor5008/Palander/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/Trevor5008/Palander/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Trevor5008/Palander/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Trevor5008/Palander/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Trevor5008/Palander/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/Trevor5008/Palander/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Trevor5008/Palander/releases/tag/v0.0.1
