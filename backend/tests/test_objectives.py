def objective_payload(domain_id: int, **overrides):
    payload = {
        "title": "Finish thesis",
        "target_date": "2026-12-01T00:00:00",
        "domain_id": domain_id,
    }
    payload.update(overrides)
    return payload


def test_create_objective(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Finish thesis"
    assert data["domain_id"] == seed_domain.id
    assert data["user_id"] == seed_user.id


def test_create_objective_requires_owned_domain(
    client, seed_user, seed_domain, other_auth_headers
):
    response = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=other_auth_headers,
    )

    assert response.status_code == 404


def test_list_objectives(client, seed_user, seed_domain, auth_headers):
    client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    )

    response = client.get("/objectives", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_objectives_filters_by_domain(client, seed_user, seed_domain, auth_headers):
    other_domain = client.post(
        "/domains",
        json={"name": "school"},
        headers=auth_headers,
    ).json()
    client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    )
    client.post(
        "/objectives",
        json=objective_payload(other_domain["id"], title="Pass exam"),
        headers=auth_headers,
    )

    response = client.get(
        "/objectives",
        params={"domain_id": seed_domain.id},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["domain_id"] == seed_domain.id


def test_get_objective(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.get(f"/objectives/{created['id']}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_objective_wrong_user_returns_404(
    client, seed_user, seed_domain, auth_headers, other_auth_headers
):
    created = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.get(f"/objectives/{created['id']}", headers=other_auth_headers)

    assert response.status_code == 404


def test_update_objective(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    response = client.patch(
        f"/objectives/{created['id']}",
        json={"title": "Finish dissertation"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Finish dissertation"


def test_delete_objective(client, seed_user, seed_domain, auth_headers):
    created = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id),
        headers=auth_headers,
    ).json()

    delete_response = client.delete(f"/objectives/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/objectives/{created['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_create_objective_rejects_empty_title(client, seed_user, seed_domain, auth_headers):
    response = client.post(
        "/objectives",
        json=objective_payload(seed_domain.id, title="   "),
        headers=auth_headers,
    )

    assert response.status_code == 422
