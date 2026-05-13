from core.enums.subscription_enum import SubscriptionPlanName
from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from .base.central_declarative_base import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscriptions_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Enum(SubscriptionPlanName), unique=True, nullable=False)
    price = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="plan")
