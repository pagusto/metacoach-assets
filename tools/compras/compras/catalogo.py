"""Carga catalogo.yaml, proveedores.yaml y plantilla.yaml."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent


@dataclass
class Item:
    id: str
    nombre: str
    proteina_100g: float
    kcal_100g: float
    categoria: str
    busquedas: dict = field(default_factory=dict)   # proveedor -> {q, incluir, excluir}
    nota: str = ""


def _yaml(nombre: str, raiz: Path = RAIZ):
    with open(raiz / nombre, encoding="utf-8") as f:
        return yaml.safe_load(f)


def cargar_items(raiz: Path = RAIZ) -> dict[str, Item]:
    data = _yaml("catalogo.yaml", raiz)
    return {i["id"]: Item(**i) for i in data["items"]}


def cargar_proveedores(raiz: Path = RAIZ) -> dict[str, dict]:
    return {p["id"]: p for p in _yaml("proveedores.yaml", raiz)["proveedores"]}


def cargar_plantilla(raiz: Path = RAIZ) -> dict:
    return _yaml("plantilla.yaml", raiz)
