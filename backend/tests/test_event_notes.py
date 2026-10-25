from datetime import UTC, datetime

OCC_A = datetime(2026, 10, 20, 12, 30, tzinfo=UTC)
OCC_B = datetime(2026, 10, 22, 12, 30, tzinfo=UTC)
OCC_C = datetime(2026, 10, 27, 12, 30, tzinfo=UTC)


def _create_recurring_event(client, domain_id, auth_headers):
    return client.post(
        "/events",
        json={
            "title": "Fundamentals of Modeling",
            "start_at": "2026-08-18T12:30:00",
            "end_at": "2026-08-18T13:45:00",
            "is_recurring": True,
            "rrule": "FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261205T235959Z",
            "timezone": "America/New_York",
            "recurrence_until": "2026-12-05T23:59:00",
            "domain_id": domain_id,
            "objective_id": None,
        },
        headers=auth_headers,
    )


def test_get_event_note_empty(client, seed_domain, auth_headers):
    created = _create_recurring_event(client, seed_domain.id, auth_headers)
    event_id = created.json()["id"]
    response = client.get(
        f"/events/{event_id}/notes",
        params={"occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["content"] == ""
    assert response.json()["updated_at"] is None


def test_upsert_event_note_create_and_update(client, seed_domain, auth_headers):
    event_id = _create_recurring_event(client, seed_domain.id, auth_headers).json()["id"]
    create = client.put(
        f"/events/{event_id}/notes",
        json={
            "content": "Lecture notes",
            "occurrence_start_at": OCC_C.isoformat(),
        },
        headers=auth_headers,
    )
    assert create.status_code == 200
    created = create.json()
    assert created["content"] == "Lecture notes"

    update = client.put(
        f"/events/{event_id}/notes",
        json={
            "content": "Updated notes",
            "occurrence_start_at": OCC_C.isoformat(),
            "if_updated_at": created["updated_at"],
        },
        headers=auth_headers,
    )
    assert update.status_code == 200
    assert update.json()["content"] == "Updated notes"


def test_upsert_conflict(client, seed_domain, auth_headers):
    event_id = _create_recurring_event(client, seed_domain.id, auth_headers).json()["id"]
    first = client.put(
        f"/events/{event_id}/notes",
        json={"content": "v1", "occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    ).json()

    conflict = client.put(
        f"/events/{event_id}/notes",
        json={"content": "v2", "occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )
    assert conflict.status_code == 409

    second = client.put(
        f"/events/{event_id}/notes",
        json={
            "content": "v2",
            "occurrence_start_at": OCC_C.isoformat(),
            "if_updated_at": first["updated_at"],
        },
        headers=auth_headers,
    )
    assert second.status_code == 200

    stale = client.put(
        f"/events/{event_id}/notes",
        json={
            "content": "v3",
            "occurrence_start_at": OCC_C.isoformat(),
            "if_updated_at": first["updated_at"],
        },
        headers=auth_headers,
    )
    assert stale.status_code == 409


def test_series_notes_ordering(client, seed_domain, auth_headers):
    event_id = _create_recurring_event(client, seed_domain.id, auth_headers).json()["id"]
    client.put(
        f"/events/{event_id}/notes",
        json={"content": "Oct 20", "occurrence_start_at": OCC_A.isoformat()},
        headers=auth_headers,
    )
    client.put(
        f"/events/{event_id}/notes",
        json={"content": "Oct 22", "occurrence_start_at": OCC_B.isoformat()},
        headers=auth_headers,
    )
    client.put(
        f"/events/{event_id}/notes",
        json={"content": "Oct 27 active", "occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )

    stack = client.get(
        f"/events/{event_id}/series-notes",
        params={"occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )
    assert stack.status_code == 200
    items = stack.json()["items"]
    assert len(items) == 2
    assert items[0]["content"] == "Oct 22"
    assert items[1]["content"] == "Oct 20"


def test_series_notes_empty_for_non_recurring(client, seed_domain, auth_headers):
    created = client.post(
        "/events",
        json={
            "title": "One-off",
            "start_at": "2026-10-27T12:30:00",
            "end_at": "2026-10-27T13:45:00",
            "is_recurring": False,
            "rrule": None,
            "domain_id": seed_domain.id,
            "objective_id": None,
        },
        headers=auth_headers,
    )
    event_id = created.json()["id"]
    response = client.get(
        f"/events/{event_id}/series-notes",
        params={"occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_event_note_user_isolation(client, seed_domain, auth_headers, other_auth_headers):
    event_id = _create_recurring_event(client, seed_domain.id, auth_headers).json()["id"]
    client.put(
        f"/events/{event_id}/notes",
        json={"content": "secret", "occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )

    other_get = client.get(
        f"/events/{event_id}/notes",
        params={"occurrence_start_at": OCC_C.isoformat()},
        headers=other_auth_headers,
    )
    assert other_get.status_code == 404


def test_delete_event_cascades_notes(client, seed_domain, auth_headers, db_session):
    from app.models.note import Note

    event_id = _create_recurring_event(client, seed_domain.id, auth_headers).json()["id"]
    client.put(
        f"/events/{event_id}/notes",
        json={"content": "gone", "occurrence_start_at": OCC_C.isoformat()},
        headers=auth_headers,
    )
    assert db_session.query(Note).filter(Note.event_id == event_id).count() == 1

    client.delete(f"/events/{event_id}", headers=auth_headers)
    assert db_session.query(Note).filter(Note.event_id == event_id).count() == 0
