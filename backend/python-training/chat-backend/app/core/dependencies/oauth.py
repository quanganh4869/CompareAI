from authlib.jose.errors import ExpiredTokenError
from configuration.logger.config import log
from core.constants import TOKEN_PREFIX
from core.messages import CustomMessageCode
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from services.key_manager_service import KeyManager

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def _unauthorized(
    detail: str = CustomMessageCode.UNAUTHORIZED_ERROR.title,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": TOKEN_PREFIX},
    )


def get_current_user_claims(token: str) -> dict:
    try:
        payload = KeyManager().get_payload_access_token(access_token=token)

        return payload

    except ExpiredTokenError as e:
        log.error(f"❌ Token expired: {e}")
        raise e

    except Exception as e:
        log.error(f"❌ Exception get_current_user_claims token failed: {e}")
        return None


def depends_get_current_user_claims():
    """Dependency for getting current user claims"""

    def parse_token(token: str = Depends(oauth2_scheme)):
        try:
            payload = KeyManager().get_payload_access_token(access_token=token)
            if not payload:
                raise _unauthorized()

            return payload

        except HTTPException as e:
            log.error(
                f"❌ HTTPException get_current_user_claims token failed: {e.detail}"
            )
            raise _unauthorized()
        except Exception as e:
            log.error(f"❌ Exception get_current_user_claims token failed: {e}")
            raise _unauthorized()

    return parse_token
