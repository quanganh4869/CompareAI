from api.document_api import router as document_router
from api.health_check import router as health_check_router
from api.oauth_api import router as oauth_router
from api.user_api import router as user_router
from core.api_version_router import VersionedAPIRouter

router = VersionedAPIRouter()

router.include_router(health_check_router, tags=["health-check"])
router.include_router(oauth_router, prefix="/auth", tags=["OAuth"])
router.include_router(user_router, prefix="/user", tags=["User"])
router.include_router(document_router, prefix="/document", tags=["Document"])
