from typing import Annotated

from fastapi import APIRouter, Path, status

from app.api.deps import IssueServiceDep, RequestIdDep, TraceabilityServiceDep
from app.api.responses import error_responses
from app.schemas.report import (
    DataIssueCreate,
    DataIssueRead,
    DatasetReportRead,
    ModelReportRead,
    TrendReportRead,
)
from app.services.ports import DataIssueRecord

router = APIRouter(prefix="/report", tags=["rapport"])

TrendId = Annotated[str, Path(max_length=100, description="Identifiant de l'arôme")]


@router.get("", summary="Provenance et qualité du jeu de données")
async def read_dataset_report(service: TraceabilityServiceDep) -> DatasetReportRead:
    """Origine, date, sources des indicateurs, traitements, qualité calculée."""
    return DatasetReportRead.build(await service.dataset_report())


@router.get(
    "/trends/{trend_id}",
    summary="Provenance et qualité d'un arôme",
    responses=error_responses(status.HTTP_404_NOT_FOUND),
)
async def read_trend_report(
    trend_id: TrendId, service: TraceabilityServiceDep
) -> TrendReportRead:
    """Chaque indicateur de l'arôme, sa source, sa valeur ; qualité par source."""
    return TrendReportRead.build(await service.trend_report(trend_id))


@router.get("/model", summary="Métriques du modèle V1 / V2")
async def read_model_report(service: TraceabilityServiceDep) -> ModelReportRead:
    """F1 et matrice de confusion ; `available: false` en repli CSV (jamais de 5xx)."""
    return ModelReportRead.build(await service.model_report())


@router.post(
    "/issues",
    response_model=DataIssueRead,
    status_code=status.HTTP_201_CREATED,
    summary="Signaler un problème de données",
    responses=error_responses(
        status.HTTP_404_NOT_FOUND, status.HTTP_503_SERVICE_UNAVAILABLE
    ),
)
async def create_issue(
    body: DataIssueCreate, request_id: RequestIdDep, service: IssueServiceDep
) -> DataIssueRecord:
    """Enregistre le message, l'origine des données et le `request_id` de l'appel."""
    return await service.report(body.trend_id, body.message, body.contact, request_id)
