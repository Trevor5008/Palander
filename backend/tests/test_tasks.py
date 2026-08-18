def task_payload(domain_id: int | None = None, **overrides):
    payload = {
        "name": "Review notes",
        "due_date": "2026-08-18T14:00:00",
        "is_recurring": False,
        "rrule": None,
        "domain_id": domain_id,
        "event_id": None,
        "objective_id": None,
    }
    payload.update(overrides)
    return payload


def test_create_task(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/tasks",
        json=task_payload(seed_domain.id),
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Review notes"
    assert data["domain_id"] == seed_domain.id
    assert data["user_id"] == seed_user.id


def test_list_tasks_in_date_range(client, seed_user, seed_domain, auth_headers):
    client.post("/tasks", json=task_payload(seed_domain.id), headers=auth_headers)

    response = client.get(
        "/tasks",
        params={
            "start": "2026-08-18T00:00:00",
            "end": "2026-08-18T23:59:59",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_task(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/tasks",
        json=task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.get(f"/tasks/{created['id']}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Review notes"


def test_get_task_wrong_user_returns_404(
    client, seed_user, seed_domain, auth_headers, other_auth_headers
):
    created = client.post(
        "/tasks",
        json=task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.get(f"/tasks/{created['id']}", headers=other_auth_headers)

    assert response.status_code == 404


def test_update_task(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/tasks",
        json=task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.patch(
        f"/tasks/{created['id']}",
        json={"name": "Updated task"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated task"


def test_delete_task(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/tasks",
        json=task_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    delete_response = client.delete(f"/tasks/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/tasks/{created['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_task_linked_to_event(client, seed_user, seed_domain, auth_headers):
    event = client.post(
        "/events",
        json={
            "title": "Workshop",
            "start_at": "2026-08-18T09:00:00",
            "end_at": "2026-08-18T11:00:00",
            "is_recurring": False,
            "rrule": None,
            "domain_id": seed_domain.id,
            "objective_id": None,
        },
        headers=auth_headers,
    ).json()

    response = client.post(
        "/tasks",
        json=task_payload(seed_domain.id, event_id=event["id"]),
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["event_id"] == event["id"]


def test_create_task_rejects_empty_name(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/tasks",
        json=task_payload(seed_domain.id, name="  "),
        headers=auth_headers,
    )

    assert response.status_code == 422
