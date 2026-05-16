from pathlib import Path

from core.exception_handler.custom_exception import ExceptionValueError
from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from services.document_match_service import DocumentMatchService

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse(
        "dashboard.html", {"request": request, "active_page": "dashboard"}
    )


@router.post("/analyze", response_class=HTMLResponse)
async def analyze(
    request: Request,
    cv_file: UploadFile = File(None),
    jd_text: str = Form(...),
):
    match_service = DocumentMatchService(None)

    if not cv_file:
        return templates.TemplateResponse(
            "report.html",
            {
                "request": request,
                "result": {
                    "overall_score": 0,
                    "executive_summary": "Vui long tai len CV de he thong phan tich.",
                    "skill_gap": {
                        "matched_hard_skills": [],
                        "missing_hard_skills": [],
                        "matched_soft_skills": [],
                        "missing_soft_skills": [],
                    },
                    "deep_experience_alignment": [],
                    "actionable_recommendations": [],
                },
                "candidate_name": "Ung vien",
                "active_page": "dashboard",
            },
        )

    try:
        file_bytes = await cv_file.read()
        cv_file.file.seek(0)
        _, extracted_text, _, _, _ = (
            match_service.cv_parser_service._extract_text_from_pdf(file_bytes)
        )
        cv_text = (extracted_text or "").strip()
    except Exception as exc:
        raise ExceptionValueError(
            message=f"Khong the doc CV: {exc}",
            status_code=422,
        ) from exc

    if not cv_text:
        raise ExceptionValueError(
            message=f"Khong the trich xuat noi dung CV tu file {cv_file.filename}.",
            status_code=422,
        )

    result = match_service._calculate_match(cv_text=cv_text, jd_text=jd_text)

    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "result": result,
            "candidate_name": cv_file.filename if cv_file else "Ung vien",
            "active_page": "dashboard",
        },
    )
