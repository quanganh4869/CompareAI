from db.models.base.datetime_mixin import DateTimeMixin
from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base


class AuthIdentity(Base, DateTimeMixin):
    __tablename__ = "auth_identities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("auth_providers.id"), nullable=False)

    # This stores the 'sub' (Subject ID) from Google
    provider_user_id = Column(String(255), nullable=False)

    user = relationship("User", back_populates="identities")
    provider = relationship("AuthProvider", back_populates="identities")

    # Ensure a user can't link the same google account twice
    __table_args__ = (
        UniqueConstraint("provider_id", "provider_user_id", name="_provider_user_uc"),
    )
