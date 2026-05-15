from pathlib import Path
from types import SimpleNamespace

import pytest
from core.exception_handler.custom_exception import ExceptionValueError
from services.document_service import DocumentService


@pytest.mark.anyio
@pytest.mark.unit
async def test_create_access_url_local_returns_local_access_route(tmp_path: Path):
    service = DocumentService.__new__(DocumentService)
    service.storage_service = SimpleNamespace(supports_presigned_download=False)

    file_path = tmp_path / "cv-test.pdf"
    file_path.write_bytes(b"dummy cv file")

    document = SimpleNamespace(
        id=1,
        storage_key=str(file_path),
        mime_type="application/pdf",
        file_name="cv-test.pdf",
    )

    async def fake_get_accessible_document(user, document_id):
        return document

    service._get_accessible_document = fake_get_accessible_document

    response = await service.create_access_url(
        user=SimpleNamespace(id=10),
        document_id=1,
        expires_in=300,
        image_only=False,
        public_base_url="https://example.onrender.com",
    )

    assert response["document_id"] == 1
    assert "/v1_0/document/local-access?" in response["download_url"]
    assert "token=" in response["download_url"]
    assert response["expires_in"] == 300


@pytest.mark.anyio
@pytest.mark.unit
async def test_create_access_url_local_raises_not_found_when_file_missing():
    service = DocumentService.__new__(DocumentService)
    service.storage_service = SimpleNamespace(supports_presigned_download=False)

    document = SimpleNamespace(
        id=99,
        storage_key="D:/tmp/this-file-does-not-exist.pdf",
        mime_type="application/pdf",
        file_name="missing.pdf",
    )

    async def fake_get_accessible_document(user, document_id):
        return document

    service._get_accessible_document = fake_get_accessible_document

    with pytest.raises(ExceptionValueError) as exc:
        await service.create_access_url(
            user=SimpleNamespace(id=10),
            document_id=99,
            expires_in=300,
            image_only=False,
            public_base_url="https://example.onrender.com",
        )

    assert exc.value.status_code == 404
    assert "Uploaded file is not found in storage" in exc.value.message

