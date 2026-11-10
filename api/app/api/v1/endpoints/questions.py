from fastapi import APIRouter, status

from app.api.deps import QuestionServiceDep
from app.schemas.error import ErrorRead
from app.schemas.question import QuestionCreate, QuestionRead
from app.services.ports import QuestionRecord

router = APIRouter(prefix="/questions", tags=["questions"])


# response_model : FastAPI convertit les QuestionRecord en QuestionRead (format public)
@router.get("", response_model=list[QuestionRead], summary="Dernières questions posées")
async def list_questions(service: QuestionServiceDep) -> list[QuestionRecord]:
    """Les 10 dernières questions et leurs réponses, la plus récente en premier."""
    return await service.latest()


@router.post(
    "",
    response_model=QuestionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Poser une question à l'IA",
    responses={status.HTTP_502_BAD_GATEWAY: {"model": ErrorRead}},
)
async def create_question(
    body: QuestionCreate, service: QuestionServiceDep
) -> QuestionRecord:
    """Envoie la question à l'IA (mode 1 ou 2 selon api/.env), enregistre l'échange."""
    return await service.ask(body.question)
