# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/Trevor5008/Palander/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Trevor5008/Palander/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Trevor5008/Palander/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Trevor5008/Palander/compare/v0.0.2...v0.1.0
[0.0.2]: https://github.com/Trevor5008/Palander/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Trevor5008/Palander/releases/tag/v0.0.1
