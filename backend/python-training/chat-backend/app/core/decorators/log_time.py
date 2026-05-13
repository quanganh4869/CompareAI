import functools
import inspect
import time

from configuration.logger.config import log


def measure_time(func):
    if inspect.iscoroutinefunction(func):

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.perf_counter()

            result = await func(*args, **kwargs)

            end_time = time.perf_counter()
            elapsed_time = end_time - start_time
            log.info(
                f"\n\n🚀 Async Function \033[92m{func.__name__}\033[0m: "
                f"Executed in \033[93m{elapsed_time:.4f}\033[0m seconds\n"
            )
            return result

        return async_wrapper
    else:

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()

            result = func(*args, **kwargs)

            end_time = time.perf_counter()
            elapsed_time = end_time - start_time

            log.info(
                f"\n\n🚀 Function \033[92m{func.__name__}\033[0m: "
                f"Executed in \033[93m{elapsed_time:.4f}\033[0m seconds\n"
            )

            return result

        return wrapper
