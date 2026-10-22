import pytest

from compras.metricas import coste_100g_proteina, proteina_por_100kcal, semaforo_coste


def test_coste_proteina_pollo():
    # $12/kg y 23 g de proteína por 100 g -> 230 g por kg -> $5,22 por 100 g de proteína
    assert coste_100g_proteina(12.0, 23.0) == pytest.approx(5.217, abs=1e-3)


def test_coste_proteina_whey():
    # $80/kg con 88 % de proteína -> $9,09 por 100 g de proteína
    assert coste_100g_proteina(80.0, 88.0) == pytest.approx(9.091, abs=1e-3)


def test_sin_datos():
    assert coste_100g_proteina(None, 20) is None
    assert coste_100g_proteina(10, 0) is None


def test_densidad():
    assert proteina_por_100kcal(23.0, 115) == 20.0
    assert proteina_por_100kcal(19.0, 240) == pytest.approx(7.92, abs=0.01)


@pytest.mark.parametrize("c, s", [(2.5, "ok"), (3.0, "ok"), (4.5, "warn"), (9, "crit"), (None, "na")])
def test_semaforo(c, s):
    assert semaforo_coste(c, 3.0, 6.0) == s
