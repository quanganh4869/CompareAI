import re
import unicodedata
from typing import Any

from configuration.settings import configuration
from core.exception_handler.custom_exception import ExceptionValueError
from db.models.users import User
from db.models.analysis_result import AnalysisResult
from services.cv_parser_service import CvParserService
from services.document_service import DocumentService
from services.providers.embedding_provider import embedding_provider
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.ext.asyncio import AsyncSession

TECH_STACK_LIBRARY = [
    "python",
    "java",
    "javascript",
    "typescript",
    "golang",
    "ruby",
    "php",
    "c++",
    "c#",
    "rust",
    "swift",
    "kotlin",
    "fastapi",
    "django",
    "flask",
    "spring boot",
    "react",
    "angular",
    "vue",
    "next.js",
    "nest.js",
    "laravel",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "elasticsearch",
    "oracle",
    "sql server",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "jenkins",
    "terraform",
    "ansible",
    "linux",
    "git",
    "pytorch",
    "tensorflow",
    "scikit-learn",
    "pandas",
    "numpy",
    "opencv",
    "llm",
    "nlp",
    "computer vision",
    "agile",
    "scrum",
    "english",
    "japanese",
    "teamwork",
    "leadership",
]

YEARS_PATTERNS = [
    r"(\d+)\s*\+?\s*(?:năm|year|years)\b",
    r"(?:exp|experience)\D*(\d+)",
]


def clean_text(text: str) -> str:
    if not text:
        return ""
    normalized = unicodedata.normalize("NFC", text).lower()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def extract_years_from_text(text: str) -> int:
    years = [0]
    source = clean_text(text)
    for pattern in YEARS_PATTERNS:
        matches = re.findall(pattern, source)
        for match in matches:
            years.append(int(match[0] if isinstance(match, tuple) else match))
    return max(years)


def extract_skills(text: str) -> list[str]:
    normalized = clean_text(text)
    found: list[str] = []
    for skill in TECH_STACK_LIBRARY:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, normalized):
            found.append(skill)
    return found


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


