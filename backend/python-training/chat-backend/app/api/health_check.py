from core.common.api_response import ApiResponse
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():  # noqa: ASYNC124
    return ApiResponse.success(data={"status": "OK"})
