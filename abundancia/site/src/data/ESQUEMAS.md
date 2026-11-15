# Esquemas de datos del sitio

Cada archivo JSON de esta carpeta alimenta una página. Reglas comunes:

- Español llano. Sin exageraciones, sin promesas. Tratamiento de «tú».
- Respeta los límites de palabras: el diseño depende de ellos.
- `etiqueta` es una de: `tradicion` (lo que enseña una tradición o maestro, en sus términos),
  `documentado` (hecho histórico o empírico con fuente fiable), `estudio` (hallazgo de investigación),
  `anecdota` (lo cuenta la persona o su entorno), `mito` (se repite pero es falso o no tiene respaldo).
- Toda `url` debe ser real y llevar a la fuente citada. Si no hay URL fiable, usa `null` y pon la
  referencia completa en `cita` (autor, obra, año, página o capítulo).
- Nunca afirmes causalidad sobrenatural como hecho: «la tradición enseña que…».
- Valida el archivo con `python3 -m json.tool archivo.json` antes de terminar.

Tipo `Fuente`: `{ "cita": "Autor (año), obra o revista", "url": "https://…" | null }`

## cabala.json

```json
{
  "titulo": "Cábala y sustento",
  "resumen": "≤ 60 palabras",
  "contexto": "≤ 160 palabras: qué es la cábala, de dónde viene, cómo acercarse con respeto",
  "sefirot": [
    {
      "id": "keter | jojma | bina | jesed | guevura | tiferet | netsaj | hod | yesod | maljut",
      "nombre": "Kéter", "hebreo": "כתר", "significado": "Corona",
      "tradicion": "≤ 55 palabras: sentido tradicional de la sefirá",
      "aplicacion": "≤ 40 palabras: cómo se aplica al sustento, dicho como aplicación moderna",
      "practica": "≤ 35 palabras: ejercicio concreto",
      "dia": "domingo | lunes | martes | miércoles | jueves | viernes | sábado | null",
      "color_cordovero": "texto breve o null",
      "fuente": Fuente
    }
  ],
  "dias_nota": "≤ 60 palabras: si la correspondencia sefirot–días es tradicional y de dónde sale",
  "arbol_nota": "≤ 60 palabras: disposición del Arí frente al árbol hermético",
  "ensenanzas": [
    {
      "id": "kebab-case", "titulo": "≤ 8 palabras",
      "tradicion": "≤ 60 palabras",
      "fuente_tradicion": Fuente,
      "cita": { "texto": "traducción al español", "original": "hebreo o arameo, o null", "referencia": "Taanit 9a" } | null,
      "practica": "≤ 40 palabras",
      "dato": "≤ 45 palabras con cifra, o null",
      "fuente_dato": Fuente | null,
      "etiqueta": "tradicion"
    }
  ],
  "glosario": [ { "termino": "Shefa", "original": "שפע", "definicion": "≤ 30 palabras" } ],
  "respeto": [ "3 a 6 pautas de uso respetuoso, ≤ 30 palabras cada una" ],
  "fuentes": [ Fuente ]
}
```

10 sefirot exactas, 10 a 12 enseñanzas, 10 a 14 términos de glosario.

## hermetismo.json

```json
{
  "titulo": "Hermetismo y esoterismo occidental",
  "resumen": "≤ 60 palabras", "contexto": "≤ 160 palabras",
  "principios": [
    { "numero": 1, "nombre": "Mentalismo", "original": "The Principle of Mentalism",
      "enunciado": "traducción fiel del enunciado del Kybalion", "enunciado_original": "cita literal en inglés",
      "aplicacion": "≤ 40 palabras: lectura práctica para el trabajo y el dinero",
      "practica": "≤ 35 palabras", "limite": "≤ 30 palabras: qué no puede hacer" }
  ],
  "ensenanzas": [ igual que en cabala.json ],
  "glosario": [ … ], "fuentes": [ Fuente ]
}
```

7 principios, 6 a 9 enseñanzas (Tabla Esmeralda, alquimia y sus colores, correspondencias planetarias, tarot de oros, formas de pensamiento, cábala hermética frente a judía).

## maestros.json

