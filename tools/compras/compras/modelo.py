from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone


@dataclass
class Oferta:
    """Un producto concreto de una tienda concreta en un momento concreto."""
    proveedor: str
    item: str                  # id del catálogo (p. ej. "pollo_pechuga")
    nombre: str                # nombre tal como lo publica la tienda
    precio: float              # precio del envase o de la unidad de venta
    precio_kg: float | None    # normalizado a $/kg (None si no se pudo calcular)
    texto_unitario: str = ""   # el texto original de precio unitario, para auditar
    en_oferta: bool = False
    precio_antes: float | None = None
    url: str = ""
    capturado: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat(timespec="seconds"))

    def dict(self):
        return asdict(self)


class Bloqueado(Exception):
    """La tienda rechazó el acceso automatizado (403, challenge de bots, captcha).

    No se intenta esquivar: el proveedor pasa a entrada manual de precios.
    """
