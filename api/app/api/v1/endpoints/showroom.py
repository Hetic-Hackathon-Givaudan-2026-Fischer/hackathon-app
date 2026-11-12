from typing import Annotated

from fastapi import APIRouter, Path, status

from app.api.deps import ShowroomLinkServiceDep, ShowroomViewServiceDep
from app.api.responses import error_responses
from app.schemas.showroom import (
    ShowroomLinkCreate,
    ShowroomLinkCreatedRead,
    ShowroomLinkRead,
    ShowroomRead,
)

router = APIRouter(prefix="/showroom", tags=["showroom"])

DB_DOWN = error_responses(status.HTTP_503_SERVICE_UNAVAILABLE)


# Routes de gestion d'abord : sinon « links » serait lu comme un jeton
@router.post(
    "/links",
    status_code=status.HTTP_201_CREATED,
    summary="Créer un lien showroom",
    responses=DB_DOWN,
)
async def create_link(
    body: ShowroomLinkCreate, service: ShowroomLinkServiceDep
) -> ShowroomLinkCreatedRead:
    """Le jeton et l'URL ne sont renvoyés qu'ici, une seule fois."""
    created = await service.create(body.client_label, body.families, body.ttl_hours)
    return ShowroomLinkCreatedRead.from_created(created)


@router.get("/links", summary="Liens showroom", responses=DB_DOWN)
async def list_links(service: ShowroomLinkServiceDep) -> list[ShowroomLinkRead]:
    """Tous les liens, le plus récent en premier, avec leur état ; sans jeton."""
    return [ShowroomLinkRead.build(link) for link in await service.list()]


@router.delete(
    "/links/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Révoquer un lien showroom",
    responses=error_responses(
        status.HTTP_404_NOT_FOUND, status.HTTP_503_SERVICE_UNAVAILABLE
    ),
)
async def revoke_link(
    link_id: Annotated[int, Path(ge=1)], service: ShowroomLinkServiceDep
) -> None:
    """Le lien répond ensuite `410` ; révoquer deux fois ne change rien."""
    await service.revoke(link_id)


@router.get(
    "/{token}",
    summary="Vue client d'un lien showroom",
    responses=error_responses(
        status.HTTP_404_NOT_FOUND,
        status.HTTP_410_GONE,
        status.HTTP_503_SERVICE_UNAVAILABLE,
    ),
)
async def read_showroom(
    token: Annotated[str, Path(max_length=100)], service: ShowroomViewServiceDep
) -> ShowroomRead:
    """Lecture seule : les arômes du périmètre du lien, ni dashboard ni rapport."""
    return ShowroomRead.build(await service.view(token))
