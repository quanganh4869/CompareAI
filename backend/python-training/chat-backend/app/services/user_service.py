from configuration.settings import configuration
from core.common.aes_gcm import AesGCMRotation
from db.models import User
from schemas.responses.google_auth_schema import GoogleUserSchema
from schemas.responses.user_schema import UserSchema
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class UserService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        # Initialize crypto service using project-standard AesGCMRotation
        self.crypto_service = AesGCMRotation(configuration)

    async def get_user_info(self, user_id: int) -> UserSchema | None:
        """
        Retrieve user information by user ID.
        """
        result = await self.db_session.execute(select(User).where(User.id == user_id))
        user = result.mappings().one_or_none()
        return UserSchema(**user) if user else None

    async def get_or_create_google_user(self, google_user: GoogleUserSchema) -> User:
        """
        Find an existing user by hashed email or create a new one.
        """
        if self.db_session.in_transaction():
            return await self._get_or_create_google_user_in_tx(google_user)

        async with self.db_session.begin():
            return await self._get_or_create_google_user_in_tx(google_user)

    async def _get_or_create_google_user_in_tx(
        self, google_user: GoogleUserSchema
    ) -> User:
        email_hash = self.crypto_service.sha256_hash(google_user.email)

        result = await self.db_session.execute(
            select(User).where(User.email_hash == email_hash)
        )
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                email_hash=email_hash,
                email_encrypted=self.crypto_service.encrypt_data(google_user.email),
                name_hash=self.crypto_service.sha256_hash(google_user.name)
                if google_user.name
                else None,
                name_encrypted=self.crypto_service.encrypt_data(google_user.name)
                if google_user.name
                else None,
                avatar_url=str(google_user.picture) if google_user.picture else None,
            )
            self.db_session.add(user)
            await self.db_session.flush()

        return user