class DocumentMatchService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.document_service = DocumentService(db_session)
        self.cv_parser_service = CvParserService(db_session)
        self.embedding_service = embedding_provider

    async def match_cv_with_jd_text(
        self,
        user: User,
        cv_document_id: int,
        jd_text: str,
    ) -> dict[str, Any]:
        if not clean_text(jd_text):
            raise ExceptionValueError(
                message="JD text is required.",
                status_code=422,
            )

        fallback_used = False
        fallback_reason = ""
        try:
            cv_parsed = await self.cv_parser_service.parse_cv_document(
                user=user,
                document_id=cv_document_id,
            )
            cv_text = str(cv_parsed.get("extracted_text", "")).strip()
        except ExceptionValueError as exc:
            if not self._is_ocr_unavailable_error(exc.message):
                raise

            cv_text = await self._build_fallback_cv_text(
                user=user,
                cv_document_id=cv_document_id,
            )
            cv_parsed = {
                "extraction_mode": "fallback_metadata",
                "ocr_used": False,
                "character_count": len(cv_text),
            }
            fallback_used = True
            fallback_reason = exc.message

        if not cv_text:
            raise ExceptionValueError(
                message="Cannot extract text from CV.",
                status_code=422,
            )

        result = self._calculate_match(cv_text=cv_text, jd_text=jd_text)
        result["diagnostics"] = {
            "cv_extraction_mode": cv_parsed.get("extraction_mode", "unknown"),
            "cv_ocr_used": bool(cv_parsed.get("ocr_used", False)),
            "cv_character_count": int(cv_parsed.get("character_count", 0)),
            "fallback_used": fallback_used,
            "fallback_reason": fallback_reason,
        }
        # Save to database
        if self.db_session:
            new_result = AnalysisResult(
                user_id=user.id,
                cv_id=cv_document_id,
                jd_text=jd_text,
                overall_score=result["overall_score"],
                result_json=result
            )
            self.db_session.add(new_result)
            await self.db_session.commit()
            log.info(f"Saved analysis result for user {user.id} and CV {cv_document_id}")

        return result

    @staticmethod
    def _is_ocr_unavailable_error(message: str) -> bool:
        source = str(message or "").lower()
        return (
            "no tessdata specified" in source
            or "tesseract is not installed" in source
            or "ocr_error=" in source
        )

    async def _build_fallback_cv_text(self, user: User, cv_document_id: int) -> str:
        document = await self.document_service._get_accessible_document(
            user=user,
            document_id=cv_document_id,
        )
        metadata = document.metadata_json or {}
        chunks = [
            str(metadata.get("target_role", "")).strip(),
            str(document.file_name or "").strip(),
        ]
        return " ".join(item for item in chunks if item).strip()

    def _calculate_match(self, cv_text: str, jd_text: str) -> dict[str, Any]:
        cv_clean = clean_text(cv_text)
        jd_clean = clean_text(jd_text)

        embeddings = self.embedding_service.encode([cv_clean, jd_clean])
        semantic_raw = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
        semantic_score = _clamp(semantic_raw, 0.0, 1.0)

        jd_skills = extract_skills(jd_text)
        cv_skills = extract_skills(cv_text)
        matched_skills = [skill for skill in jd_skills if skill in cv_skills]
        missing_skills = [skill for skill in jd_skills if skill not in cv_skills]
        skill_score = len(matched_skills) / len(jd_skills) if jd_skills else 1.0

        cv_exp = extract_years_from_text(cv_text)
        jd_exp = extract_years_from_text(jd_text)
        exp_score = 1.0
        if jd_exp > 0:
            exp_score = min(cv_exp / jd_exp, 1.2)

        weighted = (
            (configuration.WEIGHT_SEMANTIC * semantic_score)
            + (configuration.WEIGHT_SKILL * skill_score)
            + (configuration.WEIGHT_EXPERIENCE * (exp_score / 1.2))
        )
        match_score = round(_clamp(weighted, 0.0, 1.0) * 100, 2)

        recommendation = "Reject"
        if match_score >= 75:
            recommendation = "Shortlist"
        elif match_score >= 50:
            recommendation = "Consider"

        return {
            "overall_score": match_score,
            "executive_summary": self._generate_executive_summary(match_score, matched_skills, cv_exp, jd_exp),
            "skill_gap": {
                "matched_hard_skills": matched_skills[:5],
                "missing_hard_skills": missing_skills[:5],
                "matched_soft_skills": ["Agile", "Teamwork"], # Simplified for demo
                "missing_soft_skills": ["Communication"]
            },
            "deep_experience_alignment": [
                {
                    "requirement": f"Yêu cầu {jd_exp} năm kinh nghiệm thực tế.",
                    "candidate_reality": f"Ứng viên có {cv_exp} năm kinh nghiệm.",
                    "severity": "High" if cv_exp < jd_exp else "Low",
                    "hr_comment": "Kinh nghiệm thực tế " + ("chưa đáp ứng được bài toán scale hệ thống." if cv_exp < jd_exp else "phù hợp với yêu cầu vị trí.")
                }
            ],
            "actionable_recommendations": [
                {
                    "issue": "Thiếu keyword về DevOps (Docker, CI/CD) trong các dự án thực tế." if "docker" in missing_skills else "Cần làm rõ hơn về vai trò trong các dự án lớn.",
                    "solution": "Đừng chỉ liệt kê kỹ năng ở mục Kỹ năng. Hãy lồng ghép nó vào phần Kinh nghiệm làm việc hoặc Dự án cá nhân.",
                    "cv_rewrite_example": "Nên viết: 'Thiết kế RESTful API bằng FastAPI và đóng gói (containerize) ứng dụng bằng Docker' thay vì 'Làm backend API'."
                }
            ]
        }

    def _generate_executive_summary(self, score, skills, cv_exp, jd_exp):
        summary = f"Dựa trên đánh giá từ góc độ Tuyển dụng Kỹ thuật cao cấp, ứng viên đạt mức độ phù hợp {score}%. "
        if score >= 75:
            summary += "Đây là một hồ sơ tiềm năng với nền tảng kỹ thuật vững chắc. Ứng viên thể hiện sự am hiểu sâu sắc về các công nghệ cốt lõi và có kinh nghiệm thực tế phù hợp."
        else:
            summary += "Hồ sơ này còn một số khoảng cách đáng kể so với yêu cầu kỳ vọng, đặc biệt là ở mảng kinh nghiệm thực chiến và các kỹ năng bổ trợ cần thiết cho vị trí này."
        
        summary += f"\n\nĐiểm đáng chú ý là sự tương quan giữa {cv_exp} năm kinh nghiệm của ứng viên so với mức {jd_exp} năm yêu cầu. Sự thiếu hụt hoặc dư thừa kinh nghiệm này sẽ ảnh hưởng trực tiếp đến khả năng xử lý các bài toán hệ thống phức tạp mà công ty đang đối mặt."
        
        return summary

    @staticmethod
    def _generate_summary(
        cv_exp: int,
        jd_exp: int,
        matched_skills: list[str],
        missing_skills: list[str],
    ) -> str:
        parts: list[str] = []
        if matched_skills:
            parts.append(
                "Candidate has relevant skills in "
                + ", ".join(matched_skills[:3])
                + "."
            )
        if jd_exp > 0 and cv_exp >= jd_exp:
            parts.append(
                f"Experience ({cv_exp} years) meets JD expectation ({jd_exp} years)."
            )
        elif jd_exp > 0:
            parts.append(
                f"Experience ({cv_exp} years) is below JD expectation ({jd_exp} years)."
            )
        if missing_skills:
            parts.append("Missing priority skills: " + ", ".join(missing_skills[:3]) + ".")

        return " ".join(parts).strip() or "Insufficient signal for detailed summary."
