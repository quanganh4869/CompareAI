from types import SimpleNamespace

import pytest
from core.exception_handler.custom_exception import ExceptionValueError
from services.document_match_service import DocumentMatchService


class FakeEmbeddingProvider:
    def encode(self, texts: list[str]):
        return [[1.0, 0.0], [0.8, 0.2]]


class FakeCvParserService:
    async def parse_cv_document(self, user, document_id: int):
        return {
            "document_id": document_id,
            "extracted_text": "Python AWS 4 years experience",
            "character_count": 120,
            "extraction_mode": "native",
            "ocr_used": False,
        }


class FakeCvParserOcrFailService:
    async def parse_cv_document(self, user, document_id: int):
        raise ExceptionValueError(
            message="Cannot extract text from this CV. PyMuPDF diagnostics: p1[t=0,b=0,w=0,img=1][ocr_error=No tessdata specified and Tesseract is not installed]",
            status_code=422,
        )


class FakeDocumentService:
    async def _get_accessible_document(self, user, document_id: int):
        return SimpleNamespace(
            metadata_json={"target_role": "Backend Developer"},
            file_name="candidate_cv.pdf",
        )


@pytest.mark.unit
def test_calculate_match_weight_formula():
    service = DocumentMatchService.__new__(DocumentMatchService)
    service.embedding_service = FakeEmbeddingProvider()

    result = service._calculate_match(
        cv_text="Python AWS 4 years experience",
        jd_text="Need Python AWS with 3 years experience",
    )

    assert 0 <= result["overall_score"] <= 100
    assert "executive_summary" in result
    assert "skill_gap" in result
    assert "deep_experience_alignment" in result
    assert "actionable_recommendations" in result


@pytest.mark.anyio
@pytest.mark.unit
async def test_match_cv_with_jd_requires_jd_text():
    service = DocumentMatchService.__new__(DocumentMatchService)
    service.cv_parser_service = FakeCvParserService()
    service.embedding_service = FakeEmbeddingProvider()
    service.db_session = None

    with pytest.raises(ExceptionValueError):
        await service.match_cv_with_jd_text(
            user=SimpleNamespace(id=1),
            cv_document_id=1,
            jd_text="   ",
        )


@pytest.mark.anyio
@pytest.mark.unit
async def test_match_cv_with_jd_success_includes_diagnostics():
    service = DocumentMatchService.__new__(DocumentMatchService)
    service.cv_parser_service = FakeCvParserService()
    service.embedding_service = FakeEmbeddingProvider()
    service.db_session = None

    result = await service.match_cv_with_jd_text(
        user=SimpleNamespace(id=1),
        cv_document_id=10,
        jd_text="Need Python AWS with 3 years experience",
    )

    assert "diagnostics" in result
    assert result["diagnostics"]["cv_extraction_mode"] == "native"
    assert result["diagnostics"]["cv_ocr_used"] is False
    assert result["diagnostics"]["cv_character_count"] == 120
    assert result["diagnostics"]["fallback_used"] is False


@pytest.mark.anyio
@pytest.mark.unit
async def test_match_cv_with_jd_fallback_when_ocr_unavailable():
    service = DocumentMatchService.__new__(DocumentMatchService)
    service.cv_parser_service = FakeCvParserOcrFailService()
    service.embedding_service = FakeEmbeddingProvider()
    service.document_service = FakeDocumentService()
    service.db_session = None

    result = await service.match_cv_with_jd_text(
        user=SimpleNamespace(id=1),
        cv_document_id=20,
        jd_text="Need backend developer with Python and AWS",
    )

    assert result["diagnostics"]["fallback_used"] is True
    assert "tesseract is not installed" in result["diagnostics"]["fallback_reason"].lower()
    assert result["diagnostics"]["cv_extraction_mode"] == "fallback_metadata"
