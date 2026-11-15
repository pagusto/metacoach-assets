# «Riquezas y colores» · guion

Película tipográfica de Shefa. Sin imagen real y sin voz: solo letra, color y retícula.
Duración: 94,5 s · 12 escenas · 1920 × 1080 · 30 fotogramas por segundo · español.

Este archivo lo escribe `guion.cjs` a partir de la propia página (`pelicula.html`), para que el guion, los subtítulos y la música usen los mismos tiempos y los mismos textos. Para cambiar un texto o un tiempo se cambia la página y se vuelve a ejecutar `node guion.cjs`.

## Idea

Nueve hechos, uno por palacio del cuadrado Lo Shu. Cada hecho ocupa una escena, se apoya en un solo color y lleva su fuente en el margen inferior. El rótulo de la cabecera dice de qué clase es cada afirmación: **Historia**, **Tradición** o **Estudio**. La película no dice en ningún momento que un color atraiga dinero. Termina con una frase sobria: el color no crea riqueza; ayuda a ordenar la atención.

Arco: título → cómo un metal y un tinte caro se volvieron signos de riqueza (oro, púrpura) → cómo el signo cambió cuando cambió la técnica (malva, verde) → dos tradiciones vivas contadas en sus propios términos (el sobre rojo, Dhanteras) → el negro → lo que dice la investigación (azul preferido; el efecto del rojo, casi cero) → la paleta de Shefa → cierre y marca.

## Reglas que cumple

- Solo se usan hechos con veredicto CONFIRMADO o CORREGIDO en la tabla «Verificación independiente» de `research_notes/Abundancia tradiciones y datos/color_y_riqueza.md`, con la redacción corregida. Nada marcado «no verificado», «no apto para pantalla» o con el signo ‡.
- Velocidad de lectura: 14 caracteres por segundo como máximo, contando el texto de la escena y también el crédito de la fuente. Cada bloque de texto permanece al menos 2,5 s. `guion.cjs` lo comprueba y falla si no se cumple.
- Los rótulos fijos de la cabecera (número, nombre del color y clase de afirmación) no entran en la cuenta: son el encabezado de página, iguales en posición en todas las escenas.
- Cifras en formato español: 12.000, 1,4. Comillas « ».
- Las tradiciones se describen como símbolo y con sus palabras. Los tonos de púrpura, malva, verde y azafrán son elecciones propias: no se presentan como colores históricos exactos.

## Lenguaje visual

- Tipos: Archivo (ancho 100 para las palabras; negrita estrecha, ancho 75, para las cifras) y Frank Ruhl Libre para el hebreo de la marca.
- Retícula: nueve palacios de 640 × 360 px. Márgenes de 96 px. Cabecera con filete de 2 px; crédito y línea de avance en el margen inferior.
- Transición habitual: el color nuevo entra por las nueve celdas, que se abren en el orden del Lo Shu (1 a 9), unas veces en horizontal y otras en vertical.
- La moneda (círculo con hueco cuadrado) es el recurso de paso en tres momentos: del título al oro, del negro al azul y de la paleta al cierre. El disco crece y la escena siguiente se ve por su hueco. También aparece como broche del sobre rojo, como clave de las cinco bandas y como marca.
- Tinta, papel, oro, azul y un solo rojo por pantalla.

## Escenas

### 1 · Título · 0:00,0–0:06,5 (6,5 s)

- **Color:** Papel #FAF9F6 y tinta #141412
- **Texto en pantalla:**
  - «Riquezas» · «y colores» — entra en 0:00,5, 6,0 s en pantalla
  - «Nueve hechos sobre el color y la riqueza» — entra en 0:01,5, 5,0 s en pantalla
  - «Shefa שפע» — entra en 0:00,0, 6,5 s en pantalla
  - «Tradición y datos» — entra en 0:00,0, 6,5 s en pantalla
- **Hecho que muestra:** Sin dato: presenta la película y la retícula de nueve palacios con la moneda.
- **Fuente:** Shefa, dirección «Lo Shu»
- **Lectura:** 84 caracteres de texto → 12,9 c/s

### 2 · Oro · 0:06,5–0:14,0 (7,5 s)

- **Color:** Oro #D9B65A
- **Texto en pantalla:**
  - «hacia» — entra en 0:07,2, 6,8 s en pantalla
  - «550 a. C.» — entra en 0:07,2, 6,8 s en pantalla
  - «El oro puro se vuelve moneda.» — entra en 0:08,3, 5,7 s en pantalla
  - «Atribuido a Creso de Lidia.» — entra en 0:09,1, 4,9 s en pantalla
