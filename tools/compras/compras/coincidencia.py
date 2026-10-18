"""Decide si un producto de una tienda corresponde a un artículo del catálogo."""
from __future__ import annotations

import re


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower()).strip()


def coincide(nombre: str, incluir: list[str] | None, excluir: list[str] | None) -> bool:
    """Todas las palabras de `incluir` deben aparecer (cada entrada admite alternativas con '|');
    ninguna de `excluir` puede aparecer."""
    n = _norm(nombre)
    for termino in incluir or []:
        if not any(alt.strip() in n for alt in termino.lower().split("|")):
            return False
    for termino in excluir or []:
        if termino.lower() in n:
            return False
    return True
