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


def test_daily_workspace_today_and_overdue(client, seed_user, seed_domain, auth_headers):
    client.post(
        "/tasks",
        json=task_payload(seed_domain.id, name="Today task"),
        headers=auth_headers,
    )
    client.post(
        "/tasks",
        json=task_payload(
            seed_domain.id,
            name="Overdue task",
            planned_for="2026-08-10",
            due_at="2026-08-10T09:00:00",
        ),
        headers=auth_headers,
    )

    response = client.get(
        "/daily-workspace",
        params={"date": "2026-08-18"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["today"]) == 1
    assert data["today"][0]["name"] == "Today task"
    assert len(data["overdue"]) == 1
    assert data["overdue"][0]["name"] == "Overdue task"
    assert data["domain_coverage"][0]["planned_task_count"] == 1


def test_daily_workspace_completed_section(client, seed_user, seed_domain, auth_headers):
    from datetime import datetime, timezone

    completed_at = datetime(2026, 8, 18, 16, 0, tzinfo=timezone.utc).isoformat()
    created = client.post(
        "/tasks",
        json=task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()
    client.patch(
        f"/tasks/{created['id']}",
        json={"status": "completed", "completed_at": completed_at},
        headers=auth_headers,
    )

    response = client.get(
        "/daily-workspace",
        params={"date": "2026-08-18"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["completed"]) == 1
    assert data["today"] == []
