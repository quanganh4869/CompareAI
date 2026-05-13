from typing import Optional

from pydantic import BaseModel, EmailStr, HttpUrl


class GoogleUserSchema(BaseModel):
    # This schema must not contain any token field.
    sub: str
    email: EmailStr
    email_verified: Optional[bool] = None
    name: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    picture: Optional[HttpUrl] = None
    iss: Optional[str] = None
    aud: Optional[str] = None
    iat: Optional[int] = None
    exp: Optional[int] = None
    t: Optional[int] = None
