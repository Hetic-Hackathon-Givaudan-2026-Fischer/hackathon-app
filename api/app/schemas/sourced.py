from datetime import date
from typing import Any

from pydantic import BaseModel, Field

from app.services.ports import DataStatus, Origin


class SourcedRead(BaseModel):
    """Toute réponse de données dit d'où elle vient (ADR 0008)."""

    origin: Origin = Field(
        description="`data_ai` : API Data/IA ; `csv_fallback` : CSV, sans modèle"
    )
    data_date: date | None = Field(description="Date des données servies")


def sourced(status: DataStatus) -> dict[str, Any]:
    """Les champs de SourcedRead, depuis la provenance renvoyée par le service."""
    return {"origin": status.origin, "data_date": status.data_date}
