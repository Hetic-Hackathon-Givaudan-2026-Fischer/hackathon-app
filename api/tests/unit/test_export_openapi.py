from pathlib import Path

import yaml

from app.main import app
from app.scripts.export_openapi import is_up_to_date, render


def test_render_round_trips_and_keeps_accents() -> None:
    schema = app.openapi()
    text = render(schema)

    assert yaml.safe_load(text) == schema
    assert "santé" in text


def test_check_compares_content_not_formatting(tmp_path: Path) -> None:
    schema = {"openapi": "3.1.0", "tags": ["a", "b"]}
    path = tmp_path / "openapi.yaml"
    path.write_text("openapi: '3.1.0'\ntags: [a, b]\n")

    assert is_up_to_date(path, schema)
    assert not is_up_to_date(path, schema | {"tags": ["a"]})
    assert not is_up_to_date(tmp_path / "absent.yaml", schema)
