# Shefa · guía de componentes

Sistema «Lo Shu»: un almanaque impreso por un tipógrafo de Zúrich. Esta guía es para quien
construye una página nueva. Muestrario vivo: `/sistema` (página interna, `src/pages/sistema.astro`).
Páginas de referencia: `src/pages/index.astro` (Hoy) y `src/pages/arbol.astro` (Árbol).

## 1. Arranque

```bash
cd abundancia/site
npm install
npm run dev                          # desarrollo, http://localhost:4321
npm run build                        # compila a dist/ (debe pasar sin errores)
node scripts/capturas.cjs / /arbol   # capturas de las rutas indicadas, en qa/
node scripts/interacciones.cjs       # prueba de humo de Hoy y Árbol
```

`capturas.cjs` sirve `dist/` por su cuenta (no hace falta `astro preview`) y guarda, por ruta,
1440 × 900 y 390 × 844 en claro y en oscuro, a página entera. Imprime el desbordamiento
horizontal y los errores de página de cada captura y sale con código 1 si hay alguno.
Opciones: `--ancho 320` añade ese ancho; `--sin-muestra` pulsa «Empezar con mis datos» antes
de capturar (estado vacío). `qa/` no entra en git. Playwright está instalado de forma global:
antes de usar los scripts, `export NODE_PATH="$(npm root -g)"`. En Git Bash de Windows, antepón
`MSYS_NO_PATHCONV=1` a los que reciben rutas como `/arbol`, o las convierte en rutas de disco.

### Comprobar lo publicado y las fuentes

```bash
node scripts/vivo.cjs https://shefa-prosperai.vercel.app/shefa dist/shefa   # el sitio en vivo
node scripts/vivo.cjs https://pabloagusto.vercel.app/shefa dist/shefa       # y dentro del sitio raíz
node scripts/fuentes-verificar.mjs                                           # citas, estudios y cifras
npm run pruebas                                                              # todas las pruebas de humo (antes: npm run build)
```

**`vivo.cjs <base> [dist/shefa]`** abre con un navegador real las 15 rutas de la base indicada. En
cada una exige respuesta 200, ningún error de página ni petición fallida y los estilos aplicados
(la variable `--M` con valor). Si le pasas la carpeta compilada, exige además que el HTML servido sea
idéntico, byte a byte, al de local, y que la lista de rutas coincida con las páginas compiladas. En
`/colores` comprueba que la película carga metadatos, avanza al reproducir, carga los subtítulos y
no muestra el aviso «todavía no está disponible»; en `/videoteca`, que todas las miniaturas
responden, que ninguna entrada queda retirada y que el reproductor de YouTube responde. Sale con
código 1 si algo falla. La película es H.264 y el Chromium de Playwright para Windows no lo trae:
el script usa Edge o Chrome si están instalados. Al añadir una página, añádela a `RUTAS`.

**`fuentes-verificar.mjs [hebreo] [citas] [estudios] [cifras] [--detalle]`** coteja lo que el sitio
cita con su fuente: cada cita hebrea de `cabala.json` contra Sefaria, letra por letra; cada cita en
inglés o latín de `maestros.json` y `hermetismo.json` contra Project Gutenberg, archive.org o
Wikipedia; cada tamaño de efecto de `practicas.json` contra el resumen publicado; y cada cifra de
`datos.json` contra la página que cita (la serie de la Reserva Federal, contra su último dato). Por
cada elemento imprime `ok`, `difiere` o `no abre`, y sale con código 1 solo si algo difiere. `no
abre` es una web que no responde a un script (BLS, FTC, APA): no la fuerces; ábrela a mano. Necesita
`curl` y, para los PDF, `pdftotext` (Git para Windows lo trae). Qué se busca y dónde está en la
tabla `FUENTES`, al principio del script: al cambiar una cita, un efecto o una cifra en `src/data`,
actualiza su entrada, o saldrá como `difiere`.

## 2. Tokens (`src/styles/tokens.css`)

