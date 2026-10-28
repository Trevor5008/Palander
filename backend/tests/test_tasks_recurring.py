from datetime import datetime

from app.recurrence.rrule_build import build_weekly_rrule


def recurring_task_payload(domain_id: int, **overrides):
    until = datetime(2026, 9, 30, 23, 59, 0)
    rrule = build_weekly_rrule(["MO"], until, "America/New_York")
    payload = {
        "name": "Weekly review",
        "planned_for": "2026-08-17",
        "due_at": "2026-08-17T09:00:00",
        "status": "active",
        "is_recurring": True,
        "rrule": rrule,
        "timezone": "America/New_York",
        "recurrence_until": until.isoformat(),
        "overdue_policy": "keep_overdue",
        "domain_id": domain_id,
        "objective_ids": [],
    }
    payload.update(overrides)
    return payload


def test_list_recurring_task_expands(client, seed_domain, auth_headers):
    client.post(
        "/tasks",
        json=recurring_task_payload(seed_domain.id),
        headers=auth_headers,
    )
    response = client.get(
        "/tasks",
        params={"start": "2026-08-01T00:00:00", "end": "2026-09-01T00:00:00"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) >= 2
    assert all(r["series_id"] == rows[0]["id"] for r in rows)
    assert all(r["occurrence_date"] for r in rows)


def test_complete_single_occurrence(client, seed_domain, auth_headers):
    created = client.post(
        "/tasks",
        json=recurring_task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()
    occ_date = "2026-08-17"
    patch = client.patch(
        f"/tasks/{created['id']}",
        params={"scope": "occurrence", "occurrence_date": occ_date},
        json={"status": "completed"},
        headers=auth_headers,
    )
    assert patch.status_code == 200
    assert patch.json()["status"] == "completed"

    listed = client.get(
        "/tasks",
        params={"start": "2026-08-17T00:00:00", "end": "2026-08-18T00:00:00"},
        headers=auth_headers,
    ).json()
    completed = [r for r in listed if r["occurrence_date"] == occ_date]
    assert len(completed) == 1
    assert completed[0]["status"] == "completed"


def test_delete_single_occurrence(client, seed_domain, auth_headers):
    created = client.post(
        "/tasks",
        json=recurring_task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()
    response = client.delete(
        f"/tasks/{created['id']}",
        params={"scope": "occurrence", "occurrence_date": "2026-08-17"},
        headers=auth_headers,
    )
    assert response.status_code == 204
    listed = client.get(
        "/tasks",
        params={"start": "2026-08-01T00:00:00", "end": "2026-09-01T00:00:00"},
        headers=auth_headers,
    ).json()
    assert not any(r["occurrence_date"] == "2026-08-17" for r in listed)
