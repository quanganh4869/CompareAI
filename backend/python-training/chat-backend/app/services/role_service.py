from core.enums.user_enum import UserRole
from db.models.users import User
from sqlalchemy.ext.asyncio import AsyncSession


class RoleService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def list_available_roles(self) -> list[str]:
        """List all available roles from the UserRole enum."""
        return UserRole.get_member_values()

    async def assign_role_to_user(self, user: User, role: UserRole) -> User:
        """Assign a role to a specific user and return the updated user."""
        async with self.db_session.begin():
            # Merge user into current session
            user = await self.db_session.merge(user)
            user.role = role
            self.db_session.add(user)
        return user
