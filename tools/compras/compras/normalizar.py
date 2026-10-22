"""Convierte los textos de precio y tamaño de las tiendas australianas a números comparables.

Las tiendas expresan el precio unitario de formas distintas ("$13.00 / 1KG", "$1.20 per 100g",
"$0.45 / 1EA") y el tamaño del envase igual de mal ("2 x 500g", "700g 12 Pack", "1.5 kg").
Todo se lleva a gramos y a dólares por kilo.
"""
from __future__ import annotations

import re

# Factor a gramos (o mililitros, tratados como gramos: densidad 1, buena aproximación para
# yogur y leche, que es lo único líquido del catálogo).
_A_GRAMOS = {"g": 1, "gm": 1, "gram": 1, "grams": 1, "kg": 1000, "kgs": 1000, "kilo": 1000,
             "ml": 1, "l": 1000, "lt": 1000, "litre": 1000, "liter": 1000}
_POR_UNIDAD = {"ea", "each", "pk", "pack", "unit"}

_NUM = r"(\d+(?:[.,]\d+)?)"

_RE_UNITARIO = re.compile(
    r"\$\s*" + _NUM + r"\s*(?:/|per|por)\s*" + _NUM + r"?\s*([a-zA-Z]+)",
    re.IGNORECASE,
)
_RE_MULTIPACK = re.compile(_NUM + r"\s*[x×]\s*" + _NUM + r"\s*(kg|g|ml|l)\b", re.IGNORECASE)
_RE_PESO = re.compile(_NUM + r"\s*(kg|kgs|g|gm|grams?|ml|l|lt|litre|liter)\b", re.IGNORECASE)


def _num(s: str) -> float:
    return float(s.replace(",", "."))


def parse_precio_unitario(texto: str | None):
    """'$13.00 / 1KG' -> (13.0, 1000.0) es decir (precio, gramos a los que se refiere).

    Devuelve None si el texto no trae un precio unitario por peso o volumen
    (por ejemplo '$0.45 / 1EA', que es por unidad).
    """
    if not texto:
        return None
    m = _RE_UNITARIO.search(texto)
    if not m:
        return None
    precio = _num(m.group(1))
    cantidad = _num(m.group(2)) if m.group(2) else 1.0
    unidad = m.group(3).lower()
    if unidad in _POR_UNIDAD:
        return None
    factor = _A_GRAMOS.get(unidad)
    if factor is None:
        return None
    return precio, cantidad * factor


def precio_por_kg_desde_unitario(texto: str | None) -> float | None:
    r = parse_precio_unitario(texto)
    if r is None:
        return None
    precio, gramos = r
    if gramos <= 0:
        return None
    return round(precio * 1000.0 / gramos, 4)


def parse_peso_gramos(texto: str | None) -> float | None:
    """Peso total del envase en gramos: '2 x 500g' -> 1000, '1.5 kg' -> 1500, '700g 12pk' -> 700."""
    if not texto:
        return None
    m = _RE_MULTIPACK.search(texto)
    if m:
        n, cant, u = _num(m.group(1)), _num(m.group(2)), m.group(3).lower()
        return n * cant * _A_GRAMOS[u]
    m = _RE_PESO.search(texto)
    if m:
        cant, u = _num(m.group(1)), m.group(2).lower()
        u = {"grams": "g", "gram": "g"}.get(u, u)
        return cant * _A_GRAMOS[u]
    return None


def precio_por_kg(precio: float | None, peso_g: float | None) -> float | None:
    if precio is None or not peso_g:
        return None
    return round(precio * 1000.0 / peso_g, 4)
