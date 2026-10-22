"""Tiendas Shopify (muchas carnicerías y granjas australianas): endpoint público /products.json.

Es el mismo JSON que alimenta el propio escaparate de la tienda; no requiere autenticación.
"""
from __future__ import annotations

import json

from ..coincidencia import coincide
from ..modelo import Oferta
from ..normalizar import parse_peso_gramos, precio_por_kg


def productos(sesion, base_url: str, coleccion: str | None = None, max_paginas: int = 4) -> list[dict]:
    base = base_url.rstrip("/")
    ruta = f"{base}/collections/{coleccion}/products.json" if coleccion else f"{base}/products.json"
    todos = []
    for pagina in range(1, max_paginas + 1):
        data = json.loads(sesion.pedir(f"{ruta}?limit=250&page={pagina}"))
        lote = data.get("products", [])
        todos.extend(lote)
        if len(lote) < 250:
            break
    return todos


def a_ofertas(prods: list[dict], proveedor: str, item: str, base_url: str,
              incluir=None, excluir=None) -> list[Oferta]:
    out = []
    for p in prods:
        titulo = p.get("title", "")
        if not coincide(titulo, incluir, excluir):
            continue
        for v in p.get("variants", []):
            if v.get("available") is False:
                continue
            try:
                precio = float(v.get("price"))
            except (TypeError, ValueError):
                continue
            vt = v.get("title") or ""
            texto = f"{titulo} {'' if vt == 'Default Title' else vt}".strip()
            # Muchas carnicerías venden "por kg": entonces el precio ya es $/kg.
            if "per kg" in texto.lower() or "/kg" in texto.lower():
                pkg = precio
            else:
                peso = parse_peso_gramos(texto) or (v.get("grams") or None)
                pkg = precio_por_kg(precio, peso)
            antes = v.get("compare_at_price")
            try:
                antes = float(antes) if antes else None
            except ValueError:
                antes = None
            out.append(Oferta(
                proveedor=proveedor, item=item, nombre=texto, precio=precio, precio_kg=pkg,
                texto_unitario="", en_oferta=bool(antes and antes > precio), precio_antes=antes,
                url=f"{base_url.rstrip('/')}/products/{p.get('handle', '')}",
            ))
    return out
