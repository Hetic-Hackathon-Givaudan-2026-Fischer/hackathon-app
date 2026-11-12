"""Source de repli : le CSV des indicateurs bruts, lu une fois et gardé en mémoire."""

import csv
from datetime import UTC, date, datetime
from pathlib import Path

from app.core.errors import NotFoundError
from app.core.indicators import INDICATOR_KEYS
from app.services.ports import DataStatus, Sourced, TrendRecord

CSV_PATH = Path(__file__).resolve().parents[1] / "data" / "aromes_indicateurs.csv"
# Date d'export du CSV par l'équipe Data/IA. La date du fichier ne convient pas :
# git et Docker ne la conservent pas. None tant que l'équipe ne l'a pas donnée
CSV_EXPORT_DATE: date | None = None


def clean_header(name: str) -> str:
    """Retire le préfixe de type du CSV : `mS#arome_id` → `arome_id`."""
    return name.rpartition("#")[2].strip()


def parse_number(value: str | None) -> float | None:
    """Cellule vide → None ; sinon un nombre."""
    text = (value or "").strip()
    return float(text) if text else None


def _to_record(row: dict[str, str]) -> TrendRecord:
    return TrendRecord(
        id=row["arome_id"].strip(),
        name=row["arome"].strip(),
        family=row["famille"].strip(),
        # Seules les colonnes présentes : un indicateur absent n'est pas « vide »
        indicators={k: parse_number(row[k]) for k in INDICATOR_KEYS if k in row},
    )


def load_trends(path: Path) -> list[TrendRecord]:
    """Lit le CSV : en-têtes nettoyés, une ligne = un arôme."""
    with path.open(encoding="utf-8", newline="") as file:
        reader = csv.reader(file)
        header = [clean_header(name) for name in next(reader)]
        return [_to_record(dict(zip(header, row, strict=True))) for row in reader]


class CsvTrendSource:
    """TrendSource sur le CSV : indicateurs bruts, sans statut ni modèle."""

    def __init__(
        self, path: Path = CSV_PATH, data_date: date | None = CSV_EXPORT_DATE
    ) -> None:
        self._trends = load_trends(path)
        self._by_id = {trend.id: trend for trend in self._trends}
        self._data_date = data_date
        self._loaded_at = datetime.now(UTC)

    async def data_status(self) -> DataStatus:
        return DataStatus(
            origin="csv_fallback",
            data_date=self._data_date,
            fetched_at=self._loaded_at,
        )

    async def list_trends(self) -> Sourced[list[TrendRecord]]:
        return Sourced(list(self._trends), await self.data_status())

    async def get_trend(self, trend_id: str) -> Sourced[TrendRecord]:
        trend = self._by_id.get(trend_id)
        if trend is None:
            raise NotFoundError(f"Arôme inconnu : {trend_id}")
        return Sourced(trend, await self.data_status())
