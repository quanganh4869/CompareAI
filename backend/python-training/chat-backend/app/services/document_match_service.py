import re
import unicodedata
from typing import Any

from configuration.logger.config import log
from configuration.settings import configuration
from core.exception_handler.custom_exception import ExceptionValueError
from db.models.analysis_result import AnalysisResult
from db.models.document import Document
from db.models.users import User
from services.cv_parser_service import CvParserService
from services.document_service import DocumentService
from services.providers.embedding_provider import embedding_provider
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import func, select
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
    r"(\d+)\s*\+?\s*(?:năm|nam|year|years)\b",
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


def _tokenize_words(text: str) -> set[str]:
    return set(re.findall(r"\b[\w\+#\.]{2,}\b", clean_text(text)))


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

        if self.db_session:
            new_result = AnalysisResult(
                user_id=user.id,
                cv_id=cv_document_id,
                jd_text=jd_text,
                overall_score=result["overall_score"],
                result_json=result,
            )
            self.db_session.add(new_result)
            await self.db_session.commit()
            log.info(
                "Saved analysis result for user %s and CV %s",
                user.id,
                cv_document_id,
            )

        return result

    async def list_match_history(
        self,
        *,
        user: User,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        capped_limit = max(1, min(int(limit), 100))
        safe_offset = max(0, int(offset))

        total_query = select(func.count(AnalysisResult.id)).where(
            AnalysisResult.user_id == user.id
        )
        total = (await self.db_session.execute(total_query)).scalar_one() or 0

        query = (
            select(AnalysisResult, Document.file_name, Document.metadata_json)
            .join(Document, Document.id == AnalysisResult.cv_id)
            .where(AnalysisResult.user_id == user.id)
            .order_by(AnalysisResult.created_at.desc())
            .limit(capped_limit)
            .offset(safe_offset)
        )
        rows = (await self.db_session.execute(query)).all()

        items: list[dict[str, Any]] = []
        for analysis, cv_file_name, cv_metadata_json in rows:
            jd_text = str(analysis.jd_text or "").strip()
            items.append(
                {
                    "id": analysis.id,
                    "cv_document_id": analysis.cv_id,
                    "cv_file_name": cv_file_name or f"CV #{analysis.cv_id}",
                    "cv_metadata_json": cv_metadata_json or {},
                    "overall_score": float(analysis.overall_score or 0),
                    "jd_text_preview": jd_text[:160] if jd_text else None,
                    "created_at": analysis.created_at,
                }
            )

        return {
            "items": items,
            "total": int(total),
            "limit": capped_limit,
            "offset": safe_offset,
        }

    async def get_match_history_detail(
        self,
        *,
        user: User,
        analysis_id: int,
    ) -> dict[str, Any]:
        query = (
            select(AnalysisResult, Document.file_name, Document.metadata_json)
            .join(Document, Document.id == AnalysisResult.cv_id)
            .where(
                AnalysisResult.id == analysis_id,
                AnalysisResult.user_id == user.id,
            )
        )
        row = (await self.db_session.execute(query)).first()
        if not row:
            raise ExceptionValueError(
                message="Match history record not found.",
                status_code=404,
            )

        analysis, cv_file_name, cv_metadata_json = row
        raw_result = analysis.result_json or {}

        result_payload = {
            "overall_score": float(raw_result.get("overall_score", analysis.overall_score or 0)),
            "executive_summary": str(raw_result.get("executive_summary", "")),
            "skill_gap": raw_result.get(
                "skill_gap",
                {
                    "matched_hard_skills": [],
                    "missing_hard_skills": [],
                    "matched_soft_skills": [],
                    "missing_soft_skills": [],
                },
            ),
            "deep_experience_alignment": raw_result.get("deep_experience_alignment", []),
            "actionable_recommendations": raw_result.get("actionable_recommendations", []),
        }

        return {
            "id": analysis.id,
            "cv_document_id": analysis.cv_id,
            "cv_file_name": cv_file_name or f"CV #{analysis.cv_id}",
            "cv_metadata_json": cv_metadata_json or {},
            "jd_document_id": analysis.jd_id,
            "jd_text": analysis.jd_text,
            "overall_score": float(analysis.overall_score or 0),
            "created_at": analysis.created_at,
            "result": result_payload,
        }

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

        semantic_score = self._calculate_semantic_score(cv_clean=cv_clean, jd_clean=jd_clean)

        jd_skills = extract_skills(jd_text)
        cv_skills = extract_skills(cv_text)
        matched_skills = [skill for skill in jd_skills if skill in cv_skills]
        missing_skills = [skill for skill in jd_skills if skill not in cv_skills]
        skill_score = len(matched_skills) / len(jd_skills) if jd_skills else 0.0

        cv_exp = extract_years_from_text(cv_text)
        jd_exp = extract_years_from_text(jd_text)
        exp_score = 0.0
        if jd_exp > 0:
            exp_score = min(cv_exp / jd_exp, 1.2)

        weighted = (
            (configuration.WEIGHT_SEMANTIC * semantic_score)
            + (configuration.WEIGHT_SKILL * skill_score)
            + (configuration.WEIGHT_EXPERIENCE * (exp_score / 1.2))
        )
        match_score = round(_clamp(weighted, 0.0, 1.0) * 100, 2)

        project_examples = self._extract_project_examples(cv_text)
        project_example = self._pick_project_example(
            project_examples=project_examples,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            jd_skills=jd_skills,
        )

        return {
            "overall_score": match_score,
            "executive_summary": self._generate_executive_summary(
                score=match_score,
                matched_skills=matched_skills,
                cv_exp=cv_exp,
                jd_exp=jd_exp,
                project_example=project_example,
            ),
            "skill_gap": {
                "matched_hard_skills": matched_skills[:5],
                "missing_hard_skills": missing_skills[:5],
                "matched_soft_skills": [],
                "missing_soft_skills": [],
            },
            "deep_experience_alignment": self._build_deep_experience_alignment(
                cv_exp=cv_exp,
                jd_exp=jd_exp,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                project_example=project_example,
            ),
            "actionable_recommendations": self._build_actionable_recommendations(
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                jd_skills=jd_skills,
                project_example=project_example,
            ),
        }

    def _calculate_semantic_score(self, cv_clean: str, jd_clean: str) -> float:
        if not configuration.MATCH_USE_EMBEDDING:
            return self._lexical_similarity(cv_clean=cv_clean, jd_clean=jd_clean)

        try:
            embeddings = self.embedding_service.encode([cv_clean, jd_clean])
            semantic_raw = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
            return _clamp(semantic_raw, 0.0, 1.0)
        except Exception as exc:
            log.warning("embedding_match_fallback reason=%s", str(exc))
            return self._lexical_similarity(cv_clean=cv_clean, jd_clean=jd_clean)

    @staticmethod
    def _lexical_similarity(cv_clean: str, jd_clean: str) -> float:
        cv_tokens = _tokenize_words(cv_clean)
        jd_tokens = _tokenize_words(jd_clean)
        if not cv_tokens or not jd_tokens:
            return 0.0

        intersection = len(cv_tokens.intersection(jd_tokens))
        union = len(cv_tokens.union(jd_tokens))
        if union == 0:
            return 0.0
        return _clamp(intersection / union, 0.0, 1.0)

    def _generate_executive_summary(
        self,
        score: float,
        matched_skills: list[str],
        cv_exp: int,
        jd_exp: int,
        project_example: str,
    ) -> str:
        skill_hint = ", ".join(matched_skills[:3]) if matched_skills else "chua co nhieu skill trung khop"
        exp_hint = (
            f"kinh nghiệm {cv_exp} năm so với yêu cầu {jd_exp} năm"
            if jd_exp > 0
            else f"kinh nghiệm hiện tại khoảng {cv_exp} năm"
        )
        tone = (
            "hồ sơ đang rất sát nhu cầu"
            if score >= 75
            else (
                "hồ sơ có tiềm năng, cần bổ sung một vài điểm để tăng độ tin cậy"
                if score >= 50
                else "hồ sơ cần thêm minh chứng thực tế để thuyết phục hơn"
            )
        )

        return (
            f"Tổng quan: mức độ phù hợp hiện tại là {score}%, {tone}. "
            f"Điểm sáng để khai thác là {skill_hint}; đồng thời cần đối chiếu thêm về {exp_hint}. "
            f"Ví dụ dự án để nhà tuyển dụng hình dung rõ hơn: {project_example}. "
            "Nếu bạn trình bày được kết quả, vai trò, và phạm vi ảnh hưởng trong dự án này, "
            "đánh giá sẽ tăng lên rõ rệt."
        )

    @staticmethod
    def _extract_project_examples(text: str) -> list[str]:
        raw = str(text or "").strip()
        if not raw:
            return []

        sentences = re.split(r"[\n\.\!\?;]+", raw)
        keywords = {
            "dự án",
            "du an",
            "project",
            "xây dựng",
            "xay dung",
            "thiết kế",
            "thiet ke",
            "triển khai",
            "trien khai",
            "tối ưu",
            "toi uu",
            "api",
            "microservice",
            "docker",
            "kubernetes",
            "aws",
            "gcp",
            "postgresql",
            "redis",
        }

        examples: list[str] = []
        for sentence in sentences:
            line = sentence.strip()
            if len(line) < 20:
                continue
            normalized = clean_text(line)
            if any(keyword in normalized for keyword in keywords):
                examples.append(line)
            if len(examples) >= 3:
                break
        return examples

    @staticmethod
    def _pick_project_example(
        project_examples: list[str],
        matched_skills: list[str],
        missing_skills: list[str],
        jd_skills: list[str],
    ) -> str:
        if project_examples:
            return project_examples[0]

        strong_skills = matched_skills[:2] or jd_skills[:2]
        if strong_skills:
            skill_text = ", ".join(strong_skills)
            return (
                f"Xây một module thực tế với {skill_text}: viết API, kết nối database, "
                "và trình bày rõ cách tối ưu hiệu năng hoặc xử lý lỗi."
            )

        if missing_skills:
            return (
                "Thử làm mini-project bổ sung các kỹ năng còn thiếu, "
                "ví dụ một API CRUD có logging, test, và docker compose."
            )

        return (
            "Mô tả một dự án gần đây theo cấu trúc: bài toán, giải pháp kỹ thuật, "
            "vai trò của bạn, kết quả đo được."
        )

    def _build_deep_experience_alignment(
        self,
        cv_exp: int,
        jd_exp: int,
        matched_skills: list[str],
        missing_skills: list[str],
        project_example: str,
    ) -> list[dict[str, str]]:
        return [
            {
                "requirement": (
                    f"Yêu cầu kinh nghiệm {jd_exp} năm."
                    if jd_exp > 0
                    else "JD không nêu rõ số năm kinh nghiệm, cần minh chứng qua dự án."
                ),
                "candidate_reality": f"Ứng viên hiện có khoảng {cv_exp} năm kinh nghiệm.",
                "severity": "High" if jd_exp > 0 and cv_exp < jd_exp else "Low",
                "hr_comment": (
                    f"Ví dụ để đối chiếu: {project_example}. "
                    "Nếu dự án có quy mô và độ khó tương đương với bài toán JD, điểm tin cậy tăng mạnh."
                ),
            },
            {
                "requirement": "Độ phù hợp tech stack với nhu cầu công việc.",
                "candidate_reality": (
                    "Đã trùng các kỹ năng: " + ", ".join(matched_skills[:5])
                    if matched_skills
                    else "Chưa tìm thấy kỹ năng trùng khớp rõ ràng từ CV."
                ),
                "severity": "Medium" if missing_skills else "Low",
                "hr_comment": (
                    "Cần viết rõ trong một dự án cụ thể bạn đã dùng những stack này như thế nào, "
                    "tránh liệt kê chung chung."
                ),
            },
            {
                "requirement": "Cần minh chứng tác động thực tế (impact) trong dự án.",
                "candidate_reality": "CV đã có mô tả công việc, nhưng cần thêm KPI/đo lường kết quả.",
                "severity": "Medium",
                "hr_comment": (
                    f"Gợi ý viết theo mẫu dự án: '{project_example}' + kết quả đo được "
                    "(VD: giảm latency 30%, tăng throughput 2x, giảm lỗi production)."
                ),
            },
        ]

    @staticmethod
    def _build_actionable_recommendations(
        matched_skills: list[str],
        missing_skills: list[str],
        jd_skills: list[str],
        project_example: str,
    ) -> list[dict[str, str]]:
        prioritized_missing = missing_skills[:3]
        prioritized_match = matched_skills[:3]

        issue = (
            "Thiếu minh chứng kỹ năng cho nhóm: " + ", ".join(prioritized_missing)
            if prioritized_missing
            else "Cần tăng độ cụ thể khi mô tả vai trò và kết quả trong dự án."
        )

        if prioritized_match:
            solution = (
                "Hãy dùng ngay các kỹ năng bạn đã có ("
                + ", ".join(prioritized_match)
                + ") để viết lại phần kinh nghiệm theo format STAR (Situation-Task-Action-Result)."
            )
        elif jd_skills:
            solution = (
                "Chọn 1-2 kỹ năng quan trọng trong JD ("
                + ", ".join(jd_skills[:2])
                + ") và bổ sung mini-project để tạo minh chứng thực tế."
            )
        else:
            solution = (
                "Bổ sung mô tả dự án theo hướng kết quả đo được, thay vì mô tả công việc chung chung."
            )

        rewrite_example = (
            "Nên viết: 'Trong dự án "
            + project_example
            + ", tôi phụ trách thiết kế API, tối ưu truy vấn, giảm thời gian phản hồi 35%, "
              "đồng thời thêm monitoring cảnh báo lỗi production'."
        )

        return [
            {
                "issue": issue,
                "solution": solution,
                "cv_rewrite_example": rewrite_example,
            }
        ]
