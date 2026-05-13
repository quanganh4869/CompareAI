from typing import Callable

from fastapi import APIRouter


class VersionedAPIRouter(APIRouter):
    def add_api_route(self, path: str, endpoint: Callable, *args, **kwargs):
        version = getattr(endpoint, "__version__", None)
        if version:
            path = f"/{version}{path}"

            existing_tags = kwargs.get("tags", [])

            combined_tags = [
                f"{tag} - {version.replace('_', '.')}" for tag in existing_tags
            ]
            kwargs["tags"] = combined_tags

        super().add_api_route(path, endpoint, *args, **kwargs)
