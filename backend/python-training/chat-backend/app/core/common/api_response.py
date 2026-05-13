from typing import Any, Optional

from fastapi import status
from fastapi.responses import JSONResponse


class ApiResponse:
    @staticmethod
    def success(
        data: Any = None,
        message: Optional[str] = None,
        message_code: Optional[int] = None,
        status_code: int = status.HTTP_200_OK,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content={
                "success": True,
                "data": data,
                "message": message,
                "messageCode": message_code,
                "messageErrors": None,
            },
        )

    @staticmethod
    def error(
        message: Optional[str] = None,
        message_code: Optional[int] = None,
        message_errors: Optional[list[str]] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        data: Any = None,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "data": data,
                "message": message,
                "messageCode": message_code,
                "messageErrors": message_errors,
            },
        )
