from datetime import datetime

from app.recurrence.expand import expand_event_occurrences
from app.recurrence.rrule_build import build_rrule, build_weekly_rrule


def test_build_weekly_rrule_includes_byday_and_until():
    until = datetime(2026, 12, 31, 23, 59, 0)
    rrule = build_weekly_rrule(["MO", "WE"], until, "America/New_York")
    assert "FREQ=WEEKLY" in rrule
    assert "BYDAY=MO,WE" in rrule
    assert "UNTIL=" in rrule


def test_expand_weekly_occurrences_in_range():
    start = datetime(2026, 8, 17, 9, 0, 0)
    end = datetime(2026, 8, 17, 10, 0, 0)
    until = datetime(2026, 9, 30, 23, 59, 0)
    rrule = build_weekly_rrule(["MO"], until, "America/New_York")

    occurrences = expand_event_occurrences(
        event_id=1,
        title="Class",
        start_at=start,
        end_at=end,
        is_recurring=True,
        rrule=rrule,
        timezone_name="America/New_York",
        recurrence_until=until,
        domain_id=1,
        user_id=1,
        objective_ids=[],
        range_start=datetime(2026, 8, 1, 0, 0, 0),
        range_end=datetime(2026, 9, 1, 0, 0, 0),
    )

    assert len(occurrences) == 3
    assert all(occ.series_id == 1 for occ in occurrences)


def test_build_daily_interval_rrule():
    until = datetime(2026, 12, 31, 23, 59, 0)
    rrule = build_rrule(freq="DAILY", interval=3, until=until, tz_name="UTC")
    assert "FREQ=DAILY" in rrule
    assert "INTERVAL=3" in rrule


def test_build_monthly_interval_rrule():
    until = datetime(2026, 12, 31, 23, 59, 0)
    rrule = build_rrule(freq="MONTHLY", interval=2, until=until, tz_name="UTC")
    assert "FREQ=MONTHLY" in rrule
    assert "INTERVAL=2" in rrule


def test_expand_dst_wall_clock_stable():
    start = datetime(2026, 3, 2, 9, 0, 0)
    end = datetime(2026, 3, 2, 10, 0, 0)
    until = datetime(2026, 3, 30, 23, 59, 0)
    rrule = build_weekly_rrule(["MO"], until, "America/New_York")

    occurrences = expand_event_occurrences(
        event_id=2,
        title="Morning class",
        start_at=start,
        end_at=end,
        is_recurring=True,
        rrule=rrule,
        timezone_name="America/New_York",
        recurrence_until=until,
        domain_id=1,
        user_id=1,
        objective_ids=[],
        range_start=datetime(2026, 3, 1, 0, 0, 0),
        range_end=datetime(2026, 4, 1, 0, 0, 0),
    )

    assert len(occurrences) >= 4
    for occ in occurrences:
        assert occ.start_at.hour == 9
        assert occ.end_at.hour == 10
