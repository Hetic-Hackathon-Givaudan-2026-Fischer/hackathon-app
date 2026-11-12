from typing import Annotated

from fastapi import APIRouter, Path, Query, status

from app.api.deps import TrendServiceDep
from app.api.responses import error_responses
from app.schemas.trend import TrendDetailRead, TrendListQuery, TrendListRead

router = APIRouter(prefix="/trends", tags=["tendances"])

TrendId = Annotated[str, Path(max_length=100, description="Identifiant de l'arôme")]


@router.get("", summary="Arômes filtrés, triés et paginés")
async def list_trends(
    params: Annotated[TrendListQuery, Query()], service: TrendServiceDep
) -> TrendListRead:
    """Filtres famille, statut et recherche (nom ou identifiant, sans accents).

    Les valeurs absentes sont triées en dernier. En repli CSV, `status` et
    `score` sont null : filtrer par statut ne renvoie alors rien.
    """
    return TrendListRead.build(await service.search(params.to_query()))


@router.get(
    "/{trend_id}",
    summary="Fiche d'un arôme",
    responses=error_responses(status.HTTP_404_NOT_FOUND),
)
async def read_trend(trend_id: TrendId, service: TrendServiceDep) -> TrendDetailRead:
    """Indicateurs, verdict du modèle et série temporelle (Data/IA seulement)."""
    return TrendDetailRead.build(await service.get(trend_id))
