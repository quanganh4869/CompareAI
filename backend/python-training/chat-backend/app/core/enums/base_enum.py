from enum import Enum
from enum import IntEnum as SourceIntEnum


class _EnumBase:
    @classmethod
    def get_member_keys(cls: type[Enum]) -> list[str]:
        return list(cls.__members__.keys())

    @classmethod
    def get_member_values(cls: type[Enum]) -> list:
        return [item.value for item in cls.__members__.values()]


class IntEnum(_EnumBase, SourceIntEnum):
    """Integer enum"""


class StrEnum(_EnumBase, str, Enum):
    """String enum"""


class DictEnum(_EnumBase, dict, Enum):
    """Dict enum"""
