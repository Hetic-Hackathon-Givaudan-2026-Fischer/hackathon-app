from pydantic import BaseModel


class ErrorRead(BaseModel):
    """Format des erreurs renvoyées par l'API (le même que celui de FastAPI)."""

    detail: str
