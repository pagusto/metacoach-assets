# Dirección D · Lo Shu

Prototipo de Shefa: `hoy.html`, `arbol.html`, `tokens.css`, capturas en `shots/`.

## Concepto

Un almanaque impreso por un tipógrafo de Zúrich. El cuadrado Lo Shu de nueve palacios no adorna la página: es la página. En «Hoy», las nueve funciones del inicio ocupan los nueve palacios, cada una en el que le corresponde por tradición (la cifra en el 4, palacio de la riqueza; las fuentes en el 1, palacio del agua; la tradición en el 8, palacio del conocimiento). En «Árbol», el mismo cuadrado se reparte en cuatro piezas ancladas en las cuatro esquinas pares: el Árbol ocupa cuatro palacios, el detalle dos, el libro de fuentes dos y el medidor uno. Todo sale del 3: módulo de 48 px, palacio de 9 módulos, cuadrado de 27; la escala tipográfica sube en razón 3:2. Tinta, papel, un oro que solo mide, un azul que solo fluye y un único sello rojo que marca el presente: el día de hoy o la sefirá elegida.

## Paleta: cinco colores, cinco elementos

Contraste calculado con la fórmula de luminancia relativa de WCAG 2.x, contra el fondo de cada tema (claro `#FAF9F6`, oscuro `#121211`).

| Elemento | Token | Papel en la interfaz | Claro | Contraste | Oscuro | Contraste |
|---|---|---|---|---|---|---|
| Madera 木 (tinta de hollín de pino) | `--madera` | Texto, filetes, estructura | `#141412` | 17,52:1 | `#F1EFE9` | 16,30:1 |
| | `--madera-2` | Texto secundario | `#4A4843` | 8,68:1 | `#B9B6AE` | 9,25:1 |
| | `--madera-3` | Rótulos, notas, pasos ya hechos | `#6B6862` | 5,27:1 | `#98958D` | 6,26:1 |
| Tierra 土 (papel) | `--tierra` | Fondo | `#FAF9F6` | — | `#121211` | — |
| | `--tierra-3` | Contorno de marcas vacías (solo gráfico) | `#8F8C85` | 3,19:1 | `#6F6C66` | 3,58:1 |
| | `--tierra-2` | Filete suave entre filas (solo separación, sin información) | `#C8C5BD` | 1,64:1 | `#3A3936` | 1,62:1 |
| Metal 金 (oro) | `--metal` | Valor medido: reglas, arcos, puntos (solo gráfico, nunca texto) | `#A07F2A` | 3,58:1 | `#D9B65A` | 9,63:1 |
| Agua 水 (azul de Zúrich) | `--agua` | Flujo e interacción: foco, campo editable, hover, fuente que ingresa | `#0070B4` | 5,02:1 | `#58AEE8` | 7,71:1 |
| Fuego 火 (sello bermellón) | `--fuego` | El presente: el 14 de la fecha, la sefirá elegida. Uno por pantalla | `#D5281B` | 4,81:1 | `#D5281B` | 3,70:1 |
| | `--sobre-fuego` | Cifra dentro del sello | `#FFFFFF` sobre `#D5281B` | 5,06:1 | igual | 5,06:1 |

Todo el texto alcanza 4,5:1 en ambos temas (el mínimo real es 5,02:1 en claro y 5,06:1 en oscuro). El botón «Guardar» invierte tinta y papel (17,52:1 y 16,30:1) y en hover pasa a papel sobre azul (5,02:1 y 7,71:1). El oro y los contornos solo se usan en marcas gráficas, donde WCAG pide 3:1.

El azul claro es el acento que el sistema de diseño web del cantón de Zúrich publica como `#0070B4` (zh.ch, «Design-Grundlagen · Farben»), según el resultado de búsqueda; no pude abrir la página para leerla entera. El azul del tema oscuro es ese mismo tono aclarado, no un valor oficial.

La madera es la tinta porque la tinta china se hace con hollín de pino. Así los cinco colores de la dirección (tinta, papel, oro, sello, azul) cubren los cinco elementos sin añadir un verde.

## Sistema tipográfico