```json
{
  "resumen": "≤ 60 palabras sobre el Nuevo Pensamiento",
  "linea_tiempo": [ { "anio": 1910, "hito": "≤ 18 palabras" } ],
  "maestros": [
    {
      "id": "napoleon-hill", "nombre": "Napoleon Hill", "anios": "1883–1970",
      "obra_clave": "Think and Grow Rich (1937)",
      "idea_central": "≤ 40 palabras",
      "metodos": [ { "titulo": "≤ 6 palabras", "ejercicio": "≤ 40 palabras" } ],
      "metodos_nota": "opcional, ≤ 25 palabras: si los métodos no se cotejaron con el original, se dice aquí",
      "cita": { "texto": "español", "original": "inglés literal", "fuente": "libro y año" } | null,
      "nota_critica": "≤ 55 palabras: lo que añade su biografía documentada o la evidencia",
      "etiqueta_nota": "documentado | anecdota | mito",
      "fuentes": [ Fuente ]
    }
  ],
  "matriz": {
    "practicas": [ "Meta escrita", "Repetición diaria", "Visualización", "Gratitud", "Dar", "Grupo de apoyo", "Persistencia", "Servicio" ],
    "filas": [ { "maestro": "Napoleon Hill", "marca": [true, true, true, false, false, true, true, true] } ]
  },
  "casos": [ { "nombre": "Michael Jackson", "hecho": "≤ 60 palabras", "leccion": "≤ 30 palabras", "etiqueta": "documentado", "fuente": Fuente } ],
  "mitos": [ { "afirmacion": "≤ 25 palabras", "realidad": "≤ 45 palabras", "fuente": Fuente } ]
}
```

12 a 16 maestros (obligatorios: Wallace Wattles, Charles Haanel, Florence Scovel Shinn, Napoleon Hill, Earl Nightingale, Neville Goddard, Joseph Murphy, Jim Rohn, Bob Proctor, Brian Tracy, Tony Robbins). 2 o 3 métodos por maestro. 12 a 18 hitos. 3 a 5 casos. 4 a 6 mitos.

## practicas.json

```json
{
  "resumen": "≤ 60 palabras",
  "practicas": [
    {
      "id": "woop", "nombre": "Contraste mental (WOOP)",
      "que_hacer": "≤ 40 palabras",
      "tradicion_afin": "≤ 25 palabras: con qué práctica tradicional se parece",
      "efecto": "p. ej. d = 0,65 en 94 estudios",
      "calidad": "alta | media | baja",
      "estudio": Fuente,
      "momento": "mañana | noche | semanal | mensual | continuo",
      "riesgo": "≤ 25 palabras o null"
    }
  ],
  "energias": [
    { "tradicion": "Qi", "origen": "China", "afirma": "≤ 40 palabras", "medido": "≤ 45 palabras: qué efectos medibles hay y cuáles no", "fuente": Fuente }
  ],
  "manifestacion": { "estudio": Fuente, "muestra": "N = …", "hallazgos": [ "≤ 30 palabras cada uno" ], "lectura": "≤ 60 palabras" },
  "mitos": [ { "afirmacion": "…", "realidad": "…", "fuente": Fuente } ]
}
```

12 a 16 prácticas ordenadas de mayor a menor respaldo. 6 a 8 tradiciones de energía. 5 a 8 mitos.

## fengshui.json

```json
{
  "titulo": "Feng shui del espacio de trabajo", "resumen": "≤ 60 palabras", "contexto": "≤ 160 palabras (escuelas y cómo usarlo con respeto)",
  "lo_shu": [[4, 9, 2], [3, 5, 7], [8, 1, 6]],
  "palacios": [
    { "numero": 4, "trigrama": "Xun", "simbolo": "☴", "direccion": "Sureste", "posicion_btb": "fondo izquierda",
      "elemento": "madera", "colores": ["verde", "púrpura"], "area": "Riqueza",
      "en_el_trabajo": "≤ 35 palabras", "pregunta": "≤ 18 palabras: pregunta de revisión para esa área" }
  ],
  "elementos": [ { "id": "madera", "nombre": "Madera", "color": "verde", "genera": "fuego", "controla": "tierra", "formas": "…", "materiales": "…", "cualidad": "≤ 15 palabras" } ],
  "lista": [
    { "id": "posicion-de-mando", "titulo": "≤ 8 palabras", "tradicion": "≤ 40 palabras", "dato": "≤ 45 palabras o null", "fuente_dato": Fuente | null, "peso": 1 | 2 | 3 }
  ],
  "simbolos": [ { "nombre": "Moneda redonda con hueco cuadrado", "historia": "≤ 45 palabras", "etiqueta": "documentado" } ],
  "periodo": { "nombre": "Periodo 9", "anios": "2024–2043", "texto": "≤ 50 palabras" },
  "estudios_economicos": [ { "hallazgo": "≤ 40 palabras con cifra", "fuente": Fuente } ],
  "fuentes": [ Fuente ]
}
```