Nunca escribas un color en hex ni un tamaño suelto: usa los tokens.

| Elemento | Token | Papel | Regla |
|---|---|---|---|
| Madera 木 | `--texto`, `--texto-2`, `--texto-3`, `--filete` | Tinta: texto y estructura | `--texto-3` es el mínimo para texto (5,3:1) |
| Tierra 土 | `--fondo`, `--filete-suave`, `--trazo` | Papel, filete suave, contorno de marcas vacías | `--filete-suave` y `--trazo` nunca llevan información ni texto |
| Metal 金 | `--medida` | Oro: **solo valores medidos** (arcos, reglas, puntos) | Nunca en texto ni en adornos |
| Agua 水 | `--accion` | Azul de Zúrich: enlaces, foco, borde de campo, hover | Solo interacción |
| Fuego 火 | `--sello`, `--sobre-sello` | Sello rojo: el presente | **Uno por pantalla** |

- Tema claro y oscuro: `prefers-color-scheme` más `html[data-theme="light|dark"]`. Los tokens cambian
  solos; no escribas reglas por tema.
- Tipografía: `--fuente` (Archivo variable, ancho 100 % para palabras), cifras con `.cifra`
  (ancho 75 %, peso 700, tabulares). Hebreo: `--fuente-he` con `class="he" lang="he" dir="rtl"`.
  Chino: `class="han" lang="zh-Hans"` (fuente CJK del sistema; solo los cinco caracteres del pie).
- Escala 3:2: `--t-1` 16 · `--t-2` 24 · `--t-3` 36 · `--t-4` 54 · `--t-5` 81 · `--t-6` 121,5.
  Rótulos: `--t-00` 13 (14 en móvil) y `--t-0` 14. Medio paso `--t-1m` 20, solo para `.voz-m`.
  Interlíneas `--lh-*` sobre una línea base de 8 px.
- Espacio: `--s-1` 8 · `--s-2` 16 · `--s-3` 24 · `--s-4` 48 (M) · `--s-5` 72 · `--s-6` 96 · `--s-7` 144.
- Retícula: `--M` 48 px · palacio 9 M · `--cuadrado` 1296 px (27 M) · `--margen` · `--palacio-pad`
  (24; 16 en móvil) · `--marco` 2 px · `--linea` 1 px · `--campo` 48 px (alto de campos y botones).

## 3. Retícula

- **Módulo de 48 px.** Altos y separaciones en múltiplos o fracciones de M (8, 16, 24, 48, 72).
- **El cuadrado** (`<Cuadrado>`): desde 1280 px, tres columnas de 9 M con filetes de 1 px y marco de
  2 px. Cada fila mide como mínimo el lado de un palacio y crece si el contenido lo pide.
- **Palacios y Lo Shu**: el cuadrado se numera `4 9 2 / 3 5 7 / 8 1 6` (sur arriba). Cada
  `<Palacio n={…}>` se coloca solo en su casilla. Para una pieza que ocupa varias, pasa
  `celdas`: `[4, 9, 3, 5]` (2 × 2), `[2, 7]` (columna derecha, dos filas), `[8, 1]` (dos columnas).
  Tienen que formar un rectángulo y no solaparse con otros palacios.
- **Por debajo de 1280 px** el cuadrado es una tira de una columna (560 px como máximo) en el
  **orden del código**. La prop `forma` da la altura mínima en la tira: `cuadrado` (1:1),
  `dos-tercios` (3:2), `tira` (3:1, cifra a la izquierda y marca a la derecha) o `libre`.
- `<Cuadrado>` debe ser hijo directo del `<main>` de `Base` (usa su ancho para calcular el palacio).
- **Orden del código = orden visual.** Escribe los palacios en el orden en que se ven en escritorio
  (4 9 2 / 3 5 7 / 8 1 6, de izquierda a derecha y de arriba abajo): el foco del teclado y el lector de
  pantalla siguen el código, y la tira de móvil hereda ese orden.
