"""Precios introducidos a mano (tiendas que bloquean el acceso automatizado, o compras en tienda).

CSV con columnas: proveedor,item,nombre,precio,peso_g,url
"""
from __future__ import annotations

import csv
from pathlib import Path

from ..modelo import Oferta
from ..normalizar import precio_por_kg


def leer(ruta: Path) -> list[Oferta]:
    if not ruta.exists():
        return []
    out = []
    with open(ruta, encoding="utf-8") as f:
        for fila in csv.DictReader(f):
            if not fila.get("item") or fila["item"].startswith("#"):
                continue
            precio = float(fila["precio"])
            peso = float(fila["peso_g"]) if fila.get("peso_g") else None
            out.append(Oferta(proveedor=fila["proveedor"], item=fila["item"], nombre=fila["nombre"],
                              precio=precio, precio_kg=precio_por_kg(precio, peso),
                              texto_unitario="manual", url=fila.get("url", "")))
    return out
