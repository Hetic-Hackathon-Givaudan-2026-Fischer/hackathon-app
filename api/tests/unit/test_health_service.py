from app.services.health import HealthService
from tests.fakes import FakeDatabaseProbe, FakeTrendSource


async def test_data_ai_not_configured() -> None:
    health = await HealthService(FakeDatabaseProbe()).check()

    assert health.data_ai == "non_configuree"


async def test_data_ai_up_and_down_never_fail_health() -> None:
    up = await HealthService(FakeDatabaseProbe(), FakeTrendSource()).check()
    down = await HealthService(FakeDatabaseProbe(), FakeTrendSource(fail=True)).check()

    assert (up.status, up.data_ai) == ("ok", "up")
    assert (down.status, down.data_ai) == ("ok", "down")
