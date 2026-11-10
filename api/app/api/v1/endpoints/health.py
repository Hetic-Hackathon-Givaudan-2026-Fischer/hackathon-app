from fastapi import APIRouter, status

from app.api.deps import HealthServiceDep
from app.schemas.error import ErrorRead
from app.schemas.health import HealthRead

router = APIRouter(tags=["santé"])


@router.get(
    "/health",
    summary="État de l'API et de la base",
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ErrorRead}},
)
async def read_health(service: HealthServiceDep) -> HealthRead:
    """Utilisé par le healthcheck Docker : sain = API démarrée ET base joignable."""
    return await service.check()
