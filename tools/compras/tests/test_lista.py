from compras.catalogo import cargar_items, cargar_plantilla
from compras.lista import construir, mejores_ofertas, totales


def test_plantilla_cumple_objetivo_de_proteina():
    items, pl = cargar_items(), cargar_plantilla()
    lineas = construir(items, pl["semana_g"], {})
    t = totales(lineas)
    assert 155 <= t["proteina_g_dia"] <= 180
    assert t["coste_semana"] == 0 and len(t["sin_precio"]) == len(lineas)


def test_escalado_por_perfil():
    items, pl = cargar_items(), cargar_plantilla()
    ref = pl["referencia"]["proteina_g_dia"]
    base = totales(construir(items, pl["semana_g"], {}))["proteina_g_dia"]
    mas = totales(construir(items, pl["semana_g"], {}, proteina_obj=ref * 1.2, referencia_prot=ref))["proteina_g_dia"]
    assert mas > base


def test_mejor_oferta_por_kg_y_filtro_de_proveedor():
    ofs = [{"item": "pollo_pechuga", "proveedor": "a", "precio_kg": 14.0, "nombre": "x"},
           {"item": "pollo_pechuga", "proveedor": "b", "precio_kg": 11.0, "nombre": "y"},
           {"item": "pollo_pechuga", "proveedor": "c", "precio_kg": None, "nombre": "z"}]
    assert mejores_ofertas(ofs)["pollo_pechuga"]["proveedor"] == "b"
    assert mejores_ofertas(ofs, ["a"])["pollo_pechuga"]["proveedor"] == "a"
