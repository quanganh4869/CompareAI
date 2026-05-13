import sys
import io
import os
import pytest
from pathlib import Path

# Add app to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app')))

from fastapi import UploadFile
from configuration.settings import configuration
from services.file_storage_service import get_storage_service, S3FileStorageService
from services.cv_parser_service import CvParserService
from db.models.users import User
from db.models.document import Document
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.mark.anyio
@pytest.mark.integration
async def test_cloudflare_r2_integration():
    # Only run this test if STORAGE_STRATEGY is r2
    if configuration.STORAGE_STRATEGY != "r2":
        pytest.skip("STORAGE_STRATEGY is not r2. Skipping R2 integration test.")

    # 1. Initialize Storage Service
    storage = get_storage_service()
    assert isinstance(storage, S3FileStorageService), "Storage service is not S3FileStorageService for r2"
    assert storage.bucket_name == configuration.R2_BUCKET_NAME
    assert storage.endpoint_url == configuration.R2_ENDPOINT_URL

    # 2. Test Upload (save_file)
    test_content = b"Dummy CV PDF Content for R2 Testing"
    file_obj = io.BytesIO(test_content)
    upload_file = UploadFile(
        file=file_obj, 
        filename="test_cv_r2.pdf", 
        headers={"content-type": "application/pdf"}
    )
    
    # Fastapi UploadFile compat
    upload_file.file.seek = file_obj.seek
    upload_file.file.read = file_obj.read

    print("\n[R2 Test] Uploading file to R2...")
    object_key = await storage.save_file(upload_file, sub_dir="test_documents")
    assert object_key is not None
    assert object_key.startswith("test_documents/")
    print(f"[R2 Test] Upload successful: {object_key}")

    try:
        # 3. Test Object Exists
        print("[R2 Test] Checking object_exists...")
        exists = await storage.object_exists(object_key)
        assert exists is True, "Object should exist in R2 after upload"
        print("[R2 Test] Object exists verified.")

        # 4. Test Presigned URL
        print("[R2 Test] Generating Presigned URL...")
        url_info = await storage.create_presigned_download(object_key, expires_seconds=300)
        assert "download_url" in url_info
        assert "http" in url_info["download_url"]
        print(f"[R2 Test] Presigned URL generated: {url_info['download_url']}")

        # 5. Test cv_parser_service._read_document_bytes
        print("[R2 Test] Testing direct S3 stream read via CvParserService...")
        mock_db_session = AsyncMock(spec=AsyncSession)
        cv_parser = CvParserService(db_session=mock_db_session)
        
        # We test _read_document_bytes directly to verify boto3 get_object stream reading
        downloaded_bytes = await cv_parser._read_document_bytes(object_key)
        assert downloaded_bytes == test_content, "Downloaded content does not match uploaded content"
        print("[R2 Test] S3 stream read successful.")

    finally:
        # 6. Test Delete File
        print(f"[R2 Test] Cleaning up: deleting {object_key}...")
        await storage.delete_file(object_key)
        
        # Verify deletion
        exists_after = await storage.object_exists(object_key)
        assert exists_after is False, "Object should not exist after deletion"
        print("[R2 Test] Cleanup successful.")