- **Crédito en pantalla:** Metcalf, 2016, vía Wikipedia
- **Hecho que muestra:** Hacia 550 a. C. se atribuyen a Creso, rey de Lidia, las primeras monedas de oro de pureza estandarizada.
- **Fuente:** Wikipedia, «Croeseid», que cita a Metcalf, The Oxford Handbook of Greek and Roman Coinage, 2016
- **Lectura:** 70 caracteres de texto + 28 de crédito → 9,3 c/s (13,1 c/s con el crédito)

### 3 · Púrpura · 0:14,0–0:21,5 (7,5 s)

- **Color:** Púrpura #4A1942 (tono propio, no histórico)
- **Texto en pantalla:**
  - «12.000 caracoles» — entra en 0:14,6, 6,9 s en pantalla
  - «1,4 gramos de tinte» — entra en 0:16,6, 4,9 s en pantalla
  - «Solo el ribete de una prenda.» — entra en 0:18,0, 3,5 s en pantalla
- **Crédito en pantalla:** Friedländer, 1909 · Wolk y Frimer, 2010
- **Hecho que muestra:** 12.000 caracoles Murex brandaris dan como mucho 1,4 g de tinte puro, lo justo para el ribete de una prenda.
- **Fuente:** Friedländer, Berichte 42, 1909; confirmado en Wolk y Frimer, Molecules, 2010 (PMC6264235)
- **Lectura:** 64 caracteres de texto + 39 de crédito → 8,5 c/s (13,7 c/s con el crédito)

### 4 · Malva · 0:21,5–0:29,0 (7,5 s)

- **Color:** Malva #B48CC2 (tono propio)
- **Texto en pantalla:**
  - «1856» — entra en 0:22,1, 6,9 s en pantalla
  - «Perkin busca quinina.» — entra en 0:23,1, 5,9 s en pantalla
  - «Halla un tinte malva,» · «de los primeros sintéticos.» — entra en 0:24,8, 4,2 s en pantalla
- **Crédito en pantalla:** Wikipedia, «Mauveine»
- **Hecho que muestra:** En 1856 William Henry Perkin, que intentaba sintetizar quinina, descubrió la mauveína, uno de los primeros tintes sintéticos.
- **Fuente:** Wikipedia, «Mauveine» (cita a St Clair, 2016)
- **Lectura:** 74 caracteres de texto + 21 de crédito → 9,9 c/s (12,7 c/s con el crédito)

### 5 · Verde · 0:29,0–0:36,5 (7,5 s)

- **Color:** Verde #1E5C45 (tono propio)
- **Texto en pantalla:**
  - «1861» — entra en 0:29,6, 6,9 s en pantalla
  - «Estados Unidos autoriza billetes» · «de reverso verde.» — entra en 0:30,6, 5,9 s en pantalla
  - «De ahí «greenback».» — entra en 0:33,0, 3,5 s en pantalla
- **Crédito en pantalla:** Wikipedia, «Demand Note»
- **Hecho que muestra:** El Congreso de EE. UU. autorizó los Demand Notes el 17 de julio de 1861; su reverso iba en tinta verde y de ahí el apodo «greenback».
- **Fuente:** Wikipedia, «Demand Note»
- **Lectura:** 73 caracteres de texto + 24 de crédito → 9,7 c/s (12,9 c/s con el crédito)

### 6 · Rojo · 0:36,5–0:43,0 (6,5 s)

- **Color:** Papel con un solo rojo, sello #D5281B
- **Texto en pantalla:**
  - «2014» — entra en 0:37,1, 5,9 s en pantalla
  - «En China, el sobre rojo» · «de Año Nuevo se vuelve digital.» — entra en 0:38,1, 4,9 s en pantalla
- **Crédito en pantalla:** Wikipedia, «Red envelope»
- **Hecho que muestra:** WeChat lanzó el sobre rojo digital en el Año Nuevo chino de 2014.
- **Fuente:** Wikipedia, «Red envelope» y «WeChat red envelope»
- **Lectura:** 59 caracteres de texto + 25 de crédito → 9,1 c/s (12,9 c/s con el crédito)

### 7 · Oro (Dhanteras) · 0:43,0–0:51,0 (8,0 s)

- **Color:** Azafrán #E0932A (tono propio)
- **Texto en pantalla:**
  - «Dhanteras» — entra en 0:43,6, 7,4 s en pantalla
  - «Dhana: riqueza. Teras: día trece.» — entra en 0:45,0, 6,0 s en pantalla
  - «Abre Diwali: día propicio» · «para comprar oro.» — entra en 0:46,6, 4,4 s en pantalla
- **Crédito en pantalla:** Wikipedia, «Dhanteras»
- **Hecho que muestra:** Dhanteras abre Diwali; «dhana» es «riqueza» en sánscrito y «teras», el día trece en hindi; la tradición hindú lo considera propicio para comprar oro.
- **Fuente:** Wikipedia, «Dhanteras»
- **Lectura:** 85 caracteres de texto + 22 de crédito → 10,6 c/s (13,4 c/s con el crédito)

