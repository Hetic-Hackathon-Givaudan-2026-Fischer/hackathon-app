from fastapi import APIRouter

from app.api.deps import TrendServiceDep
from app.schemas.trend import DashboardSummaryRead, FamilyListRead

router = APIRouter(tags=["dashboard"])


@router.get("/families", summary="Familles d'arômes")
async def list_families(service: TrendServiceDep) -> FamilyListRead:
    """Chaque famille, son nombre d'arômes et sa croissance moyenne sur 3 mois."""
    return FamilyListRead.build(await service.families())


@router.get("/dashboard/summary", summary="KPI du dashboard")
async def read_summary(service: TrendServiceDep) -> DashboardSummaryRead:
    """Calculés par l'API, identiques que les données viennent de Data/IA ou du CSV."""
    return DashboardSummaryRead.build(await service.summary())
