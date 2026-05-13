from fastapi import APIRouter, Request, Form, UploadFile, File, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
from services.document_match_service import DocumentMatchService
from services.document_service import DocumentService
from db.db_connection import Database
from sqlalchemy.ext.asyncio import AsyncSession
from core.api_version_router import VersionedAPIRouter

router = APIRouter()
templates = Jinja2Templates(directory=str(Path(__file__).parent.parent / "templates"))

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request, "active_page": "dashboard"})

@router.post("/analyze", response_class=HTMLResponse)
async def analyze(
    request: Request, 
    cv_file: UploadFile = File(None), 
    jd_text: str = Form(...),
):
    # This is a simplified version of the analysis flow for the SSR demo
    # In a real scenario, we'd use the services to process the file and text
    
    # Mock data for demonstration as requested by the user for the "Upgrade"
    # Normally we'd call document_match_service here
    
    match_service = DocumentMatchService(None) # Session not needed for current logic
    
    # Simulate a result based on the new schema
    result = match_service._calculate_match(cv_text="Python Senior Backend", jd_text=jd_text)
    
    return templates.TemplateResponse("report.html", {
        "request": request, 
        "result": result,
        "candidate_name": cv_file.filename if cv_file else "Ứng viên Tiềm năng",
        "active_page": "dashboard"
    })
