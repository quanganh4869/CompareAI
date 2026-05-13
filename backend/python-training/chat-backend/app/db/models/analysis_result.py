from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Float,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base
from .base.datetime_mixin import DateTimeMixin


class AnalysisResult(Base, DateTimeMixin):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cv_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    jd_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    jd_text = Column(Text, nullable=True)
    
    overall_score = Column(Float, nullable=False)
    result_json = Column(JSONB, nullable=False)

    user = relationship("User")
    cv = relationship("Document", foreign_keys=[cv_id])
    jd = relationship("Document", foreign_keys=[jd_id])
