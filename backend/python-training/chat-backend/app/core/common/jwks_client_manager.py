from typing import Optional

import jwt


class JWKSClientManager:
    """Singleton class to manage JWKS client"""

    _instance: Optional[jwt.PyJWKClient] = None

    @classmethod
    def get_instance(cls, configuration) -> jwt.PyJWKClient:
        if cls._instance is None:
            cls._instance = jwt.PyJWKClient(
                uri=configuration.AUTH_SERVICE_JWKS_URL,
                cache_jwk_set=True,
                lifespan=configuration.AUTH_SERVICE_JWKS_LIFESPAN,
            )
        return cls._instance
