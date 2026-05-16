from datetime import datetime, timedelta, timezone

from configuration.logger.config import log
from configuration.settings import configuration
from core.common.aes_gcm import AesGCMRotation
from core.common.jwt_token import encode_jwt_token
from core.constants import TOKEN_PREFIX
from db.models import AuthIdentity, AuthProvider, OAuthToken, User
from google.auth.transport import requests
from google.oauth2 import id_token
from schemas.responses.google_auth_schema import GoogleUserSchema
from schemas.responses.user_auth_schema import OAuthTokenResponse
from services.google_auth_service import GoogleAuthService
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


class UserAuthService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.aes_gcm = AesGCMRotation(configuration=configuration)

    async def get_or_create_user(
        self,
        google_user: GoogleUserSchema,
        provider_name: str = "google",
    ) -> User:
        try:
            identity = await self._get_identity(google_user.sub)
            if identity:
                return identity.user

            hashed_email = self.aes_gcm.sha256_hash(google_user.email)
            user = await self._get_user(hashed_email)

            if user is None:
                user = await self._create_user(google_user=google_user)

            await self._create_identity(
                user_id=user.id,
                provider_user_id=google_user.sub,
                provider_name=provider_name,
            )

            return user
        except Exception as e:
            log.error(f"Failed to get or create user: {e}")
            raise

    async def create_access_token(
        self,
        user: User,
    ) -> OAuthTokenResponse:
        try:
            jwt_token = encode_jwt_token(
                key_id=configuration.JWT_CURRENT_KID
                or configuration.RSA_KEY_MANIFEST.get("current_kid"),
                jwt_secret_key=configuration.JWT_RSA_PRIVATE_KEY,
                jwt_algorithm=configuration.JWT_ALGORITHM,
                access_token_expire_minutes=configuration.ACCESS_TOKEN_EXPIRE_MINUTES,
                scope=" ".join(configuration.GOOGLE_SCOPES),
                user=user,
            )

            oauth_token = OAuthToken(
                user_id=user.id,
                access_token=jwt_token["access_token"],
                refresh_token=jwt_token["refresh_token"],
                expires_at=datetime.now(timezone.utc)
                + timedelta(seconds=jwt_token["expires_in"]),
                user=user,
            )
            self.db_session.add(oauth_token)
            await self.db_session.flush()

            return OAuthTokenResponse(
                access_token=jwt_token["access_token"],
                refresh_token=jwt_token["refresh_token"],
                token_type=TOKEN_PREFIX,
                expires_in=jwt_token["expires_in"],
                user=user,
            )

        except Exception as e:
            log.error(f"Failed to create access token: {e}")
            raise

    async def refresh_access_token(self, refresh_token: str) -> OAuthTokenResponse:
        try:
            refresh_token = str(refresh_token or "").strip()
            if not refresh_token:
                raise ValueError("Missing refresh token.")

            result = await self.db_session.execute(
                select(OAuthToken)
                .options(selectinload(OAuthToken.user))
                .where(OAuthToken.refresh_token == refresh_token)
            )
            existing_token = result.scalar_one_or_none()
            if not existing_token or not existing_token.user:
                raise ValueError("Invalid refresh token.")

            user = existing_token.user
            jwt_token = encode_jwt_token(
                key_id=configuration.JWT_CURRENT_KID
                or configuration.RSA_KEY_MANIFEST.get("current_kid"),
                jwt_secret_key=configuration.JWT_RSA_PRIVATE_KEY,
                jwt_algorithm=configuration.JWT_ALGORITHM,
                access_token_expire_minutes=configuration.ACCESS_TOKEN_EXPIRE_MINUTES,
                scope=" ".join(configuration.GOOGLE_SCOPES),
                user=user,
            )

            existing_token.access_token = jwt_token["access_token"]
            existing_token.refresh_token = jwt_token["refresh_token"]
            existing_token.expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=jwt_token["expires_in"]
            )
            self.db_session.add(existing_token)
            await self.db_session.flush()

            return OAuthTokenResponse(
                access_token=jwt_token["access_token"],
                refresh_token=jwt_token["refresh_token"],
                token_type=TOKEN_PREFIX,
                expires_in=jwt_token["expires_in"],
                user=user,
            )
        except Exception as e:
            log.error(f"Failed to refresh access token: {e}")
            raise

    async def revoke_by_access_token(self, access_token: str) -> bool:
        access_token = str(access_token or "").strip()
        if not access_token:
            return False

        result = await self.db_session.execute(
            select(OAuthToken).where(OAuthToken.access_token == access_token)
        )
        existing_token = result.scalar_one_or_none()
        if not existing_token:
            return False

        await self.db_session.delete(existing_token)
        await self.db_session.flush()
        return True

    async def revoke_by_refresh_token(self, refresh_token: str) -> bool:
        refresh_token = str(refresh_token or "").strip()
        if not refresh_token:
            return False

        result = await self.db_session.execute(
            select(OAuthToken).where(OAuthToken.refresh_token == refresh_token)
        )
        existing_token = result.scalar_one_or_none()
        if not existing_token:
            return False

        await self.db_session.delete(existing_token)
        await self.db_session.flush()
        return True

    async def _get_identity(self, provider_user_id: str) -> AuthIdentity | None:
        result = await self.db_session.execute(
            select(AuthIdentity)
            .options(selectinload(AuthIdentity.user))
            .where(AuthIdentity.provider_user_id == provider_user_id)
        )
        return result.scalar_one_or_none()

    async def _get_user(self, hashed_email: str) -> User | None:
        result = await self.db_session.execute(
            select(User).where(User.email_hash == hashed_email)
        )
        return result.scalar_one_or_none()

    async def _create_user(
        self,
        google_user: GoogleUserSchema,
    ) -> User:
        user = User(
            email_hash=self.aes_gcm.sha256_hash(google_user.email),
            email_encrypted=self.aes_gcm.encrypt_data(google_user.email),
            name_hash=self.aes_gcm.sha256_hash(google_user.name)
            if google_user.name
            else None,
            name_encrypted=self.aes_gcm.encrypt_data(google_user.name)
            if google_user.name
            else None,
            avatar_url=str(google_user.picture) if google_user.picture else None,
        )
        self.db_session.add(user)
        await self.db_session.flush()
        await self.db_session.refresh(user)
        return user

    async def _get_provider(self, provider_name: str) -> AuthProvider | None:
        provider_name = provider_name.strip().lower()
        result = await self.db_session.execute(
            select(AuthProvider).where(AuthProvider.provider_name == provider_name)
        )
        return result.scalar_one_or_none()

    async def _get_or_create_provider(self, provider_name: str) -> AuthProvider:
        provider_name = provider_name.strip().lower()
        provider = await self._get_provider(provider_name)
        if provider is not None:
            return provider

        provider = AuthProvider(provider_name=provider_name, is_active=True)
        self.db_session.add(provider)
        await self.db_session.flush()
        await self.db_session.refresh(provider)
        return provider

    async def _create_identity(
        self,
        user_id: int,
        provider_user_id: str,
        provider_name: str,
    ) -> None:
        provider = await self._get_or_create_provider(provider_name)

        identity = AuthIdentity(
            user_id=user_id,
            provider_id=provider.id,
            provider_user_id=provider_user_id,
        )
        self.db_session.add(identity)
        await self.db_session.flush()

    async def handle_google_login_callback(
        self,
        code: str,
        provider_name: str = "google",
    ) -> OAuthTokenResponse:
        token_data = await GoogleAuthService.exchange_code_for_token(code)
        return await self.handle_google_login_post(
            token=token_data["id_token"],
            provider_name=provider_name,
        )

    async def handle_google_login_post(
        self,
        token: str,
        provider_name: str = "google",
    ) -> OAuthTokenResponse:
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                configuration.GOOGLE_CLIENT_ID,
            )

            google_user = GoogleUserSchema(
                sub=idinfo.get("sub"),
                email=idinfo.get("email"),
                name=idinfo.get("name"),
                picture=idinfo.get("picture"),
                iss=idinfo.get("iss"),
                aud=idinfo.get("aud"),
                iat=idinfo.get("iat"),
                exp=idinfo.get("exp"),
            )

            async with self.db_session.begin():
                user = await self.get_or_create_user(
                    google_user=google_user,
                    provider_name=provider_name,
                )
                return await self.create_access_token(user=user)

        except ValueError as e:
            log.error(f"Invalid Google token: {e}")
            raise

        except Exception as e:
            log.error(f"Failed to handle Google login POST: {e}")
            raise
