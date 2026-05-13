from core.enums.subscription_enum import SubscriptionPlanName
from pydantic import BaseModel


class PlanResponse(BaseModel):
    id: int
    name: SubscriptionPlanName
    price: int
    description: str | None = None

    class Config:
        from_attributes = True
        use_enum_values = True
