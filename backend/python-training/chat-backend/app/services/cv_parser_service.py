import re
import os
import shutil
from pathlib import Path
from typing import Any

import fitz
from botocore.exceptions import ClientError
from configuration.logger.config import log
from configuration.settings import configuration
from core.enums.document_enum import DocumentType
from core.exception_handler.custom_exception import ExceptionValueError
from db.models.users import User
from services.document_service import DocumentService
from services.file_storage_service import S3CompatibleFileStorageService, get_storage_service
from sqlalchemy.ext.asyncio import AsyncSession


class CvParserService:
    LEADING_BULLET_RE = re.compile(
        r"^[\s\-\*\>\u00bb\u2022\u2023\u2043\u2219\u25aa\u25ab"
        r"\u25cf\u25a0\u25e6\u00b7\uf0a7\uf0b7\uf071]+"
    )
    LEADING_SYMBOL_RUN_RE = re.compile(r"^[^\w]+(?=\w)")

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.document_service = DocumentService(db_session)

    async def parse_cv_document(self, user: User, document_id: int) -> dict[str, Any]:
        document = await self.document_service._get_accessible_document(
            user=user,
            document_id=document_id,
        )
        self._ensure_parseable_document(
            document.document_type,
            document.file_name,
            document.mime_type,
        )

        page_count, extracted_text, diagnostics, extraction_mode, ocr_used = (
            self._extract_text_from_pdf(
            await self._read_document_bytes(document.storage_key)
            )
        )
        if not extracted_text.strip():
            max_diags = self._cfg_positive_int("CV_PARSE_MAX_DIAGNOSTICS_IN_ERROR", 12)
            raise ExceptionValueError(
                message=(
                    "Cannot extract text from this CV. "
                    f"PyMuPDF diagnostics: {'; '.join(diagnostics[:max_diags])}"
                ),
                status_code=422,
            )

        normalized_text = self._normalize_text(extracted_text)
        max_chars = self._cfg_positive_int("CV_PARSE_MAX_EXTRACTED_CHARS", 12000)
        is_truncated = len(normalized_text) > max_chars
        truncated_text = (
            normalized_text[:max_chars].rstrip() if is_truncated else normalized_text
        )
        highlights = self._extract_highlights(normalized_text)

        return {
            "document_id": document.id,
            "file_name": document.file_name,
            "page_count": page_count,
            "character_count": len(normalized_text),
            "is_truncated": is_truncated,
            "extracted_text": truncated_text,
            "profile_summary": (
                " | ".join(highlights[:3]) if highlights else normalized_text[:400]
            ).strip()[:400],
            "contacts": self._extract_contacts(normalized_text),
            "highlights": highlights,
            "extraction_mode": extraction_mode,
            "ocr_used": ocr_used,
            "diagnostics": diagnostics,
        }

    @staticmethod
    def _ensure_parseable_document(
        document_type: str | DocumentType,
        file_name: str | None,
        mime_type: str | None,
    ) -> None:
        if document_type != DocumentType.CV:
            raise ExceptionValueError(
                message="Only CV documents can be parsed by this endpoint.",
                status_code=422,
            )
        is_pdf = (mime_type and mime_type.lower() == "application/pdf") or str(
            file_name or ""
        ).lower().endswith(".pdf")
        if not is_pdf:
            raise ExceptionValueError(
                message="Only PDF CV is supported for parsing.",
                status_code=422,
            )

    async def _read_document_bytes(self, storage_key: str) -> bytes:
        if configuration.STORAGE_STRATEGY not in ["s3", "r2"]:
            file_path = Path(storage_key)
            if not file_path.exists():
                raise ExceptionValueError(
                    message="Document file is not found in local storage.",
                    status_code=404,
                )
            return file_path.read_bytes()

        storage_service = get_storage_service()
        if not isinstance(storage_service, S3CompatibleFileStorageService):
            raise ExceptionValueError(
                message="Cloud storage is not configured correctly.",
                status_code=500,
            )
        try:
            async with storage_service.create_s3_client() as client:
                response = await client.get_object(
                    Bucket=storage_service.bucket_name,
                    Key=storage_key,
                )
                return await response["Body"].read()
        except ClientError as exc:
            code = str(exc.response.get("Error", {}).get("Code", ""))
            if code in {"NoSuchKey", "404", "NotFound"}:
                raise ExceptionValueError(
                    message="Document file is not found in storage.",
                    status_code=404,
                ) from exc
            if code in {
                "InvalidAccessKeyId",
                "SignatureDoesNotMatch",
                "AccessDenied",
                "InvalidToken",
            }:
                raise ExceptionValueError(
                    message="Cannot read CV file from storage: invalid credentials or permission denied.",
                    status_code=502,
                ) from exc
            log.error("failed_to_read_cv_from_s3 key=%s error=%s", storage_key, str(exc))
            raise ExceptionValueError(
                message="Cannot read CV file from storage.",
                status_code=502,
            ) from exc

    def _extract_text_from_pdf(
        self,
        pdf_bytes: bytes,
    ) -> tuple[int, str, list[str], str, bool]:
        self._configure_ocr_environment()
        diagnostics: list[str] = []
        page_texts: list[str] = []
        ocr_used = False

        with fitz.open(stream=pdf_bytes, filetype="pdf") as pdf_doc:
            for idx, page in enumerate(pdf_doc, start=1):
                text = (page.get_text("text") or "").strip()
                mode = "text"

                if not text:
                    text = self._text_from_blocks(page)
                    mode = "blocks"
                if not text:
                    text = self._text_from_words(page)
                    mode = "words"
                ocr_error = ""
                if not text and self._cfg_bool("CV_OCR_ENABLED", True):
                    text, ocr_error = self._text_from_ocr(page)
                    if text:
                        mode = "ocr"
                        ocr_used = True

                if text:
                    page_texts.append(text)
                    diagnostics.append(f"p{idx}[mode={mode}]")
                else:
                    blocks = page.get_text("blocks") or []
                    words = page.get_text("words") or []
                    images = page.get_images(full=True) or []
                    diagnostic = f"p{idx}[t=0,b={len(blocks)},w={len(words)},img={len(images)}]"
                    if ocr_error:
                        diagnostic = f"{diagnostic}[ocr_error={ocr_error}]"
                    diagnostics.append(diagnostic)

            page_count = len(pdf_doc)

        extraction_mode = "ocr" if ocr_used else "native"
        has_native_text = any(
            "[mode=text]" in item
            or "[mode=blocks]" in item
            or "[mode=words]" in item
            for item in diagnostics
        )
        if ocr_used and has_native_text:
            extraction_mode = "mixed"

        return page_count, "\n\n".join(page_texts).strip(), diagnostics, extraction_mode, ocr_used

    @staticmethod
    def _text_from_blocks(page) -> str:
        blocks = page.get_text("blocks") or []
        return "\n".join(
            str(block[4]).strip()
            for block in blocks
            if len(block) > 4 and str(block[4]).strip()
        ).strip()

    @staticmethod
    def _text_from_words(page) -> str:
        words = page.get_text("words") or []
        return " ".join(
            str(word[4]).strip()
            for word in words
            if len(word) > 4 and str(word[4]).strip()
        ).strip()

    def _text_from_ocr(self, page) -> tuple[str, str]:
        try:
            text_page = page.get_textpage_ocr(
                language=self._cfg_str("CV_OCR_LANG", "vie+eng"),
                dpi=self._cfg_positive_int("CV_OCR_DPI", 300),
            )
            return (text_page.extractText(sort=True) or "").strip(), ""
        except RuntimeError as exc:
            log.warning("cv_parse_ocr_runtime_error error=%s", str(exc))
            return "", str(exc)
        except Exception as exc:
            log.error("cv_parse_ocr_failed error=%s", str(exc))
            return "", str(exc)

    @classmethod
    def _normalize_text(cls, text: str) -> str:
        lines: list[str] = []
        blank_streak = 0
        normalized = text.replace("\x00", "").replace("\r\n", "\n").replace("\r", "\n")

        for raw in normalized.split("\n"):
            line = raw.strip()
            if line:
                line = cls.LEADING_BULLET_RE.sub("", line).strip()
                line = cls.LEADING_SYMBOL_RUN_RE.sub("", line).strip()
                line = re.sub(r"[ \t]+", " ", line).strip()

            if not line:
                blank_streak += 1
                if blank_streak <= 1:
                    lines.append("")
                continue

            blank_streak = 0
            lines.append(line)

        return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        seen: set[str] = set()
        output: list[str] = []
        for item in items:
            value = item.strip()
            if not value:
                continue
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            output.append(value)
        return output

    def _extract_contacts(self, text: str) -> dict[str, list[str]]:
        emails = self._dedupe(
            re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        )
        phones = self._dedupe(re.findall(r"(?:\+?84|0)(?:[\s.\-]?\d){8,10}", text))
        links = self._dedupe(
            [link.rstrip(".,;)") for link in re.findall(r"(?:https?://|www\.)[^\s]+", text)]
        )
        return {"emails": emails[:10], "phones": phones[:10], "links": links[:10]}

    def _extract_highlights(self, text: str) -> list[str]:
        candidates = [
            line.strip(" -*:\t")
            for line in text.split("\n")
            if 20 <= len(line.strip(" -*:\t")) <= 180 and any(ch.isalpha() for ch in line)
        ]
        limit = self._cfg_positive_int("CV_PARSE_MAX_HIGHLIGHTS", 8)
        return self._dedupe(candidates)[:limit]

    @staticmethod
    def _cfg_positive_int(field_name: str, default: int) -> int:
        try:
            value = int(str(getattr(configuration, field_name, default)).strip())
        except (TypeError, ValueError):
            return default
        return value if value > 0 else default

    @staticmethod
    def _cfg_bool(field_name: str, default: bool) -> bool:
        raw_value = str(getattr(configuration, field_name, default)).strip().lower()
        if raw_value in {"1", "true", "yes", "on"}:
            return True
        if raw_value in {"0", "false", "no", "off"}:
            return False
        return default

    @staticmethod
    def _cfg_str(field_name: str, default: str) -> str:
        value = str(getattr(configuration, field_name, default) or "").strip()
        return value or default

    def _configure_ocr_environment(self) -> None:
        tessdata_prefix = self._cfg_str("TESSDATA_PREFIX", "")
        if tessdata_prefix:
            os.environ["TESSDATA_PREFIX"] = tessdata_prefix

        tesseract_cmd = self._cfg_str("TESSERACT_CMD", "")
        if not tesseract_cmd:
            tesseract_cmd = shutil.which("tesseract") or ""

        if tesseract_cmd and not os.environ.get("TESSERACT"):
            os.environ["TESSERACT"] = tesseract_cmd