### 8 · Negro · 0:51,0–0:58,0 (7,0 s)

- **Color:** Tinta #141412
- **Texto en pantalla:**
  - «1926» — entra en 0:51,6, 6,4 s en pantalla
  - «*Vogue* publica un vestido negro» · «de Chanel y lo compara con un Ford.» — entra en 0:52,6, 5,4 s en pantalla
- **Crédito en pantalla:** FIDM Museum · Wikipedia
- **Hecho que muestra:** En 1926 la edición estadounidense de Vogue publicó un vestido negro de Chanel y lo comparó con un Ford.
- **Fuente:** FIDM Museum; Wikipedia, «Little black dress»
- **Lectura:** 70 caracteres de texto + 23 de crédito → 10,0 c/s (13,3 c/s con el crédito)

### 9 · Azul · 0:58,0–1:06,5 (8,5 s)

- **Color:** Azul #0070B4
- **Texto en pantalla:**
  - «32 colores» — entra en 0:58,8, 7,8 s en pantalla
  - «48 personas los puntúan.» — entra en 0:59,8, 6,7 s en pantalla
  - «Ganan los azules:» · «cielo despejado, agua limpia.» — entra en 1:01,4, 5,1 s en pantalla
- **Crédito en pantalla:** Palmer y Schloss, *PNAS*, 2010 · EE. UU.
- **Hecho que muestra:** 48 participantes valoraron 32 colores; la preferencia tiene un pico amplio en el azul. Gustan los colores asociados a cosas que gustan (cielo despejado, agua limpia). Muestra de EE. UU.
- **Fuente:** Palmer y Schloss, PNAS 107(19), 2010
- **Lectura:** 81 caracteres de texto + 38 de crédito → 9,5 c/s (14,0 c/s con el crédito)

### 10 · Rojo (estudio) · 1:06,5–1:16,5 (10,0 s)

- **Color:** Tinta #141412 con un solo rojo, sello #D5281B
- **Texto en pantalla:**
  - «¿Ver rojo empeora un examen?» — entra en 1:07,1, 9,4 s en pantalla
  - «Metaanálisis de 2020» — entra en 1:09,1, 7,4 s en pantalla
  - «67 efectos» — entra en 1:09,2, 7,3 s en pantalla
  - «Corregido el sesgo de publicación:» · «casi cero.» — entra en 1:11,9, 4,6 s en pantalla
- **Crédito en pantalla:** Gnambs, *Psychon. Bull. Rev.*, 2020
- **Hecho que muestra:** Un metaanálisis de 67 tamaños de efecto sobre el rojo y el rendimiento deja el efecto, tras corregir el sesgo de publicación, cerca de cero.
- **Fuente:** Gnambs, Psychonomic Bulletin & Review 27, 2020 (PMC7704521)
- **Lectura:** 103 caracteres de texto + 33 de crédito → 10,3 c/s (13,6 c/s con el crédito)

### 11 · Paleta de Shefa · 1:16,5–1:25,0 (8,5 s)

- **Color:** Tinta #141412, sello #D5281B, papel #FAF9F6, oro #D9B65A, azul #0070B4
- **Texto en pantalla:**
  - «Cinco colores, cinco elementos.» — entra en 1:17,1, 7,9 s en pantalla
  - «Madera» · «tinta» — entra en 1:18,2, 6,8 s en pantalla
  - «Fuego» · «sello» — entra en 1:18,3, 6,7 s en pantalla
  - «Tierra» · «papel» — entra en 1:18,4, 6,6 s en pantalla
  - «Metal» · «oro» — entra en 1:18,6, 6,4 s en pantalla
  - «Agua» · «azul» — entra en 1:18,7, 6,3 s en pantalla
- **Crédito en pantalla:** Convención de diseño de Shefa
- **Hecho que muestra:** Sin dato externo: Shefa nombra sus cinco colores como los cinco elementos. Es una convención de diseño, no una afirmación de eficacia.
- **Fuente:** Shefa, tokens de la dirección «Lo Shu»
- **Lectura:** 84 caracteres de texto + 29 de crédito → 9,9 c/s (13,3 c/s con el crédito)

### 12 · Cierre · 1:25,0–1:34,5 (9,5 s)

- **Color:** Papel #FAF9F6 y tinta #141412
- **Texto en pantalla:**
  - «El color no crea riqueza.» · «Ayuda a ordenar la atención.» — entra en 1:25,8, 4,0 s en pantalla
  - «Shefa שפע» — entra en 1:30,4, 4,1 s en pantalla
  - «Tradición y datos» — entra en 1:30,9, 3,6 s en pantalla
  - «Información general, no asesoramiento financiero» — entra en 1:25,5, 9,0 s en pantalla
