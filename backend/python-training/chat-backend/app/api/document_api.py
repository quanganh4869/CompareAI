from http import HTTPStatus
from typing import Annotated, Any, Awaitable, Callable

from configuration.logger.config import log
from core.common.api_response import ApiResponse
from core.decorators.api_version import version as api_version
from core.decorators.log_time import measure_time
from core.dependencies.rbac import require_role
from core.enums.user_enum import UserRole
from core.exception_handler.custom_exception import ExceptionValueError
from db.db_connection import Database
from db.models.document import Document
from db.models.users import User
from fastapi import APIRouter, Depends, File, Form, Query, Security, UploadFile
from fastapi.security import HTTPBearer
from schemas.requests.document_schema import (
    DocumentAccessUrlRequest,
    DocumentMatchScoreRequest,
)
from schemas.responses.document_schema import (
    CvParsedResponse,
    DocumentDeleteResponse,
    DocumentDownloadUrlResponse,
    DocumentMatchScoreResponse,
    DocumentResponse,
)
from services.cv_parser_service import CvParserService
from services.document_match_service import DocumentMatchService
from services.document_service import DocumentService
from sqlalchemy.ext.asyncio import AsyncSession

bearer_scheme = HTTPBearer(auto_error=False)
router = APIRouter(dependencies=[Security(bearer_scheme)])

DBSessionDep = Annotated[AsyncSession, Depends(Database.get_async_db_session)]
UserOrHRDep = Annotated[User, Depends(require_role([UserRole.USER, UserRole.HR]))]


def get_document_service(db_session: DBSessionDep) -> DocumentService:
    return DocumentService(db_session)


DocumentServiceDep = Annotated[DocumentService, Depends(get_document_service)]


def get_cv_parser_service(db_session: DBSessionDep) -> CvParserService:
    return CvParserService(db_session)


CvParserServiceDep = Annotated[CvParserService, Depends(get_cv_parser_service)]


def get_document_match_service(db_session: DBSessionDep) -> DocumentMatchService:
    return DocumentMatchService(db_session)


DocumentMatchServiceDep = Annotated[
    DocumentMatchService, Depends(get_document_match_service)
]


def _serialize_document(model: Document) -> dict:
    return DocumentResponse.model_validate(model).model_dump(mode="json")


def _default_error_mapper(
    exc: ExceptionValueError,
    user_id: int,
    action: str,
) -> dict[str, Any]:
    log.error("Failed to %s for user %s: %s", action, user_id, exc.message)
    return {
        "message": f"❌ {exc.message}",
        "message_code": exc.message_code,
        "status_code": exc.status_code,
        "data": None,
        "message_errors": None,
    }


def _default_success_mapper(data: object, message: str) -> dict[str, Any]:
    return {
        "data": data,
        "message": f"✅ {message}",
        "message_code": None,
        "status_code": HTTPStatus.OK.value,
    }


async def _service_response(
    user_id: int,
    action: str,
    success_message: str,
    producer: Callable[[], Awaitable[object]],
    success_mapper: Callable[[object, str], dict[str, Any]] | None = None,
    error_mapper: Callable[[ExceptionValueError, int, str], dict[str, Any]]
    | None = None,
):
    success_mapper = success_mapper or _default_success_mapper
    error_mapper = error_mapper or _default_error_mapper

    try:
        data = await producer()
        payload = success_mapper(data, success_message)
        return ApiResponse.success(
            data=payload.get("data"),
            message=payload.get("message"),
            message_code=payload.get("message_code"),
            status_code=payload.get("status_code", HTTPStatus.OK.value),
        )
    except ExceptionValueError as exc:
        payload = error_mapper(exc, user_id, action)
        return ApiResponse.error(
            message=payload.get("message"),
            message_code=payload.get("message_code"),
            message_errors=payload.get("message_errors"),
            status_code=payload.get("status_code", exc.status_code),
            data=payload.get("data"),
        )


@router.post("/upload/{document_type}")
@api_version(1, 0)
@measure_time
async def upload_document_via_backend(
    document_type: str,
    file: Annotated[UploadFile, File(...)],
    user: UserOrHRDep,
    service: DocumentServiceDep,
    target_role: Annotated[str | None, Form()] = None,
    title: Annotated[str | None, Form()] = None,
    company: Annotated[str | None, Form()] = None,
    summary: Annotated[str | None, Form()] = None,
):
    return await _service_response(
        user_id=user.id,
        action=f"upload {document_type} via backend",
        success_message=f"{document_type.upper()} uploaded successfully",
        producer=lambda: _direct_upload_data(
            service=service,
            user=user,
            document_type=document_type,
            file=file,
            target_role=target_role,
            title=title,
            company=company,
            summary=summary,
        ),
    )