- No es obligatorio llenar los nueve palacios, pero una fila sin completar deja ver el fondo de
  tinta: completa siempre el rectángulo con piezas o con `celdas`.
- Contenido fuera del cuadrado (franjas, notas): hijo directo de `<main>`, con filetes suaves
  arriba y abajo, como `.muestra` o `.datos-ctl`.

## 4. Esqueleto de página

```astro
---
import Base from '../layouts/Base.astro';
import TituloPagina from '../components/TituloPagina.astro';
import Cuadrado from '../components/Cuadrado.astro';
import Palacio from '../components/Palacio.astro';
import Cita from '../components/Cita.astro';
import Etiqueta from '../components/Etiqueta.astro';
import datos from '../data/practicas.json';
import '../styles/ritual.css';            // estilos propios de la página (globales)
---
<Base title="Ritual" description="Una frase llana que describe la página.">
  <TituloPagina titulo="Ritual" nota="Línea de apoyo, corta." />
  <Cuadrado>
    <Palacio n={4} celdas={[4, 9]} titulo="Mañana" etiqueta="10 min" forma="libre">
      <p class="voz">Una frase en la voz grande.</p>
      <Fragment slot="pie"><Cita fuente={datos.practicas[0].estudio} /></Fragment>
    </Palacio>
    <Palacio n={2} titulo="Evidencia" etiqueta="Estudio" forma="dos-tercios">
      <p><Etiqueta tipo="estudio" /></p>
      <p>{datos.practicas[0].efecto}</p>
    </Palacio>
    <!-- … hasta completar las filas … -->
  </Cuadrado>
</Base>

<script>
  import { leer, guardar, alCambiar } from '../lib/store';
  function pintar(s) { /* escribe el estado en el DOM */ }
  pintar(leer());
  alCambiar(pintar);
  document.documentElement.classList.add('listo');   // muestra lo marcado con .vivo
</script>
```

- Estilos de página: un archivo en `src/styles/` importado en el frontmatter, o `<style is:global>`.
  Los `<style>` con ámbito de Astro no alcanzan al HTML que pinta el cliente.
- Marca con `class="vivo"` lo que depende del estado guardado: queda oculto hasta que el script
  añade `listo` a `<html>` (así no parpadean los datos de muestra). Sin JavaScript se ve siempre.
- Lo que depende de la fecha se calcula en el cliente (`new Date()`), no al compilar.
- **Enlaces internos y archivos de `/public`: siempre con `ruta()`** de `src/lib/ruta.ts`
  (`<a href={ruta('/arbol#libro')}>`, `<img src={ruta('/media/x.jpg')}>`), también en el HTML que
  pinta el cliente. Así el sitio funciona si se sirve bajo un prefijo.

## 5. Componentes (`src/components/`)

### Base (`src/layouts/Base.astro`)
Página entera: `<head>` (título, descripción, Open Graph, `theme-color`, tema antes de pintar),
cabecera con marca y conmutador, navegación de nueve entradas con `aria-current`, `<main
id="contenido" class="pagina">` y pie (aviso, enlace a `/metodo`, clave Lo Shu y de elementos).

| Prop | Tipo | |
|---|---|---|
| `title` | `string` | Se completa con « · Shefa» |
| `description` | `string?` | Una frase llana |
| `clase` | `string?` | Clases para `<body>` |
| `noindex` | `boolean?` | Para páginas internas |

### TituloPagina
```astro
<TituloPagina titulo="Árbol de la Vida" nota="Diez cualidades y su medida" />
<TituloPagina><time slot="titulo">sábado <Sello>14</Sello> de noviembre</time></TituloPagina>
```
Props: `titulo?`, `nota?`. Ranuras: `titulo` (h1 con marcado propio) y la principal (nota con marcado).

### Cuadrado
```astro
<Cuadrado clase="mi-pagina">…palacios…</Cuadrado>
```
Props: `clase?`, `id?`.

