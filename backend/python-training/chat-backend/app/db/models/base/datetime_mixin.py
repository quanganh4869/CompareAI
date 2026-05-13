from datetime import datetime, timezone

from sqlalchemy import TIMESTAMP, Column
from sqlalchemy.sql import func


def utc_now():
    return datetime.now(timezone.utc)


class DateTimeMixin:
    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=True,
        onupdate=utc_now,
    )
    deleted_at = Column(TIMESTAMP(timezone=True), nullable=True)
