# Shefa

Sistema personal de práctica de riqueza que une tradición y datos. «Shefa» (שפע) significa
abundancia o flujo en hebreo.

- **Tradición:** enseñanzas judías sobre el sustento, hermetismo y maestros de la prosperidad
  (Napoleon Hill, Brian Tracy y otros), feng shui y prácticas de energía, descritas en sus
  propios términos y con su fuente.
- **Datos:** cifras sobre cómo se crea, se conserva y se pierde la riqueza, y qué prácticas
  tienen respaldo en la investigación.

Cada afirmación lleva una etiqueta: tradición, documentado, estudio, anécdota o mito.

## Qué hay aquí

| Pieza | Dónde | Para qué |
|---|---|---|
| Sitio | `site/` (Astro) | Hoy, Árbol, Ritual, Tradición, Espacio, Datos, Videoteca, Colores, Agentes, Método |
| Datos del sitio | `site/src/data/*.json` | Contenido por sección, con fuentes. Esquemas en `ESQUEMAS.md` |
| Diario de conocimiento | `site/src/content/diario/` | Una entrada por día, escrita por la nutrición diaria |
| Base de conocimiento | `conocimiento/` | Notas verificadas que leen los agentes. Empieza por `INDICE.md` |
| Investigación | `research_notes/`, `reports/` | Siete notas con fuentes y el reporte de síntesis |
| Película | `video/` | «Riquezas y colores»: animación HTML, música sintetizada y renderizador a MP4 |
| Cuaderno NotebookLM | `notebooklm/` | Doce fuentes listas para subir, con preguntas y prompt de video |
| Herramientas | `tools/` | `yt.py` busca y verifica videos; `fetch.py` lee fuentes |
| Diseño | `design/` | Brief y la dirección aprobada «Lo Shu» |
| Prompt para PC | `PROMPT-LOCAL.md` | Prompt único para mantener, auditar o ampliar Shefa desde tu equipo |
| Auditorías | `auditoria/` | Un informe por auditoría: lo corregido, lo descartado y lo que no se pudo verificar |

Los agentes y comandos viven en `.claude/` en la raíz del repositorio:

- Directores: `riqueza-material`, `riqueza-espiritual`, `abundancia`.
- Especialistas: `estratega-ingresos`, `analista-datos`, `maestro-precios-y-ventas`,
  `guardian-patrimonio`, `guia-cabala`, `guia-hermetico`, `guia-feng-shui`, `guia-ritual`,
  `coach-mentalidad`, `verificador-evidencia`, `curador-videoteca`, `nutridor-conocimiento`.
- Comandos: `/consejo-abundancia <pregunta>`, `/nutrir`, `/ritual-abundancia`,
  `/revision-semanal`, `/notebooklm <tema>`.

## Trabajar en el sitio

```bash
cd abundancia/site
npm ci
npm run dev          # desarrollo
npm run build        # compila a dist/shefa
npm run capturas -- / /arbol     # capturas en claro y oscuro, escritorio y móvil
npm run probar       # prueba de interacciones de Hoy y Árbol
```

El sitio se sirve bajo `/shefa`. Todo enlace interno pasa por `ruta()` (`src/lib/ruta.ts`).
La guía de componentes y reglas de diseño está en `site/COMPONENTES.md`.

## Despliegue

El proyecto de Vercel `shefa` compila `abundancia/site` en cada push. Lo que llega a `master`
sale a producción en `https://shefa-prosperai.vercel.app/shefa/`, y el sitio raíz lo muestra en
`https://pabloagusto.vercel.app/shefa/`. Una tarea programada añade cada mañana la entrada del
diario. Los datos del tablero se guardan solo en el navegador de quien lo usa.

## Principios

- Las tradiciones se describen en sus propios términos. No se afirma causalidad sobrenatural
  como hecho. Las aplicaciones al dinero se marcan como aplicación moderna.
- Las enseñanzas judías se tratan con respeto y con su fuente exacta.
- Ninguna cita, cifra o fuente inventada. Lo que no se pudo verificar se marca.
- Información general, no asesoramiento financiero, legal ni médico.
