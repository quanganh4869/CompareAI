from http import HTTPStatus


class ExceptionValueError(ValueError):
    def __init__(
        self,
        message: str,
        message_code: str | None = None,
        status_code: int = HTTPStatus.BAD_REQUEST.value,
    ):
        self.status_code = status_code
        self.message = message
        self.message_code = message_code
        super().__init__(message)
