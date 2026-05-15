from http import HTTPStatus
from typing import Any

import msgspec
from authlib.jose.errors import ExpiredTokenError
from configuration.logger.config import log
from configuration.settings import configuration
from core.common.global_variables import set_current_user
from core.dependencies.oauth import get_current_user_claims
from core.messages import CustomMessageCode
from db.db_connection import Database
from db.models import OAuthToken, User
from fastapi import Response
from sqlalchemy import select
from starlette.authentication import (
    AuthCredentials,
    AuthenticationBackend,
    AuthenticationError,
)
from starlette.requests import HTTPConnection


class _AuthenticationError(AuthenticationError):
    """Override internal authentication error classes"""

    def __init__(
        self,
        *,
        code: int = HTTPStatus.UNAUTHORIZED.value,
        msg: str = CustomMessageCode.UNAUTHORIZED_ERROR.title,
        msg_code: int = CustomMessageCode.UNAUTHORIZED_ERROR.code,
        headers: dict[str, Any] | None = None,
        media_type: str = "application/json",
    ):
        self.code = code
        self.msg = msg
        self.msg_code = msg_code
        self.headers = headers
        self.media_type = media_type


class JWTAuthMiddleware(AuthenticationBackend):
    """JWT Authentication Middleware"""

    @staticmethod
    def auth_exception_handler(
        conn: HTTPConnection, exc: _AuthenticationError
    ) -> Response:
        """Override internal authentication error handling"""
        payload = {
            "code": exc.code,
            "msg": exc.msg,
            "msg_code": exc.msg_code,
            "data": None,
        }
        return Response(
            content=msgspec.json.encode(payload),
            status_code=exc.code,
            headers=exc.headers or None,
            media_type=exc.media_type,
        )

    async def authenticate(self, request: HTTPConnection):
        """
        Authenticate the user based on JWT token in the request header.
        If authentication fails, raise an AuthenticationError.
        """
        try:
            method = str(request.scope.get("method", "")).upper()
            if method == "OPTIONS":
                return

            if request.url.path in configuration.TOKEN_EXCLUDE_URLS:
                return

            auth = request.headers.get("Authorization") or request.cookies.get(
                "Authorization"
            )

            if not auth:
                log.error("❌ JWTAuthMiddleware missing Authorization header")
                raise _AuthenticationError()

            _, _, token = auth.partition("Bearer ")
            if not token:
                log.error("❌ JWTAuthMiddleware missing or malformed JWT token")
                raise _AuthenticationError()

            payload = get_current_user_claims(token=token)
            if not payload:
                log.error("❌ JWTAuthMiddleware invalid JWT token")
                raise _AuthenticationError()

            user = await self.validate_token(token=token)
            set_current_user(user)

            # Note that this return uses a non-standard mode, so when authentication passes,
            # some standard features will be lost
            # Please see the standard return mode: https://www.starlette.io/authentication/
            return AuthCredentials(["authenticated"]), user

        except ExpiredTokenError as e:
            log.error(f"❌ JWTAuthMiddleware expired JWT token: {e}")
            raise _AuthenticationError(
                msg_code=CustomMessageCode.TOKEN_EXPIRED.code,
                msg=CustomMessageCode.TOKEN_EXPIRED.title,
            )
        except _AuthenticationError as e:
            raise e
        except Exception as e:
            log.error(f"❌ Exception during JWT authentication: {e}")
            raise _AuthenticationError()

    @staticmethod
    async def validate_token(token: str) -> User | None:
        try:
            async with Database().get_instance_db() as db_session:
                token_result = await db_session.execute(
                    select(OAuthToken).where(OAuthToken.access_token == token)
                )
                oauth_token = token_result.scalar_one_or_none()

                if not oauth_token:
                    log.error("❌ Token not found")
                    return None

                user_result = await db_session.execute(
                    select(User).where(
                        User.id == oauth_token.user_id,
                    )
                )
                user = user_result.scalar_one_or_none()

                if not user:
                    log.error("❌ User not found or inactive")
                    return None

                return user

        except Exception as e:
            log.error(f"❌ Error validating token: {e}")
            return None
