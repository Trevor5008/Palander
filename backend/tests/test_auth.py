def test_login_success(client, seed_user):
    response = client.post(
        "/auth/login",
        json={"username": "dev", "password": "dev"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, seed_user):
    response = client.post(
        "/auth/login",
        json={"username": "dev", "password": "wrong"},
    )

    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post(
        "/auth/login",
        json={"username": "nobody", "password": "dev"},
    )

    assert response.status_code == 401


def test_me_returns_current_user(client, seed_user, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == seed_user.id
    assert data["username"] == "dev"
    assert data["email"] == "dev@local"


def test_me_requires_auth(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_me_rejects_invalid_token(client):
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
