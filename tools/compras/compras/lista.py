"""Lista de la compra semanal: la plantilla escalada al perfil, con el proveedor más barato por
artículo (en $/kg) y totales de proteína, calorías y coste."""
from __future__ import annotations

from dataclasses import dataclass

from .catalogo import Item
from .metricas import coste_100g_proteina


@dataclass
class Linea:
    item: str
    nombre: str
    gramos: float
    proveedor: str | None
    producto: str | None
    precio_kg: float | None
    coste: float | None
    proteina_g: float
    kcal: float
    coste_100g_prot: float | None
    en_oferta: bool = False


def mejores_ofertas(ofertas, permitidos=None) -> dict:
    """La oferta con menor $/kg por artículo. `ofertas`: filas o Oferta con .item/.precio_kg."""
    mejor = {}
    for o in ofertas:
        o = dict(o) if not isinstance(o, dict) else o
        if o.get("precio_kg") is None:
            continue
        if permitidos and o["proveedor"] not in permitidos:
            continue
        actual = mejor.get(o["item"])
        if actual is None or o["precio_kg"] < actual["precio_kg"]:
            mejor[o["item"]] = o
    return mejor


def construir(items: dict[str, Item], plantilla: dict, mejores: dict,
              proteina_obj: float | None = None, referencia_prot: float | None = None,
              excluir: list[str] | None = None) -> list[Linea]:
    """Escala la plantilla: los artículos de proteína se multiplican por proteina_obj/referencia."""
    factor = 1.0
    if proteina_obj and referencia_prot:
        factor = proteina_obj / referencia_prot
    lineas = []
    for iid, g in plantilla.items():
        if excluir and iid in excluir:
            continue
        it = items[iid]
        gramos = g * factor if it.categoria.startswith("proteina") else g
        o = mejores.get(iid)
        pkg = o["precio_kg"] if o else None
        lineas.append(Linea(
            item=iid, nombre=it.nombre, gramos=round(gramos),
            proveedor=o["proveedor"] if o else None, producto=o["nombre"] if o else None,
            precio_kg=pkg, coste=round(pkg * gramos / 1000, 2) if pkg else None,
            proteina_g=round(it.proteina_100g * gramos / 100, 1),
            kcal=round(it.kcal_100g * gramos / 100),
            coste_100g_prot=coste_100g_proteina(pkg, it.proteina_100g),
            en_oferta=bool(o and o.get("en_oferta")),
        ))
    return lineas


def totales(lineas: list[Linea]) -> dict:
    con_precio = [l for l in lineas if l.coste is not None]
    return {
        "proteina_g_dia": round(sum(l.proteina_g for l in lineas) / 7),
        "kcal_dia": round(sum(l.kcal for l in lineas) / 7),
        "coste_semana": round(sum(l.coste for l in con_precio), 2),
        "sin_precio": [l.item for l in lineas if l.coste is None],
        "por_proveedor": _por_proveedor(con_precio),
    }


def _por_proveedor(lineas):
    out: dict[str, float] = {}
    for l in lineas:
        out[l.proveedor] = round(out.get(l.proveedor, 0) + l.coste, 2)
    return dict(sorted(out.items(), key=lambda kv: -kv[1]))
