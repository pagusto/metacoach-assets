# Brief — Works Summary Report 03, The Garema Hotel (SA Quality Ductwork)

Pegá este archivo entero como primer mensaje en una sesión de Claude Code abierta en la carpeta que
tiene las fotos. Está escrito para que se ejecute sin más contexto que esto y los archivos.

---

## 1. Situación

SA Quality Ductwork (SAQD) instala ductería en The Garema Hotel, Canberra ACT. Contratista
principal: **TP Dynamics**. Contratista mecánico que nos contrata: **Climatech**. Supervisor de
Climatech y único punto de instrucción: **Keith Morgan**.

El martes 8 de septiembre de 2026 removieron del site al supervisor de SAQD por mover una luminaria
sin autorización. Se levantó una no conformidad: la primera contra SAQD en este proyecto. El lunes
14 llegó **Mauro** como supervisor nuevo. Cuadrilla en site: **Pablo Agusto, Eduardo y Mauro**.

El objetivo del paquete es que SAQD siga en el site: que Keith evalúe a la cuadrilla por el trabajo
entregado y no por el incidente. Entrega por email a Keith.

**El instrumento que persuade es el reporte de obra, no la disculpa.** Un reporte puntual y completo
se lee como continuidad; una carta larga se lee como súplica. La disculpa ya está escrita y ocupa
cinco líneas.

## 2. Qué hay que producir

| Archivo | Estado | Qué es |
| --- | --- | --- |
| `SAQD_NCR_Response_14_Sep_2026.pdf` | **hecho** | Memo de 1 hoja: responsabilidad, acciones, controles, pedido |
| `SAQD_Direction_Record_Aug-Sep_2026.pdf` | **hecho** | Anexo de 6 hojas con las 32 capturas del hilo con Keith |
| `email-to-keith.md` | **hecho** | Cuerpo del email, listo para copiar |
| `SAQD_Works_Summary_Report_03_05-14_Sep_2026.pdf` | **falta** | El reporte: 1 hoja de resumen + hojas de fotos + 1 hoja de log |

Lo que falta es el reporte. Todo lo demás ya está construido y no se toca.

## 3. Archivos de entrada

- `photos/` — ~60 fotos de obra. Los nombres traen fecha y hora (`20260914_133905.jpg` → 14/09/2026
  13:39). **Usá el nombre para fechar cada foto**: eso cierra el "levels and dates to be confirmed"
  que quedó pendiente en los reportes 01 y 02.
- `sms/SMS-01.jpg … SMS-32.jpg` — capturas del hilo con Keith, ya recortadas al área de mensajes y
  ordenadas cronológicamente. `sms/index.json` trae fecha y descripción de cada una. Ya están usadas
  en el anexo; **no van en el reporte**.
- `_base.html` — la hoja de estilos compartida de los tres documentos.
- `build.py` — el compilador.
- `ncr-response.html`, `direction-record.html` — los dos documentos ya hechos, como referencia de
  formato.

Si alguna foto de obra es en realidad una captura de pantalla de mensajes, sacala de `photos/`.

## 4. El reporte, hoja por hoja

Formato idéntico al reporte 02: A4, `.sheet` por hoja, tokens de color y tipografías ya definidos en
`_base.html`. Copiá la estructura de `ncr-response.html` para el masthead y de `direction-record.html`
para la grilla de fotos.

### Hoja 1 — Resumen ejecutivo

Masthead, `REF SAQD-GAR-003 · ISSUE 14/09/2026`, título, y:

- **Datagrid** (4 columnas × 2 filas): Project · The Garema Hotel (5-Star), ACT / Principal
  Contractor · TP Dynamics / Mechanical Contractor · Climatech / Site Supervisor · Keith Morgan /
  Works By · SA Quality Ductwork / Reporting Period · Sat 5 – Mon 14 Sep 2026 / Site Crew ·
  P. Agusto, Eduardo, Mauro / Prepared By · P. Agusto.
- **01 Scope of Works Delivered** — viñetas cortas en 2 columnas, cada una con las referencias de
  foto entre paréntesis en `<span class="mono">`.
- **02 Progress by Work Front** — la tabla de abajo.
- **03 Coordination & Observations**, **04 Safety & Compliance**, **05 Planned Works** en el bloque
  `.cols` de dos columnas.
- Firmas: **Pablo Agusto** / SA Quality Ductwork y **Keith Morgan** / Climatech. Sin cargos
  individuales.

