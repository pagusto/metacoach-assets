# Tarea programada «Nutrición diaria de Shefa»

Instrucciones que tiene la tarea programada en la nube (cada día a las 05:37 de Canberra).
Las instrucciones de una tarea solo se pueden cambiar desde la conversación en la que publica, la
de Shefa en la nube: para ponerlas al día, pide allí «cambia las instrucciones de la tarea
"Nutrición diaria de Shefa" por el texto de `.claude/tareas/nutricion-diaria.md`, tal cual».
El procedimiento de búsqueda y escritura está en `.claude/agents/nutridor-conocimiento.md`.

Puestas al día en la tarea el 15 de noviembre de 2026: subida directa a `master`, sin pull
requests, y mantenimiento de los lunes (videos y pruebas a 1024 px).

```text
Nutrición diaria de Shefa (repositorio pagusto/metacoach-assets). Hazlo entero sin preguntar.
Resultado exigido: la entrada de hoy llega a master sin que el usuario fusione nada y sin pull
requests, con la fecha de Canberra, sin pisar ninguna entrada existente y solo si el sitio
compila y pasan las pruebas. Los lunes, además, mantenimiento (paso 8).

1. Fecha: HOY=$(TZ=Australia/Sydney date +%F). Es la fecha de Canberra; no uses la fecha del
   sistema, que va en UTC. Usa $HOY en todos los pasos.
2. Sincroniza: git fetch origin master. Si la rama de trabajo de la sesión tiene commits sin
   publicar en master, o hay cambios sin confirmar que no son de esta tarea, no los toques:
   trabaja en una copia aparte (git worktree add --detach <carpeta> origin/master) y dilo al
   cerrar. Si no, git checkout -B nutricion-diaria origin/master. Trabaja siempre sobre el
   master recién traído.
3. No pises nada: si abundancia/site/src/content/diario/$HOY.md ya existe en origin/master,
   no escribas la entrada («La entrada de $HOY ya existe; no se tocó») y salta al paso 8.
4. Lanza el agente nutridor-conocimiento (procedimiento de
   .claude/agents/nutridor-conocimiento.md) indicándole que la fecha es $HOY. Si no puedes
   lanzarlo, sigue tú ese procedimiento.
5. Revisa el cambio con git status --porcelain: solo puede haber un archivo nuevo,
   abundancia/site/src/content/diario/$HOY.md, y como mucho abundancia/site/src/data/videoteca.json
   modificado. Si aparece cualquier otro cambio, o una entrada anterior modificada o borrada,
   deshazlo antes de seguir (git checkout -- . y borra lo nuevo que no sea la entrada de hoy);
   si no queda una entrada válida, no publiques.
6. Compila y prueba desde abundancia/site: export NODE_PATH="$(npm root -g)"; npm ci &&
   npm run build && npm run pruebas. En la sesión en la nube Playwright ya viene instalado: no
   lo instales de nuevo. Si algo falla por la entrada o por videoteca.json, corrígelo y repite;
   si falla por otra causa o las pruebas no se pueden ejecutar, no publiques.
7. Publica solo si el paso 6 pasó entero: git add de esos dos archivos como mucho y commit
   «Nutrición diaria $HOY». Después git fetch origin master; si master avanzó, git rebase
   origin/master, repite la comprobación del paso 3 y vuelve a compilar y probar. Luego
   git push origin HEAD:master, sin --force nunca y sin pull request: el dueño no los quiere.
   Solo si el servidor rechaza la subida directa a master, sube la rama, abre el pull request
   «Nutrición diaria $HOY» y fusiónalo tú en esta misma ejecución (squash); no lo dejes abierto
   ni pidas al usuario que lo fusione.
8. Solo los lunes (día de la semana en Australia/Sydney), mantenimiento:
   a) Videos: python3 abundancia/tools/yt.py check con todos los ids de
      abundancia/site/src/data/videoteca.json, por tandas. Quita los que ya no existan;
      sustituye uno solo si el sustituto pasa la misma comprobación.
   b) Pruebas a ancho de tableta, desde abundancia/site: npm run build && npm run pruebas:tableta.
      Si hoy no hubo entrada nueva, pasa antes npm run pruebas.
   c) Si algo falla por datos que cambió esta tarea, corrígelo. Si falla por otra causa, no
      toques el código: dilo al cerrar con el nombre de la prueba.
   d) Si cambió videoteca.json, publícalo como en el paso 7, con el commit
      «Videoteca: mantenimiento $HOY».
9. Comprueba que el despliegue de producción del proyecto «shefa» de Vercel corresponde al
   último commit de master y queda listo.
10. Cierra con dos líneas: qué se publicó (título de la entrada y commit) o por qué no se
    publicó, y la dirección del sitio (https://pabloagusto.vercel.app/shefa/). Si no se
    publicó, no insistas: el paso 5 de «mantener» (abundancia/PROMPT-LOCAL.md) la cubre.

Límites: no toques nada fuera del diario y de videoteca.json; no edites
abundancia/conocimiento/base; no toques otros pull requests ni otros proyectos de Vercel.
Antes de aceptar la cifra de un estudio, comprueba que sale de la versión publicada y no de un
borrador. Reglas de siempre: tradiciones en sus propios términos, ninguna causalidad
sobrenatural como hecho, nada de consejo financiero personal, ninguna cita ni cifra inventada,
enseñanzas judías con respeto y fuente exacta.
```
