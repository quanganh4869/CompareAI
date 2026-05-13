from datetime import datetime, timedelta, timezone

from authlib.jose import JoseError, jwt
from authlib.jose.errors import ExpiredTokenError, InvalidTokenError
from configuration.logger.config import log
from cryptography.hazmat.primitives import serialization
from werkzeug.security import gen_salt


def encode_jwt_token(
    key_id: str,
    jwt_secret_key: str,
    jwt_algorithm: str,
    access_token_expire_minutes: int,
    user,
    scope: str,
) -> dict:
    now = datetime.now(timezone.utc)
    token_expires_minute = timedelta(minutes=access_token_expire_minutes)

    header = {"kid": key_id, "alg": jwt_algorithm}

    payload = {
        "iss": "Chat App",
        "sub": str(user.id),
        "scope": scope,
        "iat": int(now.timestamp()),
        "exp": int((now + token_expires_minute).timestamp()),
    }

    private_key_obj = serialization.load_pem_private_key(jwt_secret_key, password=None)
    access_token_str = jwt.encode(header, payload, private_key_obj).decode("utf-8")

    token_data = {
        "access_token": access_token_str,
        "refresh_token": gen_salt(48),
        "token_type": "Bearer",
        "scope": scope,
        "expires_in": int(token_expires_minute.total_seconds()),
    }
    return token_data


def decode_jwt_token(
    jwt_public_key: str, jwt_algorithm: str, token: str | bytes
) -> dict | None:
    try:
        claims_options = {
            "header": {
                "alg": {"essential": True, "values": [jwt_algorithm]},
            }
        }

        claims = jwt.decode(token, jwt_public_key, claims_options=claims_options)

        claims.validate()
        return claims

    except (ExpiredTokenError, InvalidTokenError) as e:
        log.error(f"❌ JWT token has expired: {e}")
        raise e

    except JoseError as e:
        log.error(f"❌ Error while decoding JWT: {e}")
        return None
