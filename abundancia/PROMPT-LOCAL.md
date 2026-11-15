# Prompt único para tu PC

Un solo prompt para mantener Shefa desplegado en Vercel, enlazado en tu sitio raíz y al día.
También sirve para auditarlo o ampliarlo: cambia la primera línea.

## Antes de pegarlo

```bash
git clone https://github.com/pagusto/metacoach-assets   # o git pull si ya lo tienes
cd metacoach-assets
claude
```

Si quieres que use muchos agentes en paralelo, añade al final la frase «usa un workflow».

## El prompt

```text
MODO: mantener        (cambia a «auditar» o «ampliar» cuando quieras; por defecto, mantener)

Eres el responsable de operación de Shefa, mi sistema de práctica de riqueza (tradición y
datos), y de su lugar dentro de mi sitio raíz. Tu trabajo es que todo siga desplegado en
Vercel, al día y funcionando, sin dejar nada pendiente en pull requests. Usa las skills que
tengo instaladas, los agentes y comandos del repositorio (.claude/agents, .claude/skills) y
la CLI o el conector de Vercel. No me preguntes salvo bloqueo real.

MAPA
- Repositorio: pagusto/metacoach-assets. La rama master es producción.
- Shefa: proyecto de Vercel «shefa» (equipo prosperai). Compila abundancia/site (Astro) y lo
  sirve bajo /shefa. Público en https://shefa-prosperai.vercel.app/shefa/
- Sitio raíz: proyecto de Vercel «pabloagusto» (https://pabloagusto.vercel.app). Se despliega
  desde archivos, no desde este repositorio. Su index.html tiene un centro de botones con la
  regla escrita en un comentario («HUB RULE»).
- Nutrición diaria: una tarea programada en la nube añade cada mañana una entrada en
  abundancia/site/src/content/diario/ y la fusiona sola en master.
- Guías: abundancia/README.md, abundancia/site/COMPONENTES.md, abundancia/conocimiento/INDICE.md.

SIEMPRE, EN ESTE ORDEN
1. Sincroniza: git checkout master && git pull. Luego cd abundancia/site && npm ci.
2. Comprueba en local: npm run build; ejecuta todos los scripts de prueba de scripts/
   (interacciones, ritual, tradición, datos, videoteca) y las capturas de todas las rutas en
   1440, 390 y 320 px. Corrige lo que falle antes de seguir.
3. Comprueba Vercel: el último despliegue de producción de «shefa» debe estar listo y
   corresponder al último commit de master. Si no, despliega producción de nuevo. Abre las
   15 rutas bajo /shefa y confirma que responden y cargan estilos, la película y los videos.
4. Sitio raíz: asegúrate de que «pabloagusto» tiene (a) en index.html el botón
   <a class="cta" href="/shefa/">Wealth manifestation</a> en lugar del hueco «coming soon», y
   (b) en vercel.json las reglas
   { "source": "/shefa", "destination": "https://shefa-prosperai.vercel.app/shefa/" } y
   { "source": "/shefa/:path*", "destination": "https://shefa-prosperai.vercel.app/shefa/:path*" }.
   Si falta algo, cámbialo conservando todo lo demás del sitio raíz, despliega y comprueba que
   https://pabloagusto.vercel.app/shefa/ y /shefa/arbol cargan con sus estilos.
5. Nutrición: si falta la entrada de hoy en el diario, ejecuta /nutrir.
6. Videoteca: python3 abundancia/tools/yt.py check sobre todos los ids de videoteca.json;
   sustituye o quita los que ya no existan.
7. Publica: si cambiaste algo, confirma directamente en master con mensajes claros y haz
   push (sin pull requests; yo lo autorizo). Vercel despliega solo. Vuelve al paso 3.
8. Informe de una página: direcciones en vivo, qué cambiaste, qué comprobaste, qué no pudiste
   comprobar y si hay algo que solo yo puedo decidir.

SI MODO = auditar (además de lo anterior, antes del paso 7)
Lanza revisores independientes en paralelo e intenta refutar cada hallazgo antes de aceptarlo:
riqueza material (medidas del Árbol, calculadoras, cada cifra de datos.json contra su fuente
primaria: UBS, Reserva Federal, IRS, BLS, FTC, Scamwatch); manifestación y psicología (cada
tamaño de efecto de practicas.json contra el artículo original; que el ritual use lo que
mejor evidencia tiene); tradiciones (cada cita hebrea contra Sefaria letra por letra, citas de
los maestros contra el texto original, tablas de feng shui contra una fuente académica;
respeto y ningún estereotipo); diseño (retícula, jerarquía, coherencia, claro y oscuro);
accesibilidad y rendimiento. En la nube no se pudieron abrir sefaria.org, chabad.org, ubs.com,
zh.ch, bls.gov ni pubmed: empieza por lo que depende de ellos. Corrige lo confirmado y guarda
el informe en abundancia/auditoria/AAAA-MM-DD.md.

SI MODO = ampliar (además de lo anterior)
Propón tres caminos para la siguiente versión y elige con un panel de jueces (impacto en
ingreso real, constancia diaria, belleza, esfuerzo). Evalúa al menos: sincronización entre
dispositivos con cuenta propia, flujo de caja real por semana y trimestre, recordatorios del
ritual, aplicación instalable sin conexión, narración con voz para la película, plan de 90
días adaptado a mis números, más calculadoras. Construye la opción elegida respetando el
sistema de diseño y publícala igual que en el paso 7.

REGLAS
- Nada se publica si no compila y no pasan las pruebas.
- Las tradiciones se describen en sus propios términos; ninguna causalidad sobrenatural como
  hecho; lo que sea aplicación moderna se rotula así. Enseñanzas judías con respeto, fuente
  exacta y sin estereotipos.
- No inventes citas, cifras ni fuentes; lo que no se pueda verificar se marca.
- Información general: nada de consejo financiero, legal o médico personalizado.
- Mis datos del tablero viven en mi navegador: no los subas a ningún servicio.
- No toques otros proyectos de Vercel ni otros pull requests del repositorio.
```

## Atajos

- Consejo rápido: `/consejo-abundancia ¿subo mis precios este mes?`
- Nutrir la base hoy: `/nutrir`
- Ritual guiado: `/ritual-abundancia`
