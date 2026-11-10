import pytest

from app.core.config import Settings, to_async_url


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("postgres://app:app@db:5432/app", "postgresql+asyncpg://app:app@db:5432/app"),
        ("postgresql://app@db/app", "postgresql+asyncpg://app@db/app"),
        ("postgresql+asyncpg://app@db/app", "postgresql+asyncpg://app@db/app"),
    ],
)
def test_to_async_url(url: str, expected: str) -> None:
    assert to_async_url(url) == expected


def test_settings_normalise_url_and_empty_data_ai_url() -> None:
    settings = Settings(
        _env_file=None,  # type: ignore[call-arg]
        database_url="postgres://app:app@db:5432/app",
        data_ai_url="",
    )

    assert settings.database_url.startswith("postgresql+asyncpg://")
    assert settings.data_ai_url is None
