import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — register all models on Base.metadata
from app.auth import create_access_token, hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Domain, User

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seed_user(db_session):
    user = User(
        username="dev",
        email="dev@local",
        password_hash=hash_password("dev"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(seed_user):
    token = create_access_token(seed_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def seed_domain(db_session, seed_user):
    domain = Domain(name="career", user_id=seed_user.id)
    db_session.add(domain)
    db_session.commit()
    db_session.refresh(domain)
    return domain


@pytest.fixture()
def other_user(db_session):
    user = User(
        username="other",
        email="other@local",
        password_hash=hash_password("other"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def other_auth_headers(other_user):
    token = create_access_token(other_user.id)
    return {"Authorization": f"Bearer {token}"}
