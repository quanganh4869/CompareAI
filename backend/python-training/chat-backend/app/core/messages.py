from enum import Enum

from core.common.i18n import i18n as _


class CustomMessageCode(Enum):
    """Custom message codes for application-specific errors and messages."""

    def __new__(cls, code, title, description):
        obj = object.__new__(cls)
        obj._value_ = code
        obj._title = title
        obj._description = description
        return obj

    @property
    def code(self):
        return self.value

    @property
    def title(self):
        # Using the i18n instance to translate the title
        return _(self._title)

    @property
    def description(self):
        return self._description

    def __str__(self):
        return f"{self.code} - {self.title}: {self.description}"

    # Invalid
    INVALID_REQUEST_PAYLOAD = (
        4422,
        "Invalid request payload!",
        "The request payload is invalid or improperly formatted",
    )

    # Permission
    FORBIDDEN_ERROR = (
        4403,
        "Permission Denied!",
        "You do not have the necessary permissions to perform this action or access this resource.",
    )

    # Server Errors
    UNKNOWN_ERROR = (
        5000,
        _("Unknown error!", "「不明なエラーです!"),
        "An unexpected error occurred.",
    )

    UNAUTHORIZED_ERROR = (
        4400,
        "Unauthorized!",
        "You must be authenticated to access this resource.",
    )

    TOKEN_EXPIRED = (
        4413,
        "Token expired!",
        "Your access token has expired. Please log in again.",
    )

    # User
    USER_NOT_FOUND = (
        4404,
        "User not found!",
        "The requested user does not exist.",
    )

    PLAN_NOT_FOUND = (
        4405,
        "Plan not found!",
        "The requested subscription plan does not exist.",
    )

    # Google Auth Error Message
    FAILED_TO_EXCHANGE_TOKEN = (
        4401,
        "Failed to exchange token",
        "Failed to exchange the authorization code for access, refresh, and ID tokens.",
    )

    GOOGLE_AUTH_SUCCESS = (
        4410,
        "Google Auth Success",
        "Google Auth Success",
    )

    GOOGLE_AUTH_FAILED = (
        4411,
        "Google Auth Failed",
        "Google Auth Failed",
    )

    TOKEN_SIGNATURE_VERIFICATION_FAILED = (
        4412,
        "Token Signature Verification Failed",
        "Token Signature Verification Failed",
    )
