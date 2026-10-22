import pytest

from compras.normalizar import (parse_peso_gramos, parse_precio_unitario, precio_por_kg,
                                precio_por_kg_desde_unitario)


@pytest.mark.parametrize("texto, esperado", [
    ("$13.00 / 1KG", 13.0),          # formato CupString de Woolworths
    ("$1.20 / 100G", 12.0),
    ("$12.00 per 1kg", 12.0),        # formato comparable de Coles
    ("$3.50 per 100g", 35.0),
    ("$4.20 / 1L", 4.2),             # líquidos: densidad 1
    ("$0.84 / 100ML", 8.4),
    ("$25 per kg", 25.0),            # sin cantidad explícita
    ("$1,50 / 100g", 15.0),          # coma decimal
])
def test_precio_unitario_a_kg(texto, esperado):
    assert precio_por_kg_desde_unitario(texto) == pytest.approx(esperado)


@pytest.mark.parametrize("texto", ["$0.45 / 1EA", "$7.00 each", "", None, "Special"])
def test_precio_unitario_no_por_peso(texto):
    assert precio_por_kg_desde_unitario(texto) is None


def test_parse_precio_unitario_devuelve_gramos():
    assert parse_precio_unitario("$1.20 / 100G") == (1.2, 100.0)


@pytest.mark.parametrize("texto, gramos", [
    ("1kg", 1000), ("500g", 500), ("1.5 kg", 1500), ("2 x 500g", 1000),
    ("3 x 95g", 285), ("Free Range Eggs 700g 12 Pack", 700), ("Rice 5kg", 5000),
    ("Natural Yoghurt 1L", 1000), ("Chicken Breast 1.2kg", 1200), ("6x150g", 900),
])
def test_peso(texto, gramos):
    assert parse_peso_gramos(texto) == pytest.approx(gramos)


def test_peso_ausente():
    assert parse_peso_gramos("Chicken breast fillets per kg tray") is None


def test_precio_por_kg():
    assert precio_por_kg(10.0, 500) == 20.0
    assert precio_por_kg(10.0, None) is None
