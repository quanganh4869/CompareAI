from typing import List

from core.enums.user_enum import UserRole
from core.messages import CustomMessageCode
from fastapi import HTTPException, Request, status


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency to check if the current user has one of the allowed roles.
    Assumes `request.user` is populated by JWTAuthMiddleware.
    """

    def role_checker(request: Request):
        user = getattr(request, "user", None)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=CustomMessageCode.UNAUTHORIZED_ERROR.title,
            )

        if not hasattr(user, "role") or user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=CustomMessageCode.FORBIDDEN_ERROR.title,
            )
        return user

    return role_checker
