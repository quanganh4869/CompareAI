# #!/usr/bin/env python3
import logging
import sys
from typing import ClassVar


class MaxLevelFilter(logging.Filter):
    def __init__(self, max_level):
        self.max_level = max_level

    def filter(self, record):
        return record.levelno <= self.max_level


class ColorFormatter(logging.Formatter):
    COLORS: ClassVar[dict] = {
        logging.INFO: "\033[92m",
        logging.WARNING: "\033[93m",
        logging.ERROR: "\033[91m",
        logging.CRITICAL: "\033[95m",
    }
    RESET = "\033[0m"

    def format(self, record):
        color = self.COLORS.get(record.levelno, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


class Logger(logging.Logger):
    def __init__(self, name, level=logging.NOTSET):
        super().__init__(name, level)
        self.extra_info = None

    def _log_with_extra(self, level, msg, *args, **kwargs):
        kwargs["extra"] = self.extra_info
        msg = f"{self.extra_info} {msg}" if self.extra_info else msg
        super()._log(level, msg, args, **kwargs)

    def info(self, msg, *args, **kwargs):
        self._log_with_extra(logging.INFO, msg, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        self._log_with_extra(logging.WARNING, msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        self._log_with_extra(logging.ERROR, msg, *args, **kwargs)

    def critical(self, msg, *args, **kwargs):
        self._log_with_extra(logging.CRITICAL, msg, *args, **kwargs)

    def success(self, msg, *args, **kwargs):
        self._log_with_extra(logging.INFO, msg, *args, **kwargs)


logging.setLoggerClass(Logger)
log = Logger("Noda Backend")
log.setLevel(logging.INFO)

stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setLevel(logging.INFO)
stdout_handler.addFilter(MaxLevelFilter(logging.WARNING))

stderror_handler = logging.StreamHandler(sys.stderr)
stderror_handler.setLevel(logging.ERROR)

formatter = ColorFormatter("%(asctime)s - %(levelname)s - %(message)s")
stdout_handler.setFormatter(formatter)
stderror_handler.setFormatter(formatter)

log.addHandler(stdout_handler)
log.addHandler(stderror_handler)
