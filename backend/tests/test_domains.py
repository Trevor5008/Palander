def domain_payload(**overrides):
    payload = {"name": "fitness"}
    payload.update(overrides)
    return payload


def test_list_domains_returns_user_domains(client, seed_user, seed_domain, auth_headers):
    response = client.get("/domains", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "career"
    assert data[0]["user_id"] == seed_user.id


def test_list_domains_empty_for_other_user(client, seed_user, seed_domain, other_auth_headers):
    response = client.get("/domains", headers=other_auth_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_list_domains_requires_auth(client):
    response = client.get("/domains")

    assert response.status_code == 401


def test_create_domain(client, seed_user, auth_headers):
    response = client.post("/domains", json=domain_payload(name="school"), headers=auth_headers)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "school"
    assert data["user_id"] == seed_user.id


def test_get_domain(client, seed_user, seed_domain, auth_headers):
    response = client.get(f"/domains/{seed_domain.id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["name"] == "career"


def test_get_domain_wrong_user_returns_404(
    client, seed_user, seed_domain, auth_headers, other_auth_headers
):
    response = client.get(f"/domains/{seed_domain.id}", headers=other_auth_headers)

    assert response.status_code == 404


def test_update_domain(client, seed_user, seed_domain, auth_headers):
    response = client.patch(
        f"/domains/{seed_domain.id}",
        json={"name": "Career"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Career"


def test_delete_domain(client, seed_user, auth_headers):
    created = client.post(
        "/domains",
        json=domain_payload(name="temporary"),
        headers=auth_headers,
    ).json()

    delete_response = client.delete(f"/domains/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/domains/{created['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_create_domain_rejects_empty_name(client, seed_user, auth_headers):
    response = client.post(
        "/domains",
        json=domain_payload(name="  "),
        headers=auth_headers,
    )

    assert response.status_code == 422
