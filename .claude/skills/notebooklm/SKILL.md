---
name: notebooklm
description: Investiga un tema y lo convierte en un archivo de fuente para NotebookLM dentro de abundancia/notebooklm/, con cada afirmación etiquetada por nivel de evidencia. Úsalo cuando el usuario escriba /notebooklm <tema> o pida ampliar su cuaderno de abundancia, riqueza, mentalidad o fuentes de ingreso.
---

# /notebooklm

Argumento: el tema (por ejemplo «cómo construyó su fortuna Oprah» o «pulsos binaurales y concentración»). Si falta, pregunta cuál.

NotebookLM no se puede escribir desde aquí. El resultado es un archivo Markdown que el usuario sube a mano.

## Pasos
1. Lee `abundancia/conocimiento/INDICE.md` (etiquetas y reglas de la casa), `abundancia/notebooklm/00-guia-notebooklm.md` y un archivo existente para copiar formato y tono. Si el tema ya está en `abundancia/conocimiento/base/`, parte de ahí y no repitas lo verificado.
2. Investiga con búsqueda web y con `abundancia/tools/fetch.py` y `yt.py` (uso en `abundancia/tools/README.md`). Prioriza fuentes primarias: documentos, entrevistas originales, artículos científicos, registros judiciales. Lanza varias búsquedas a la vez.
3. Escribe `abundancia/notebooklm/NN-tema.md` (siguiente número libre), en español, con:
   - Qué pasó o qué se afirma, en viñetas cortas.
   - Etiqueta en cada afirmación: **[TRADICIÓN]**, **[DOCUMENTADO]**, **[ESTUDIO]**, **[ANÉCDOTA]** o **[MITO]** (los archivos `01` a `05` usan además **[SIN EVIDENCIA]**).
   - De dónde salió realmente el dinero (activos, propiedad, ventas), si el tema es una persona.
   - La parte incómoda: deudas, fracasos, suerte, sesgo del superviviente.
   - Qué se puede aplicar mañana.
   - Sección «Fuentes» con URL completas.
4. Añade a la guía `00` dos o tres preguntas nuevas para el chat de NotebookLM.
5. Informa al usuario: ruta del archivo, enlaces que conviene añadir como fuentes web y cualquier dato que no hayas podido verificar. Si el tema merece aparecer en el sitio (`abundancia/site/src/data/`, esquemas en `ESQUEMAS.md`), propónlo; no edites la base ni los JSON desde este comando.

## Reglas
- No presentes una cita como literal si no la has visto en la fuente original. Márcala como anécdota.
- No escribas que una técnica mental produce dinero. Describe qué conducta cambia y qué estudio lo respalda.
- Si el tema es un método de inversión o un programa de pago, pasa antes por el agente `verificador-evidencia`.