### Palacio
```astro
<Palacio n={7} titulo="Ahorro" etiqueta="Cosecha" forma="tira" id="ahorro">
  <p class="dato"><span class="cifra fig-l">12 %</span></p>
  <div slot="graf">…marca gráfica…</div>
  <Fragment slot="pie">…pie…</Fragment>
</Palacio>
```
| Prop | Tipo | |
|---|---|---|
| `n` | `number` | Número Lo Shu (1–9); si ocupa varios, el de su esquina |
| `titulo` | `string` | `<h2>` del palacio |
| `etiqueta` | `string?` | Rótulo a la derecha (lleva `data-etiqueta` para cambiarlo desde el cliente) |
| `celdas` | `number[]?` | Palacios que ocupa en escritorio; por defecto `[n]` |
| `forma` | `'cuadrado' \| 'dos-tercios' \| 'tira' \| 'libre'` | Altura mínima en la tira; por defecto `libre` |
| `id` | `string?` | Ancla de la sección |
| `clase` | `string?` | Clases extra (además de `pal` y `p{n}`) |
| `nivel` | `2 \| 3` | Nivel del título |

Ranuras: principal (dentro de `.pal-cuerpo`), `pie` (`<footer class="pal-pie">`, pegado abajo) y
`graf` (`.pal-graf`: abajo a la derecha en escritorio si la forma es `tira`; da tú el ancho, p. ej.
`.p7 .pal-graf { width: 192px }`).

### MiniLoShu
```astro
<MiniLoShu celdas={[4, 9, 3, 5]} />
```
Localizador de 3 × 3. Props: `celdas: number[]`, `tam?` (px, 25), `clase?`. `Palacio` ya lo incluye.

### Moneda
```astro
<Moneda valor={0.38} etiqueta="38 % de la cifra" />
<Moneda valor={0.62} texto="62" />
<Moneda estado="ingresando" />
```
Anillo medidor en SVG: canto, arco de oro de 0 a 1, hueco cuadrado. Props: `valor?` (0–1),
`texto?` (cifra dentro del hueco), `etiqueta?` (sin ella es decorativa), `estado?`
(`ingresando | probando | idea`: dibuja la moneda de estado) y `clase?`. Ocupa el ancho de su
contenedor. En el cliente: `ponerArco(elemento, valor, etiqueta?)`.

### Sello
```astro
<Sello>14</Sello>   <Sello tam="s">3</Sello>
```
Cuadrado rojo con cifra blanca. Props: `tam?` (`m` | `s`), `clase?`. Uno por pantalla.

### Etiqueta
```astro
<Etiqueta tipo="estudio" />   <Etiqueta tipo="tradicion" texto="Aplicación moderna" />
```
Chip tipográfico del nivel de evidencia. Props: `tipo` (`tradicion | documentado | estudio |
anecdota | mito`, los mismos valores que `etiqueta` en los JSON) y `texto?`.

### Cita
```astro
<Cita fuente={e.fuente_dato} />
<Cita cita="Talmud, Taanit 9a" url="https://www.sefaria.org/Taanit.9a" rotulo="Fuente" />
```
Línea de fuente; enlaza si hay URL (se abre en otra pestaña y lo avisa al lector de pantalla). Props: `fuente?` (objeto `{ cita, url }` de los JSON), o
`cita?` y `url?`; `rotulo?`, `clase?`. No pinta nada si no hay cita.

### Medidor
```astro
<Medidor valor={0.4} etiqueta="Avance: 40 %" desde="0" hasta="meta 10 %" />
<Medidor valor={0.75} fina />
```
Regla con marcas cada décima. Props: `valor?` (0–1), `etiqueta?`, `desde?`, `hasta?`, `fina?`,
`clase?`. En el cliente: `el.querySelector('.regla-oro').style.width = '40%'`.

### AvisoMuestra
```astro
<AvisoMuestra />
```
Franja «Estos son datos de muestra» con el botón «Empezar con mis datos». En el script de la
página: `import { iniciarAvisoMuestra } from '../lib/muestra'; iniciarAvisoMuestra();`

## 6. Clases de utilidad (`src/styles/base.css`)

