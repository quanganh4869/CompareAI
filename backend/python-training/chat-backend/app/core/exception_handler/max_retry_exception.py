class MaxRetriesExceededError(Exception):
    def __init__(self, function_name: str, last_exception: Exception):
        super().__init__(
            f"{function_name} failed after max retries. Last error: {last_exception}"
        )
        self.function_name = function_name
        self.last_exception = last_exception
