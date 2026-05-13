from db.models.base.datetime_mixin import DateTimeMixin
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base


class AuthProvider(Base, DateTimeMixin):
    __tablename__ = "auth_providers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider_name = Column(String(50), unique=True, nullable=False)  # e.g., 'google'
    is_active = Column(Boolean, default=True)

    identities = relationship("AuthIdentity", back_populates="provider")
