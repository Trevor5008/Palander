from pathlib import Path


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
    assert response.json()["format_issues"] == []


def test_parse_space_delimited_single_letter_days(client, auth_headers):
    response = client.post(
        "/schedule/parse",
        json={
            "text": "Chemistry Lab M W 0900 1145",
            "default_year": 2026,
            "timezone": "America/New_York",
            "format_hint": "plain",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["candidates"]) == 1
    assert body["candidates"][0]["title"] == "Chemistry Lab"
    assert set(body["candidates"][0]["weekdays"]) == {"MO", "WE"}


def test_parse_reports_weekday_format_issue(client, auth_headers):
    response = client.post(
        "/schedule/parse",
        json={
            "text": "Chemistry Lab X Y 0900 1145",
            "default_year": 2026,
            "timezone": "America/New_York",
            "format_hint": "plain",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["candidates"]) == 0
    assert len(body["format_issues"]) >= 1
    assert body["format_issues"][0]["code"] == "WEEKDAY_UNRECOGNIZED"


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


def test_parse_schedule_respects_term_end(client, auth_headers):
    response = client.post(
        "/schedule/parse",
        json={
            "text": "Office Hours Fri 10:00-11:00",
            "default_year": 2026,
            "timezone": "America/New_York",
            "term_start": "2026-09-01",
            "term_end": "2026-11-30",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    candidate = response.json()["candidates"][0]
    assert candidate["recurrence_until"].startswith("2026-11-30")


def test_parse_schedule_csv_format(client, auth_headers):
    fixture = (
        Path(__file__).parent / "fixtures" / "schedules" / "csv_lines.txt"
    ).read_text()
    response = client.post(
        "/schedule/parse",
        json={
            "text": fixture,
            "default_year": 2026,
            "timezone": "America/New_York",
            "format_hint": "csv",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    titles = {row["title"] for row in response.json()["candidates"]}
    assert "Chemistry Lab" in titles
    assert "Team Sync" in titles


def test_parse_term_end_before_start_rejected(client, auth_headers):
    response = client.post(
        "/schedule/parse",
        json={
            "text": "Class Mon 09:00-10:00",
            "default_year": 2026,
            "timezone": "America/New_York",
            "term_start": "2026-12-01",
            "term_end": "2026-08-01",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_import_rebuilds_rrule_from_edited_weekdays(client, seed_domain, auth_headers):
    parse_response = client.post(
        "/schedule/parse",
        json={
            "text": "Study Block Mon 08:00-09:00",
            "default_year": 2026,
            "timezone": "America/New_York",
            "term_end": "2026-10-15",
        },
        headers=auth_headers,
    )
    candidate = parse_response.json()["candidates"][0]
    import_body = {
        "candidates": [
            {
                "client_key": candidate["client_key"],
                "title": candidate["title"],
                "start_at": candidate["start_at"],
                "end_at": candidate["end_at"],
                "weekdays": ["MO", "WE", "FR"],
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
    assert import_response.status_code == 200
    assert import_response.json()["imported"] == 1