**La tabla de avance sale de la lista que mandó Keith el lunes 14/09**, no de lo que nos parezca:

| Work front | Works performed | Qty | Status |
| --- | --- | --- | --- |
| Level 8 | Cushion boxes installed to the marked-up locations | — | Complete |
| Basement 1 | Cushion boxes installed; boxes collected from B1 and GF stores | — | Complete |
| Basement 4 – B2 | Duct install | — | Complete |
| Basement 4 – B2 | Smoke seal, angle and mastic | — | Complete |
| Basement 1 | Duct install | — | In progress |
| Level 1 conference | Supply boxes sprayed, finished supa wood timber left untouched | — | Complete |
| Basement 2 | AC unit supports and duct install to the B1 walkway | — | Complete |
| Rooftop / cooling tower | Waffle pads set to 4 per side under the frame, with metal | — | Complete |
| Ground floor / L1 | Penetrations cut out and made good | — | Complete |
| All fronts | 200 cushion boxes installed — the full quantity available on site | — | Complete |

Dejá **Qty en `—`**: las cantidades se confirman con los dockets diarios. No inventes números. El
único número verificado es el de las 200 cajas, que está en el hilo.

### Hojas 2 a N — Registro fotográfico

Grilla de 3 columnas, 9 fotos por hoja, `aspect-ratio:10/9` en `.frame`, `object-fit:cover`.
Cada figura: badge `PH-01`, un `.tag` con **la fecha sacada del nombre del archivo**, un título de
3 a 5 palabras y una descripción de una sola línea. ~60 fotos → 7 hojas.

Ejemplo del tono de los captions (breve, técnico, sin adjetivos):

> **Cushion boxes installed, Level 8** — Boxes set to the marked-up locations and connected to the
> spigots.

### Última hoja — Direction & Response Log

Tabla de cuatro columnas: `Date / time · Direction received · Action · Close-out`. Es la pieza más
importante del documento después del resumen: no argumenta, registra. Las filas están en §5.

## 5. Direction & Response Log (transcripción del hilo)

Transcribilas tal cual. Son citas textuales de Keith y de SAQD.

| Fecha | Dirección recibida | Acción | Cierre |
| --- | --- | --- | --- |
| 4 Sep 8:26 | Penetrations marked up "cut out" / "west cut out" | Cut-outs commenced | — |
| 4 Sep 10:44 | Extent queried: "Here is ok or more?" | "Remove as well" | Extent confirmed before cutting |
| 4 Sep 11:47 | "We removed the first one" | "Need to take the whole thing out" | Full removal completed |
| 4 Sep | "These penos taking way to long mate" | "Got it" | Noted; daily completion note now issued |
| 4 Sep | "Thanks bro, I'll get 2 of you to help me with Basement 1" | "We are on b1 pls let us know where" | "Grab gear from ground floor and take to B1" |
| 4 Sep | "Let me know when the gear is moved" | "Already moved we will start drilling" | "Ok perfect" |
| 7 Sep 7:16 | "Please complete B2 AC unit supports and duct install in the B1 walkway" | "Will do" | Completed |
| 7 Sep 10:03 | Query raised before proceeding in B2 | "Yeah, I'll come down. Give me 10 mins" | Attended on site |
| 7 Sep | Waffle pad count queried: "3 read ones on each one right?" | Detail issued | Superseded next morning |
| 8 Sep 7:26 | Cooling tower waffle pad detail issued (sketch) | Pads installed | — |
| 8 Sep 9:04 | "The middle of the center has a diff on height" | "4 on each side of the frame understood — not 3" | "Done" |
| 8 Sep | "How is there such a big gap?" | "I'll come up" | Reviewed on site, corrected |
| **8 Sep** | **"Stop works and meet on ground floor to complete a toolbox talk about not touching other services"** | **"Ok. We are on GF"** | **Attended in full; adopted as a standing rule** |
| **9 Sep 7:54** | — | **"Could you pls quickly check before using Dynabolts"** | **Confirmation sought before fixing** |
| 9 Sep | "This box isn't completed. Needs tape on the sides and silicone around the spigots…" | Rectification carried out | Box completed |
| 14 Sep | "Can you spray the box black please" | "Would u want the otside as well? Or the edges?" | "Yeah that's better 👍" |
| 14 Sep | "Can you send Lalo to Level 1 conference to spray these boxes" | "Okay calling him now" | "Yeah that's fine, after lunch" |
| 14 Sep | "Get cushion boxes from here on B1 / install them here on Level 8 / and install here on B1" | "Ok we are on our way" | "Sweeet." |
| 14 Sep | "There are also more boxes here on ground floor" | Boxes collected | 200 boxes installed |
| **14 Sep** | Level 4 scope unclear | **"You forgot to send us what you need us to do on lvl 4 — is there any drawing? Or zone so we can have a look and then proceed"** | **"Check out basement 4 on Procore" — drawing provided before starting** |
| 14 Sep | Week's works list issued to Wednesday | "Understood" | In progress per list |
| 14 Sep | — | New supervisor introduced: "Mauro the new supervisor would like to meet u" | Introduction arranged |

