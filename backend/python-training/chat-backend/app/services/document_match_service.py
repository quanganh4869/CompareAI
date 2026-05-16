import re
import unicodedata
from typing import Any

from configuration.logger.config import log
from configuration.settings import configuration
from core.exception_handler.custom_exception import ExceptionValueError
from db.models.analysis_result import AnalysisResult
from db.models.users import User
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
    r"(\d+)\s*\+?\s*(?:nam|year|years)\b",
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
            f"kinh nghiem {cv_exp} nam so voi yeu cau {jd_exp} nam"
            if jd_exp > 0
            else f"kinh nghiem hien tai khoang {cv_exp} nam"
        )
        tone = (
            "ho so dang rat sat nhu cau"
            if score >= 75
            else (
                "ho so co tiem nang, can bo sung mot vai diem de tang do tin cay"
                if score >= 50
                else "ho so can them minh chung thuc te de thuyet phuc hon"
            )
        )

        return (
            f"Tong quan: muc do phu hop hien tai la {score}%, {tone}. "
            f"Diem sang de khai thac la {skill_hint}; dong thoi can doi chieu them ve {exp_hint}. "
            f"Vi du du an de nha tuyen dung hinh dung ro hon: {project_example}. "
            "Neu ban trinh bay duoc ket qua, vai tro, va pham vi anh huong trong du an nay, "
            "danh gia se tang len ro ret."
        )

    @staticmethod
    def _extract_project_examples(text: str) -> list[str]:
        raw = str(text or "").strip()
        if not raw:
            return []

        sentences = re.split(r"[\n\.\!\?;]+", raw)
        keywords = {
            "du an",
            "project",
            "xay dung",
            "thiet ke",
            "trien khai",
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
                f"Xay mot module thuc te voi {skill_text}: viet API, ket noi database, "
                "va trinh bay ro cach toi uu hieu nang hoac xu ly loi."
            )

        if missing_skills:
            return (
                "Thu lam mini-project bo sung cac ky nang con thieu, "
                "vi du mot API CRUD co logging, test, va docker compose."
            )

        return (
            "Mo ta mot du an gan day theo cau truc: bai toan, giai phap ky thuat, "
            "vai tro cua ban, ket qua do duoc."
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
                    f"Yeu cau kinh nghiem {jd_exp} nam."
                    if jd_exp > 0
                    else "JD khong neu ro so nam kinh nghiem, can minh chung qua du an."
                ),
                "candidate_reality": f"Ung vien hien co khoang {cv_exp} nam kinh nghiem.",
                "severity": "High" if jd_exp > 0 and cv_exp < jd_exp else "Low",
                "hr_comment": (
                    f"Vi du de doi chieu: {project_example}. "
                    "Neu du an co quy mo va do kho tuong duong voi bai toan JD, diem tin cay tang manh."
                ),
            },
            {
                "requirement": "Do phu hop tech stack voi nhu cau cong viec.",
                "candidate_reality": (
                    "Da trung cac ky nang: " + ", ".join(matched_skills[:5])
                    if matched_skills
                    else "Chua tim thay ky nang trung khop ro rang tu CV."
                ),
                "severity": "Medium" if missing_skills else "Low",
                "hr_comment": (
                    "Can viet ro trong mot du an cu the ban da dung nhung stack nay nhu the nao, "
                    "tranh liet ke chung chung."
                ),
            },
            {
                "requirement": "Can minh chung tac dong thuc te (impact) trong du an.",
                "candidate_reality": "CV da co mo ta cong viec, nhung can them KPI/do luong ket qua.",
                "severity": "Medium",
                "hr_comment": (
                    f"Goi y viet theo mau du an: '{project_example}' + ket qua do duoc "
                    "(VD: giam latency 30%, tang throughput 2x, giam loi production)."
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
            "Thieu minh chung ky nang cho nhom: " + ", ".join(prioritized_missing)
            if prioritized_missing
            else "Can tang do cu the khi mo ta vai tro va ket qua trong du an."
        )

        if prioritized_match:
            solution = (
                "Hay dung ngay cac ky nang ban da co ("
                + ", ".join(prioritized_match)
                + ") de viet lai phan kinh nghiem theo format STAR (Situation-Task-Action-Result)."
            )
        elif jd_skills:
            solution = (
                "Chon 1-2 ky nang quan trong trong JD ("
                + ", ".join(jd_skills[:2])
                + ") va bo sung mini-project de tao minh chung thuc te."
            )
        else:
            solution = (
                "Bo sung mo ta du an theo huong ket qua do duoc, thay vi mo ta cong viec chung chung."
            )

        rewrite_example = (
            "Nen viet: 'Trong du an "
            + project_example
            + ", toi phu trach thiet ke API, toi uu truy van, giam thoi gian phan hoi 35%, "
              "dong thoi them monitoring canh bao loi production'."
        )

        return [
            {
                "issue": issue,
                "solution": solution,
                "cv_rewrite_example": rewrite_example,
            }
        ]

