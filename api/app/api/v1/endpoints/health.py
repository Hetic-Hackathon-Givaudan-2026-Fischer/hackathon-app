from fastapi import APIRouter, status

from app.api.deps import HealthServiceDep
from app.api.responses import error_responses
from app.schemas.health import HealthRead

router = APIRouter(tags=["santé"])


@router.get(
    "/health",
    summary="État de l'API, de la base et de l'API Data/IA",
    responses=error_responses(status.HTTP_503_SERVICE_UNAVAILABLE),
)
async def read_health(service: HealthServiceDep) -> HealthRead:
    """Healthcheck Docker : sain = API démarrée ET base joignable.

    `data_ai` est informatif : Data/IA coupée ne rend pas l'API « unhealthy ».
    """
    return await service.check()
