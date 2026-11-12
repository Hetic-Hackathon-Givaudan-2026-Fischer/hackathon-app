import json
import logging

import pytest

from app.api.middleware import mask_path, request_id_from
from app.core.logging import JsonFormatter, request_id_var


@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("/api/v1/showroom/s3cr3t-T0ken", "/api/v1/showroom/***"),
        ("/api/v1/showroom/links", "/api/v1/showroom/links"),
        ("/api/v1/showroom/links/3", "/api/v1/showroom/links/3"),
        ("/api/v1/trends/acai", "/api/v1/trends/acai"),
    ],
)
def test_showroom_token_is_masked(path: str, expected: str) -> None:
    assert mask_path(path) == expected


def scope(request_id: str) -> dict:
    return {"type": "http", "headers": [(b"x-request-id", request_id.encode())]}


def test_valid_incoming_request_id_is_kept() -> None:
    assert request_id_from(scope("abc-123")) == "abc-123"


@pytest.mark.parametrize("bad", ["", "a" * 65, "<script>", "id avec espaces"])
def test_invalid_incoming_request_id_is_replaced(bad: str) -> None:
    generated = request_id_from(scope(bad))

    assert generated != bad
    assert len(generated) == 32


def test_json_formatter_adds_request_id_and_extras() -> None:
    record = logging.LogRecord("app", logging.INFO, "", 1, "GET %s", ("/x",), None)
    record.status = 200
    token = request_id_var.set("req-42")
    try:
        entry = json.loads(JsonFormatter().format(record))
    finally:
        request_id_var.reset(token)

    assert entry["message"] == "GET /x"
    assert (entry["request_id"], entry["status"], entry["level"]) == (
        "req-42",
        200,
        "INFO",
    )
