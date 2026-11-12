"""Faux partagés par les tests : implémentent les Protocols sans base ni réseau."""

from dataclasses import asdict, replace
from datetime import UTC, date, datetime

from app.core.errors import (
    DatabaseUnavailableError,
    DataSourceUnavailableError,
    NotFoundError,
)
from app.core.indicators import INDICATOR_KEYS
from app.services.ports import (
    DataIssueRecord,
    DataStatus,
    ModelMetrics,
    NewDataIssue,
    NewShowroomLink,
    Origin,
    ProductShare,
    ShowroomLinkRecord,
    SimulationInput,
    SimulationResult,
    Sourced,
    TrendAnalysis,
    TrendRecord,
)


class FakeDatabaseProbe:
    def __init__(self, version: str | None = "PostgreSQL 17.0") -> None:
        self._version = version

    async def server_version(self) -> str:
        if self._version is None:
            raise DatabaseUnavailableError("connexion refusée")
        return self._version


# --- Tendances --------------------------------------------------------------------

DATA_DATE = date(2026, 11, 10)
FETCHED_AT = datetime(2026, 11, 12, 9, 0, tzinfo=UTC)


def make_trend(
    trend_id: str,
    family: str = "epice",
    status: str | None = None,
    score: float | None = None,
    name: str | None = None,
    **indicators: float | None,
) -> TrendRecord:
    """Un arôme de test ; indicateurs non précisés : absents (None)."""
    values = dict.fromkeys(INDICATOR_KEYS) | indicators
    return TrendRecord(
        id=trend_id,
        name=name or trend_id.capitalize(),
        family=family,
        indicators=values,
        status=status,
        score=score,
    )


def with_product_types(trend: TrendRecord, main: str, *others: str) -> TrendRecord:
    """L'arôme présent dans `main` (type principal) et `others`."""
    shares = tuple(
        ProductShare(type_id, type_id.capitalize(), 10, 0.5, "produits")
        for type_id in (main, *others)
    )
    return replace(trend, main_product_type=main, product_types=shares)


def with_analysis(
    trend: TrendRecord, buzz_score: int | None, trend_score: int | None = None
) -> TrendRecord:
    analysis = TrendAnalysis(
        "growing", "hausse régulière", buzz_score, trend_score, "high"
    )
    return replace(trend, analysis=analysis)


def make_status(origin: Origin = "csv_fallback") -> DataStatus:
    return DataStatus(origin=origin, data_date=DATA_DATE, fetched_at=FETCHED_AT)


class FakeTrendSource:
    """TrendSource en mémoire ; `fail` simule une API Data/IA coupée."""

    def __init__(
        self,
        trends: list[TrendRecord] | None = None,
        origin: Origin = "csv_fallback",
        fail: bool = False,
    ) -> None:
        self.trends = trends or []
        self._status = make_status(origin)
        self._fail = fail
        self.calls = 0

    async def data_status(self) -> DataStatus:
        self._check()
        return self._status

    async def list_trends(self) -> Sourced[list[TrendRecord]]:
        self._check()
        return Sourced(list(self.trends), self._status)

    async def get_trend(self, trend_id: str) -> Sourced[TrendRecord]:
        self._check()
        for trend in self.trends:
            if trend.id == trend_id:
                return Sourced(trend, self._status)
        raise NotFoundError(f"Arôme inconnu : {trend_id}")

    def _check(self) -> None:
        self.calls += 1
        if self._fail:
            raise DataSourceUnavailableError("injoignable (ConnectError)")


class FakeModelMetrics:
    """ModelMetricsSource ; sans métriques, se comporte comme Data/IA coupée."""

    def __init__(self, metrics: ModelMetrics | None = None) -> None:
        self._metrics = metrics

    async def model_metrics(self) -> ModelMetrics:
        if self._metrics is None:
            raise DataSourceUnavailableError("injoignable (ConnectError)")
        return self._metrics


class FakeSimulator:
    """PerennitySimulator ; sans résultat, se comporte comme Data/IA coupée."""

    def __init__(self, result: SimulationResult | None = None) -> None:
        self._result = result
        self.received: list[SimulationInput] = []

    async def simulate(self, inputs: SimulationInput) -> SimulationResult:
        self.received.append(inputs)
        if self._result is None:
            raise DataSourceUnavailableError("injoignable (ConnectError)")
        return self._result


# --- Signalements et showroom -----------------------------------------------------


class FakeDataIssueRepository:
    def __init__(self) -> None:
        self.rows: list[DataIssueRecord] = []

    async def add(self, issue: NewDataIssue) -> DataIssueRecord:
        row = DataIssueRecord(
            id=len(self.rows) + 1,
            status="open",
            created_at=datetime.now(UTC),
            **asdict(issue),
        )
        self.rows.append(row)
        return row


class FakeShowroomLinkRepository:
    """Garde aussi le hash du jeton, pour vérifier qu'aucun jeton clair n'entre."""

    def __init__(self) -> None:
        self.rows: dict[int, ShowroomLinkRecord] = {}
        self.hashes: dict[str, int] = {}

    async def add(self, link: NewShowroomLink) -> ShowroomLinkRecord:
        record = ShowroomLinkRecord(
            id=len(self.rows) + 1,
            client_label=link.client_label,
            families=link.families,
            expires_at=link.expires_at,
            revoked_at=None,
            created_at=datetime.now(UTC),
        )
        self.rows[record.id] = record
        self.hashes[link.token_hash] = record.id
        return record

    async def list_all(self) -> list[ShowroomLinkRecord]:
        return sorted(self.rows.values(), key=lambda row: row.id, reverse=True)

    async def get(self, link_id: int) -> ShowroomLinkRecord | None:
        return self.rows.get(link_id)

    async def find_by_hash(self, token_hash: str) -> ShowroomLinkRecord | None:
        link_id = self.hashes.get(token_hash)
        return self.rows.get(link_id) if link_id else None

    async def revoke(self, link_id: int, at: datetime) -> ShowroomLinkRecord | None:
        if link_id not in self.rows:
            return None
        self.rows[link_id] = replace(self.rows[link_id], revoked_at=at)
        return self.rows[link_id]


class FakeTokenGenerator:
    """Jetons prévisibles : token-1, token-2…"""

    def __init__(self) -> None:
        self.count = 0

    def new_token(self) -> str:
        self.count += 1
        return f"token-{self.count}"