- **Archivo** (Omnibus-Type, variable en peso y ancho), una sola familia latina. Texto en ancho 100 %, pesos 400, 500/600 y 700. Cifras en ancho 75 %, peso 700, tabulares. Esa es la única regla: las palabras son anchas y tranquilas, los números estrechos y fuertes.
- **Frank Ruhl Libre** para el hebreo, siempre con `lang="he"` y `dir="rtl"`. Es la letra de los libros y calendarios hebreos impresos, la pareja natural de un almanaque.
- **Noto Sans SC**, cargada solo con los cinco caracteres 木火土金水, para la clave de color del pie.
- Escala en razón 3:2 desde 16 px: 16 · 24 · 36 · 54 · 81 · 121,5. Rótulos a 13 y 14 px en escritorio; en móvil ningún rótulo baja de 14 px y el cuerpo es de 16 px.
- Interlíneas sobre una línea base de 8 px (24, 32, 40, 56, 80, 120).
- Dos voces: «voz» (declaración, tradición, dato) a 36 px en escritorio y 24 px en móvil; cifras a 81 y 121,5 px.

## Retícula

- Módulo M = 48 px. Palacio = 9 M = 432 px. Cuadrado = 27 M = 1296 px. Márgenes de 1,5 M a 1440 px.
- Los palacios se separan con filetes de 1 px y el cuadrado se cierra con un marco de 2 px, el mismo grosor que el filete de la navegación. Nada de tarjetas, sombras ni degradados.
- La navegación tiene nueve entradas y ocupa nueve columnas de 144 px (3 M) en escritorio; en móvil se pliega en un 3 × 3.
- Cada palacio lleva su número Lo Shu, su título y un localizador de 3 × 3 que marca qué casilla (o casillas) ocupa.
- De 1280 a 1439 px el cuadrado mantiene la forma con márgenes de M/2. Por debajo de 1280 px se despliega en una tira de una columna: palacio entero para el contenido largo, dos tercios para tradición y dato, un tercio (358 × 119 a 390 px) para cada una de las tres cifras.
- El Árbol usa las coordenadas del brief tal cual: los 22 senderos son `<line>` en un SVG con `viewBox="0 0 100 100"`, y los nodos se colocan con `--x` y `--y` en porcentaje. Marco de 576 × 720 px en escritorio y de proporción 3:5 en móvil.

### Reparto de palacios

| Palacio | Rumbo y elemento | «Hoy» | «Árbol» |
|---|---|---|---|
| 4 | SE · Madera · riqueza | La cifra | Árbol |
| 9 | S · Fuego · reputación | Declaración | Árbol |
| 2 | SO · Tierra · lo receptivo | Sefirá del día | Detalle |
| 3 | E · Madera · impulso | Ritual de hoy | Árbol |
| 5 | Centro · Tierra | Ingreso real | Árbol |
| 7 | O · Metal · cosecha | Ahorro | Detalle |
| 8 | NE · Tierra · conocimiento | Tradición | Libro de fuentes |
| 1 | N · Agua · flujo | Fuentes que ingresan | Libro de fuentes |
| 6 | NO · Metal · apoyo | Dato | Medidor de meta |

## El motivo de la moneda

- **Marca**: disco con el hueco cuadrado. Se construye sobre una retícula de 3 × 3: el hueco es la casilla central, es decir, el palacio 5 abierto.
- **Medidor**: la moneda grande del palacio central de «Hoy» y del medidor de «Árbol». El arco de oro recorre el canto y marca el 38 %; el hueco queda vacío, como en una moneda real.
- **Estado de una fuente**: tres monedas, llena en azul (ingresando), contorno (probando), contorno discontinuo (idea).
- **Nodos del Árbol**: círculos con un arco de oro cuando la métrica tiene meta. El nodo elegido queda dentro de un cuadrado rojo: cielo redondo dentro de tierra cuadrada.
- **Ahorro**: 100 círculos en una retícula cuadrada de 10 × 10, 12 llenos, con la línea de meta en 20.
- **Casilla del ritual**: cuadrado vacío que, al marcarse, recibe un círculo.
- **Clave de color** del pie: cinco círculos dentro de cinco cuadrados.

