# Brief de diseño — Shefa

**Producto.** Shefa (שפע, «abundancia, flujo» en hebreo) es un sistema personal de práctica de riqueza, en español. Une tradición (cábala judía, hermetismo y Nuevo Pensamiento, feng shui, prácticas de energía) con datos cuantitativos. Se usa a diario: declaración, cifra objetivo, tablero en forma de Árbol de la Vida con diez cualidades medibles, libro de fuentes de ingreso, ritual guiado, biblioteca de tradición, videoteca, calculadoras.

**Encargo del cliente.** «Un toque de Zúrich en los colores y el diseño, y de feng shui», «como diseñador profesional», «unreasonably pro». La versión anterior le pareció pobre: un libro mayor genérico en crema y verde. Esto debe parecer el trabajo de un gran estudio de Zúrich.

## Principios fijos (valen para todas las direcciones)

1. **Estilo tipográfico internacional suizo, escuela de Zúrich** (Müller-Brockmann, Lohse, Vivarelli, revista Neue Grafik): retícula modular estricta, espaciado matemático, texto en bandera a la izquierda, una sola familia grotesca con pesos disciplinados, gran contraste de escala, cifras tabulares, filetes finos, asimetría. Sin decoración, sin degradados, sin sombras, sin tarjetas redondeadas de plantilla, sin emoji.
2. **Color de Zúrich**: anclado en el azul y blanco de Zúrich (armas del cantón, tranvías), contención de banca privada (Paradeplatz), un acento metálico (oro) usado con mucha medida y un rojo de señal (segundero del reloj ferroviario suizo) en dosis mínimas.
3. **Feng shui con sentido, no decorativo**:
   - Equilibrio de los cinco elementos: una paleta de cinco colores funcionales, cada uno asignado a Madera, Fuego, Tierra, Metal o Agua y a un papel en la interfaz.
   - «Cielo redondo, tierra cuadrada» (天圆地方): círculos dentro de cuadrados. La moneda china antigua (redonda con hueco cuadrado) es el motivo de identidad; las marcas de datos son circulares dentro de una retícula cuadrada.
   - El cuadrado Lo Shu de nueve palacios (3 × 3) como estructura organizadora donde resulte natural.
   - Entrada despejada (cabecera sin ruido), flujo de aire en los blancos (qi), equilibrio entre yin (texto, calma) y yang (cifras activas).
   - Tema claro (yang) y tema oscuro (yin), ambos diseñados de verdad.
4. **Cábala**: el Árbol de la Vida (10 sefirot, 3 columnas, 22 senderos) es la visualización central de datos. Cada sefirá es una cualidad medible con su valor. El nombre hebreo aparece pequeño junto al nombre en español. Con respeto: nada de kitsch, nada de clip-art místico, ninguna estrella de David como adorno.
5. **Los datos primero**: las cifras son las protagonistas y se leen de un vistazo.
6. **Accesibilidad**: contraste WCAG AA, foco visible, cuerpo mínimo de 16 px en móvil, funciona a 390 px sin desplazamiento horizontal, respeta `prefers-reduced-motion`.
7. **Texto de interfaz en español**, llano, sin palabras de bombo.

## Árbol de la Vida: disposición y contenido

Usa la disposición judía luriana (del Arí), no la hermética: 3 senderos horizontales, 7 verticales y 12 diagonales. Maljut solo se une a Yesod.

- Horizontales: Jojmá–Biná, Jésed–Guevurá, Nétsaj–Hod.
- Verticales: Kéter–Tiféret, Tiféret–Yesod, Yesod–Maljut, Jojmá–Jésed, Jésed–Nétsaj, Biná–Guevurá, Guevurá–Hod.
- Diagonales: Kéter–Jojmá, Kéter–Biná, Jojmá–Tiféret, Biná–Tiféret, Jojmá–Guevurá, Biná–Jésed, Jésed–Tiféret, Guevurá–Tiféret, Tiféret–Nétsaj, Tiféret–Hod, Nétsaj–Yesod, Hod–Yesod.

Posiciones relativas (x, y en %, origen arriba a la izquierda; la columna derecha es la de Jojmá, Jésed y Nétsaj):
Kéter (50, 5) · Jojmá (82, 19) · Biná (18, 19) · Jésed (82, 41) · Guevurá (18, 41) · Tiféret (50, 53) · Nétsaj (82, 70) · Hod (18, 70) · Yesod (50, 81) · Maljut (50, 96).

