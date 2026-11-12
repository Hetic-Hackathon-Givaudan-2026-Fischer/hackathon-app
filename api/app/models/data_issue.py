from datetime import datetime

from sqlalchemy import DateTime, Identity, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class DataIssue(Base):
    """Table `data_issues` de db/init/003-report-issues.sql : à garder alignés."""

    __tablename__ = "data_issues"
    __mapper_args__ = {"eager_defaults": True}  # noqa: RUF012

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    trend_id: Mapped[str | None] = mapped_column(Text)
    message: Mapped[str] = mapped_column(Text)
    contact: Mapped[str | None] = mapped_column(Text)
    request_id: Mapped[str] = mapped_column(Text)
    data_origin: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, server_default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
