"""Logs structurés JSON (`logging` standard), avec le request_id de la requête."""

import json
import logging
from contextvars import ContextVar
from datetime import UTC, datetime

# Posé par app/api/middleware.py pour toute la durée d'une requête
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)
# Champs passés en `extra=` par le log d'accès
EXTRA_FIELDS = ("method", "path", "status", "duration_ms")


class JsonFormatter(logging.Formatter):
    """Une ligne JSON par log : lisible par un humain comme par un collecteur."""

    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(),
        }
        entry |= {k: getattr(record, k) for k in EXTRA_FIELDS if hasattr(record, k)}
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False, default=str)


def configure_logging(level: int = logging.INFO) -> None:
    """Un seul handler JSON sur la racine ; uvicorn y remonte.

    Le log d'accès d'uvicorn est coupé : il afficherait les jetons showroom
    présents dans l'URL. Notre middleware le remplace, chemin masqué.
    """
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level)
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers.clear()
        logging.getLogger(name).propagate = True
    logging.getLogger("uvicorn.access").disabled = True