| Sefirá | Hebreo | Cualidad | Métrica de muestra |
|---|---|---|---|
| Kéter | כתר | Intención | Declaración y cifra escritas: 100 % |
| Jojmá | חכמה | Visión | 7 ideas capturadas |
| Biná | בינה | Plan | 2 de 3 fuentes con próxima acción |
| Jésed | חסד | Generosidad | 4 % donado (meta 10 %) |
| Guevurá | גבורה | Disciplina | 12 % de ahorro (meta 20 %) |
| Tiféret | תפארת | Equilibrio | Índice general: 54 |
| Nétsaj | נצח | Constancia | Racha de 6 días |
| Hod | הוד | Gratitud | 3 evidencias esta semana |
| Yesod | יסוד | Canales | 1 fuente que ya ingresa |
| Maljut | מלכות | Manifestación | 3.800 de 10.000 al mes (38 %) |

## Pantallas del prototipo (contenido de muestra, idéntico en todas las direcciones)

### `hoy.html` — inicio
- Barra superior: marca «Shefa»; navegación: Hoy · Árbol · Ritual · Tradición · Espacio · Datos · Videoteca · Colores · Agentes; conmutador de tema.
- Fecha: «sábado 14 de noviembre de 2026». Sefirá del día: «Maljut · מלכות · Manifestación» con la práctica «Hoy se descansa y se revisa lo recibido».
- Declaración: «Soy un profesional que cumple lo que promete. Cada semana sirvo mejor y cobro lo justo. Voy a dominar mi oficio.»
- La cifra: «10.000 al mes», para el «30 de junio de 2027», avance 38 %.
- Ritual de hoy, cinco pasos marcables: Respirar (2 min) · Leer la declaración en voz alta (2 min) · Visualizar el proceso de hoy (5 min) · Dar primero (apartar el 10 %) · Bloque de trabajo sin distracciones (90 min). Racha: 6 días.
- Tres cifras: Ingreso real 3.800 · Fuentes que ingresan 1 de 3 · Ahorro 12 %.
- Tradición y dato del día, lado a lado: Tradición — «Diezma para que te enriquezcas» (Talmud, Taanit 9a). Dato — Gastar en otros aumenta el bienestar más que gastar en uno mismo (Dunn, Aknin y Norton, Science, 2008).
- Pie: «Información general, no asesoramiento financiero».

### `arbol.html` — tablero
- El Árbol con los diez nodos y sus valores de la tabla.
- Panel de detalle de la sefirá seleccionada (muestra Jésed): significado en la tradición, práctica de hoy, la métrica con su campo editable, el dato que la respalda.
- Libro de fuentes de ingreso (3 filas): Servicio principal · Servicio · ingresando · 3.200 · «Subir precio 10 % a clientes nuevos» / Contratos recurrentes · Servicio · probando · 600 · «Ofrecer plan mensual a 5 clientes» / Guía digital · Digital · idea · 0 · «Escribir el índice y validarlo con 3 personas».
- Medidor de meta: 3.800 de 10.000.

## Entregables de cada dirección (en su carpeta)

- `tokens.css`: tokens de diseño para tema claro y oscuro (`prefers-color-scheme` y además `[data-theme]`).
- `hoy.html` y `arbol.html`: HTML y CSS escritos a mano, autocontenidos (pueden enlazar `tokens.css` y Google Fonts). JS mínimo: cambio de tema y selección de nodo.
- `shots/`: capturas generadas con `node /home/user/metacoach-assets/abundancia/design/shoot.cjs <carpeta>`.
- `README.md`: concepto en 150 palabras; paleta con hex, elemento asignado, papel en la interfaz y contraste calculado; sistema tipográfico; retícula; uso del motivo de la moneda; qué lo hace de Zúrich; qué lo hace feng shui; debilidades conocidas.

## Notas técnicas

- Google Fonts funciona en el Chromium sin interfaz de este entorno. Elige la grotesca con intención (por ejemplo Inter, Inter Tight, Hanken Grotesk, Schibsted Grotesk, Instrument Sans, Geist, Host Grotesk, Familjen Grotesk, Archivo) y una monoespaciada o cifras tabulares para datos.
- Para el hebreo carga una fuente web con soporte hebreo (Frank Ruhl Libre, Heebo, Assistant, Noto Sans Hebrew o Noto Serif Hebrew). No dependas de fuentes del sistema. El hebreo va con `dir="rtl"` y `lang="he"`.
- Si muestras caracteres chinos, cárgalos con una fuente web (Noto Sans SC o Noto Serif SC con el parámetro `&text=`) o dibújalos en SVG.
- Dibuja el Árbol en SVG con coordenadas exactas.
