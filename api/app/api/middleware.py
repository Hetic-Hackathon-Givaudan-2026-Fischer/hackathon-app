"""Middleware ASGI : request_id, log d'accès masqué, 500 générique."""

import logging
import re
import time
import uuid

from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.api.errors import internal_error_response
from app.core.logging import request_id_var

REQUEST_ID_HEADER = "X-Request-ID"
# Un request_id venu du client n'est repris que s'il est court et inoffensif
_VALID_REQUEST_ID = re.compile(r"[A-Za-z0-9._-]{1,64}")
# /api/v1/showroom/<jeton> : le jeton ne doit jamais apparaître dans les logs
_SHOWROOM_TOKEN = re.compile(r"^(/api/v1/showroom/)(?!links(?:/|$))[^/]+")

access_logger = logging.getLogger("app.access")
logger = logging.getLogger(__name__)


def mask_path(path: str) -> str:
    return _SHOWROOM_TOKEN.sub(r"\1***", path)


def request_id_from(scope: Scope) -> str:
    incoming = Headers(scope=scope).get(REQUEST_ID_HEADER, "")
    if _VALID_REQUEST_ID.fullmatch(incoming):
        return incoming
    return uuid.uuid4().hex


def _log_access(scope: Scope, status: int, started: float) -> None:
    access_logger.info(
        "%s %s %s",
        scope["method"],
        mask_path(scope["path"]),
        status,
        extra={
            "method": scope["method"],
            "path": mask_path(scope["path"]),
            "status": status,
            "duration_ms": round((time.perf_counter() - started) * 1000, 1),
        },
    )


class RequestContextMiddleware:
    """Un request_id par requête (en-tête X-Request-ID en entrée et en sortie)."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = request_id_from(scope)
        scope.setdefault("state", {})["request_id"] = request_id
        context = request_id_var.set(request_id)
        try:
            await self._handle(scope, receive, send, request_id)
        finally:
            request_id_var.reset(context)

    async def _handle(
        self, scope: Scope, receive: Receive, send: Send, request_id: str
    ) -> None:
        started, response = time.perf_counter(), {"status": 0}

        async def send_with_id(message: Message) -> None:
            if message["type"] == "http.response.start":
                response["status"] = message["status"]
                MutableHeaders(scope=message).append(REQUEST_ID_HEADER, request_id)
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        except Exception:
            # Détail dans les logs seulement ; le client n'a qu'un 500 générique
            logger.exception("Erreur non prévue")
            if response["status"]:
                raise
            await internal_error_response()(scope, receive, send_with_id)
        finally:
            _log_access(scope, response["status"] or 500, started)
