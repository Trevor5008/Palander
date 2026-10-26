from datetime import date, datetime


def task_payload(domain_id: int, **overrides):
    payload = {
        "name": "Review notes",
        "planned_for": "2026-08-18",
        "due_at": "2026-08-18T14:00:00",
        "status": "active",
        "is_recurring": False,
        "rrule": None,
        "domain_id": domain_id,
        "event_id": None,
        "objective_id": None,
    }
    payload.update(overrides)
    return payload


def test_weekly_review_domain_allocation_and_carry_forward(
    client, seed_user, seed_domain, auth_headers
):
    client.post(
        "/tasks",
        json=task_payload(
            seed_domain.id,
            planned_for="2026-08-10",
            due_at="2026-08-10T09:00:00",
        ),
        headers=auth_headers,
    )
    client.post(
        "/tasks",
        json=task_payload(seed_domain.id, planned_for="2026-08-18"),
        headers=auth_headers,
    )

    response = client.get(
        "/planning/weekly-review",
        params={"week_start": "2026-08-17"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["week_start"] == "2026-08-17"
    assert data["week_end"] == "2026-08-23"
    assert len(data["domain_allocation"]) >= 1
    assert data["domain_allocation"][0]["tasks_planned"] == 1
    assert len(data["carry_forward"]) >= 1


def test_carry_forward_bulk(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/tasks",
        json=task_payload(
            seed_domain.id,
            planned_for="2026-08-10",
            due_at="2026-08-10T09:00:00",
        ),
        headers=auth_headers,
    ).json()

    response = client.post(
        "/planning/carry-forward",
        json={"items": [{"task_id": created["id"], "planned_for": "2026-08-18"}]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["updated"] == 1

    task = client.get(f"/tasks/{created['id']}", headers=auth_headers).json()
    assert task["planned_for"] == "2026-08-18"


def test_planning_progress(client, seed_user, seed_domain, auth_headers):
    obj = client.post(
        "/objectives",
        json={"title": "Ship MVP", "domain_id": seed_domain.id},
        headers=auth_headers,
    ).json()
    client.post(
        "/tasks",
        json=task_payload(seed_domain.id, objective_id=obj["id"]),
        headers=auth_headers,
    )

    response = client.get("/planning/progress", params={"weeks": 4}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["weeks"] == 4
    assert isinstance(data["objective_weekly_activity"], list)
