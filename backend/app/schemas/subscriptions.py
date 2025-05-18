from pydantic import BaseModel


class SubscriptionRequest(BaseModel):
    plan_id: str