9 palacios, 5 elementos, 15 ítems de lista, 5 a 7 símbolos, 2 a 4 estudios económicos.
Un ítem de `lista` puede llevar además `fuente_dato_2` (Fuente) cuando el dato cita una réplica. `peso`: 1 si solo
hay tradición o el hallazgo no se replicó, 2 con un estudio al lado, 3 con respaldo fuerte.

## datos.json

```json
{
  "resumen": "≤ 60 palabras",
  "cifras": [
    { "id": "kebab-case", "titulo": "≤ 10 palabras", "valor": "687.000", "unidad": "USD por adulto", "anio": 2024,
      "geografia": "Suiza", "fuente": Fuente, "confianza": "alta | media | baja", "nota": "≤ 30 palabras o null" }
  ],
  "riqueza_por_adulto": [ { "pais": "Suiza", "media_usd": 0, "mediana_usd": 0, "anio": 2024 } ],
  "retornos_reales": [ { "activo": "Acciones globales", "retorno_real_anual_pct": 0.0, "periodo": "1900–2024", "fuente": Fuente } ],
  "supervivencia_negocios": [ { "pais": "EE. UU.", "anios": 1, "sobrevive_pct": 0.0, "fuente": Fuente } ],
  "dinero_rapido": [ { "via": "Day trading", "resultado": "≤ 30 palabras", "pct_pierde": 97, "fuente": Fuente } ],
  "fraude": [ { "pais": "EE. UU.", "anio": 2024, "perdidas": "12.500 millones USD", "fuente": Fuente } ],
  "ingreso_y_bienestar": [ { "hallazgo": "≤ 40 palabras", "fuente": Fuente } ],
  "banderas_rojas": [ "10 a 12 señales de estafa, ≤ 18 palabras cada una" ],
  "reguladores": [ { "pais": "Australia", "nombre": "ASIC Moneysmart", "url": "https://…" } ],
  "mitos": [ { "afirmacion": "…", "realidad": "…", "fuente": Fuente } ]
}
```

`confianza`: `alta` si la fuente es primaria u oficial (el organismo, su nota de prensa, la institución de los
autores o un artículo revisado); `media` si la cifra llega por prensa que cita el informe, o es una proyección o un
cálculo propio; `baja` si es una encuesta de marketing o un dato autodeclarado. `anio` es `null` cuando la fuente no
lo fija. Un país de `riqueza_por_adulto` sin cifra propia lleva su `fuente` en la fila, y una fila de
`retornos_reales` puede llevar `nota` (≤ 25 palabras) si otra lectura de la misma fuente da otro valor.

18 a 26 cifras. Países en `riqueza_por_adulto`: Suiza, Estados Unidos, Australia, España, México, Argentina, Chile, Colombia (los que tengan dato). Reguladores: Australia, España, México, Estados Unidos, Reino Unido, Argentina, Colombia, Chile.

## videoteca.json

```json
{
  "videos": [
    { "id": "11 caracteres", "titulo": "título exacto que devuelve yt.py check", "canal": "canal que devuelve yt.py check",
      "titulo_visible": "opcional: el mismo título sin emoji ni versales, para pintarlo",
      "duracion": "h:mm:ss o mm:ss", "idioma": "es | en", "maestro": "nombre de quien habla, o el canal si no consta",
      "anio_original": 1954 | null, "categoria": "maestros | ciencia | datos | cabala | hermetismo | feng-shui | color-diseno",
      "temas": ["2 a 4 etiquetas cortas"], "resumen": "2 frases", "por_que": "1 frase",
      "tipo_canal": "oficial | autorizado | archivo | fan", "nota": "" }
  ],
  "ruta_inicio": [ { "id": "…", "motivo": "≤ 20 palabras" } ]
}
```

