from datetime import date


NOTE_DATE = date(2026, 10, 24)


def test_get_daily_note_empty_before_first_put(client, auth_headers):
    response = client.get(f"/daily-notes/{NOTE_DATE.isoformat()}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["note_date"] == NOTE_DATE.isoformat()
    assert data["content"] == ""
    assert data["updated_at"] is None


def test_upsert_create_and_update(client, auth_headers):
    create = client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "Morning plan"},
        headers=auth_headers,
    )
    assert create.status_code == 200
    created = create.json()
    assert created["content"] == "Morning plan"
    assert created["updated_at"] is not None

    update = client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={
            "content": "Updated plan",
            "if_updated_at": created["updated_at"],
        },
        headers=auth_headers,
    )
    assert update.status_code == 200
    assert update.json()["content"] == "Updated plan"

    fetched = client.get(f"/daily-notes/{NOTE_DATE.isoformat()}", headers=auth_headers)
    assert fetched.json()["content"] == "Updated plan"


def test_upsert_conflict_without_if_updated_at(client, auth_headers):
    client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "First"},
        headers=auth_headers,
    )
    conflict = client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "Second"},
        headers=auth_headers,
    )
    assert conflict.status_code == 409


def test_upsert_conflict_stale_if_updated_at(client, auth_headers):
    first = client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "v1"},
        headers=auth_headers,
    )
    updated_at = first.json()["updated_at"]

    client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "v2", "if_updated_at": updated_at},
        headers=auth_headers,
    )

    stale = client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "v3", "if_updated_at": updated_at},
        headers=auth_headers,
    )
    assert stale.status_code == 409


def test_daily_note_user_isolation(client, auth_headers, other_auth_headers):
    client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "User A secret"},
        headers=auth_headers,
    )

    other_get = client.get(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        headers=other_auth_headers,
    )
    assert other_get.status_code == 200
    assert other_get.json()["content"] == ""

    other_put = client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "User B note"},
        headers=other_auth_headers,
    )
    assert other_put.status_code == 200

    owner_get = client.get(f"/daily-notes/{NOTE_DATE.isoformat()}", headers=auth_headers)
    assert owner_get.json()["content"] == "User A secret"


def test_two_users_same_date(client, auth_headers, other_auth_headers):
    client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "A"},
        headers=auth_headers,
    )
    client.put(
        f"/daily-notes/{NOTE_DATE.isoformat()}",
        json={"content": "B"},
        headers=other_auth_headers,
    )
    assert (
        client.get(f"/daily-notes/{NOTE_DATE.isoformat()}", headers=auth_headers).json()[
            "content"
        ]
        == "A"
    )
    assert (
        client.get(f"/daily-notes/{NOTE_DATE.isoformat()}", headers=other_auth_headers).json()[
            "content"
        ]
        == "B"
    )
