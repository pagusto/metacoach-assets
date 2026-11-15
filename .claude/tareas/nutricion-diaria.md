# Tarea programada «Nutrición diaria de Shefa»

Instrucciones que debe tener la tarea programada en la nube (cada día a las 05:37 de Canberra).
Las instrucciones de una tarea solo se pueden cambiar desde la conversación en la que publica, la
de Shefa en la nube: para ponerlas al día, pide allí «cambia las instrucciones de la tarea
"Nutrición diaria de Shefa" por el texto de `.claude/tareas/nutricion-diaria.md`, tal cual».
El procedimiento de búsqueda y escritura está en `.claude/agents/nutridor-conocimiento.md`.

```text
Nutrición diaria de Shefa (repositorio pagusto/metacoach-assets). Hazlo entero sin preguntar.
Resultado exigido: la entrada de hoy llega a master sin que el usuario fusione nada, con la fecha
de Canberra, sin pisar ninguna entrada existente y solo si el sitio compila y pasan las pruebas.

1. Fecha: HOY=$(TZ=Australia/Sydney date +%F). Es la fecha de Canberra; no uses la fecha del
   sistema, que va en UTC. Usa $HOY en todos los pasos.
2. Sincroniza: git fetch origin master && git checkout -B nutricion-diaria origin/master.
   Trabaja siempre sobre el master recién traído.
3. No pises nada: si abundancia/site/src/content/diario/$HOY.md ya existe en origin/master,
   termina aquí con una línea («La entrada de $HOY ya existe; no se tocó nada»).
4. Lanza el agente nutridor-conocimiento (procedimiento de
   .claude/agents/nutridor-conocimiento.md) indicándole que la fecha es $HOY. Si no puedes
   lanzarlo, sigue tú ese procedimiento.
5. Revisa el cambio con git status --porcelain: solo puede haber un archivo nuevo,
   abundancia/site/src/content/diario/$HOY.md, y como mucho abundancia/site/src/data/videoteca.json
   modificado. Si aparece cualquier otro cambio, o una entrada anterior modificada o borrada,
   deshazlo antes de seguir (git checkout -- . y borra lo nuevo que no sea la entrada de hoy);
   si no queda una entrada válida, no publiques.
6. Compila y prueba desde abundancia/site: export NODE_PATH="$(npm root -g)"; npm ci &&
   npm run build && npm run pruebas. Si falta Playwright, instálalo (npm i -g playwright &&
   npx playwright install chromium) y repite. Si algo falla por la entrada o por videoteca.json,
   corrígelo y repite; si falla por otra causa o las pruebas no se pueden ejecutar, no publiques.
7. Publica solo si el paso 6 pasó entero: git add de esos dos archivos como mucho y commit
   «Nutrición diaria $HOY». Después git fetch origin master; si master avanzó, git rebase
   origin/master, repite la comprobación del paso 3 y vuelve a compilar y probar. Luego
   git push origin HEAD:master, sin --force nunca. Si el push directo a master se rechaza, sube
   la rama, abre el pull request «Nutrición diaria $HOY» y fusiónalo tú en esta misma ejecución
   (squash); no lo dejes abierto ni pidas al usuario que lo fusione.
8. Comprueba que el despliegue de producción del proyecto «shefa» de Vercel corresponde a ese
   commit y queda listo.
9. Cierra con dos líneas: qué se publicó (título de la entrada y commit) o por qué no se
   publicó. Si no se publicó, no insistas: el paso 5 de «mantener» (abundancia/PROMPT-LOCAL.md)
   la cubre.

Límites: no toques nada fuera del diario y de videoteca.json; no edites
abundancia/conocimiento/base; no toques otros pull requests ni otros proyectos de Vercel.
```
