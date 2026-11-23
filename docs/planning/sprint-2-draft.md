# Sprint 2 draft — Daily Workspace Usability

**Planning state:** Draft, ready to groom — **not committed** and **not loaded** to [GitHub Project #10](https://github.com/users/Trevor5008/projects/10). No `PAL-S2-*` issues exist in the repository yet.

**Proposed window (provisional):** 2026-11-26 through 2026-12-02. Dates follow the one-week Palander cadence but stay tentative until Sprint 1 closes and the story batch is accepted.

**Proposed goal:** Reduce Daily workspace overload and make destructive recurring-item actions predictable without changing historical recurrence-generation semantics.

## Draft story themes (repository-backed)

Evidence for current behavior lives in implementation and tests; this sprint would change UX only where noted.

| Draft ID | Theme | Repository touchpoints (today) |
|----------|--------|--------------------------------|
| `PAL-S2-001` | **Progressive disclosure** — compact Daily execution / Overdue by default with deliberate expansion and visible counts | [`frontend/src/components/DailyExecutionPane.tsx`](../../frontend/src/components/DailyExecutionPane.tsx) (Completed today collapsed; Overdue expanded; 10-row pagination) |
| `PAL-S2-002` | **Bulk overdue cleanup** — multi-select and batch removal with occurrence-safe semantics (no series deletion via bulk) | `GET /daily-workspace` ([`backend/app/routers/daily_workspace.py`](../../backend/app/routers/daily_workspace.py)); scoped `DELETE` on tasks/events |
| `PAL-S2-003` | **Recurring delete-scope clarity** — button/confirm text names occurrence, future, or series | [`frontend/src/modals/EventModal.tsx`](../../frontend/src/modals/EventModal.tsx); scoped delete APIs ([`data-flow.md`](../data-flow.md) — Recurrence) |

Integrated acceptance (`PAL-S2-004`) would cover collapse behavior, bulk safety, recurrence clarity, and responsive checks together once grooming fixes owners and sizes.

## Explicitly out of this draft

**Historical Recurring-Task Hygiene** (past-starting series and overdue flooding) remains a **separate candidate**, not part of this sprint draft.

## Related planning

- Sprint 1 parent and non-goals: [#13](https://github.com/Trevor5008/Palander/issues/13)
- Case-study classification: [`docs/portfolio-case-study.md`](../portfolio-case-study.md)