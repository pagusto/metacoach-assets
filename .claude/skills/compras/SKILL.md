---
name: compras
description: Arma la compra semanal de comida en Australia al menor coste por proteína. Captura precios de tiendas online (Woolworths, Coles, carnicerías y granjas Shopify), los compara en $ por 100 g de proteína y genera la lista que cumple los macros del perfil. Úsala cuando el usuario pida hacer la compra, comparar precios de comida o proteína, buscar dónde comprar carne, o revisar ofertas de la semana.
---

# /compras

Herramienta en `tools/compras/`. Todo se ejecuta desde ese directorio con `python -m compras ...`.

## Flujo

1. **Perfil.** Lee `tools/compras/perfil.local.json`. Si no existe, pide al usuario peso, % de
   grasa aproximado, objetivo (superávit / recomposición / déficit), calorías y proteína diarias,
   y créalo a partir de `perfil.example.json`. Ese archivo está en `.gitignore`: nunca lo subas
   al repositorio ni copies su contenido en un commit.

2. **¿Hay precios recientes?** Mira la fecha de `datos/ultima_captura.json`. Si falta o tiene
   más de 7 días, o el usuario pide precios nuevos:
   - `python -m compras probar` para ver qué tiendas responden.
   - `python -m compras capturar` (tarda unos minutos: hay pausas entre peticiones a propósito).
   Si ya hay una captura de esta semana, no vuelvas a capturar salvo que lo pidan.

3. **Resultados.**
   - `python -m compras informe` → `datos/informe.html` (ranking por $/100 g de proteína).
   - `python -m compras lista --json` → la lista semanal con proveedor y coste por artículo.

4. **Respuesta al usuario**, en este orden:
   - La lista agrupada **por tienda**, con cantidad, precio y coste de cada artículo.
   - El total semanal y cuánto va a cada tienda. Compáralo con `presupuesto_semanal_aud`.
   - Comprobación de macros: proteína y kcal diarias frente a los objetivos del perfil. Las kcal
     del catálogo no incluyen aceite, fruta ni salsas: dilo.
   - Ofertas de la semana (`en_oferta`) que merezca la pena aprovechar.
   - **Consolidación de pedidos:** si la lista reparte artículos baratos entre muchas tiendas,
     propón juntar el pedido en una o dos, comparando el ahorro con el pedido mínimo y el envío
     de cada tienda (`proveedores.yaml`). Un ahorro de $2 no compensa un envío de $10.
   - Carne a granel: si el perfil tiene `congelador_litros`, sugiere una caja mensual que quepa
     (≈0,8–1 kg de carne envasada al vacío por litro).

## Reglas

- **No inventes precios.** Si un artículo no tiene precio, dilo y ofrece apuntarlo en
  `precios_manuales.csv` (columnas: proveedor,item,nombre,precio,peso_g,url).
- **Tiendas bloqueadas:** si `capturar` marca una tienda como BLOQUEADA, no intentes esquivarlo
  (ni proxies, ni cambiar de identidad, ni resolver captchas). Explícalo y pasa esa tienda a
  precios manuales. «SIN RED» significa que el equipo no tiene salida a esa web: no es la tienda.
- Los valores nutricionales de `catalogo.yaml` son típicos. Si el usuario elige un producto
  concreto con etiqueta distinta (sobre todo yogures y atún), corrige el catálogo.
- El wagyu y otros cortes premium salen caros por gramo de proteína: preséntalos como compra de
  calidad, no como fuente principal de proteína, salvo que el usuario diga lo contrario.

## Mantenimiento

- Alimento nuevo: añádelo a `catalogo.yaml` (proteína y kcal por 100 g, búsquedas por tienda) y,
  si va en la compra habitual, a `plantilla.yaml`.
- Tienda nueva: `proveedores.yaml`. Shopify → `tipo: shopify`; si no → `tipo: manual`.
- Tras cambiar el código: `python -m pytest -q` en `tools/compras`.
