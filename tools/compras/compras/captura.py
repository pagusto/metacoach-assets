"""Recorre catálogo × proveedores, recoge las ofertas que coinciden y registra los bloqueos."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from .catalogo import Item
from .fuentes import coles, manual, shopify, woolworths
from .fuentes.base import Sesion
from .modelo import Bloqueado, Oferta


@dataclass
class Resultado:
    ofertas: list[Oferta] = field(default_factory=list)
    bloqueados: dict[str, str] = field(default_factory=dict)   # proveedor -> motivo
    sin_acceso: dict[str, str] = field(default_factory=dict)   # proveedor -> motivo (red)
    vacios: list[tuple[str, str]] = field(default_factory=list)  # (proveedor, item) sin coincidencias


def _busqueda(item: Item, prov: dict):
    return item.busquedas.get(prov["id"]) or (item.busquedas.get("_shopify") if prov["tipo"] == "shopify" else None)


def capturar(items: dict[str, Item], proveedores: dict[str, dict], cache_dir: Path,
             solo_proveedores=None, solo_items=None, manual_csv: Path | None = None,
             chromium: str | None = None, log=print) -> Resultado:
    res = Resultado()
    sesion = Sesion(cache_dir)
    elegidos = {k: v for k, v in proveedores.items() if not solo_proveedores or k in solo_proveedores}
    its = {k: v for k, v in items.items() if not solo_items or k in solo_items}

    for pid, prov in elegidos.items():
        tipo = prov["tipo"]
        if tipo == "manual":
            continue
        log(f"· {prov['nombre']}")
        try:
            if tipo == "shopify":
                prods = shopify.productos(sesion, prov["base_url"], prov.get("coleccion"))
                log(f"  {len(prods)} productos en el catálogo de la tienda")
                for iid, it in its.items():
                    b = _busqueda(it, prov)
                    if not b:
                        continue
                    o = shopify.a_ofertas(prods, pid, iid, prov["base_url"], b.get("incluir"), b.get("excluir"))
                    res.ofertas.extend(o)
                    if not o:
                        res.vacios.append((pid, iid))
            elif tipo == "woolworths":
                for iid, it in its.items():
                    b = _busqueda(it, prov)
                    if not b:
                        continue
                    o = woolworths.buscar(sesion, b["q"], b.get("incluir"), b.get("excluir"), item=iid, proveedor=pid)
                    log(f"  {iid}: {len(o)}")
                    res.ofertas.extend(o)
                    if not o:
                        res.vacios.append((pid, iid))
            elif tipo == "coles":
                nav = coles.NavegadorColes(ejecutable=chromium or os.environ.get("CHROMIUM_PATH"))
                try:
                    for iid, it in its.items():
                        b = _busqueda(it, prov)
                        if not b:
                            continue
                        o = coles.a_ofertas(nav.resultados(b["q"]), b.get("incluir"), b.get("excluir"), item=iid, proveedor=pid)
                        log(f"  {iid}: {len(o)}")
                        res.ofertas.extend(o)
                        if not o:
                            res.vacios.append((pid, iid))
                finally:
                    nav.cerrar()
        except Bloqueado as e:
            res.bloqueados[pid] = str(e)
            log(f"  BLOQUEADO: {e} → usa precios_manuales.csv para esta tienda")
        except ConnectionError as e:
            res.sin_acceso[pid] = str(e)
            log(f"  SIN ACCESO DE RED: {e}")

    if manual_csv is not None:
        m = [o for o in manual.leer(manual_csv) if (not solo_items or o.item in solo_items)]
        if m:
            log(f"· Precios manuales: {len(m)}")
        res.ofertas.extend(m)
    return res
