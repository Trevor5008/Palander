from datetime import datetime

from app.recurrence.rrule_build import build_weekly_rrule


def recurring_payload(domain_id: int, **overrides):
    start = datetime(2026, 8, 18, 9, 0, 0)
    end = datetime(2026, 8, 18, 10, 0, 0)
    until = datetime(2026, 9, 30, 23, 59, 0)
    rrule = build_weekly_rrule(["MO"], until, "America/New_York")
    payload = {
        "title": "Weekly standup",
        "start_at": start.isoformat(),
        "end_at": end.isoformat(),
        "is_recurring": True,
        "rrule": rrule,
        "timezone": "America/New_York",
        "recurrence_until": until.isoformat(),
        "domain_id": domain_id,
        "objective_id": None,
    }
    payload.update(overrides)
    return payload


def test_create_recurring_event(client, seed_domain, auth_headers):
    response = client.post(
        "/events",
        json=recurring_payload(seed_domain.id),
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["is_recurring"] is True
    assert data["timezone"] == "America/New_York"
    assert data["rrule"] is not None


def test_list_recurring_event_expands_occurrences(client, seed_domain, auth_headers):
    client.post(
        "/events",
        json=recurring_payload(seed_domain.id),
        headers=auth_headers,
    )

    response = client.get(
        "/events",
        params={
            "start": "2026-08-01T00:00:00",
            "end": "2026-09-01T00:00:00",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    rows = response.json()
    assert len(rows) >= 2
    assert all(row["series_id"] == rows[0]["id"] for row in rows)
    assert len({row["start_at"] for row in rows}) == len(rows)
