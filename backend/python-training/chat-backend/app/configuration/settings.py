from pathlib import Path
from typing import ClassVar, Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    BASE_DIR: ClassVar[Path] = Path(__file__).resolve().parent

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str
    ENVIRONMENT: Literal["unittest", "develop", "testing", "staging", "production"]
    BACKEND_CORS_ORIGINS: list[str] = []
    BACKEND_CORS_METHODS: list[str] = [
        "GET",
        "POST",
        "PUT",
        "OPTIONS",
        "PATCH",
        "DELETE",
    ]

    # Database settings
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int
    POSTGRES_SSL_MODE: Literal[
        "disable",
        "allow",
        "prefer",
        "require",
        "verify-ca",
        "verify-full",
    ] = "prefer"
    DB_ECHO: bool = False
    DB_INIT: bool = False

    # Read-only Database settings
    READ_ONLY_POSTGRES_SERVER: str
    READ_ONLY_POSTGRES_USER: str
    READ_ONLY_POSTGRES_PASSWORD: str
    READ_ONLY_POSTGRES_DB: str
    READ_ONLY_POSTGRES_PORT: int
    READ_ONLY_POSTGRES_SSL_MODE: Literal[
        "disable",
        "allow",
        "prefer",
        "require",
        "verify-ca",
        "verify-full",
    ] = "prefer"

    # AES-GCM
    SECRET_ROTATION_KEY_MAPPING: dict = {"v1": "0123456789abcdef0123456789abcdef"}
    SECRET_CURRENT_VERSION: str = "v1"

    # Storage settings
    STORAGE_STRATEGY: Literal["local", "r2"] = "local"
    UPLOAD_DIR: str = "uploads"
    STORAGE_PRESIGNED_EXPIRES_SECONDS: int = 900
    STORAGE_PRESIGNED_GET_EXPIRES_SECONDS: int = 600
    DOCUMENT_CV_PREFIX: str = "cv"
    DOCUMENT_JD_PREFIX: str = "jd"

    # Cloudflare R2 settings
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_REGION: str = "auto"

    # CV parser settings
    CV_PARSE_MAX_EXTRACTED_CHARS: str = "12000"
    CV_PARSE_MAX_HIGHLIGHTS: str = "8"
    CV_PARSE_MAX_DIAGNOSTICS_IN_ERROR: str = "12"
    CV_OCR_ENABLED: str = "true"
    CV_OCR_LANG: str = "vie+eng"
    CV_OCR_DPI: str = "300"
    TESSERACT_CMD: str = ""
    TESSDATA_PREFIX: str = ""
    CV_PARSE_LEADING_BULLET_PATTERN: str = (
        r"^[\s\-\*\>\u00bb\u2022\u2023\u2043\u2219\u25aa\u25ab"
        r"\u25cf\u25a0\u25e6\u00b7\uf0a7\uf0b7\uf071]+"
    )
    CV_PARSE_LEADING_SYMBOL_RUN_PATTERN: str = r"^[^\w]+(?=\w)"

    # CV/JD match scoring settings
    MATCH_USE_EMBEDDING: bool = True
    EMBEDDING_MODEL_NAME: str = "paraphrase-multilingual-MiniLM-L12-v2"
    WEIGHT_SEMANTIC: float = 0.5
    WEIGHT_SKILL: float = 0.3
    WEIGHT_EXPERIENCE: float = 0.2

    # Google OAuth
    GOOGLE_AUTH_URL: str = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_SCOPES: list[str] = ["openid", "email", "profile"]
    GOOGLE_TOKEN_ISSUERS: list[str] = [
        "accounts.google.com",
        "https://accounts.google.com",
    ]

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/v1_0/auth/login/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"

    # JWT
    JWT_ALGORITHM: str = "RS256"
    JWT_RSA_PRIVATE_KEY: str = ""
    JWT_PRIVATE_KEY_PEM: str = ""
    JWT_PUBLIC_KEY_PEM: str = ""
    JWT_CURRENT_KID: str = "key_env"
    RSA_KEY_MANIFEST: dict = {
        "current_kid": "key_20250805",
        "keys": {
            "key_20250805": {
                "private_path": str(
                    BASE_DIR / ".keys" / "rsa_private_key_20250805.pem"
                ),
                "public_path": str(BASE_DIR / ".keys" / "rsa_public_key_20250805.pem"),
                "status": "active",
            }
        },
    }
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    TOKEN_EXCLUDE_URLS: list[str] = [
        "/docs",
        "/openapi.json",
        "/favicon.ico",
        "/health",
        "/v1_0/auth/jwks",
        "/v1_0/auth/google/login",
        "/v1_0/auth/login/google/callback",
        "/v1_0/auth/login/google",
    ]


configuration = Settings()
