import os
import sys
from types import SimpleNamespace

import pytest

os.environ.setdefault("POSTGRES_PORT", "5432")
os.environ.setdefault("READ_ONLY_POSTGRES_PORT", "5432")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../app")))

from api import oauth_api
from schemas.requests.google_auth_schema import RefreshTokenRequest
from schemas.responses.user_schema import aes_gcm
from services.user_auth_service import UserAuthService


class DummyModel(SimpleNamespace):
    def model_dump(self):
        return dict(self.__dict__)


class DummyAsyncTx:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class DummyDbSession:
    def begin(self):
        return DummyAsyncTx()


class DummyExecuteResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class DummyDbSessionWithQuery:
    def __init__(self, token_row):
        self.token_row = token_row

    def begin(self):
        return DummyAsyncTx()

    async def execute(self, query):
        return DummyExecuteResult(self.token_row)

    def add(self, item):
        return None

    async def flush(self):
        return None

    async def delete(self, item):
        return None


class DummyRequest:
    def __init__(self, cookies=None, headers=None):
        self.cookies = cookies or {}
        self.headers = headers or {}


@pytest.mark.anyio
async def test_google_callback_sets_refresh_cookie_and_redacts_hash(monkeypatch):
    result = DummyModel(
        access_token="access-123",
        refresh_token="refresh-456",
        expires_in=900,
    )

    class FakeService:
        def __init__(self, db_session):
            self.db_session = db_session

        async def handle_google_login_callback(self, code):
            return result

    monkeypatch.setattr(oauth_api, "UserAuthService", FakeService)
    monkeypatch.setattr(oauth_api.configuration, "ENVIRONMENT", "production")

    response = await oauth_api.google_login_callback("google-code", DummyDbSession())

    location = response.headers["location"]
    assert "access_token=access-123" in location
    assert "refresh_token=" not in location

    set_cookie = response.headers["set-cookie"]
    assert "refresh_token=refresh-456" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/v1_0/auth" in set_cookie


@pytest.mark.anyio
async def test_refresh_prefers_cookie_and_rotates(monkeypatch):
    result = DummyModel(
        access_token="new-access",
        refresh_token="new-refresh",
        expires_in=900,
        user={"id": 10},
    )
    captured = {}

    class FakeService:
        def __init__(self, db_session):
            self.db_session = db_session

        async def refresh_access_token(self, refresh_token):
            captured["refresh_token"] = refresh_token
            return result

    monkeypatch.setattr(oauth_api, "UserAuthService", FakeService)
    monkeypatch.setattr(oauth_api.configuration, "ENVIRONMENT", "production")

    request = DummyRequest(cookies={oauth_api.REFRESH_COOKIE_NAME: "cookie-refresh"})
    response = await oauth_api.refresh_token(request, DummyDbSession())

    assert captured["refresh_token"] == "cookie-refresh"
    assert response.body
    assert b"new-access" in response.body
    assert "refresh_token=new-refresh" in response.headers["set-cookie"]


@pytest.mark.anyio
async def test_refresh_falls_back_to_body_token(monkeypatch):
    result = DummyModel(
        access_token="new-access",
        refresh_token="new-refresh",
        expires_in=900,
        user={"id": 10},
    )
    captured = {}

    class FakeService:
        def __init__(self, db_session):
            self.db_session = db_session

        async def refresh_access_token(self, refresh_token):
            captured["refresh_token"] = refresh_token
            return result

    monkeypatch.setattr(oauth_api, "UserAuthService", FakeService)

    request = DummyRequest()
    response = await oauth_api.refresh_token(
        request,
        DummyDbSession(),
        RefreshTokenRequest(refresh_token="body-refresh"),
    )

    assert captured["refresh_token"] == "body-refresh"
    assert response.status_code == 200


@pytest.mark.anyio
async def test_logout_revokes_tokens_and_clears_cookie(monkeypatch):
    calls = {"refresh": None, "access": None}

    class FakeService:
        def __init__(self, db_session):
            self.db_session = db_session

        async def revoke_by_refresh_token(self, refresh_token):
            calls["refresh"] = refresh_token
            return True

        async def revoke_by_access_token(self, access_token):
            calls["access"] = access_token
            return True

    monkeypatch.setattr(oauth_api, "UserAuthService", FakeService)

    request = DummyRequest(
        cookies={oauth_api.REFRESH_COOKIE_NAME: "refresh-789"},
        headers={"Authorization": "Bearer access-789"},
    )
    response = await oauth_api.logout(request, DummyDbSession())

    assert calls["refresh"] == "refresh-789"
    assert calls["access"] == "access-789"
    assert response.status_code == 200
    assert 'refresh_token=""' in response.headers["set-cookie"]
    assert "Max-Age=0" in response.headers["set-cookie"]


@pytest.mark.anyio
async def test_refresh_access_token_rotates_refresh_token_in_db(monkeypatch):
    encrypted_email = aes_gcm.encrypt_data("tester@example.com")
    token_row = SimpleNamespace(
        access_token="old-access",
        refresh_token="old-refresh",
        user=SimpleNamespace(
            id=10,
            email_encrypted=encrypted_email,
            name_encrypted=None,
            avatar_url=None,
            role="user",
            plan_id=None,
        ),
    )
    db_session = DummyDbSessionWithQuery(token_row)
    service = UserAuthService(db_session)

    monkeypatch.setattr(
        "services.user_auth_service.encode_jwt_token",
        lambda **kwargs: {
            "access_token": "new-access",
            "refresh_token": "new-refresh",
            "expires_in": 900,
        },
    )
    monkeypatch.setattr("services.user_auth_service.configuration", oauth_api.configuration)

    result = await service.refresh_access_token("old-refresh")

    assert result.access_token == "new-access"
    assert result.refresh_token == "new-refresh"
    assert token_row.refresh_token == "new-refresh"
    assert token_row.access_token == "new-access"