| Clase | Uso |
|---|---|
| `.cifra` | Negrita estrecha tabular. Tamaños: `.fig-xl` (121,5; se estrecha con `--n` = n.º de caracteres), `.fig-l` (54; 81 en escritorio), `.fig-m` (36), `.fig-s` (24) |
| `.voz`, `.voz-m` | Texto protagonista: 24/36 px y 20/24 px (móvil/escritorio). Dentro de `.voz`, cada `<span>` es una línea |
| `.rotulo`, `.nota` | Rótulo de 13 px en `--texto-3`; nota de 14 px en `--texto-2` |
| `.texto-2`, `.texto-3`, `.medio`, `.sin-corte` | Color secundario, terciario, peso 600, sin salto de línea |
| `.he`, `.han` | Hebreo y chino (con `lang` y, en hebreo, `dir="rtl"`) |
| `.pila`, `.pila-1`, `.pila-3` | Pila vertical con 16, 8 o 24 px |
| `.fila`, `.fila-extremos`, `.pares` | Fila flexible; con extremos separados; par «texto — cifra» |
| `.boton`, `.boton-2`, `.boton-s`, `.boton-texto` | Principal, secundario, pequeño, de texto. `<a>` o `<button>` |
| `.editable` | Texto o cifra que abre su edición al pulsarlo |
| `.campo`, `.campo-fila`, `.campo-par`, `.campo-u`, `.campo-estado` | Etiqueta más control; fila con unidad; dos columnas; unidad; mensaje (`role="status"`) |
| `.entrada`, `.entrada-cifra`, `.selector`, `.casilla` | Campo suelto; campo de cifra; envoltorio de `<select>` con su flecha; casilla |
| `.tabla`, `.num`, `.tabla-ancha` | Tabla con filetes; celda numérica; envoltorio con desplazamiento propio |
| `.lista-ed`, `.lista-vacia` | Lista con botón «Quitar»; texto de lista vacía |
| `.regla`, `.regla-s`, `.regla-oro`, `.regla-notas` | Piezas del medidor |
| `.dias`, `.puntos`, `.estado`, `.m-ingresa`, `.m-prueba`, `.m-idea` | Tira de días, matriz de cien puntos, moneda de estado con su texto |
| `.sello`, `.sello-s`, `.etiqueta`, `.fuente-cita` | Lo que pintan `Sello`, `Etiqueta` y `Cita` |
| `.muestra` | Franja discreta fuera del cuadrado |
| `.oculto` | Solo para lectores de pantalla |
| `.solo-escritorio`, `.solo-tira` | Visible solo desde 1280 px, o solo por debajo |
| `.vivo` | Oculto hasta que `<html>` tiene la clase `listo` |

## 7. Datos (`src/data/*.json`)

Los esquemas están en `src/data/ESQUEMAS.md`. Se importan en el frontmatter y se pintan al compilar:

```astro
---
import fengshui from '../data/fengshui.json';
---
{fengshui.palacios.map((p) => <li>{p.area}: {p.en_el_trabajo}</li>)}
```

- No inventes contenido ni lo copies al código: léelo del JSON. Si un campo puede ser `null`
  (`dato`, `fuente_dato`, `cita`, `url`), contempla el caso.
- Todo dato lleva su fuente (`<Cita fuente={…} />`) y, cuando el JSON trae `etiqueta`, su
  `<Etiqueta tipo={…} />`.
- Pasa los textos con cifras por `fino()` (`src/lib/formato.ts`) para que «10 %» no se parta.

## 8. Estado (`src/lib/store.ts`)

Todo se guarda en `localStorage` del dispositivo (clave `shefa-v2`). Solo en el cliente
(`<script>`), nunca en el frontmatter salvo `estadoInicial()` para pintar la muestra.

```ts
import { leer, guardar, alCambiar, fmt, fmtPct, medidas, racha, claveDia } from '../lib/store';

const s = leer();                                  // estado actual
guardar((s) => { s.ahorroPct = 15; });             // cambia, guarda y avisa
alCambiar((s) => pintar(s));                       // también salta si cambia en otra pestaña
```

