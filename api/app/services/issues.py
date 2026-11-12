from app.services.ports import (
    DataIssueRecord,
    DataIssueRepository,
    NewDataIssue,
    Origin,
    TrendSource,
)


class IssueService:
    """Signaler un problème de données à l'IT / au support.

    Le signalement garde l'origine des données au moment où il est fait.
    """

    def __init__(self, repository: DataIssueRepository, source: TrendSource) -> None:
        self._repository = repository
        self._source = source

    async def report(
        self, trend_id: str | None, message: str, contact: str | None, request_id: str
    ) -> DataIssueRecord:
        issue = NewDataIssue(
            trend_id=trend_id,
            message=message,
            contact=contact,
            request_id=request_id,
            data_origin=await self._current_origin(trend_id),
        )
        return await self._repository.add(issue)

    async def _current_origin(self, trend_id: str | None) -> Origin:
        """Arôme inconnu → NotFoundError (404) : on ne signale que l'existant."""
        if trend_id is None:
            return (await self._source.data_status()).origin
        return (await self._source.get_trend(trend_id)).status.origin
