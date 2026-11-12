"""Liens showroom (ADR 0010) : gestion interne et vue client en lecture seule."""

from datetime import datetime
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.schemas.sourced import SourcedRead, sourced
from app.services.showroom import (
    MAX_TTL_HOURS,
    CreatedLink,
    LinkState,
    ManagedLink,
    ShowroomView,
)

ClientLabel = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
FamilyName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class ShowroomLinkCreate(BaseModel):
    """Corps de POST /showroom/links."""

    client_label: ClientLabel = Field(examples=["Nestlé — équipe desserts"])
    families: list[FamilyName] = Field(
        default_factory=list,
        max_length=50,
        description="Familles d'arômes visibles ; vide : toutes",
    )
    ttl_hours: int | None = Field(
        default=None,
        ge=1,
        le=MAX_TTL_HOURS,
        description="Durée de vie ; absent : SHOWROOM_LINK_TTL_HOURS",
    )


class ShowroomLinkRead(BaseModel):
    """Un lien showroom, sans son jeton (montré une seule fois, à la création)."""

    id: int
    client_label: str
    families: list[str]
    expires_at: datetime
    revoked_at: datetime | None
    created_at: datetime
    state: LinkState

    @classmethod
    def build(cls, managed: ManagedLink | CreatedLink) -> Self:
        link = managed.link
        return cls(
            id=link.id,
            client_label=link.client_label,
            families=list(link.families),
            expires_at=link.expires_at,
            revoked_at=link.revoked_at,
            created_at=link.created_at,
            state=managed.state,
        )


class ShowroomLinkCreatedRead(ShowroomLinkRead):
    """Réponse de création : le jeton et l'URL ne seront plus jamais renvoyés."""

    token: str
    url: str

    @classmethod
    def from_created(cls, created: CreatedLink) -> Self:
        base = ShowroomLinkRead.build(created).model_dump()
        return cls(**base, token=created.token, url=created.url)


class ShowroomTrendRead(BaseModel):
    """Ce que la vue immersive affiche d'un arôme : rien du rapport interne."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    family: str
    aisle: str | None = Field(description="Rayon du magasin 3D")
    status: str | None
    score: float | None


class ShowroomRead(SourcedRead):
    """Vue client d'un lien showroom, en lecture seule."""

    client_label: str
    expires_at: datetime
    families: list[str]
    trends: list[ShowroomTrendRead]

    @classmethod
    def build(cls, view: ShowroomView) -> Self:
        return cls(
            **sourced(view.trends.status),
            client_label=view.link.client_label,
            expires_at=view.link.expires_at,
            families=list(view.link.families),
            trends=[ShowroomTrendRead.model_validate(t) for t in view.trends.value],
        )
