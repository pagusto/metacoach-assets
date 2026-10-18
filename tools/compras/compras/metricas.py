"""Las dos métricas que deciden qué comprar: coste por proteína y densidad proteica."""
from __future__ import annotations


def coste_100g_proteina(precio_kg: float | None, proteina_100g: float | None) -> float | None:
    """Dólares que cuesta comprar 100 g de proteína de este alimento.

    Un kilo contiene proteina_100g * 10 gramos de proteína, así que
    $/100 g de proteína = precio_kg * 100 / (proteina_100g * 10) = precio_kg * 10 / proteina_100g.
    """
    if not precio_kg or not proteina_100g:
        return None
    return round(precio_kg * 10.0 / proteina_100g, 3)


def proteina_por_100kcal(proteina_100g: float | None, kcal_100g: float | None) -> float | None:
    """Gramos de proteína por cada 100 kcal: cuánto «cuesta» la proteína en calorías.

    En recomposición importa tanto como el precio: el wagyu da proteína cara en dólares y en calorías.
    """
    if not proteina_100g or not kcal_100g:
        return None
    return round(proteina_100g * 100.0 / kcal_100g, 2)


def semaforo_coste(coste: float | None, verde: float, ambar: float) -> str:
    """'ok' si coste <= verde, 'warn' si <= ambar, 'crit' por encima. 'na' si no hay dato."""
    if coste is None:
        return "na"
    if coste <= verde:
        return "ok"
    if coste <= ambar:
        return "warn"
    return "crit"
