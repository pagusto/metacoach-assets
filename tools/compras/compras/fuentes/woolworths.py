"""Woolworths: la búsqueda de su web consulta un endpoint JSON interno.

Primero se visita la portada para recibir las cookies de sesión, como haría el navegador.
Si responde 403 o un challenge, se levanta Bloqueado y se pasa a precios manuales.
"""
from __future__ import annotations

import json

from ..coincidencia import coincide
from ..modelo import Oferta
from ..normalizar import parse_peso_gramos, precio_por_kg, precio_por_kg_desde_unitario

BASE = "https://www.woolworths.com.au"


def buscar(sesion, consulta: str, incluir=None, excluir=None, item="", proveedor="woolworths"):
    sesion.pedir(BASE + "/", usar_cache=True)  # cookies de sesión
    body = {"SearchTerm": consulta, "PageSize": 36, "PageNumber": 1, "SortType": "TraderRelevance",
            "Location": f"/shop/search/products?searchTerm={consulta}", "Filters": [],
            "IsSpecial": False, "IsBundle": False, "IsMobile": False, "Formatted": False}
    data = json.loads(sesion.pedir(BASE + "/apis/ui/Search/products", metodo="POST", json_body=body,
                                   cabeceras={"Origin": BASE, "Referer": BASE + "/"}))
    out = []
    for grupo in data.get("Products") or []:
        for p in grupo.get("Products") or []:
            nombre = p.get("Name") or p.get("DisplayName") or ""
            precio = p.get("Price")
            if precio is None or not p.get("IsAvailable", True):
                continue
            if not coincide(nombre, incluir, excluir):
                continue
            unitario = p.get("CupString") or ""
            pkg = precio_por_kg_desde_unitario(unitario)
            if pkg is None:
                pkg = precio_por_kg(precio, parse_peso_gramos(f"{p.get('PackageSize', '')} {nombre}"))
            out.append(Oferta(
                proveedor=proveedor, item=item, nombre=nombre, precio=float(precio), precio_kg=pkg,
                texto_unitario=unitario, en_oferta=bool(p.get("IsOnSpecial")),
                precio_antes=p.get("WasPrice") if p.get("IsOnSpecial") else None,
                url=f"{BASE}/shop/productdetails/{p.get('Stockcode')}",
            ))
    return out
