from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def create_engine(database_url: str) -> AsyncEngine:
    """Pool de connexions partagé par toute l'application."""
    # pre_ping : une connexion coupée (base redémarrée) est remplacée, pas renvoyée
    return create_async_engine(database_url, pool_pre_ping=True)


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Une session par requête ; les objets restent lisibles après le commit."""
    return async_sessionmaker(engine, expire_on_commit=False)
