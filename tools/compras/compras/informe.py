"""Informe HTML autónomo: ranking de $/100 g de proteína y mejor proveedor por alimento."""
from __future__ import annotations

import html
from datetime import datetime

from .catalogo import Item
from .metricas import coste_100g_proteina, proteina_por_100kcal, semaforo_coste

_CSS = """body{font:14px/1.5 system-ui,sans-serif;max-width:1000px;margin:24px auto;padding:0 16px;color:#10171a;background:#fbfcfc}
h1{font-size:22px}h2{font-size:17px;margin-top:28px}table{border-collapse:collapse;width:100%;font-size:13px}
th{text-align:left;font:600 11px ui-monospace,monospace;text-transform:uppercase;color:#6d7a80;padding:6px;border-bottom:1px solid #d4dcde}
td{padding:6px;border-bottom:1px solid #e6ecec;vertical-align:top}.n{font-family:ui-monospace,monospace;white-space:nowrap}
.tag{font:600 11px ui-monospace,monospace;padding:1px 6px;border-radius:3px}.ok{background:#e9f5ec;color:#0d7a37}
.warn{background:#fbf4e2;color:#a8790c}.crit{background:#fbeaea;color:#b8312f}.na{background:#eee;color:#666}
.muted{color:#6d7a80;font-size:12px}a{color:#0f6b7a}"""

_LBL = {"ok": "barato", "warn": "medio", "crit": "caro", "na": "sin dato"}

# Umbrales en $ por 100 g de proteína, calibrados con precios australianos de 2026:
# pollo, picada magra, whey y huevos suelen caer por debajo de 7; filetes y pescado, por encima de 12.
VERDE, AMBAR = 7.0, 12.0


def generar(items: dict[str, Item], filas, bloqueados=None, sin_acceso=None) -> str:
    por_item: dict[str, list[dict]] = {}
    for f in filas:
        f = dict(f)
        por_item.setdefault(f["item"], []).append(f)

    ranking = []
    for iid, it in items.items():
        ofs = sorted(por_item.get(iid, []), key=lambda o: o["precio_kg"])
        mejor = ofs[0] if ofs else None
        c = coste_100g_proteina(mejor["precio_kg"], it.proteina_100g) if mejor else None
        ranking.append((it, mejor, c, ofs))
    ranking.sort(key=lambda r: (r[2] is None, r[2] or 0))

    h = [f"<!doctype html><meta charset=utf-8><title>Precios por proteína</title><style>{_CSS}</style>",
         f"<h1>Coste por proteína · {datetime.now():%d %b %Y %H:%M}</h1>",
         f"<p class=muted>Semáforo: verde ≤ ${VERDE:.0f} por 100 g de proteína, ámbar ≤ ${AMBAR:.0f}, rojo por encima. "
         "Valores nutricionales típicos del catálogo; comprueba la etiqueta del producto elegido.</p>"]
    for titulo, d in (("Tiendas que bloquearon el acceso automatizado", bloqueados),
                      ("Tiendas sin acceso de red desde este equipo", sin_acceso)):
        if d:
            h.append(f"<h2>{titulo}</h2><ul>" + "".join(
                f"<li><b>{html.escape(k)}</b>: {html.escape(v)}</li>" for k, v in d.items()) + "</ul>")
    h.append("<h2>Ranking por coste de proteína</h2><table><tr><th>Alimento</th><th>$/100 g prot.</th>"
             "<th>g prot./100 kcal</th><th>Mejor $/kg</th><th>Dónde</th><th>Producto</th></tr>")
    for it, mejor, c, _ in ranking:
        s = semaforo_coste(c, VERDE, AMBAR) if it.categoria.startswith("proteina") else "na"
        dens = proteina_por_100kcal(it.proteina_100g, it.kcal_100g)
        if mejor:
            prod = f'<a href="{html.escape(mejor["url"])}">{html.escape(mejor["nombre"])}</a>'
            if mejor.get("en_oferta"):
                prod += ' <span class="tag ok">oferta</span>'
            h.append(f"<tr><td>{html.escape(it.nombre)}</td><td class=n><span class='tag {s}'>"
                     f"${c:.2f}</span></td><td class=n>{dens}</td><td class=n>${mejor['precio_kg']:.2f}</td>"
                     f"<td>{html.escape(mejor['proveedor'])}</td><td>{prod}</td></tr>")
        else:
            h.append(f"<tr><td>{html.escape(it.nombre)}</td><td class=n><span class='tag na'>—</span></td>"
                     f"<td class=n>{dens}</td><td>—</td><td>—</td><td class=muted>sin precios</td></tr>")
    h.append("</table><h2>Detalle por alimento</h2>")
    for it, _, _, ofs in ranking:
        if not ofs:
            continue
        h.append(f"<h3>{html.escape(it.nombre)}</h3><table><tr><th>Proveedor</th><th>$/kg</th><th>Precio</th>"
                 "<th>Producto</th><th>Unitario original</th></tr>")
        for o in ofs[:8]:
            h.append(f"<tr><td>{html.escape(o['proveedor'])}</td><td class=n>${o['precio_kg']:.2f}</td>"
                     f"<td class=n>${o['precio']:.2f}</td><td><a href='{html.escape(o['url'])}'>"
                     f"{html.escape(o['nombre'])}</a></td><td class='n muted'>{html.escape(o.get('texto_unitario') or '')}</td></tr>")
        h.append("</table>")
    return "\n".join(h)