Las cuatro filas en negrita son las que sostienen el caso ante la no conformidad: el toolbox lo
convocó Climatech y se atendió en el acto; al día siguiente se pidió autorización antes de fijar;
y se pidió el plano de Basement 4 **antes** de proceder en vez de asumir. **No las destaques en el
documento** — que sean filas como todas las demás. Eso es lo que las hace creíbles.

## 6. Reglas de redacción

- Inglés australiano, voz activa, frases cortas. Sin americanismos.
- Nada personal: ni situación de la empresa, ni necesidad económica, ni "sería una lástima".
- No nombrar al supervisor removido. "The supervisor involved is no longer on site" alcanza.
- No mencionar que Climatech ya tenía no conformidades previas. Es su problema, no nuestro argumento.
- La queja de ritmo de Keith ("these penos taking way to long") **no se menciona ni se justifica**.
  Se responde con el compromiso de la nota diaria de lo terminado, que ya está en el memo.
- Nada de cantidades inventadas.

## 7. Control de calidad — antes de exportar nada

1. **Revisión foto por foto.** Mandarle fotos al supervisor que acaba de levantar una NC es
   entregarle evidencia. Descartá cualquier foto con: alguien sin EPP, trabajo en altura sin
   asegurar, escalera mal usada, o la luminaria del incidente. Avisá cuál sacaste y por qué.
2. **Orientación.** Las fotos de teléfono vienen rotadas. `ImageOps.exif_transpose`, y después armá
   una hoja de contactos y miralas: en el reporte 02 varias quedaron de costado igual.
3. **Normalizado.** 1400 px lado mayor, calidad 74, `optimize=True`, `progressive=True`.
4. **Altura de hoja.** Ninguna `.sheet` puede pasar de **294 mm** o se desborda a una página extra:

   ```python
   from playwright.sync_api import sync_playwright
   import pathlib
   u = pathlib.Path('report-print.html').resolve().as_uri()
   with sync_playwright() as pw:
       b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                              args=["--no-sandbox"])
       pg = b.new_page(viewport={"width": 1200, "height": 900})
       pg.goto(u); pg.emulate_media(media="print"); pg.wait_for_timeout(3000)
       print([round(h, 1) for h in pg.evaluate(
           "() => {const mm=96/25.4; return Array.from(document.querySelectorAll('.sheet'))"
           ".map(s => s.getBoundingClientRect().height/mm);}")])
       b.close()
   ```

5. **Páginas.** `pypdf` para confirmar el conteo: memo 1, anexo 6, reporte el que corresponda.
6. **Vista.** `pdftoppm -jpeg -r 110` y mirá la hoja 1 y la última antes de darlo por cerrado.

## 8. Build

```bash
python3 build.py report          # solo el reporte
python3 build.py                 # los tres documentos
```

`build.py` toma `<nombre>.html`, le antepone `_base.html`, incrusta las fotos como data URI y las
tipografías como `@font-face`, y renderiza el PDF con el Chromium local. Requiere `pillow`, `pypdf`
y `playwright` (solo para la medición de altura). Si el Chromium está en otra ruta, cambiá `CHROME`
al principio del archivo.

## 9. Entrega

1. Los tres PDF adjuntos a un solo email a Keith. El cuerpo está en `email-to-keith.md` — copialo
   tal cual, no le agregues nada.
2. **Sale hoy.** Si el reporte no llega a tiempo, mandá igual el email y el memo, y cambiá la
   primera línea por: "Our works summary for 5–14 September follows tomorrow morning."
3. Antes de mandar: pasale al usuario la lista de captions y la tabla del log para que corrija
   niveles y partidas. Él estuvo en la obra; vos no.
