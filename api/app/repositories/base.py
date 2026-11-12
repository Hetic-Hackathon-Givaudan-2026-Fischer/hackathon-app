from collections.abc import Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Base
from app.repositories.errors import db_errors


async def insert[Row: Base, Record](
    session: AsyncSession, row: Row, to_record: Callable[[Row], Record]
) -> Record:
    """INSERT … RETURNING (eager_defaults), puis commit.

    Le record est lu avant le commit, qui pourrait expirer l'objet.
    """
    session.add(row)
    with db_errors():
        await session.flush()
        record = to_record(row)
        await session.commit()
    return record
