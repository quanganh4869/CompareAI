from typing import Annotated

from configuration.logger.config import log
from configuration.settings import configuration
from core.common.api_response import ApiResponse
from core.decorators.api_version import version as api_version
from core.decorators.log_time import measure_time
from core.exception_handler.custom_exception import ExceptionValueError
from core.messages import CustomMessageCode
from db.db_connection import Database
from fastapi import APIRouter, Depends, Request, Response, status
from schemas.requests.google_auth_schema import GoogleLoginRequest, RefreshTokenRequest
from services.google_auth_service import GoogleAuthService
from services.key_manager_service import KeyManager
from services.user_auth_service import UserAuthService
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import RedirectResponse

router = APIRouter()
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/v1_0/auth"


def _should_use_secure_cookie() -> bool:
    if configuration.ENVIRONMENT in {"production", "staging"}:
        return True
    return configuration.COOKIE_SECURE


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=_should_use_secure_cookie(),
        samesite=configuration.COOKIE_SAMESITE,
        path=REFRESH_COOKIE_PATH,
        max_age=configuration.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        samesite=configuration.COOKIE_SAMESITE,
        secure=_should_use_secure_cookie(),
    )


@router.get("/jwks")
@api_version(1, 0)
@measure_time
def jwks():
    """Expose public keys (JWKS) for internal JWT verification."""
    try:
        key_manager = KeyManager()
        return ApiResponse.success(data=key_manager.get_all_active_public_jwks())
    except Exception as e:
        log.error(f"Failed to fetch JWKS: {e}")
        return ApiResponse.error(
            message=CustomMessageCode.UNKNOWN_ERROR.title,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/login/google")
@api_version(1, 0)
@measure_time
async def init_google_login():
    """Redirect user to Google OAuth2 consent screen."""
    try:
        google_auth_service = GoogleAuthService()
        return RedirectResponse(url=google_auth_service.get_authorization_url())
    except Exception as e:
        log.error(f"Failed to initialize Google login: {e}")
        return RedirectResponse(
            url=f"{configuration.FRONTEND_URL}/login?error=auth_init_failed"
        )


@router.get("/login/google/callback")
@api_version(1, 0)
@measure_time
async def google_login_callback(
    code: str,
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """Handle Google OAuth2 callback and redirect back to frontend."""
    try:
        auth_service = UserAuthService(db_session)
        login_result = await auth_service.handle_google_login_callback(code=code)

        redirect_url = (
            f"{configuration.FRONTEND_URL}/google-callback#"
            f"access_token={login_result.access_token}"
            f"&token_type=bearer"
            f"&expires_in={login_result.expires_in}"
        )
        response = RedirectResponse(url=redirect_url)
        _set_refresh_cookie(response, login_result.refresh_token)
        return response

    except ExceptionValueError as e:
        log.error(f"Google callback business error: {e.message}")
        return RedirectResponse(
            url=f"{configuration.FRONTEND_URL}/login?error_code={e.message_code}"
        )
    except ValueError as e:
        log.error(f"Google callback invalid token: {e}")
        return RedirectResponse(
            url=f"{configuration.FRONTEND_URL}/login?error=invalid_token"
        )
    except Exception as e:
        log.error(f"Google callback system error: {e}")
        return RedirectResponse(
            url=f"{configuration.FRONTEND_URL}/login?error=auth_failed"
        )


@router.post("/google/login")
@api_version(1, 0)
@measure_time
async def login_google(
    request_data: GoogleLoginRequest,
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """Handle Google OAuth2 login and return internal JWT tokens."""
    try:
        auth_service = UserAuthService(db_session=db_session)

        result = await auth_service.handle_google_login_post(
            token=request_data.id_token,
        )

        response = ApiResponse.success(
            data=result.model_dump(),
        )
        _set_refresh_cookie(response, result.refresh_token)
        return response

    except ValueError as e:
        log.error(f"Invalid Google token in login_google: {e}")
        return ApiResponse.error(
            message=CustomMessageCode.GOOGLE_AUTH_FAILED.title,
            message_code=CustomMessageCode.GOOGLE_AUTH_FAILED.code,
            message_errors=[str(e)],
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    except Exception as e:
        log.error(f"Failed to process Google login POST: {e}")
        return ApiResponse.error(
            message=CustomMessageCode.UNKNOWN_ERROR.title,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/refresh")
@api_version(1, 0)
@measure_time
async def refresh_token(
    request: Request,
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
    request_data: RefreshTokenRequest | None = None,
):
    """Refresh access token from refresh token."""
    try:
        refresh_token_value = request.cookies.get(REFRESH_COOKIE_NAME) or (
            request_data.refresh_token if request_data else ""
        )
        auth_service = UserAuthService(db_session=db_session)
        async with db_session.begin():
            result = await auth_service.refresh_access_token(
                refresh_token=refresh_token_value
            )
        response = ApiResponse.success(data=result.model_dump())
        _set_refresh_cookie(response, result.refresh_token)
        return response
    except ValueError as e:
        return ApiResponse.error(
            message=str(e) or "Invalid refresh token.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    except Exception as e:
        log.error(f"Failed to refresh token: {e}")
        return ApiResponse.error(
            message=CustomMessageCode.UNKNOWN_ERROR.title,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/logout")
@api_version(1, 0)
@measure_time
async def logout(
    request: Request,
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """Revoke current refresh/access token and clear refresh cookie."""
    try:
        auth_header = request.headers.get("Authorization", "")
        _, _, access_token = auth_header.partition("Bearer ")
        refresh_token_value = request.cookies.get(REFRESH_COOKIE_NAME, "")

        auth_service = UserAuthService(db_session=db_session)
        async with db_session.begin():
            revoked_refresh = await auth_service.revoke_by_refresh_token(
                refresh_token_value
            )
            revoked_access = await auth_service.revoke_by_access_token(access_token)

        response = ApiResponse.success(
            data={"revoked": bool(revoked_refresh or revoked_access)}
        )
        _clear_refresh_cookie(response)
        return response
    except Exception as e:
        log.error(f"Failed to logout: {e}")
        response = ApiResponse.error(
            message=CustomMessageCode.UNKNOWN_ERROR.title,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
        _clear_refresh_cookie(response)
        return response
