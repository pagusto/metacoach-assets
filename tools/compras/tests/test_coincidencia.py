from compras.coincidencia import coincide


def test_incluir_y_excluir():
    inc, exc = ["chicken", "breast"], ["marinated", "schnitzel"]
    assert coincide("Woolworths RSPCA Chicken Breast Fillets 1kg", inc, exc)
    assert not coincide("Chicken Breast Schnitzel 500g", inc, exc)
    assert not coincide("Chicken Thigh Fillets", inc, exc)


def test_alternativas():
    assert coincide("Beef Mince Heart Smart 500g", ["mince", "5 star|heart smart"], [])
    assert not coincide("Beef Mince Regular 1kg", ["mince", "5 star|heart smart"], [])
