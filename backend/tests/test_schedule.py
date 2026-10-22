def test_parse_schedule_heuristic(client, auth_headers):
    text = "Chemistry Lab Mon,Wed 09:00-10:30\nRandom note"
    response = client.post(
        "/schedule/parse",
        json={
            "text": text,
            "default_year": 2026,
            "timezone": "America/New_York",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    candidates = response.json()["candidates"]
    assert len(candidates) == 1
    assert candidates[0]["title"] == "Chemistry Lab"
    assert "MO" in candidates[0]["weekdays"]


def test_import_schedule_creates_recurring_event(client, seed_domain, auth_headers):
    parse_response = client.post(
        "/schedule/parse",
        json={
            "text": "Team Sync Tue 13:00-14:00",
            "default_year": 2026,
            "timezone": "America/New_York",
        },
        headers=auth_headers,
    )
    candidate = parse_response.json()["candidates"][0]
    candidate["domain_id"] = seed_domain.id
    candidate["included"] = True

    import_body = {
        "candidates": [
            {
                "client_key": candidate["client_key"],
                "title": candidate["title"],
                "start_at": candidate["start_at"],
                "end_at": candidate["end_at"],
                "weekdays": candidate["weekdays"],
                "recurrence_until": candidate["recurrence_until"],
                "timezone": candidate["timezone"],
                "domain_id": seed_domain.id,
                "included": True,
            }
        ]
    }
    import_response = client.post(
        "/schedule/import",
        json=import_body,
        headers=auth_headers,
    )
    assert import_response.status_code == 200, import_response.text
    assert import_response.json()["imported"] == 1

    list_response = client.get(
        "/events",
        params={"start": "2026-08-01T00:00:00", "end": "2026-09-01T00:00:00"},
        headers=auth_headers,
    )
    assert len(list_response.json()) >= 1