- **Hecho que muestra:** Sin dato nuevo: conclusión sobria y marca.
- **Fuente:** Shefa
- **Lectura:** 128 caracteres de texto → 13,5 c/s

## Velocidad de lectura

| N.º | Escena | Tiempo | Duración | Caracteres (texto + crédito) | c/s texto | c/s con crédito |
|---|---|---|---|---|---|---|
| 1 | Título | 0:00,0–0:06,5 | 6,5 s | 84 + 0 | 12,9 | 12,9 |
| 2 | Oro | 0:06,5–0:14,0 | 7,5 s | 70 + 28 | 9,3 | 13,1 |
| 3 | Púrpura | 0:14,0–0:21,5 | 7,5 s | 64 + 39 | 8,5 | 13,7 |
| 4 | Malva | 0:21,5–0:29,0 | 7,5 s | 74 + 21 | 9,9 | 12,7 |
| 5 | Verde | 0:29,0–0:36,5 | 7,5 s | 73 + 24 | 9,7 | 12,9 |
| 6 | Rojo | 0:36,5–0:43,0 | 6,5 s | 59 + 25 | 9,1 | 12,9 |
| 7 | Oro (Dhanteras) | 0:43,0–0:51,0 | 8,0 s | 85 + 22 | 10,6 | 13,4 |
| 8 | Negro | 0:51,0–0:58,0 | 7,0 s | 70 + 23 | 10,0 | 13,3 |
| 9 | Azul | 0:58,0–1:06,5 | 8,5 s | 81 + 38 | 9,5 | 14,0 |
| 10 | Rojo (estudio) | 1:06,5–1:16,5 | 10,0 s | 103 + 33 | 10,3 | 13,6 |
| 11 | Paleta de Shefa | 1:16,5–1:25,0 | 8,5 s | 84 + 29 | 9,9 | 13,3 |
| 12 | Cierre | 1:25,0–1:34,5 | 9,5 s | 128 + 0 | 13,5 | 13,5 |

## Lo que se dejó fuera, y por qué

- **Colores de las sefirot según Cordovero.** En las notas, tanto la lista de colores como la advertencia de que son metáfora llevan el signo ‡ (fuentes secundarias que no se pudieron abrir) y no figuran en la tabla de verificación. No se muestran. El hebreo aparece solo en la marca, שפע.
- **Correspondencias clásicas de los cinco elementos (wuxing) y colores del área de riqueza del feng shui.** No están en la tabla de verificación (y las del área de riqueza llevan ‡). La escena 11 habla solo de la paleta de Shefa, como convención de diseño propia.
- **«De cincuenta marcas financieras, casi la mitad viste de azul» (DeSantis Breindel, 2021).** La tabla lo da por confirmado, pero el dato lleva ‡ en la sección 4 (la página no se abrió). Para el azul se usa Palmer y Schloss (2010), cotejado con el texto completo.
- **Réplica fallida de Steele (2014) del estudio de *Science* de 2009.** Corregida y confirmada en parte, pero con ‡. La nota honesta sobre los efectos famosos se apoya en el metaanálisis de Gnambs (2020), confirmado con el texto completo.
- **Cotización del greenback en 1864, cifras de ventas de Dhanteras, valores «oficiales» de Zúrich y de los SBB, cita literal de *Vogue*, fecha del segundero rojo.** No verificables o con redacción dudosa. La escena del negro no cita el pie de *Vogue*: dice solo que comparó el vestido con un Ford.

## Notas de precisión

- Escena 2: «atribuido» y «hacia», como pide la verificación (fuente única).
- Escena 3: los 120 puntos son una ilustración (cada punto, cien caracoles), no un gráfico con escala.
- Escena 5: 1861 es el año de la ley que autorizó los billetes. No se da fecha de emisión.
- Escena 9: la muestra del estudio es de Estados Unidos; lo dice el crédito.
- Escena 10: la barra roja empieza a toda altura, baja a la proporción 0,13 / 0,86 (efecto conjunto frente al de los primeros estudios de razonamiento) y termina en una línea: el efecto corregido, cerca de cero.
- Escena 11: Shefa llama a sus cinco colores con los nombres de los cinco elementos. Es una convención de diseño, no una afirmación sobre lo que hacen los colores.

## Música

`musica.py` sintetiza la pista con numpy: acordes de senos y triángulos suaves en re mayor, un bordón grave en re, campanas escasas en cada cambio de escena, reverberación por convolución y fundidos de 3 s y 4 s. Dura lo mismo que la película (lee `salida/tiempos.json`).
