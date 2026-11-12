from typing import Literal

from pydantic import BaseModel, Field

DataAiState = Literal["up", "down", "non_configuree"]


class HealthRead(BaseModel):
    """API démarrée et base joignable. L'état Data/IA est informatif seulement."""

    status: Literal["ok"] = "ok"
    db: str = Field(description="Version du serveur PostgreSQL")
    data_ai: DataAiState = Field(
        description="API Data/IA ; `down` ne rend pas l'API « unhealthy » (repli CSV)"
    )