- `Estado`: `declaracion`, `cifra`, `fechaMeta`, `fuentes[]`, `ideas[]`, `donadoPct`, `ahorroPct`,
  `ritual` (por día: `ritual['2026-11-14'] = [true, …]`), `evidencias[]`, `woop`, `espacio`, `ejemplo`.
- Cálculo: `ingresoReal(s)`, `racha(s)`, `ultimosDias(s, n)`, `hechosEl(s, clave)`, `medidas(s)`
  (las diez del Árbol: `valor`, `detalle`, `avance`), `METAS`, `PASOS_RITUAL`, `TIPOS_FUENTE`,
  `ESTADOS_FUENTE`, `uid()`.
- Datos: `exportar()`, `importar(texto)`, `reiniciar()`, `borrarEjemplos()`.
- Números: siempre `fmt(n)` y `fmtPct(n, dec)`. Para pintarlos, `pct(n, dec)` de `formato.ts`
  añade el espacio fino antes de «%». Para leer lo que escribe la persona, `leerNumero('3.800')`.
- Patrón de repintado: una función `pintar(s)` que escribe todo; se llama al cargar y en
  `alCambiar`. No pises el campo que tiene el foco (mira `poner()` en `arbol-cliente.ts`).
- Confirmaciones siempre en la página (un bloque oculto con «Sí» y «Cancelar»), nunca
  `window.confirm` ni `alert`.

Otros módulos de `src/lib/`: `formato.ts` (fechas en español, `fino`, `pct`, `esc`, `leerNumero`,
`leerConSigno`, `frases`, `parrafos`, `diaDelAnio`), `rotacion.ts` (`delDia`, `indiceDelDia`, `alternar`, `sefiraDelDia`),
`moneda.ts` (`monedaSVG`, `ponerArco`, `nodoSVG`, `monedaEstadoSVG`, `puntosSVG`, `rachaSVG`,
`diasSVG`), `sefirot.ts` (orden, cualidades, posiciones y los 22 senderos del Arí), `loshu.ts`, `ruta.ts`,
`muestra.ts`, `arbol-cliente.ts` (cliente de la página Árbol).

## 9. Listón de calidad

Antes de dar una página por terminada:

1. `npm run build` sin errores y `node scripts/capturas.cjs /tu-ruta` sin «REVISAR».
2. **Sin desbordamiento horizontal a 320 px** (`--ancho 320`). Las tablas anchas van dentro de
   `.tabla-ancha` o se apilan en móvil.
3. **Mira las capturas**: escritorio y móvil, claro y oscuro. Alineación a la retícula, texto
   cortado o montado, hebreo de derecha a izquierda, estados vacíos.
4. **Contraste AA**: texto solo con `--texto`, `--texto-2`, `--texto-3` o `--accion`. El oro y los
   contornos no llevan texto.
5. **Foco visible** en todo lo interactivo (ya viene dado: no quites el `outline`). Todo se puede
   usar con teclado; los controles llevan `<label>` o `aria-label`.
6. Cuerpo de 16 px como mínimo en móvil; rótulos de 14 px como mínimo en móvil.
7. Sin degradados, sombras, esquinas redondeadas (salvo círculos de datos) ni emoji. Oro solo
   para lo medido, azul solo para lo que se pulsa, un solo sello rojo por pantalla.
8. **Texto**: español llano, tuteo, frases cortas, mayúscula solo inicial («Añadir fuente», no
   «Añadir Fuente»), sin palabras de bombo ni promesas. Comillas « ». Cifras con `fmt`/`fmtPct`.
9. **Tradiciones en sus términos**: «la tradición enseña que…». Nunca afirmes una causa
   sobrenatural como hecho. Toda aplicación al dinero se rotula como aplicación moderna.
10. Funciona sin red: nada de fuentes, scripts ni imágenes de terceros en tiempo de ejecución.
