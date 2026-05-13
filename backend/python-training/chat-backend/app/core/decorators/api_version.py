from typing import Callable


def version(major: int, minor: int = 0):
    def decorator(func: Callable):
        setattr(func, "__version__", f"v{major}_{minor}")  # noqa: B010
        return func

    return decorator
