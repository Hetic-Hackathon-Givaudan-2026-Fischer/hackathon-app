"""Calculatrice « et si… » : probabilité qu'une hausse d'arôme soit durable."""

from app.services.ports import PerennitySimulator, SimulationInput, SimulationResult


class SimulationService:
    """Interroge le modèle V2 ; sans modèle joignable, DataSourceUnavailableError."""

    def __init__(self, simulator: PerennitySimulator) -> None:
        self._simulator = simulator

    async def simulate(self, inputs: SimulationInput) -> SimulationResult:
        return await self._simulator.simulate(inputs)
