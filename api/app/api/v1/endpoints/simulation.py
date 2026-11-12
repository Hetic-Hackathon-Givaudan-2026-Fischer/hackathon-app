from fastapi import APIRouter, status

from app.api.deps import SimulationServiceDep
from app.api.responses import error_responses
from app.schemas.simulation import SimulationCreate, SimulationRead

router = APIRouter(tags=["simulation"])


@router.post(
    "/simulate",
    summary="Probabilité qu'une hausse soit durable (modèle V2)",
    responses=error_responses(status.HTTP_503_SERVICE_UNAVAILABLE),
)
async def simulate(
    body: SimulationCreate, service: SimulationServiceDep
) -> SimulationRead:
    """Calcul par l'API Data/IA ; `503` en repli CSV (aucun modèle)."""
    return SimulationRead.build(await service.simulate(body.to_input()))
