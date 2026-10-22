"""Parser de /products.json con la estructura documentada de Shopify (datos de ejemplo)."""
from compras.fuentes.shopify import a_ofertas

PRODUCTOS = [
    {"title": "F1 Wagyu Rump Steak", "handle": "f1-wagyu-rump",
     "variants": [{"title": "500g", "price": "18.00", "available": True, "compare_at_price": None, "grams": 500},
                  {"title": "1kg", "price": "34.00", "available": True, "compare_at_price": "40.00", "grams": 1000},
                  {"title": "2kg", "price": "60.00", "available": False, "grams": 2000}]},
    {"title": "Wagyu Burger Patties 4 pack", "handle": "wagyu-burgers",
     "variants": [{"title": "Default Title", "price": "15.00", "available": True, "grams": 600}]},
    {"title": "Chicken Breast Fillets (per kg)", "handle": "chicken-breast",
     "variants": [{"title": "Default Title", "price": "13.99", "available": True, "grams": 0}]},
]


def test_wagyu_filtra_y_calcula():
    o = a_ofertas(PRODUCTOS, "granja", "wagyu_f1", "https://x.example", ["wagyu"], ["burger"])
    assert [x.precio_kg for x in o] == [36.0, 34.0]        # el de 2 kg está agotado
    assert o[1].en_oferta and o[1].precio_antes == 40.0
    assert o[0].url == "https://x.example/products/f1-wagyu-rump"


def test_precio_por_kg_explicito():
    o = a_ofertas(PRODUCTOS, "granja", "pollo", "https://x.example", ["chicken", "breast"], [])
    assert len(o) == 1 and o[0].precio_kg == 13.99
