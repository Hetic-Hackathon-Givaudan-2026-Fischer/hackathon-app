from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# Espaces retirés, puis au moins un caractère : « Question manquante » → 422.
# Plafond : une question, pas un document (et un prompt borné pour l'IA)
QUESTION_MAX_LENGTH = 4000
QuestionText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=1, max_length=QUESTION_MAX_LENGTH
    ),
]


class QuestionCreate(BaseModel):
    """Corps de POST /questions."""

    question: QuestionText = Field(examples=["Quelle est la capitale de la France ?"])


class QuestionRead(BaseModel):
    """Une question et la réponse de l'IA, telles qu'enregistrées.

    from_attributes : construit depuis le QuestionRecord renvoyé par le service.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    answer: str
    created_at: datetime
