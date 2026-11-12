from fastapi import APIRouter

from app.api.v1.endpoints import (
    dashboard,
    health,
    report,
    showroom,
    simulation,
    trends,
)

# Une v2 aurait son propre routeur, monté à côté : la v1 reste servie telle quelle
API_V1_PREFIX = "/api/v1"

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(trends.router)
api_router.include_router(report.router)
api_router.include_router(showroom.router)
api_router.include_router(simulation.router)
