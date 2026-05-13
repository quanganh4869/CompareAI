from datetime import datetime
from typing import Any, Dict

from core.enums.document_enum import DocumentType
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: int
    owner_user_id: int
    document_type: DocumentType
    file_name: str
    storage_key: str
    metadata_json: Dict[str, Any]
    mime_type: str | None
    size_bytes: int | None
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentDownloadUrlResponse(BaseModel):
    document_id: int
    download_url: str
    expires_in: int


class DocumentDeleteResponse(BaseModel):
    document_id: int
    deleted: bool


class CvParsedContactsResponse(BaseModel):
    emails: list[str] = []
    phones: list[str] = []
    links: list[str] = []


class CvParsedResponse(BaseModel):
    document_id: int
    file_name: str
    page_count: int
    character_count: int
    is_truncated: bool
    extracted_text: str
    profile_summary: str
    contacts: CvParsedContactsResponse
    highlights: list[str] = []
    extraction_mode: str = "native"
    ocr_used: bool = False
    diagnostics: list[str] = []


class DocumentMatchExperienceResponse(BaseModel):
    cv: int
    jd: int


class DocumentMatchDiagnosticsResponse(BaseModel):
    cv_extraction_mode: str
    cv_ocr_used: bool
    cv_character_count: int
    fallback_used: bool = False
    fallback_reason: str = ""


class DocumentSkillGap(BaseModel):
    matched_hard_skills: list[str]
    missing_hard_skills: list[str]
    matched_soft_skills: list[str]
    missing_soft_skills: list[str]

class DocumentExperienceAlignment(BaseModel):
    requirement: str
    candidate_reality: str
    severity: str
    hr_comment: str

class DocumentActionableRecommendation(BaseModel):
    issue: str
    solution: str
    cv_rewrite_example: str

class DocumentMatchScoreResponse(BaseModel):
    overall_score: float
    executive_summary: str
    skill_gap: DocumentSkillGap
    deep_experience_alignment: list[DocumentExperienceAlignment]
    actionable_recommendations: list[DocumentActionableRecommendation]
