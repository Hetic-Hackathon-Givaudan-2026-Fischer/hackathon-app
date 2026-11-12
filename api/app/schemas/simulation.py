"""Notre contrat de la calculatrice « et si… » (modèle V2 de Data/IA)."""

from typing import Self

from pydantic import BaseModel, Field

from app.services.ports import SimulationInput, SimulationResult, SimulationVerdict


class SimulationCreate(BaseModel):
    """Variables d'un arôme EN HAUSSE ; valeurs par défaut : un cas type."""

    growth_13w: float = Field(
        default=0.45, description="Croissance sur 13 semaines (0.45 = +45 %)"
    )
    growth_52w: float | None = Field(
        default=0.3, description="Croissance vs la même période l'an dernier"
    )
    volatility_26w: float | None = Field(
        default=0.25, description="Écart-type / moyenne sur 26 semaines"
    )
    spike_ratio: float | None = Field(
        default=1.4, description="Pic des 13 dernières semaines / moyenne sur 26"
    )
    acceleration: float | None = Field(
        default=1.1, description="Moyenne 4 semaines / moyenne 13 semaines"
    )
    popularity_vs_anchor: float | None = Field(
        default=0.2, description="Niveau de recherche / vanille"
    )
    market_products_log: float | None = Field(
        default=3.0, description="log(1 + nombre de produits en rayon)"
    )

    def to_input(self) -> SimulationInput:
        return SimulationInput(**self.model_dump())


class SimulationRead(BaseModel):
    probability: float = Field(
        ge=0, le=1, description="Probabilité V2 que la hausse dure un an"
    )
    verdict: SimulationVerdict
    note: str

    @classmethod
    def build(cls, result: SimulationResult) -> Self:
        return cls(
            probability=result.probability, verdict=result.verdict, note=result.note
        )
