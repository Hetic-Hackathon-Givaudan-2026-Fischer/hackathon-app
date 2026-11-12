from datetime import datetime

from sqlalchemy import DateTime, Identity, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ShowroomLink(Base):
    """Table `showroom_links` de db/init/004-showroom.sql : à garder alignés."""

    __tablename__ = "showroom_links"
    __mapper_args__ = {"eager_defaults": True}  # noqa: RUF012

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    token_hash: Mapped[str] = mapped_column(Text, unique=True)
    client_label: Mapped[str] = mapped_column(Text)
    families: Mapped[list[str]] = mapped_column(ARRAY(Text))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
