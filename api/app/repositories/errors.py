from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy.exc import SQLAlchemyError

from app.core.errors import DatabaseUnavailableError


@contextmanager
def db_errors() -> Iterator[None]:
    """Toute erreur de base devient une DatabaseUnavailableError (503 JSON).

    OSError : connexion refusée ou hôte inconnu, levés avant SQLAlchemy.
    """
    try:
        yield
    except (SQLAlchemyError, OSError) as exc:
        raise DatabaseUnavailableError(str(exc)) from exc