@router.post("/{document_id}/access-url")
@api_version(1, 0)
@measure_time
async def get_document_access_url(
    document_id: int,
    payload: DocumentAccessUrlRequest,
    user: UserOrHRDep,
    service: DocumentServiceDep,
):
    return await _service_response(
        user_id=user.id,
        action="create document access url",
        success_message="Document access URL created successfully",
        producer=lambda: _download_url_data(
            service,
            user,
            document_id,
            payload.expires_in,
            image_only=payload.image_only,
        ),
    )


@router.get("")
@api_version(1, 0)
@measure_time
async def list_my_documents(
    user: UserOrHRDep,
    service: DocumentServiceDep,
    document_type: str | None = Query(default=None),
):
    return await _service_response(
        user_id=user.id,
        action="list my documents",
        success_message="Documents fetched successfully",
        producer=lambda: _list_documents_data(
            service=service,
            user=user,
            document_type=document_type,
        ),
        success_mapper=_list_documents_success_mapper,
    )


@router.delete("/{document_id}")
@api_version(1, 0)
@measure_time
async def delete_document(
    document_id: int,
    user: UserOrHRDep,
    service: DocumentServiceDep,
):
    return await _service_response(
        user_id=user.id,
        action="delete document",
        success_message="Document deleted successfully",
        producer=lambda: _delete_document_data(
            service=service,
            user=user,
            document_id=document_id,
        ),
    )


@router.get("/{document_id}/cv-parse")
@api_version(1, 0)
@measure_time
async def parse_cv_document(
    document_id: int,
    user: UserOrHRDep,
    service: CvParserServiceDep,
):
    return await _service_response(
        user_id=user.id,
        action="parse cv document",
        success_message="CV parsed successfully",
        producer=lambda: _parse_cv_data(
            service=service,
            user=user,
            document_id=document_id,
        ),
    )


@router.post("/match-score")
@api_version(1, 0)
@measure_time
async def match_cv_with_jd_score(
    payload: DocumentMatchScoreRequest,
    user: UserOrHRDep,
    service: DocumentMatchServiceDep,
):
    return await _service_response(
        user_id=user.id,
        action="match cv with jd score",
        success_message="CV/JD match score calculated successfully",
        producer=lambda: _match_score_data(
            service=service,
            user=user,
            payload=payload,
        ),
    )


async def _direct_upload_data(
    service: DocumentService,
    user: User,
    document_type: str,
    file: UploadFile,
    target_role: str | None,
    title: str | None,
    company: str | None,
    summary: str | None,
):
    document = await service.upload_document(
        user=user,
        document_type=document_type,
        file=file,
        target_role=target_role,
        title=title,
        company=company,
        summary=summary,
    )
    return _serialize_document(document)


async def _download_url_data(
    service: DocumentService,
    user: User,
    document_id: int,
    expires_in: int | None,
    image_only: bool,
):
    response = await service.create_access_url(
        user=user,
        document_id=document_id,
        expires_in=expires_in,
        image_only=image_only,
    )
    return DocumentDownloadUrlResponse(**response).model_dump()


async def _list_documents_data(
    service: DocumentService,
    user: User,
    document_type: str | None,
):
    documents = await service.list_documents(user=user, document_type=document_type)
    return [_serialize_document(document) for document in documents]


async def _delete_document_data(
    service: DocumentService,
    user: User,
    document_id: int,
):
    response = await service.delete_document(user=user, document_id=document_id)
    return DocumentDeleteResponse(**response).model_dump()


async def _parse_cv_data(
    service: CvParserService,
    user: User,
    document_id: int,
):
    response = await service.parse_cv_document(
        user=user,
        document_id=document_id,
    )
    return CvParsedResponse(**response).model_dump()


async def _match_score_data(
    service: DocumentMatchService,
    user: User,
    payload: DocumentMatchScoreRequest,
):
    response = await service.match_cv_with_jd_text(
        user=user,
        cv_document_id=payload.cv_document_id,
        jd_text=payload.jd_text,
    )
    return DocumentMatchScoreResponse(**response).model_dump()


def _list_documents_success_mapper(data: object, _: str) -> dict[str, Any]:
    total = len(data) if isinstance(data, list) else 0
    return {
        "data": data,
        "message": f"✅ Documents fetched successfully ({total} items)",
        "message_code": None,
        "status_code": HTTPStatus.OK.value,
    }
