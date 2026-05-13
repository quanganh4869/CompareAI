import asyncio
import time
from asyncio import sleep as async_sleep  # noqa: ASYNC106
from functools import wraps
from time import sleep
from typing import Callable, Optional

from configuration.logger.config import log
from core.exception_handler.max_retry_exception import MaxRetriesExceededError


def async_retry_action(max_retries=3, delay=0):
    def decorator_retry(func):
        @wraps(func)
        async def wrapper_retry(*args, **kwargs):
            attempt = 0
            while attempt < max_retries:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:  # noqa: PERF203
                    log.error(
                        '❌ Retry {} times and fail with error "{}"\n\n'.format(
                            str(attempt + 1), str(e)
                        )
                    )
                    attempt += 1
                    if attempt < max_retries and delay:
                        log.info("⏳ Retrying in {} seconds...".format(str(delay)))
                        await async_sleep(delay)
            return None

        return wrapper_retry

    return decorator_retry


def retry_action(max_retries=3, delay=0):
    def decorator_retry(func):
        @wraps(func)
        def wrapper_retry(*args, **kwargs):
            attempt = 0
            while attempt < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:  # noqa: PERF203
                    log.error(
                        '❌ Retry {} times and fail with error "{}"\n\n'.format(
                            str(attempt + 1), str(e)
                        )
                    )
                    attempt += 1
                    if attempt < max_retries and delay:
                        log.info("⏳ Retrying in {} seconds...".format(str(delay)))
                        sleep(delay)
            return None

        return wrapper_retry

    return decorator_retry


def retry_on_failure(
    retries: int = 3,
    backoff: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
    log_prefix: Optional[str] = None,
    notify_slack: bool = False,
):
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            delay = backoff
            for attempt in range(1, retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:  # noqa: PERF203
                    if attempt == retries:
                        log.error(
                            f"{log_prefix or func.__name__} failed after {retries} retries: {e}"
                        )
                        raise MaxRetriesExceededError(func.__name__, e)
                    log.warning(
                        f"{log_prefix or func.__name__} failed (attempt {attempt}), retrying in {delay}s: {e}"
                    )
                    await asyncio.sleep(delay)
                    delay *= backoff_factor

        return wrapper

    return decorator


def sync_retry_on_failure(
    retries: int = 3,
    backoff: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,),
    log_prefix: Optional[str] = None,
    notify_slack: bool = False,
):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = backoff
            for attempt in range(1, retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:  # noqa: PERF203
                    if attempt == retries:
                        log.error(
                            f"{log_prefix or func.__name__} failed after {retries} retries: {e}"
                        )
                        raise MaxRetriesExceededError(func.__name__, e)
                    log.warning(
                        f"{log_prefix or func.__name__} failed (attempt {attempt}), retrying in {delay}s: {e}"
                    )
                    time.sleep(delay)
                    delay *= backoff_factor

        return wrapper

    return decorator
