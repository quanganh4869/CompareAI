from core.enums.user_enum import UserRole
from db.models.base.datetime_mixin import DateTimeMixin
from sqlalchemy import Column, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base


class User(Base, DateTimeMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    email_hash = Column(String(255), unique=True, nullable=False)
    email_encrypted = Column(Text, nullable=False)

    name_hash = Column(String(255), nullable=True)
    name_encrypted = Column(Text, nullable=True)

    avatar_url = Column(String(255), nullable=True)

    role = Column(Enum(UserRole), nullable=True, default=UserRole.USER)

    plan_id = Column(Integer, ForeignKey("subscriptions_plans.id"), nullable=True)

    plan = relationship("SubscriptionPlan", back_populates="users")
    identities = relationship("AuthIdentity", back_populates="user")
    tokens = relationship(
        "OAuthToken", back_populates="user", cascade="all, delete-orphan"
    )
