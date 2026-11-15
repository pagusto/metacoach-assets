# «Riquezas y colores» · guion

Película tipográfica de Shefa. Sin imagen real y sin voz: solo letra, color y retícula.
Duración: {{DURACION}} s · {{ESCENAS}} escenas · 1920 × 1080 · 30 fotogramas por segundo · español.

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
