import urllib.parse

from configuration.logger.config import log
from configuration.settings import configuration
from core.common.http_request import SingletonRequestApi
from core.exception_handler.custom_exception import ExceptionValueError
from core.messages import CustomMessageCode
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from schemas.responses.google_auth_schema import GoogleUserSchema


class GoogleAuthService:
    @staticmethod
    def get_authorization_url() -> str:
        """Builds the URL for the Google Consent Screen."""
        params = {
            "client_id": configuration.GOOGLE_CLIENT_ID,
            "response_type": "code",
            "scope": " ".join(configuration.GOOGLE_SCOPES),
            "redirect_uri": configuration.GOOGLE_REDIRECT_URI,
            "access_type": "offline",
            "prompt": "consent",
        }
        url_params = urllib.parse.urlencode(params)
        return f"{configuration.GOOGLE_AUTH_URL}?{url_params}"

    @staticmethod
    async def exchange_code_for_token(code: str) -> dict:
        """Exchanges the authorization code for access, refresh, and ID tokens."""
        try:
            data = {
                "client_id": configuration.GOOGLE_CLIENT_ID,
                "client_secret": configuration.GOOGLE_CLIENT_SECRET,
                "redirect_uri": configuration.GOOGLE_REDIRECT_URI,
                "code": code,
                "grant_type": "authorization_code",
            }

            client_request = await SingletonRequestApi.get_instance()
            _, response = await client_request.request(
                "POST",
                configuration.GOOGLE_TOKEN_URL,
                json=data,
            )
            log.info(
                "Successfully exchanged code for token (keys=%s)",
                list(response.keys()),
            )

            return response

        except Exception as e:
            log.error(f"❌ Error exchanging code for token: {e}")
            raise ExceptionValueError(
                message=CustomMessageCode.FAILED_TO_EXCHANGE_TOKEN.title,
                message_code=CustomMessageCode.FAILED_TO_EXCHANGE_TOKEN.value,
            )

    @staticmethod
    async def decode_id_token(token: str) -> GoogleUserSchema:
        try:
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                configuration.GOOGLE_CLIENT_ID,
            )

            if id_info.get("iss") not in configuration.GOOGLE_TOKEN_ISSUERS:
                raise ExceptionValueError(message="Wrong issuer for ID token")

            google_user = GoogleUserSchema(**id_info)
            log.info(f"Successfully decoded ID token: {google_user}")
            return google_user

        except Exception as e:
            log.error(f"❌ Error decoding ID token: {e}")
            if isinstance(e, ExceptionValueError):
                raise
            raise ExceptionValueError(
                message=CustomMessageCode.GOOGLE_AUTH_FAILED.title,
                message_code=CustomMessageCode.GOOGLE_AUTH_FAILED.code,
            ) from e
