import pytest
from fastapi.testclient import TestClient

from app.services.ports import SimulationResult
from tests.fakes import FakeSimulator

URL = "/api/v1/simulate"
RESULT = SimulationResult(0.634, "durable", "Estimation statistique (modèle V2)")


@pytest.mark.parametrize("simulator", [FakeSimulator(RESULT)])
def test_simulate_returns_probability(
    client: TestClient, simulator: FakeSimulator
) -> None:
    response = client.post(URL, json={"growth_13w": 0.8, "growth_52w": None})

    assert response.status_code == 200
    assert response.json() == {
        "probability": 0.634,
        "verdict": "durable",
        "note": "Estimation statistique (modèle V2)",
    }
    [inputs] = simulator.received
    assert (inputs.growth_13w, inputs.growth_52w) == (0.8, None)
    assert inputs.spike_ratio == 1.4


def test_simulate_without_model_is_503(client: TestClient) -> None:
    response = client.post(URL, json={})

    assert response.status_code == 503
    assert response.json() == {"detail": "Source de données indisponible"}


def test_simulate_rejects_invalid_body(client: TestClient) -> None:
    assert client.post(URL, json={"growth_13w": "beaucoup"}).status_code == 422
