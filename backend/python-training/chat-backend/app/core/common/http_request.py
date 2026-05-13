import asyncio

import httpx
from configuration.logger.config import log


class SingletonRequestApi:
    _instance = None
    _lock = asyncio.Lock()
    _client = None

    @classmethod
    async def get_instance(cls):
        async with cls._lock:
            if cls._instance is None:
                cls._instance = SingletonRequestApi()
                cls._client = httpx.AsyncClient()  # nosec CWE-400
        return cls._instance

    async def request(
        self,
        method: str,
        url: str,
        params: dict | None = None,
        json: dict | None = None,
        headers: dict | None = None,
        timeout=60,  # noqa: ASYNC109
    ):
        try:
            default_headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
            headers = {**default_headers, **(headers or {})}
            response = await self._client.request(
                method,
                url,
                params=params,
                json=json,
                headers=headers,
                timeout=timeout,
            )
            response.raise_for_status()
            return response.status_code, response.json()
        except httpx.HTTPStatusError as e:
            log.error(f"❌ Request API Fail: {str(e)}")
            return e.response.status_code, {"message": e.response.text}
        except httpx.TimeoutException:
            log.error("❌ Request API Fail: Send Request Time Out")
            raise RuntimeError("Request Time Out")
        except Exception as e:
            log.error(f"❌ Request API Exception: {str(e)}")
            raise e
