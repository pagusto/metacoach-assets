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
  sirve bajo /shefa. Público en https://shefa-prosperai.vercel.app/shefa/ y, a través del
  sitio raíz, en https://pabloagusto.vercel.app/shefa/
- Sitio raíz: proyecto de Vercel «pabloagusto» (https://pabloagusto.vercel.app). Se despliega
  desde archivos, no desde este repositorio: desde la carpeta D:\Proyectos\pabloagusto, que es
  un repositorio git solo local (contiene CV y cartas: no se sube a GitHub ni a ningún otro
  servicio). Su index.html tiene un centro de botones con la regla escrita en un comentario
  («HUB RULE»).
- /empleo/ del sitio raíz pide contraseña (con cualquier usuario; la contraseña es la variable
  de entorno EMPLEO_PASSWORD del proyecto «pabloagusto» en Vercel y no se escribe en la
  carpeta, que es pública). La exige middleware.js, en la raíz de la carpeta del sitio: no lo
  borres ni lo dejes fuera del despliegue. Los enlaces directos /empleo/docs/<id>/<archivo>
  siguen abiertos a propósito, por si ya se envió alguno.
- Nutrición diaria: la tarea programada en la nube «Nutrición diaria de Shefa» (05:37 de
  Canberra; existe desde el 15 de noviembre de 2026 y las entradas anteriores se escribieron a
  mano) lanza al agente nutridor-conocimiento, que escribe la entrada del día en
  abundancia/site/src/content/diario/ con la fecha de Australia/Sydney, sin tocar una que ya
  exista, y compila y pasa las pruebas. Después la propia tarea la sube directa a master,
  sin pull requests (solo abriría uno, y lo fusionaría ella misma, si el servidor rechazara
  la subida directa): no queda nada por revisar. Los lunes comprueba además los videos de la
  videoteca y repite las pruebas a 1024 px. Sus instrucciones solo se cambian desde la
  conversación de Shefa en la nube; las que tiene están en .claude/tareas/nutricion-diaria.md.
  Si un día la entrada no llega, la cubre el paso 5.
- Guías: abundancia/README.md, abundancia/site/COMPONENTES.md, abundancia/conocimiento/INDICE.md.

SIEMPRE, EN ESTE ORDEN
1. Sincroniza: git checkout master && git pull. Luego cd abundancia/site && npm ci.
2. Comprueba en local: npm run build; ejecuta todos los scripts de prueba de scripts/
   (interacciones, ritual, tradición, datos, videoteca: npm run pruebas los lanza todos y
   npm run pruebas:tableta los repite a 1024 px) y las capturas de todas las rutas en 1440,
   1024, 390 y 320 px. Corrige lo que falle antes de seguir.
3. Comprueba Vercel: el último despliegue de producción de «shefa» debe estar listo y
   corresponder al último commit de master. Si no, despliega producción de nuevo. Después,
   desde abundancia/site, comprueba los dos dominios con un navegador real:
   node scripts/vivo.cjs https://shefa-prosperai.vercel.app/shefa dist/shefa
   node scripts/vivo.cjs https://pabloagusto.vercel.app/shefa dist/shefa
   Cada uno abre las 15 rutas y mira estilos, película, videos y que el HTML servido sea el
   que compilaste en el paso 2. Los dos deben acabar en «Todo en orden».
4. Sitio raíz: asegúrate de que «pabloagusto» tiene (a) en index.html el botón
   <a class="cta" href="/shefa/">Wealth manifestation</a> en lugar del hueco «coming soon», y
   (b) en vercel.json las cuatro reglas (Vercel compara las rutas de forma estricta: sin las dos
   últimas, las direcciones con barra final dan 404, y el botón apunta a /shefa/)
   { "source": "/shefa", "destination": "https://shefa-prosperai.vercel.app/shefa/" },
   { "source": "/shefa/:path*", "destination": "https://shefa-prosperai.vercel.app/shefa/:path*" },
   { "source": "/shefa/", "destination": "https://shefa-prosperai.vercel.app/shefa/" } y
   { "source": "/shefa/:path+/", "destination": "https://shefa-prosperai.vercel.app/shefa/:path+/" }.
   Si falta algo, cámbialo conservando todo lo demás del sitio raíz, despliega y comprueba que
   https://pabloagusto.vercel.app/shefa/, /shefa/arbol y /shefa/arbol/ cargan con sus estilos.
   Antes de desplegar el sitio raíz, comprueba que producción coincide con el último commit
   de su carpeta: python abundancia/tools/raiz-verificar.py D:\Proyectos\pabloagusto
   (python3 en Linux y macOS). Si hay cambios sin confirmar o producción no coincide, otra
   sesión editó o publicó sin confirmar: con --trabajo ves si producción es lo que hay en la
   carpeta; si lo es, confirma ese estado tal cual en un commit aparte antes de tocar nada.
   Después confirma tus cambios en git (git add -A && git commit), despliega desde la carpeta
   (vercel deploy --prod --scope prosperai --yes) y repite la comprobación.
5. Nutrición: si falta en el diario la entrada de hoy (fecha de Canberra:
   TZ=Australia/Sydney date +%F), la tarea programada no corrió o no pudo publicar: ejecuta
   /nutrir y dilo en el informe. Nunca sustituyas una entrada que ya existe.
6. Videoteca: abundancia/tools/yt.py check sobre todos los ids de videoteca.json (python en
   Windows, python3 en Linux y macOS); sustituye o quita los que ya no existan.
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
accesibilidad y rendimiento. Para citas, estudios y cifras empieza por
node scripts/fuentes-verificar.mjs (desde abundancia/site): coteja cada cita hebrea con
Sefaria, cada cita con su original, cada tamaño de efecto con el resumen publicado y cada
cifra con su fuente, y dice «ok», «difiere» o «no abre». Corrige lo que difiere; lo que no
abre es una web que niega el acceso a los scripts: ábrela a mano, una vez, sin forzarla. En
la nube no se pudieron abrir sefaria.org, chabad.org, ubs.com, zh.ch, bls.gov ni pubmed:
empieza por lo que depende de ellos. Coteja cada estudio con la
versión publicada, no con el borrador: Semantic Scholar, OpenAlex y Europe PMC a veces
devuelven el resumen del documento de trabajo bajo el DOI de la revista. Lee antes los
informes anteriores de abundancia/auditoria/ para no deshacer lo ya resuelto. Corrige lo
confirmado y guarda el informe en abundancia/auditoria/AAAA-MM-DD.md.

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
