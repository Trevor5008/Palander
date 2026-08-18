def event_payload(domain_id: int, **overrides):
    payload = {
        "title": "Team standup",
        "start_at": "2026-08-18T09:00:00",
        "end_at": "2026-08-18T10:00:00",
        "is_recurring": False,
        "rrule": None,
        "domain_id": domain_id,
        "objective_id": None,
    }
    payload.update(overrides)
    return payload


def test_create_event(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/events",
        json=event_payload(seed_domain.id),
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Team standup"
    assert data["domain_id"] == seed_domain.id
    assert data["user_id"] == seed_user.id
    assert "id" in data


def test_list_events_in_date_range(client, seed_user, seed_domain, auth_headers):
    client.post("/events", json=event_payload(seed_domain.id), headers=auth_headers)

    response = client.get(
        "/events",
        params={
            "start": "2026-08-18T00:00:00",
            "end": "2026-08-18T23:59:59",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_events_excludes_outside_range(client, seed_user, seed_domain, auth_headers):
    client.post("/events", json=event_payload(seed_domain.id), headers=auth_headers)

    response = client.get(
        "/events",
        params={
            "start": "2026-09-01T00:00:00",
            "end": "2026-09-30T23:59:59",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_event(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/events",
        json=event_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.get(f"/events/{created['id']}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_event_wrong_user_returns_404(
    client, seed_user, seed_domain, auth_headers, other_auth_headers
):
    created = client.post(
        "/events",
        json=event_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.get(f"/events/{created['id']}", headers=other_auth_headers)

    assert response.status_code == 404


def test_update_event(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/events",
        json=event_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.patch(
        f"/events/{created['id']}",
        json={"title": "Updated standup"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated standup"


def test_delete_event(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/events",
        json=event_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    delete_response = client.delete(f"/events/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/events/{created['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_delete_event_not_found(client, auth_headers):
    response = client.delete("/events/9999", headers=auth_headers)

    assert response.status_code == 404


def test_create_event_rejects_end_before_start(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/events",
        json=event_payload(
            seed_domain.id,
            start_at="2026-08-18T10:00:00",
            end_at="2026-08-18T09:00:00",
        ),
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_event_rejects_empty_title(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/events",
        json=event_payload(seed_domain.id, title="   "),
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_update_event_rejects_invalid_time_range(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/events",
        json=event_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.patch(
        f"/events/{created['id']}",
        json={"end_at": "2026-08-18T08:00:00"},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_events_require_auth(client, seed_domain):
    response = client.get(
        "/events",
        params={
            "start": "2026-08-18T00:00:00",
            "end": "2026-08-18T23:59:59",
        },
    )

    assert response.status_code == 401
