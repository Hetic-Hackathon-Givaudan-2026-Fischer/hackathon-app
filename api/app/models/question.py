from datetime import datetime

from sqlalchemy import DateTime, Identity, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Question(Base):
    """Table `questions` de db/init/001-schema.sql : les deux doivent rester alignés."""

    __tablename__ = "questions"
    # id et created_at sont remplis par PostgreSQL : on les relit dans le RETURNING
    # de l'INSERT plutôt que par une seconde requête
    __mapper_args__ = {"eager_defaults": True}  # noqa: RUF012

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
