from typing import Literal

from pydantic import BaseModel, Field


class HealthRead(BaseModel):
    """API démarrée et base joignable."""

    status: Literal["ok"] = "ok"
    db: str = Field(description="Version du serveur PostgreSQL")
