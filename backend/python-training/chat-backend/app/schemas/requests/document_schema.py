from pydantic import BaseModel, Field


class DocumentAccessUrlRequest(BaseModel):
    expires_in: int | None = Field(default=None, ge=60, le=3600)
    image_only: bool = False


class DocumentMatchScoreRequest(BaseModel):
    cv_document_id: int = Field(gt=0)
    jd_text: str = Field(min_length=1)