60 videos o más (la nutrición diaria añade); al menos 22 en español; cada `id` verificado con `yt.py check`
(`ok: true`). `anio_original` es `null` si no se pudo confirmar el año; se explica en `nota`. El texto va en
Unicode NFC. `titulo_visible` solo cambia mayúsculas, emoji y separadores: nunca las palabras.

## colores.json

```json
{
  "titulo": "Riquezas y colores", "resumen": "≤ 60 palabras",
  "colores": [ { "id": "oro", "nombre": "Oro", "hex": "#A07F2A", "historia": "≤ 55 palabras con un hecho fechado y verificado", "fuente": Fuente, "etiqueta": "documentado" } ],
  "tradiciones": [
    { "sistema": "Cinco elementos (wuxing)", "nota": "≤ 40 palabras", "fuente": Fuente,
      "filas": [ { "nombre": "Madera", "color": "azul verdoso", "hex": "#…", "nota": "≤ 20 palabras" } ] }
  ],
  "investigacion": [ { "hallazgo": "≤ 45 palabras con muestra y resultado", "estado": "confirmado | no replicado | discutido", "fuente": Fuente } ],
  "billetes": [ { "valor": "10", "color": "amarillo", "hex": "#…", "tema": "≤ 12 palabras" } ],
  "zurich": [ { "nombre": "Azul del cantón de Zúrich", "hex": "#0070B4", "nota": "≤ 30 palabras", "verificado": true } ],
  "paleta": [ { "elemento": "agua", "nombre": "Azul de Zúrich", "papel": "flujo e interacción", "claro": "#0070B4", "oscuro": "#58AEE8" } ],
  "pelicula": { "titulo": "Riquezas y colores", "archivo": "/media/riquezas-y-colores.mp4", "poster": "/media/riquezas-y-colores.jpg", "subtitulos": "/media/riquezas-y-colores.es.vtt" }
}
```

7 a 9 colores (oro, púrpura, verde, rojo, negro, azul, blanco o plata…). 3 a 5 sistemas en `tradiciones`
(cinco elementos, sefirot según Cordovero presentadas como metáfora, etapas alquímicas, chakras con la nota
histórica). 5 a 7 hallazgos de investigación, con su estado de replicación. Solo hechos que las notas dan por
confirmados; lo marcado como «no verificado» o con ‡ no entra, o entra con `verificado: false`.

## agentes.json

```json
{
  "resumen": "≤ 60 palabras",
  "pilares": [ { "id": "material | espiritual | abundancia", "nombre": "Riqueza material", "director": "riqueza-material", "descripcion": "≤ 40 palabras" } ],
  "agentes": [
    { "id": "riqueza-material", "nombre": "Director de riqueza material", "pilar": "material", "tipo": "director | especialista",
      "rol": "≤ 30 palabras", "cuando": "≤ 25 palabras", "ejemplo": "petición de ejemplo, ≤ 20 palabras",
      "conocimiento": [ "archivos de la base que consulta" ] }
  ],
  "comandos": [ { "comando": "/consejo-abundancia", "descripcion": "≤ 30 palabras", "ejemplo": "/consejo-abundancia ¿subo mis precios?" } ],
  "nutricion": { "cuando": "cada día", "que_hace": [ "≤ 25 palabras cada uno" ], "donde": "≤ 30 palabras" }
}
```

## Diario de conocimiento

Entradas en `src/content/diario/AAAA-MM-DD.md` con este encabezado:

```
---
fecha: 2026-11-15
titulo: "≤ 10 palabras"
---
```

y tres secciones `## Riqueza material`, `## Riqueza espiritual`, `## Abundancia`, cada una con un hallazgo de
40 a 80 palabras, su etiqueta de evidencia entre corchetes y la fuente como enlace.
