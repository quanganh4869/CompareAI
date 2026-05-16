from core.common.api_response import ApiResponse
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def root_health():  # noqa: ASYNC124
    return ApiResponse.success(data={"status": "OK"})


@router.get("/health")
async def health_check():  # noqa: ASYNC124
    return ApiResponse.success(data={"status": "OK"})
