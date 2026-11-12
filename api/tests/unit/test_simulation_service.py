from app.services.ports import SimulationInput, SimulationResult
from app.services.simulation import SimulationService
from tests.fakes import FakeSimulator

INPUTS = SimulationInput(0.45, 0.3, 0.25, 1.4, 1.1, 0.2, 3.0)
RESULT = SimulationResult(0.63, "durable", "Estimation V2")


async def test_simulation_passes_inputs_to_the_model() -> None:
    simulator = FakeSimulator(RESULT)

    result = await SimulationService(simulator).simulate(INPUTS)

    assert result == RESULT
    assert simulator.received == [INPUTS]
