# compras · comparador de comida por coste de proteína

Compara precios de comida en tiendas online australianas y los ordena por lo que importa cuando
entrenas: **cuánto cuesta cada 100 g de proteína** y **cuánta proteína da cada 100 kcal**.
Guarda el historial y arma la lista semanal que cumple tus macros al menor coste.

## Instalación

```bash
cd tools/compras
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium                   # solo si vas a usar Coles
cp perfil.example.json perfil.local.json                # y pon tus datos
```

## Uso

```bash
python -m compras probar            # qué tiendas responden desde tu equipo
python -m compras capturar          # captura precios (todas las tiendas del catálogo)
python -m compras capturar -p woolworths -i pollo_pechuga   # solo una tienda / un alimento
python -m compras informe           # -> datos/informe.html con el ranking
python -m compras lista             # lista semanal con proveedor y coste
```

Con Claude Code abierto en este repo, `/compras` hace todo lo anterior y te explica el resultado.

## Archivos

| Archivo | Para qué |
|---|---|
| `catalogo.yaml` | Los alimentos, su proteína y calorías por 100 g, y cómo buscarlos en cada tienda |
| `proveedores.yaml` | Las tiendas: tipo de acceso, condiciones de envío, fuente de cada dato |
| `plantilla.yaml` | Cantidades semanales de partida (≈170 g de proteína/día) |
| `perfil.local.json` | Tus objetivos. **No se sube** (está en `.gitignore`) |
| `precios_manuales.csv` | Precios que apuntas tú, para tiendas que bloquean el acceso automatizado |
| `datos/` | Historial SQLite, caché e informes. **No se sube** |

## Reglas de uso

Es una herramienta personal: se ejecuta como mucho una vez por semana, consulta unos pocos
productos, guarda una caché de 24 h y espera entre peticiones. **No intenta esquivar las
protecciones anti-bots**: si una tienda devuelve 403, 429 o una verificación, se marca como
bloqueada y esa tienda pasa a precios manuales.

Los términos de uso de Woolworths y Coles restringen el acceso automatizado a sus webs. Úsala
con moderación y bajo tu responsabilidad. Las tiendas Shopify (muchas carnicerías y granjas)
publican su catálogo en `/products.json`, que es el mismo JSON que usa su propio escaparate.

Desde servidores en la nube es más probable que las tiendas bloqueen que desde casa: si algo
falla en la nube, pruébalo en tu PC antes de darlo por perdido.

## Añadir una tienda

1. Si es Shopify (sus URLs tienen `/collections/` y `/products/`): añádela a `proveedores.yaml`
   con `tipo: shopify` y su `base_url`. Los alimentos con búsqueda `_shopify` se buscan solos.
2. Si no: `tipo: manual` y apunta los precios en `precios_manuales.csv`.

## Tests

```bash
python -m pytest -q
```
