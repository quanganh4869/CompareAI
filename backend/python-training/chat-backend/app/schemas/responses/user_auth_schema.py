from typing import ClassVar

from pydantic import BaseModel
from schemas.responses.user_schema import UserSchema

TOKEN_EXAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNT"


class OAuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserSchema

    class Config:
        json_schema_extra: ClassVar[dict] = {
            "example": {
                "access_token": TOKEN_EXAMPLE,
                "refresh_token": TOKEN_EXAMPLE,
                "token_type": "bearer",
                "expires_in": 3600,
            }
        }
