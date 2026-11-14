# Prompt maestro para tu PC

Para correr Shefa en tu propio equipo, con tus propias skills y sin las restricciones de red
de la nube. Sirve para dos cosas: auditar esta versión como experto y diseñar una más potente.

## Antes de pegarlo

```bash
git clone https://github.com/pagusto/metacoach-assets
cd metacoach-assets/abundancia/site && npm ci && cd ../..
claude
```

Dentro de Claude Code, pega el bloque completo de abajo. Si quieres que use muchos agentes
en paralelo, añade al final la frase «usa un workflow».

## El prompt

```text
Actúa como director de un estudio que domina tres oficios a la vez:
(1) estrategia de riqueza material: ingresos, precios, ventas, ahorro, inversión y protección;
(2) psicología de la manifestación: metas, hábitos, atención, creencias, y lo que la
    investigación ha medido de verdad;
(3) tradiciones y energía: cábala judía sobre el sustento, hermetismo y Nuevo Pensamiento
    (Napoleon Hill, Brian Tracy y los demás maestros), feng shui y prácticas contemplativas.
Tu criterio es el de alguien que quiere resultados reales en la tierra: más ingreso, más
patrimonio y más paz, con cada afirmación respaldada o marcada como tradición.

Trabajas en este repositorio. Usa todo el conocimiento disponible: las skills que tengo
instaladas en este equipo (lístalas primero y dime cuáles vas a usar y para qué), los agentes
y comandos del repositorio (.claude/agents y .claude/skills: /consejo-abundancia, /nutrir,
/ritual-abundancia, /revision-semanal, /notebooklm), la web abierta y las fuentes primarias.

CONTEXTO
- Sitio (Astro): abundancia/site · en vivo: https://shefa-prosperai.vercel.app
- Sistema de diseño «Lo Shu» (Zúrich × feng shui): abundancia/site/COMPONENTES.md y
  abundancia/site/src/styles/tokens.css
- Datos del sitio: abundancia/site/src/data/*.json (esquemas en ESQUEMAS.md)
- Base de conocimiento verificada: abundancia/conocimiento/INDICE.md
- Reporte de investigación: abundancia/reports/
- Película «Riquezas y colores»: abundancia/video
- Herramientas: abundancia/tools (yt.py verifica videos; fetch.py lee fuentes)
- Etiquetas de evidencia en todo el contenido: tradición, documentado, estudio, anécdota, mito.

FASE 1 · AUDITORÍA EXPERTA (no cambies nada todavía)
Lanza revisores independientes en paralelo, cada uno con una lente. Después intenta refutar
cada hallazgo antes de aceptarlo.
1. Riqueza material. ¿El sistema lleva de verdad a más ingreso y patrimonio? Revisa las diez
   medidas del Árbol, el libro de fuentes y las calculadoras (comprueba la aritmética con un
   script). Abre las fuentes primarias de cada cifra de datos.json: UBS, Reserva Federal, IRS,
   BLS, FTC, Scamwatch. Di qué falta: precios, ventas, flujo de caja, impuestos, protección.
2. Manifestación y psicología. ¿El ritual usa lo que mejor evidencia tiene (contraste mental,
   planes si-entonces, visualización del proceso, hábitos)? ¿Algo puede salir al revés? Coteja
   cada tamaño de efecto de practicas.json con el artículo original.
3. Tradiciones y energía. Cábala: abre Sefaria y coteja cada cita hebrea letra por letra;
   revisa el respeto y que no haya ningún estereotipo. Hermetismo y maestros: cada cita contra
   el texto original. Feng shui: las tablas del bagua y del Lo Shu contra una fuente académica.
   En la nube no se pudieron abrir sefaria.org, chabad.org, ubs.com, zh.ch ni pubmed: empieza
   por lo que depende de ellos.
4. Diseño. Capturas de todas las rutas en 1440, 768, 390 y 320 px, en claro y oscuro. Juzga
   como un tipógrafo de Zúrich y como un maestro de feng shui: retícula, jerarquía, densidad,
   coherencia entre páginas, estados vacíos, flujo, equilibrio de los cinco elementos.
5. Accesibilidad y rendimiento: teclado, lector de pantalla, contraste, Lighthouse.
6. Videoteca: vuelve a verificar los videos, sustituye los caídos, revisa los derechos.
Entregable: abundancia/auditoria/AAAA-MM-DD.md con los hallazgos por gravedad, cada uno con
su evidencia, archivo y línea, y la corrección propuesta.

FASE 2 · DISEÑO DE UNA VERSIÓN MÁS POTENTE
Propón tres caminos distintos para la versión 3 y haz que un panel de jueces los puntúe
(impacto en ingreso real, constancia diaria, belleza, esfuerzo). Evalúa al menos:
sincronización entre dispositivos con cuenta propia; registro de flujo de caja real por
semana y por trimestre; recordatorios del ritual; aplicación instalable que funcione sin
conexión; narración con voz para la película; un plan de 90 días que se adapta a mis números;
más calculadoras (precio por hora, punto de equilibrio, fondo de emergencia).
Entregable: abundancia/design/v3-propuesta.md con la opción elegida, bocetos reales en HTML y
capturas.

FASE 3 · IMPLEMENTACIÓN
Corrige todo lo grave de la auditoría y construye la opción elegida en una rama nueva, con
commits pequeños y un PR en borrador. Respeta el sistema de diseño; si lo cambias, hazlo en
los tokens y documenta el porqué.

FASE 4 · VERIFICACIÓN
Compila, toma capturas, prueba cada interacción con un navegador real y vuelve a pasar la
auditoría sobre el resultado. Termina con un informe de una página: qué cambió, qué quedó
verificado y qué no, y las tres decisiones que necesitas de mí.

REGLAS
- Describe las tradiciones en sus propios términos («la tradición enseña que…»). No afirmes
  causalidad sobrenatural como hecho. Marca como aplicación moderna lo que lo sea.
- No inventes citas, cifras ni fuentes. Si algo no se puede verificar, dilo y márcalo.
- Enseñanzas judías: con respeto, con fuente exacta y sin vincular nunca judíos y dinero como
  estereotipo. Las observancias religiosas se describen, no se apropian.
- Nada de asesoramiento financiero, legal o médico personalizado: indica cuándo hace falta un
  profesional con licencia.
- Mis datos del tablero viven solo en mi navegador: no los subas a ningún servicio.
- Pregúntame solo si estás bloqueado de verdad; si dudas entre dos opciones, elige la que más
  acerque ingreso real y dime cuál descartaste.
```

## Variantes cortas

- Solo auditar: pega el prompt hasta el final de la fase 1 y añade «detente al entregar la auditoría».
- Consejo rápido: `/consejo-abundancia ¿subo mis precios este mes?`
- Nutrir la base hoy: `/nutrir`
