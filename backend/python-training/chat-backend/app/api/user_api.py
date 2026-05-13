from typing import Annotated

from configuration.logger.config import log
from core.common.api_response import ApiResponse
from core.decorators.api_version import version as api_version
from core.decorators.log_time import measure_time
from core.enums import SubscriptionPlanName, UserRole
from core.exception_handler.custom_exception import ExceptionValueError
from db.db_connection import Database
from fastapi import APIRouter, Depends, Request, Security
from fastapi.security import HTTPBearer
from schemas.responses.user_schema import UserSchema
from services.plan_service import PlanService
from services.role_service import RoleService
from sqlalchemy.ext.asyncio import AsyncSession

bearer_scheme = HTTPBearer(auto_error=False)
router = APIRouter(dependencies=[Security(bearer_scheme)])


@router.get("/me")
@api_version(1, 0)
@measure_time
async def get_me(
    request: Request,
):
    user = request.user
    return ApiResponse.success(data=UserSchema.model_validate(user).model_dump())


@router.get("/roles")
@api_version(1, 0)
@measure_time
async def list_roles(
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """List all available roles."""
    service = RoleService(db_session)
    roles = await service.list_available_roles()
    return ApiResponse.success(data=roles)


@router.post("/role/{role_name}")
@api_version(1, 0)
@measure_time
async def assign_role(
    role_name: UserRole,
    request: Request,
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """Assign a role to the current authenticated user."""
    try:
        service = RoleService(db_session)
        user = await service.assign_role_to_user(request.user, role_name)

        return ApiResponse.success(
            data=UserSchema.model_validate(user).model_dump(),
            message=f"Role {role_name} assigned to user successfully",
        )
    except ExceptionValueError as e:
        log.error(f"Failed to assign role: {e.message}")
        return ApiResponse.error(
            message=e.message,
            message_code=e.message_code,
            status_code=e.status_code,
        )


@router.get("/plans")
@api_version(1, 0)
@measure_time
async def list_plans(
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """List all available subscription plans."""
    service = PlanService(db_session)
    plans = await service.list_plans()
    return ApiResponse.success(data=[plan.model_dump() for plan in plans])


@router.post("/plan/{plan_name}")
@api_version(1, 0)
@measure_time
async def assign_plan(
    plan_name: SubscriptionPlanName,
    request: Request,
    db_session: Annotated[AsyncSession, Depends(Database.get_async_db_session)],
):
    """Assign/Upgrade a subscription plan for the current authenticated user."""
    try:
        service = PlanService(db_session)
        user = await service.assign_plan_to_user(request.user, plan_name)

        return ApiResponse.success(
            data=UserSchema.model_validate(user).model_dump(),
            message=f"Plan {plan_name} assigned to user successfully",
        )
    except ExceptionValueError as e:
        log.error(f"Failed to assign plan: {e.message}")
        return ApiResponse.error(
            message=e.message,
            message_code=e.message_code,
            status_code=e.status_code,
        )
