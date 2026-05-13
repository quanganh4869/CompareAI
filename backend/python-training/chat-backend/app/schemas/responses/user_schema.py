from configuration.settings import configuration
from core.common.aes_gcm import AesGCMRotation
from core.enums.user_enum import UserRole
from pydantic import BaseModel, ConfigDict, model_validator

aes_gcm = AesGCMRotation(configuration=configuration)


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None = None
    avatar_url: str | None = None
    role: UserRole | None = UserRole.USER
    plan_id: int | None = None

    @model_validator(mode="before")
    @classmethod
    def decrypt_sensitive_fields(cls, data: object) -> object:
        if isinstance(data, dict):
            prepared_data = dict(data)
            encrypted_email = prepared_data.get(
                "email_encrypted", prepared_data.get("email")
            )
            encrypted_name = prepared_data.get(
                "name_encrypted", prepared_data.get("name")
            )
        else:
            prepared_data = {
                "id": getattr(data, "id", None),
                "avatar_url": getattr(data, "avatar_url", None),
                "role": getattr(data, "role", UserRole.USER),
                "plan_id": getattr(data, "plan_id", None),
            }
            encrypted_email = getattr(data, "email_encrypted", None)
            encrypted_name = getattr(data, "name_encrypted", None)

        prepared_data["email"] = (
            aes_gcm.decrypt_data(encrypted_email) if encrypted_email else None
        )
        prepared_data["name"] = (
            aes_gcm.decrypt_data(encrypted_name) if encrypted_name else None
        )

        return prepared_data
