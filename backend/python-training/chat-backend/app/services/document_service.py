import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from configuration.logger.config import log
from configuration.settings import configuration
from core.enums.document_enum import DocumentType
from core.enums.user_enum import UserRole
from core.exception_handler.custom_exception import ExceptionValueError
from db.models.document import Document
from db.models.users import User
from fastapi import UploadFile
from services.file_storage_service import FileStorageService, get_storage_service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

SOURCE_UPLOADED = "UPLOADED"


class DocumentService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.storage_service: FileStorageService = get_storage_service()

    @staticmethod
    def _normalize_document_type(document_type: str | DocumentType) -> DocumentType:
        if isinstance(document_type, DocumentType):
            return document_type
        try:
            return DocumentType(document_type.upper())
        except ValueError as exc:
            raise ExceptionValueError(message="Invalid document_type.") from exc

    @staticmethod
    def _normalize_storage_prefix(prefix: str) -> str:
        normalized = str(prefix or "").strip().strip("/")
        return normalized or "documents"

    def _resolve_storage_prefix(self, document_type: DocumentType) -> str:
        if document_type == DocumentType.CV:
            return self._normalize_storage_prefix(configuration.DOCUMENT_CV_PREFIX)
        return self._normalize_storage_prefix(configuration.DOCUMENT_JD_PREFIX)

    @staticmethod
    def _resolve_upload_document_type(
        user: User, document_type: str | DocumentType
    ) -> DocumentType:
        requested_type = DocumentService._normalize_document_type(document_type)
        if user.role == UserRole.HR:
            return DocumentType.JD
        if user.role == UserRole.USER:
            return DocumentType.CV
        return requested_type

    def _ensure_presigned_download_enabled(self) -> None:
        if not self.storage_service.supports_presigned_download:
            raise ExceptionValueError(
                message="Presigned download is only available when STORAGE_STRATEGY is r2.",
            )

    @staticmethod
    def _now_ts() -> int:
        return int(datetime.now(timezone.utc).timestamp())

    @staticmethod
    def _b64url_encode(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")

    @staticmethod
    def _b64url_decode(raw: str) -> bytes:
        padded = raw + ("=" * (-len(raw) % 4))
        return base64.urlsafe_b64decode(padded.encode("utf-8"))

    @staticmethod
    def _local_access_secret() -> bytes:
        current_version = configuration.SECRET_CURRENT_VERSION
        secret = configuration.SECRET_ROTATION_KEY_MAPPING.get(current_version, "")
        return str(secret).encode("utf-8")

    def _create_local_access_token(
        self,
        *,
        document_id: int,
        storage_key: str,
        expires_in: int,
    ) -> str:
        payload = {
            "document_id": document_id,
            "storage_key": storage_key,
            "exp": self._now_ts() + int(expires_in),
        }
        payload_raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode(
            "utf-8"
        )
        payload_b64 = self._b64url_encode(payload_raw)
        signature = hmac.new(
            self._local_access_secret(),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        return f"{payload_b64}.{self._b64url_encode(signature)}"

    def _verify_local_access_token(
        self,
        *,
        token: str,
        expected_document_id: int,
        expected_storage_key: str,
    ) -> None:
        try:
            payload_b64, signature_b64 = token.split(".", maxsplit=1)
            expected_signature = hmac.new(
                self._local_access_secret(),
                payload_b64.encode("utf-8"),
                hashlib.sha256,
            ).digest()
            provided_signature = self._b64url_decode(signature_b64)
            if not hmac.compare_digest(expected_signature, provided_signature):
                raise ExceptionValueError(
                    message="Invalid document access token.", status_code=403
                )

            payload = json.loads(self._b64url_decode(payload_b64).decode("utf-8"))
            token_document_id = int(payload.get("document_id", 0))
            token_storage_key = str(payload.get("storage_key", ""))
            token_exp = int(payload.get("exp", 0))

            if token_document_id != int(expected_document_id):
                raise ExceptionValueError(
                    message="Invalid document access token.", status_code=403
                )
            if token_storage_key != str(expected_storage_key):
                raise ExceptionValueError(
                    message="Invalid document access token.", status_code=403
                )
            if token_exp < self._now_ts():
                raise ExceptionValueError(
                    message="Document access token has expired.", status_code=401
                )
        except ExceptionValueError:
            raise
        except Exception as exc:
            raise ExceptionValueError(
                message="Invalid document access token.", status_code=403
            ) from exc

    async def _ensure_object_exists(self, object_key: str) -> None:
        try:
            exists = await self.storage_service.object_exists(object_key)
        except NotImplementedError as exc:
            raise ExceptionValueError(
                message="Download URL is only available when STORAGE_STRATEGY is r2.",
            ) from exc
        except Exception as exc:
            log.error(
                "storage_access_check_failed object_key=%s error=%s", object_key, str(exc)
            )
            raise ExceptionValueError(
                message="Cannot access file on storage. Check credentials, endpoint, or bucket policy.",
                status_code=502,
            ) from exc
        if not exists:
            raise ExceptionValueError(
                message="Uploaded file is not found in storage."
            )

    @staticmethod
    def _build_cv_metadata(target_role: str | None) -> dict[str, Any]:
        return {"target_role": target_role}

    @staticmethod
    def _build_jd_metadata(
        title: str,
        company: str | None,
        summary: str | None,
    ) -> dict[str, Any]:
        return {
            "title": title,
            "company": company,
            "summary": summary,
        }

    async def _persist_document(
        self,
        user: User,
        document_type: str | DocumentType,
        file_name: str,
        object_key: str,
        mime_type: str | None,
        size_bytes: int | None,
        metadata_json: dict[str, Any],
    ) -> Document:
        normalized_type = self._normalize_document_type(document_type)

        document = Document(
            owner_user_id=user.id,
            document_type=normalized_type.value,
            file_name=file_name,
            storage_key=object_key,
            mime_type=mime_type or "application/octet-stream",
            size_bytes=size_bytes or 0,
            source=SOURCE_UPLOADED,
            metadata_json=metadata_json,
        )

        try:
            async with self.db_session.begin():
                self.db_session.add(document)
            await self.db_session.refresh(document)
            return document
        except Exception as exc:
            log.error(
                "document_orphan_candidate user_id=%s document_type=%s object_key=%s error=%s",
                user.id,
                normalized_type,
                object_key,
                str(exc),
            )
            raise

    async def upload_document(
        self,
        user: User,
        document_type: str | DocumentType,
        file: UploadFile,
        target_role: str | None = None,
        title: str | None = None,
        company: str | None = None,
        summary: str | None = None,
    ) -> Document:
        normalized_type = self._resolve_upload_document_type(user, document_type)
        if normalized_type == DocumentType.JD and not title:
            title = (file.filename or "JD").rsplit(".", maxsplit=1)[0] or "JD"

        storage_key = await self.storage_service.save_file(
            file=file,
            sub_dir=self._resolve_storage_prefix(normalized_type),
        )
        mime_type = file.content_type or "application/octet-stream"
        size_bytes = self._extract_upload_file_size(file)
        metadata_json = (
            self._build_cv_metadata(target_role=target_role)
            if normalized_type == DocumentType.CV
            else self._build_jd_metadata(
                title=title or "",
                company=company,
                summary=summary,
            )
        )

        try:
            return await self._persist_document(
                user=user,
                document_type=normalized_type,
                file_name=file.filename or "file.bin",
                object_key=storage_key,
                mime_type=mime_type,
                size_bytes=size_bytes,
                metadata_json=metadata_json,
            )
        except Exception:
            await self._cleanup_orphan_file(storage_key=storage_key)
            raise

    @staticmethod
    def _extract_upload_file_size(file: UploadFile) -> int:
        try:
            stream = file.file
            current_pos = stream.tell()
            stream.seek(0, 2)
            size = stream.tell()
            stream.seek(current_pos)
            return int(size)
        except Exception:
            return 0

    async def _cleanup_orphan_file(self, storage_key: str) -> None:
        try:
            await self.storage_service.delete_file(storage_key)
            log.warning("orphan_file_deleted storage_key=%s", storage_key)
        except Exception as cleanup_exc:
            log.error(
                "orphan_file_cleanup_failed storage_key=%s error=%s",
                storage_key,
                str(cleanup_exc),
            )

    async def _get_accessible_document(self, user: User, document_id: int) -> Document:
        query = select(Document).where(Document.id == document_id)
        document = (await self.db_session.execute(query)).scalar_one_or_none()
        if not document:
            raise ExceptionValueError(message="Document not found.", status_code=404)
        if document.deleted_at is not None:
            raise ExceptionValueError(message="Document not found.", status_code=404)

        if document.owner_user_id != user.id and user.role != UserRole.HR:
            raise ExceptionValueError(
                message="You do not have permission to access this document.",
                status_code=403,
            )

        return document

    async def list_documents(
        self,
        user: User,
        document_type: str | DocumentType | None = None,
    ) -> list[Document]:
        query = select(Document).where(
            Document.owner_user_id == user.id,
            Document.deleted_at.is_(None),
        )
        if document_type:
            normalized_type = self._normalize_document_type(document_type)
            query = query.where(Document.document_type == normalized_type.value)

        query = query.order_by(Document.created_at.desc())
        result = await self.db_session.execute(query)
        return list(result.scalars().all())

    async def create_access_url(
        self,
        user: User,
        document_id: int,
        expires_in: int | None = None,
        image_only: bool = False,
        public_base_url: str | None = None,
    ) -> dict[str, Any]:
        document = await self._get_accessible_document(
            user=user, document_id=document_id
        )
        if image_only and (
            not document.mime_type or not document.mime_type.lower().startswith("image/")
        ):
            raise ExceptionValueError(
                message="This document is not an image.",
                status_code=400,
            )

        ttl = expires_in or configuration.STORAGE_PRESIGNED_GET_EXPIRES_SECONDS
        if self.storage_service.supports_presigned_download:
            await self._ensure_object_exists(document.storage_key)
            response = await self.storage_service.create_presigned_download(
                object_key=document.storage_key,
                expires_seconds=ttl,
            )
        else:
            file_path = Path(document.storage_key)
            if not file_path.exists() or not file_path.is_file():
                raise ExceptionValueError(
                    message="Uploaded file is not found in storage.",
                    status_code=404,
                )
            token = self._create_local_access_token(
                document_id=document.id,
                storage_key=document.storage_key,
                expires_in=ttl,
            )
            base = (public_base_url or "").rstrip("/")
            if not base:
                raise ExceptionValueError(
                    message="Cannot build local download URL.",
                    status_code=500,
                )
            response = {
                "download_url": f"{base}/v1_0/document/local-access?document_id={document.id}&token={token}",
                "expires_in": ttl,
            }

        return {
            "document_id": document.id,
            "download_url": response["download_url"],
            "expires_in": response["expires_in"],
        }

    async def read_local_document_for_access(
        self,
        *,
        document_id: int,
        token: str,
        image_only: bool = False,
    ) -> dict[str, Any]:
        document = (
            await self.db_session.execute(
                select(Document).where(
                    Document.id == document_id,
                    Document.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if not document:
            raise ExceptionValueError(message="Document not found.", status_code=404)

        self._verify_local_access_token(
            token=token,
            expected_document_id=document.id,
            expected_storage_key=document.storage_key,
        )

        if image_only and (
            not document.mime_type or not document.mime_type.lower().startswith("image/")
        ):
            raise ExceptionValueError(
                message="This document is not an image.",
                status_code=400,
            )

        file_path = Path(document.storage_key)
        if not file_path.exists() or not file_path.is_file():
            raise ExceptionValueError(
                message="Uploaded file is not found in storage.",
                status_code=404,
            )

        return {
            "file_path": str(file_path),
            "file_name": document.file_name,
            "mime_type": document.mime_type or "application/octet-stream",
        }

    async def delete_document(self, user: User, document_id: int) -> dict[str, Any]:
        document = await self._get_accessible_document(
            user=user, document_id=document_id
        )

        try:
            await self.storage_service.delete_file(document.storage_key)
        except Exception as exc:
            log.error(
                "document_storage_delete_failed user_id=%s document_id=%s storage_key=%s error=%s",
                user.id,
                document.id,
                document.storage_key,
                str(exc),
            )
            raise ExceptionValueError(
                message="Cannot delete file from storage.",
                status_code=502,
            ) from exc

        try:
            document.deleted_at = datetime.now(timezone.utc)
            self.db_session.add(document)
            await self.db_session.commit()
        except Exception as exc:
            await self.db_session.rollback()
            log.error(
                "document_db_delete_failed user_id=%s document_id=%s storage_key=%s error=%s",
                user.id,
                document.id,
                document.storage_key,
                str(exc),
            )
            raise ExceptionValueError(
                message="Cannot delete document record.",
                status_code=500,
            ) from exc

        return {
            "document_id": document.id,
            "deleted": True,
        }
