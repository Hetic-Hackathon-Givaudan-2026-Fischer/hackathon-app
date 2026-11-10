from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base des modèles ORM. Le schéma, lui, reste dans db/init/*.sql."""
