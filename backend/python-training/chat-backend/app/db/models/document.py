from core.enums.document_enum import DocumentType
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base
from .base.datetime_mixin import DateTimeMixin


class Document(Base, DateTimeMixin):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint(
            "document_type IN ('CV', 'JD')",
            name="ck_documents_document_type",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    document_type = Column(
        Enum(
            DocumentType,
            name="document_type",
            native_enum=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    file_name = Column(String(512), nullable=False)
    storage_key = Column(String(1024), nullable=False, unique=True)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    source = Column(String(50), nullable=False, default="UPLOADED")
    metadata_json = Column(JSONB, nullable=False, default=dict)

    user = relationship("User")
