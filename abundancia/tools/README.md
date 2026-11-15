# Herramientas de investigación

Scripts sin dependencias (Python 3 + curl) para buscar y verificar fuentes.

## YouTube (sin clave de API)

```bash
python3 abundancia/tools/yt.py search "napoleon hill 1954 master key" -n 10
python3 abundancia/tools/yt.py search "Brian Tracy metas" -n 10 --lang es
python3 abundancia/tools/yt.py check JfqDvi8b4gg m6dlTsKXuyQ
```

`check` usa oEmbed: `ok: true` significa que el video existe y se puede incrustar.
Ningún video entra en la videoteca sin `ok: true`.

## Fuentes de texto

```bash
python3 abundancia/tools/fetch.py --wiki "Sefirot" --grep "Cordovero|colou?r"
python3 abundancia/tools/fetch.py --wiki "Feng shui" --lang es --max 8000
python3 abundancia/tools/fetch.py --doi 10.1177/01461672231181162
python3 abundancia/tools/fetch.py --s2 "implementation intentions meta-analysis"
python3 abundancia/tools/fetch.py https://www.gutenberg.org/cache/epub/14209/pg14209.txt --grep "seven principles"
python3 abundancia/tools/fetch.py https://www.myjewishlearning.com/article/kabbalah-mysticism-101/
```

## Qué se puede abrir directamente en la sesión en la nube

El entorno `metacoach-assets` solo permite estos sitios (el resto, por búsqueda web):

| Funciona | Notas |
|---|---|
| `www.youtube.com`, `i.ytimg.com` | Búsqueda y oEmbed. Las transcripciones no: YouTube pide verificación. |
| `en.wikipedia.org`, `es.wikipedia.org` | Usa `--wiki` (wikitexto, más compacto). |
| `api.crossref.org` | Metadatos y a veces resumen por DOI. Sirve para comprobar que una cita existe. |
| `api.semanticscholar.org` | Limita peticiones (HTTP 429); reintenta. |
| `www.gutenberg.org` | Textos de dominio público completos. |
| `archive.org` | Búsqueda (`advancedsearch.php`); las descargas pueden fallar. |
| `www.cia.gov` | Sala de lectura y PDF. |
| `www.myjewishlearning.com`, `pmc.ncbi.nlm.nih.gov`, `www.ftc.gov` | Páginas normales. |
| `huggingface.co` | Solo archivos pequeños; los modelos grandes redirigen a otro host. |

Responden con bloqueo anti-robots aunque están permitidos: `www.sefaria.org`,
`www.chabad.org`, `www.ubs.com`, `www.bls.gov`, `pubmed.ncbi.nlm.nih.gov`.
Para ellos usa la búsqueda web.

En un PC propio no hay estas restricciones y los scripts funcionan igual.

## Sitio raíz (carpeta local, fuera de este repositorio)

```bash
python abundancia/tools/raiz-verificar.py D:\Proyectos\pabloagusto            # producción contra el último commit
python abundancia/tools/raiz-verificar.py D:\Proyectos\pabloagusto --trabajo  # contra la carpeta tal como está
```

Compara byte a byte cada archivo de la carpeta del sitio raíz con lo que sirve
`https://pabloagusto.vercel.app`, y comprueba que `/empleo/` pide contraseña y que las rutas de
Shefa responden. Con la variable de entorno `EMPLEO_PASSWORD` compara también el panel. Solo lee:
no cambia la carpeta ni publica. Se usa en el paso 4 de `abundancia/PROMPT-LOCAL.md`, antes y
después de desplegar (`python` en Windows, `python3` en Linux y macOS).
