"""Idempotent demo dataset for user_id=1 (dev). Run inside API container or via scripts/seed_demo.py."""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import delete, inspect, select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.domain import Domain
from app.models.event import Event
from app.models.event_occurrence_exception import EventOccurrenceException
from app.models.objective import Objective
from app.models.task import Task
from app.models.task_occurrence import TaskOccurrence
from app.models.user import User
from app.recurrence.rrule_build import build_rrule, build_weekly_rrule

APP_ROOT = Path(__file__).resolve().parent.parent
DEMO_USER_ID = 1
ANCHOR = date(2026, 10, 28)
TZ = "America/New_York"
RECUR_UNTIL = datetime(2026, 12, 5, 23, 59, 0)


def _domain_map(session: Session, user_id: int) -> dict[str, int]:
    rows = session.scalars(select(Domain).where(Domain.user_id == user_id)).all()
    return {d.name: d.id for d in rows}


def clear_user_data(session: Session, user_id: int) -> None:
    task_ids = list(
        session.scalars(select(Task.id).where(Task.user_id == user_id)).all()
    )
    event_ids = list(
        session.scalars(select(Event.id).where(Event.user_id == user_id)).all()
    )
    if task_ids and inspect(session.bind).has_table("task_occurrences"):
        session.execute(delete(TaskOccurrence).where(TaskOccurrence.task_id.in_(task_ids)))
    if event_ids:
        session.execute(
            delete(EventOccurrenceException).where(
                EventOccurrenceException.event_id.in_(event_ids)
            )
        )
    session.execute(delete(Task).where(Task.user_id == user_id))
    session.execute(delete(Event).where(Event.user_id == user_id))
    session.execute(delete(Objective).where(Objective.user_id == user_id))
    session.commit()


def seed(session: Session, user_id: int) -> None:
    user = session.get(User, user_id)
    if user is None:
        raise SystemExit(f"User id={user_id} not found — run alembic upgrade head first.")

    domains = _domain_map(session, user_id)
    required = ("career", "school")
    for name in required:
        if name not in domains:
            raise SystemExit(f"Domain {name!r} missing — expected migration 002 seed.")

    career_id = domains["career"]
    school_id = domains["school"]

    obj_portfolio = Objective(
        title="Portfolio case study",
        target_date=datetime(2026, 12, 1, 12, 0, 0),
        status="active",
        domain_id=career_id,
        user_id=user_id,
    )
    obj_semester = Objective(
        title="Semester rhythm",
        target_date=datetime(2026, 12, 15, 12, 0, 0),
        status="active",
        domain_id=school_id,
        user_id=user_id,
    )
    session.add_all([obj_portfolio, obj_semester])
    session.flush()

    daily_rrule = build_rrule(freq="DAILY", interval=1, until=RECUR_UNTIL, tz_name=TZ)
    recurring_task = Task(
        name="Practice drills",
        planned_for=date(2026, 10, 1),
        due_at=datetime(2026, 10, 1, 9, 0, 0),
        status="active",
        is_recurring=True,
        rrule=daily_rrule,
        timezone=TZ,
        recurrence_until=RECUR_UNTIL,
        estimated_duration_minutes=45,
        overdue_policy="keep_overdue",
        domain_id=career_id,
        user_id=user_id,
    )
    recurring_task.objectives.append(obj_portfolio)

    today_task = Task(
        name="Ship demo walkthrough",
        planned_for=ANCHOR,
        due_at=datetime(2026, 10, 28, 17, 0, 0),
        status="active",
        estimated_duration_minutes=60,
        overdue_policy="keep_overdue",
        domain_id=career_id,
        user_id=user_id,
    )
    today_task.objectives.append(obj_portfolio)

    completed_task = Task(
        name="Morning review",
        planned_for=ANCHOR,
        due_at=datetime(2026, 10, 28, 8, 0, 0),
        status="completed",
        completed_at=datetime(2026, 10, 28, 8, 30, 0),
        estimated_duration_minutes=20,
        overdue_policy="keep_overdue",
        domain_id=school_id,
        user_id=user_id,
    )
    completed_task.objectives.append(obj_semester)

    planning_task = Task(
        name="Weekly planning block",
        planned_for=date(2026, 10, 27),
        due_at=datetime(2026, 10, 27, 18, 0, 0),
        status="active",
        estimated_duration_minutes=30,
        overdue_policy="keep_overdue",
        domain_id=career_id,
        user_id=user_id,
    )
    planning_task.objectives.append(obj_portfolio)

    session.add_all([recurring_task, today_task, completed_task, planning_task])

    weekly_rrule = build_weekly_rrule(["TU"], RECUR_UNTIL, TZ)
    team_sync = Event(
        title="Team sync",
        start_at=datetime(2026, 10, 7, 13, 0, 0),
        end_at=datetime(2026, 10, 7, 14, 0, 0),
        is_recurring=True,
        rrule=weekly_rrule,
        timezone=TZ,
        recurrence_until=RECUR_UNTIL,
        domain_id=career_id,
        user_id=user_id,
    )
    team_sync.objectives.append(obj_portfolio)

    deep_work = Event(
        title="Deep work block",
        start_at=datetime(2026, 10, 28, 10, 0, 0),
        end_at=datetime(2026, 10, 28, 11, 30, 0),
        is_recurring=False,
        domain_id=career_id,
        user_id=user_id,
    )
    deep_work.objectives.append(obj_portfolio)

    session.add_all([team_sync, deep_work])
    session.commit()


def main() -> None:
    profile_path = APP_ROOT / "fixtures" / "demo" / "profile.json"
    anchor = ANCHOR
    if profile_path.is_file():
        data = json.loads(profile_path.read_text())
        anchor = date.fromisoformat(data["anchor_date"])

    with SessionLocal() as session:
        clear_user_data(session, DEMO_USER_ID)
        seed(session, DEMO_USER_ID)
        tc = len(
            list(session.scalars(select(Task.id).where(Task.user_id == DEMO_USER_ID)))
        )
        ec = len(
            list(session.scalars(select(Event.id).where(Event.user_id == DEMO_USER_ID)))
        )
        oc = len(
            list(
                session.scalars(select(Objective.id).where(Objective.user_id == DEMO_USER_ID))
            )
        )

    print("Demo seed complete.")
    print(f"  Anchor date: {anchor.isoformat()}")
    print(f"  Daily URL:   http://localhost:5173/?date={anchor.isoformat()}")
    print(f"  Login:       dev / dev")
    print(f"  Rows:        {oc} objectives, {tc} tasks, {ec} events")


if __name__ == "__main__":
    main()