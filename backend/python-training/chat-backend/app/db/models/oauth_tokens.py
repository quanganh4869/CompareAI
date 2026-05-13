import uuid

from db.models.base.datetime_mixin import DateTimeMixin
from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base


class OAuthToken(Base, DateTimeMixin):
    __tablename__ = "oauth_tokens"

    token_uuid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)

    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)

    user = relationship("User", back_populates="tokens")
