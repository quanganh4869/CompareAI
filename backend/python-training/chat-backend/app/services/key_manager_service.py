import base64
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from configuration.logger.config import log
from configuration.settings import configuration
from core.common.jwt_token import decode_jwt_token
from core.exception_handler.custom_exception import ExceptionValueError
from core.messages import CustomMessageCode
from cryptography.hazmat.primitives import serialization


def _normalize_pem(value: str) -> str:
    normalized = (value or "").replace("\\n", "\n").strip()
    if normalized.startswith('"') and normalized.endswith('"'):
        normalized = normalized[1:-1]
    if normalized.startswith("'") and normalized.endswith("'"):
        normalized = normalized[1:-1]
    return normalized.strip()


class KeyManager:
    def __init__(self):
        self.manifest = configuration.RSA_KEY_MANIFEST
        self.private_keys = {}
        self.public_keys = {}
        self._load_all_keys()

    def _load_manifest(self, path):
        with open(path) as f:
            return json.load(f)

    def _load_all_keys(self):
        env_private = _normalize_pem(configuration.JWT_PRIVATE_KEY_PEM)
        env_public = _normalize_pem(configuration.JWT_PUBLIC_KEY_PEM)
        env_kid = configuration.JWT_CURRENT_KID or "key_env"
        if env_private:
            try:
                private_key = serialization.load_pem_private_key(
                    env_private.encode("utf-8"),
                    password=None,
                )
                self.private_keys[env_kid] = private_key
                if env_public:
                    public_key = serialization.load_pem_public_key(
                        env_public.encode("utf-8")
                    )
                else:
                    public_key = private_key.public_key()
                self.public_keys[env_kid] = public_key
                return
            except Exception as exc:
                log.warning("Invalid JWT PEM from env, fallback to manifest keys: %s", exc)

        elif env_public:
            try:
                self.public_keys[env_kid] = serialization.load_pem_public_key(
                    env_public.encode("utf-8")
                )
                return
            except Exception as exc:
                log.warning(
                    "Invalid JWT public key from env, fallback to manifest keys: %s",
                    exc,
                )

        for kid, key_info in self.manifest["keys"].items():
            if key_info["status"] == "active":
                private_path = Path(key_info["private_path"])
                public_path = Path(key_info["public_path"])

                if kid not in self.private_keys and private_path.exists():
                    try:
                        with open(private_path, "rb") as f:
                            self.private_keys[kid] = serialization.load_pem_private_key(
                                f.read(), password=None
                            )
                    except Exception as exc:
                        log.warning(
                            "Failed to load manifest private key kid=%s path=%s error=%s",
                            kid,
                            private_path,
                            exc,
                        )

                if kid not in self.public_keys and public_path.exists():
                    try:
                        with open(public_path, "rb") as f:
                            self.public_keys[kid] = serialization.load_pem_public_key(
                                f.read()
                            )
                    except Exception as exc:
                        log.warning(
                            "Failed to load manifest public key kid=%s path=%s error=%s",
                            kid,
                            public_path,
                            exc,
                        )

    def get_payload_access_token(self, access_token: str):
        last_error = None
        for key in self.public_keys.values():
            try:
                payload = decode_jwt_token(
                    token=access_token,
                    jwt_public_key=key,
                    jwt_algorithm=configuration.JWT_ALGORITHM,
                )
                if not payload:
                    continue

                return payload
            except Exception as e:
                last_error = e
                continue

        log.error(f"Failed to verify access token: {last_error}")
        raise ExceptionValueError(
            message=CustomMessageCode.TOKEN_SIGNATURE_VERIFICATION_FAILED.title,
            message_code=CustomMessageCode.TOKEN_SIGNATURE_VERIFICATION_FAILED.code,
        )

    def get_current_signing_key(self):
        current_kid = configuration.JWT_CURRENT_KID or self.manifest["current_kid"]
        if current_kid not in self.private_keys:
            # If env private key exists but key map is empty, try loading it directly once.
            env_private = _normalize_pem(configuration.JWT_PRIVATE_KEY_PEM)
            if env_private:
                try:
                    self.private_keys[current_kid] = serialization.load_pem_private_key(
                        env_private.encode("utf-8"),
                        password=None,
                    )
                except Exception as exc:
                    log.warning("Failed to load env private key for signing: %s", exc)

        if current_kid not in self.private_keys:
            log.error(f"Current KID {current_kid} not found in private keys.")
            raise ExceptionValueError(
                message=CustomMessageCode.TOKEN_SIGNATURE_VERIFICATION_FAILED.title,
                message_code=CustomMessageCode.TOKEN_SIGNATURE_VERIFICATION_FAILED.code,
            )
        return self.private_keys[current_kid], current_kid

    def get_all_active_public_jwks(self):
        jwks = []
        for kid, public_key in self.public_keys.items():
            public_numbers = public_key.public_numbers()
            jwks.append(
                {
                    "kty": "RSA",
                    "use": "sig",
                    "kid": kid,
                    "alg": "RS256",
                    "n": self._int_to_base64url(public_numbers.n),
                    "e": self._int_to_base64url(public_numbers.e),
                }
            )
        return {"keys": jwks}

    def _int_to_base64url(self, n):
        num_bytes = n.to_bytes((n.bit_length() + 7) // 8, "big")
        return base64.urlsafe_b64encode(num_bytes).rstrip(b"=").decode("ascii")

    def create_access_token(self, payload_data: dict, expires_delta: timedelta) -> str:
        """Sign and generate an internal access token."""
        private_key, kid = self.get_current_signing_key()
        expire = datetime.now(timezone.utc) + expires_delta

        to_encode = payload_data.copy()
        to_encode.update({"exp": expire})

        # Create a JWT token signed by the current RSA private key.
        encoded_jwt = jwt.encode(
            to_encode,
            private_key,
            algorithm=configuration.JWT_ALGORITHM,
            headers={"kid": kid},
        )
        return encoded_jwt
