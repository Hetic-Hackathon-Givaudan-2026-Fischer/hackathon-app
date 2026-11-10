from app.services.ports import AnswerProvider, QuestionRecord, QuestionRepository

# Le front n'affiche que les dernières questions
LATEST_LIMIT = 10


class QuestionService:
    """Poser une question à l'IA et garder la trace des échanges."""

    def __init__(self, repository: QuestionRepository, provider: AnswerProvider):
        self._repository = repository
        self._provider = provider

    async def latest(self) -> list[QuestionRecord]:
        return await self._repository.list_latest(LATEST_LIMIT)

    async def ask(self, question: str) -> QuestionRecord:
        # Rien n'est enregistré si l'IA échoue : l'AIProviderError remonte avant
        answer = await self._provider.answer(question)
        return await self._repository.add(question, answer)
