"""Coles: la página de búsqueda incrusta los resultados en un JSON (__NEXT_DATA__).

Coles protege su web contra bots y suele bloquear las IP de servidores. Se usa un navegador
real (Playwright) a ritmo humano; si aparece la verificación, se marca Bloqueado y no se insiste.
"""
from __future__ import annotations

import json
import time
import urllib.parse

from ..coincidencia import coincide
from ..modelo import Bloqueado, Oferta
from ..normalizar import parse_peso_gramos, precio_por_kg, precio_por_kg_desde_unitario

BASE = "https://www.coles.com.au"


class NavegadorColes:
    def __init__(self, ejecutable: str | None = None, pausa: float = 3.0):
        from playwright.sync_api import sync_playwright
        self._pw = sync_playwright().start()
        kw = {"executable_path": ejecutable} if ejecutable else {}
        self._b = self._pw.chromium.launch(**kw)
        self._pg = self._b.new_page(locale="en-AU")
        self.pausa = pausa

    def cerrar(self):
        self._b.close()
        self._pw.stop()

    def resultados(self, consulta: str) -> list[dict]:
        url = f"{BASE}/search/products?q={urllib.parse.quote(consulta)}"
        self._pg.goto(url, wait_until="domcontentloaded", timeout=45000)
        time.sleep(self.pausa)
        nodo = self._pg.query_selector("script#__NEXT_DATA__")
        if not nodo:
            html = self._pg.content().lower()
            if "incapsula" in html or "captcha" in html or "pardon our interruption" in html:
                raise Bloqueado("Coles devolvió la verificación anti-bots")
            raise Bloqueado("Coles no devolvió datos de búsqueda (posible bloqueo)")
        data = json.loads(nodo.inner_text())
        pp = data.get("props", {}).get("pageProps", {})
        return (pp.get("searchResults") or {}).get("results") or []


def a_ofertas(resultados: list[dict], incluir=None, excluir=None, item="", proveedor="coles"):
    out = []
    for r in resultados:
        if r.get("_type") != "PRODUCT":
            continue
        nombre = " ".join(x for x in (r.get("brand"), r.get("name"), r.get("size")) if x)
        if not coincide(nombre, incluir, excluir):
            continue
        pr = r.get("pricing") or {}
        precio = pr.get("now")
        if precio is None:
            continue
        unitario = pr.get("comparable") or ""
        pkg = precio_por_kg_desde_unitario(unitario)
        if pkg is None:
            pkg = precio_por_kg(precio, parse_peso_gramos(r.get("size") or nombre))
        antes = pr.get("was") or None
        out.append(Oferta(
            proveedor=proveedor, item=item, nombre=nombre, precio=float(precio), precio_kg=pkg,
            texto_unitario=unitario, en_oferta=bool(antes and antes > precio), precio_antes=antes,
            url=f"{BASE}/product/{r.get('id', '')}",
        ))
    return out
