"""Uso:
  python -m compras probar                  # ¿qué tiendas responden desde este equipo?
  python -m compras capturar [-p woolworths] [-i pollo_pechuga]
  python -m compras informe                 # -> datos/informe.html
  python -m compras lista [--perfil perfil.local.json] [--json]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import db, informe, lista
from .captura import capturar
from .catalogo import RAIZ, cargar_items, cargar_plantilla, cargar_proveedores
from .fuentes.base import Sesion
from .modelo import Bloqueado

DATOS = RAIZ / "datos"
DB = DATOS / "precios.sqlite"


def _probar(args):
    provs = cargar_proveedores()
    s = Sesion(DATOS / "cache", pausa=0.5)
    for pid, p in provs.items():
        url = p.get("base_url") or {"woolworths": "https://www.woolworths.com.au/",
                                    "coles": "https://www.coles.com.au/"}.get(pid)
        if not url:
            continue
        try:
            s.pedir(url, usar_cache=False, timeout=15)
            estado = "responde"
        except Bloqueado as e:
            estado = f"BLOQUEA ({e})"
        except ConnectionError as e:
            estado = f"SIN RED ({e})"
        except Exception as e:  # noqa: BLE001 - diagnóstico, se muestra tal cual
            estado = f"ERROR {type(e).__name__}: {e}"
        print(f"{p['nombre']:<24} {estado}")


def _capturar(args):
    res = capturar(cargar_items(), cargar_proveedores(), DATOS / "cache",
                   solo_proveedores=args.proveedor, solo_items=args.item,
                   manual_csv=RAIZ / "precios_manuales.csv", chromium=args.chromium)
    con = db.abrir(DB)
    n = db.guardar(con, res.ofertas)
    print(f"\n{n} ofertas guardadas en {DB}")
    if res.vacios:
        print("Sin coincidencias:", ", ".join(f"{p}/{i}" for p, i in res.vacios))
    (DATOS / "ultima_captura.json").write_text(json.dumps(
        {"bloqueados": res.bloqueados, "sin_acceso": res.sin_acceso}, ensure_ascii=False, indent=2))
    return 0 if res.ofertas else 1


def _informe(args):
    con = db.abrir(DB)
    estado = {}
    f = DATOS / "ultima_captura.json"
    if f.exists():
        estado = json.loads(f.read_text())
    out = DATOS / "informe.html"
    out.write_text(informe.generar(cargar_items(), db.ultimas(con),
                                   estado.get("bloqueados"), estado.get("sin_acceso")), encoding="utf-8")
    print(out)


def _lista(args):
    items, pl = cargar_items(), cargar_plantilla()
    perfil = json.loads(Path(args.perfil).read_text()) if args.perfil and Path(args.perfil).exists() else {}
    con = db.abrir(DB)
    mejores = lista.mejores_ofertas(db.ultimas(con), args.solo or None)
    lineas = lista.construir(items, pl["semana_g"], mejores,
                             proteina_obj=perfil.get("proteina_g_dia"),
                             referencia_prot=pl["referencia"]["proteina_g_dia"],
                             excluir=perfil.get("excluir_items"))
    tot = lista.totales(lineas)
    if args.json:
        print(json.dumps({"lineas": [l.__dict__ for l in lineas], "totales": tot}, ensure_ascii=False, indent=2))
        return
    print(f"{'Alimento':<38}{'g/sem':>7}  {'$/kg':>7}  {'$':>7}  Dónde")
    for l in lineas:
        pk = f"{l.precio_kg:.2f}" if l.precio_kg else "—"
        c = f"{l.coste:.2f}" if l.coste is not None else "—"
        print(f"{l.nombre[:37]:<38}{l.gramos:>7.0f}  {pk:>7}  {c:>7}  {l.proveedor or 'sin precio'}"
              f"{'  (oferta)' if l.en_oferta else ''}")
    print(f"\nProteína ≈ {tot['proteina_g_dia']} g/día · {tot['kcal_dia']} kcal/día desde el catálogo")
    print(f"Coste semanal (artículos con precio): ${tot['coste_semana']:.2f}")
    for p, c in tot["por_proveedor"].items():
        print(f"  {p:<18} ${c:.2f}")
    if tot["sin_precio"]:
        print("Sin precio todavía:", ", ".join(tot["sin_precio"]))


def main(argv=None):
    ap = argparse.ArgumentParser(prog="compras")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("probar")
    c = sub.add_parser("capturar")
    c.add_argument("-p", "--proveedor", action="append")
    c.add_argument("-i", "--item", action="append")
    c.add_argument("--chromium", help="ruta al ejecutable de Chromium (para Coles)")
    sub.add_parser("informe")
    l = sub.add_parser("lista")
    l.add_argument("--perfil", default=str(RAIZ / "perfil.local.json"))
    l.add_argument("--solo", action="append", help="limitar a estos proveedores")
    l.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    return {"probar": _probar, "capturar": _capturar, "informe": _informe, "lista": _lista}[a.cmd](a) or 0


if __name__ == "__main__":
    sys.exit(main())