## Qué lo hace de Zúrich

- Retícula modular con una sola razón matemática, a la manera de Lohse y Müller-Brockmann, visible en la página en lugar de escondida.
- Una grotesca, pocos pesos, texto en bandera a la izquierda, gran salto de escala entre rótulo (13 px) y cifra (121 px).
- Filetes finos y cifras tabulares como en un horario de tren.
- Azul del cantón como único color de acción, rojo en una sola dosis (el segundero del reloj ferroviario), oro contenido.
- Asimetría dentro del orden: el Árbol ocupa cuatro palacios y el resto se reparte en 2, 2 y 1.

## Qué lo hace feng shui

- El Lo Shu organiza de verdad: cada función está en el palacio cuyo sentido tradicional comparte, con el sur arriba, como en el diagrama original.
- Cinco colores con un papel funcional cada uno, explicados en el pie.
- Círculos dentro de cuadrados en todas las marcas de datos.
- Entrada despejada: cabecera con marca, nueve entradas y un conmutador; después, solo la fecha.
- Yin y yang: palabras anchas y cifras estrechas; tema claro de tinta sobre papel y tema oscuro como calco en negativo.
- Aire: los palacios de texto corto se dejan con blanco en lugar de rellenarse.

## Accesibilidad

- HTML semántico: `header`, `nav`, `main`, una `section` con su `h2` por palacio, tabla real para el libro de fuentes, casillas reales en el ritual, botones reales en los nodos con `aria-pressed` y una etiqueta completa.
- Foco visible en azul de 2 px en todo elemento interactivo; en el nodo elegido el foco rodea el sello.
- Enlace «Saltar al contenido».
- `prefers-reduced-motion` anula la única transición.
- Sin desbordamiento horizontal a 1440, 1280, 1024, 768, 390 y 320 px.

## Debilidades conocidas

1. **Tradición y dato no quedan pegados.** Están en la misma fila, a izquierda y derecha, pero con el palacio 1 entre ambos, porque el Lo Shu pone el 8 y el 6 en las esquinas. En móvil sí van seguidos.
2. **Las tres cifras no forman una fila en escritorio.** Ocupan los palacios 5, 7 y 1 (una L). En móvil sí forman un bloque de tres tiras.
3. **El cuadrado mide 1296 px de alto.** En una pantalla de 900 px el ritual asoma a los 770 px y la fila inferior queda bajo el pliegue.
4. **No hay maqueta propia de tableta.** Entre 560 y 1279 px se ve la tira de una columna centrada, con blanco a los lados.
5. **Texto añadido que no está en el brief**: los números Lo Shu, una palabra por palacio (Riqueza, Reputación, Recepción…), la clave del pie, los rótulos «Práctica», «Métrica», «En la tradición», y las notas de tradición y práctica de las otras nueve sefirot del panel de detalle. Estas últimas son un borrador mío y debe revisarlas quien audite el contenido.
6. **Estado de muestra inventado**: el ritual aparece con 2 de 5 pasos marcados para enseñar el componente.
7. **Los rótulos del Árbol en escritorio repiten la cifra** que ya está dentro del nodo (frase completa del brief). En el panel de detalle no se repite.
8. **Árbol en móvil**: los nombres van bajo los nodos laterales y tapan un tramo de sendero; la cualidad y la métrica pasan a una tabla debajo. El hebreo queda a 14 px.
9. **El oro no sirve para texto** (3,58:1 en claro). Está limitado a marcas gráficas.
10. **El azul oficial no está verificado en la fuente primaria** (ver la nota de la paleta).
11. **El JavaScript no es mínimo del todo**: unas 90 líneas para tema, selección de nodo y guardado del campo, con los textos de las diez sefirot dentro.
12. **Dependencia de Google Fonts** para Archivo, Frank Ruhl Libre y los cinco caracteres chinos. Sin red, el latín cae a Inter o Helvetica y el hebreo y el chino a la fuente del sistema.
13. **El CSS común está duplicado** en los dos HTML (bloque marcado `shell:start` … `shell:end`), porque el brief pide archivos autocontenidos.
