"""Exporte le contrat OpenAPI de l'API dans openapi.yaml, à la racine du dépôt.

    uv run python -m app.scripts.export_openapi           # régénère le fichier
    uv run python -m app.scripts.export_openapi --check   # échoue s'il est périmé

Le contrôle compare le contenu YAML, pas le texte : Prettier peut reformater
le fichier sans le rendre « périmé ». PyYAML vient de fastapi[standard]
(via uvicorn[standard]).
"""

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml

from app.main import app

OPENAPI_FILE = Path(__file__).resolve().parents[3] / "openapi.yaml"


class _IndentedDumper(yaml.SafeDumper):
    """Listes indentées sous leur clé, comme Prettier."""

    def increase_indent(self, flow: bool = False, indentless: bool = False) -> None:
        super().increase_indent(flow, False)


def render(schema: dict[str, Any]) -> str:
    return yaml.dump(
        schema,
        Dumper=_IndentedDumper,
        allow_unicode=True,
        sort_keys=False,
        width=88,
    )


def is_up_to_date(path: Path, schema: dict[str, Any]) -> bool:
    return path.exists() and yaml.safe_load(path.read_text()) == schema


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="vérifier sans écrire")
    check = parser.parse_args(argv).check
    schema = app.openapi()
    if not check:
        OPENAPI_FILE.write_text(render(schema), encoding="utf-8")
        return 0
    if is_up_to_date(OPENAPI_FILE, schema):
        return 0
    print("openapi.yaml périmé : uv run python -m app.scripts.export_openapi")
    return 1


if __name__ == "__main__":
    sys.exit(main())
