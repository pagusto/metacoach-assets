"""Historial de precios en SQLite: cada captura se guarda, nada se sobreescribe."""
from __future__ import annotations

import sqlite3
from pathlib import Path

from .modelo import Oferta

ESQUEMA = """
CREATE TABLE IF NOT EXISTS ofertas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor TEXT NOT NULL,
    item TEXT NOT NULL,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL,
    precio_kg REAL,
    texto_unitario TEXT,
    en_oferta INTEGER NOT NULL DEFAULT 0,
    precio_antes REAL,
    url TEXT,
    capturado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_item_fecha ON ofertas(item, capturado);
"""


def abrir(ruta: Path) -> sqlite3.Connection:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(ruta)
    con.row_factory = sqlite3.Row
    con.executescript(ESQUEMA)
    return con


def guardar(con: sqlite3.Connection, ofertas: list[Oferta]) -> int:
    con.executemany(
        "INSERT INTO ofertas (proveedor,item,nombre,precio,precio_kg,texto_unitario,en_oferta,"
        "precio_antes,url,capturado) VALUES (:proveedor,:item,:nombre,:precio,:precio_kg,"
        ":texto_unitario,:en_oferta,:precio_antes,:url,:capturado)",
        [o.dict() for o in ofertas],
    )
    con.commit()
    return len(ofertas)


def ultimas(con: sqlite3.Connection) -> list[sqlite3.Row]:
    """La captura más reciente de cada (proveedor, item, nombre)."""
    return con.execute(
        """SELECT o.* FROM ofertas o
           JOIN (SELECT proveedor, item, nombre, MAX(capturado) AS m
                 FROM ofertas GROUP BY proveedor, item, nombre) u
             ON o.proveedor=u.proveedor AND o.item=u.item AND o.nombre=u.nombre AND o.capturado=u.m
           WHERE o.precio_kg IS NOT NULL"""
    ).fetchall()


def historial(con: sqlite3.Connection, item: str) -> list[sqlite3.Row]:
    return con.execute(
        "SELECT * FROM ofertas WHERE item=? ORDER BY capturado", (item,)
    ).fetchall()
