---
name: nutrir
description: Ejecuta a mano la nutrición diaria del conocimiento de Shefa. Busca y verifica un hallazgo por pilar, escribe la entrada del diario de hoy, añade un video a la videoteca si pasó la comprobación y compila el sitio. Úsalo cuando el usuario escriba /nutrir o pida la entrada de hoy del diario.
---

# /nutrir

Es el mismo procedimiento que la tarea diaria programada. La fuente única del procedimiento está en `.claude/agents/nutridor-conocimiento.md`: léelo y síguelo tal cual. Si puedes, delega en el agente `nutridor-conocimiento` con la herramienta Agent; si no, hazlo tú.

Argumento opcional: una fecha `AAAA-MM-DD` (por defecto, hoy en Canberra: `TZ=Australia/Sydney date +%F`) o un tema que priorizar.

## Resumen del procedimiento
a) Leer `abundancia/conocimiento/INDICE.md` y las siete últimas entradas de `abundancia/site/src/content/diario/` para no repetir.
b) Buscar un hallazgo nuevo por pilar: material (estadística, informe o estudio), espiritual (enseñanza con fuente primaria), abundancia (práctica con evidencia o video nuevo).
c) Verificar cada uno con `abundancia/tools/fetch.py`, `abundancia/tools/yt.py check` o búsqueda web; etiquetar; descartar lo que no se pueda verificar.
d) Escribir `abundancia/site/src/content/diario/AAAA-MM-DD.md` con el formato «Diario de conocimiento» de `abundancia/site/src/data/ESQUEMAS.md`.
e) Si un video pasó la comprobación, añadirlo a `abundancia/site/src/data/videoteca.json`.
f) `npm run build && npm run pruebas` dentro de `abundancia/site`; si falla, corregir la entrada.
g) Informar: qué se añadió, qué se descartó y qué correcciones se proponen para la base.

## Reglas
- La base (`abundancia/conocimiento/base/`) no se edita nunca desde aquí.
- Si ya existe la entrada de la fecha, no la sobrescribas: pregunta si se sustituye.
- No hagas commit ni push salvo que el usuario lo pida.
