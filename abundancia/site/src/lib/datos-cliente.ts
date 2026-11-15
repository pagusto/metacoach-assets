// Cliente de /datos: cinco calculadoras, la lista de banderas rojas y el plegado de las cifras.
// Nada se guarda: las cuentas viven en la página y se pierden al salir. Del estado guardado
// solo se lee el ingreso del libro de fuentes, para proponerlo en el reparto.

import { leer, alCambiar, ingresoReal, type Estado } from './store';
import { leerNumero, leerConSigno } from './formato';
import { num, conSigno, pctFino } from './datos-formato';
import {
  interesCompuesto, ajustarReparto, importesReparto, aniosIndependencia, subirPrecio, evaluarFuente,
  type Compuesto, type ParteReparto, type Reparto,
} from './datos-calculo';
import { graficoCompuesto, graficoIndependencia, graficoPrecio, canalPrecio, franjaReparto, escalaEvaluador } from './datos-graficos';
import { PARTES, TEXTO_NIVEL, textoMasFloja, veredictoBanderas, notaIndependencia } from './datos-textos';

const campo = (id: string) => document.getElementById(id) as HTMLInputElement | null;
const pieza = (clave: string) => document.querySelector<HTMLElement>(`[data-v="${clave}"]`);
function escribir(clave: string, texto: string): void {
  const el = pieza(clave);
  if (el && el.textContent !== texto) el.textContent = texto;
}
/** Cifra grande: además del texto, pasa el número de caracteres para que se estreche si no cabe. */
function escribirCifra(clave: string, texto: string): void {
  const el = pieza(clave);
  if (!el) return;
  if (el.textContent !== texto) el.textContent = texto;
  el.style.setProperty('--n', String(Math.max(2, texto.length)));
}
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
/** Tope de los importes que escribe la persona: evita desbordamientos sin estorbar a nadie. */
const TOPE = 1e12;
const importe = (el: HTMLInputElement) => limitar(leerNumero(el.value), 0, TOPE);
const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

// ---------- Cifras: en la tira, la nota y la fuente se pliegan ----------

const escritorio = window.matchMedia('(min-width: 960px)');
function plegarCifras(): void {
  document.querySelectorAll<HTMLDetailsElement>('.cf-d').forEach((d) => { d.open = escritorio.matches; });
  abrirCifraEnlazada();
}
function abrirCifraEnlazada(): void {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id.startsWith('c-')) return;
  const d = document.getElementById(id)?.querySelector<HTMLDetailsElement>('.cf-d');
  if (d) d.open = true;
}
escritorio.addEventListener('change', plegarCifras);
window.addEventListener('hashchange', abrirCifraEnlazada);
// Si el hash ya es el de la cifra no hay «hashchange»: se abre también al pulsar el enlace.
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a[href^="#c-"]');
  const id = a?.getAttribute('href')?.slice(1);
  const d = id ? document.getElementById(id)?.querySelector<HTMLDetailsElement>('.cf-d') : null;
  if (d) d.open = true;
});
abrirCifraEnlazada();

// ---------- 1 · Interés compuesto ----------

function iniciarCompuesto(): void {
  const aporte = campo('c-aporte');
  const anios = campo('c-anios');
  const retorno = campo('c-retorno');
  const activo = document.getElementById('c-activo') as HTMLSelectElement | null;
  const grafico = pieza('c-grafico');
  const lecturaEl = pieza('c-lectura');
  const tabla = pieza('c-tabla');
  if (!aporte || !anios || !retorno || !grafico) return;

  let actual: Compuesto = interesCompuesto(0, 1, 0);
  let lectura: number | undefined; // año señalado en el gráfico; sin señalar, el último

  function pintarLectura(): void {
    const n = actual.serie.length - 1;
    const a = lectura === undefined ? n : limitar(Math.round(lectura), 0, n);
    const p = actual.serie[a];
    grafico!.innerHTML = graficoCompuesto(actual, lectura === undefined ? undefined : a);
    grafico!.setAttribute('aria-valuemax', String(n));
    grafico!.setAttribute('aria-valuenow', String(a));
    grafico!.setAttribute('aria-valuetext', `Año ${a}: valor ${num(p.valor)}, aportado ${num(p.aportado)}`);
    if (lecturaEl) {
      lecturaEl.innerHTML =
        `<span class="lc-par"><span class="k-linea k-azul" aria-hidden="true"></span>Año ${a}: valor <b>${num(p.valor)}</b></span> ` +
        `<span class="lc-par"><span class="k-linea k-ref" aria-hidden="true"></span>aportado <b>${num(p.aportado)}</b></span>`;
    }
  }

  function pintar(): void {
    const n = limitar(Number(anios!.value) || 1, 1, 50);
    const r = limitar(leerConSigno(retorno!.value), -50, 100);
    actual = interesCompuesto(importe(aporte!), n, r);
    escribir('c-retorno-t', pctFino(r, 2));
    if (lectura !== undefined && lectura > n) lectura = undefined;
    const salida = pieza('c-anios');
    if (salida) salida.innerHTML = `<span class="cifra">${n}</span> ${plural(n, 'año', 'años')}`;
    escribirCifra('c-final', num(actual.final));
    escribir('c-aportado', num(actual.aportado));
    escribir('c-crecimiento', num(actual.crecimiento));
    pintarLectura();
    if (tabla) {
      tabla.innerHTML = actual.serie
        .slice(1)
        .map((p) => `<tr><th scope="row">${p.anio}</th><td class="num">${num(p.aportado)}</td><td class="num">${num(p.valor)}</td></tr>`)
        .join('');
    }
  }

  [aporte, anios].forEach((el) => el.addEventListener('input', pintar));
  retorno.addEventListener('input', () => {
    // Si lo escrito coincide con un activo de los datos, el selector lo dice; si no, «Otro valor».
    if (activo) {
      const v = leerConSigno(retorno.value);
      const igual = Array.from(activo.options).find((o) => o.value !== '' && Number(o.value) === v);
      activo.value = igual ? igual.value : '';
    }
    pintar();
  });
  activo?.addEventListener('change', () => {
    if (activo.value === '') {
      retorno.focus();
      retorno.select();
      return;
    }
    retorno.value = num(Number(activo.value), 2, 0);
    pintar();
  });

  // Lectura con el cursor: el año más cercano a la posición horizontal.
  const alPuntero = (e: PointerEvent) => {
    const caja = grafico.getBoundingClientRect();
    if (!caja.width) return;
    const n = actual.serie.length - 1;
    lectura = limitar(Math.round(((e.clientX - caja.left) / caja.width) * n), 0, n);
    pintarLectura();
  };
  grafico.addEventListener('pointermove', alPuntero);
  grafico.addEventListener('pointerdown', alPuntero);
  grafico.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      lectura = undefined;
      pintarLectura();
    }
  });
  // Lectura con el teclado: flechas, Inicio y Fin (el gráfico es un control deslizante).
  grafico.addEventListener('keydown', (e) => {
    const n = actual.serie.length - 1;
    const a = lectura === undefined ? n : lectura;
    const pasos: Record<string, number> = {
      ArrowLeft: a - 1, ArrowDown: a - 1, ArrowRight: a + 1, ArrowUp: a + 1, PageDown: a - 5, PageUp: a + 5, Home: 0, End: n,
    };
    if (!(e.key in pasos)) return;
    e.preventDefault();
    lectura = limitar(pasos[e.key], 0, n);
    pintarLectura();
  });

  pintar();
}

// ---------- 2 · Reparto del ingreso ----------

function iniciarReparto(): void {
  const ingreso = campo('r-ingreso');
  const franja = pieza('r-franja');
  const origen = pieza('r-origen');
  const origenMuestra = pieza('r-origen-muestra');
  const tabla = document.querySelector<HTMLTableElement>('.d-reparto-t');
  if (!ingreso) return;
  const deslizadores = new Map<ParteReparto, HTMLInputElement>();
  PARTES.forEach((p) => {
    const el = campo(`r-${p.id}`);
    if (el) deslizadores.set(p.id, el);
  });

  let reparto: Reparto = { dar: 10, ahorrar: 20, vivir: 70 };
  deslizadores.forEach((el, id) => { reparto[id] = limitar(Number(el.value) || 0, 0, 100); });
  let tocado = false; // la persona ya escribió su ingreso: no se pisa con el del libro

  function pintar(): void {
    const imp = importesReparto(importe(ingreso!), reparto);
    PARTES.forEach(({ id }) => {
      const el = deslizadores.get(id);
      if (el && Number(el.value) !== reparto[id]) el.value = String(reparto[id]);
      el?.setAttribute('aria-valuetext', `${reparto[id]} %`);
      escribir(`r-pct-${id}`, pctFino(reparto[id]));
      escribir(`r-mes-${id}`, num(imp.mes[id]));
      escribir(`r-anio-${id}`, num(imp.anio[id]));
    });
    // Importes de nueve cifras al año: en el palacio estrecho del cuadrado compacto la hoja baja la cifra un paso
    tabla?.toggleAttribute('data-larga', PARTES.some(({ id }) => num(imp.anio[id]).length >= 11));
    if (franja) {
      franja.innerHTML = franjaReparto(reparto);
      franja.setAttribute('aria-label', `Dar ${reparto.dar} %, ahorrar ${reparto.ahorrar} %, vivir ${reparto.vivir} %`);
    }
  }

  deslizadores.forEach((el, id) => {
    el.addEventListener('input', () => {
      reparto = ajustarReparto(reparto, id, Number(el.value));
      pintar();
    });
  });
  ingreso.addEventListener('input', () => {
    tocado = true;
    if (origen) origen.hidden = true;
    if (origenMuestra) origenMuestra.hidden = true;
    pintar();
  });

  // El ingreso propuesto es la suma mensual del libro de fuentes (solo lectura). Si en el libro
  // quedan fuentes de muestra, la cifra se rotula como de muestra, no como dato de la persona.
  function proponer(s: Estado): void {
    if (tocado) return;
    const real = ingresoReal(s);
    const deMuestra = s.fuentes.some((f) => f.ejemplo && (Number(f.mensual) || 0) > 0);
    if (real > 0) ingreso!.value = num(real);
    if (origen) origen.hidden = !(real > 0 && !deMuestra);
    if (origenMuestra) origenMuestra.hidden = !(real > 0 && deMuestra);
    pintar();
  }
  proponer(leer());
  alCambiar(proponer);
}

// ---------- 3 · Años a la independencia ----------

function iniciarIndependencia(): void {
  const tasa = campo('i-tasa');
  const retorno = campo('i-retorno');
  const grafico = pieza('i-grafico');
  if (!tasa || !retorno) return;

  function pintar(): void {
    const s = limitar(Number(tasa!.value) || 0, Number(tasa!.min) || 5, Number(tasa!.max) || 95);
    const r = limitar(leerNumero(retorno!.value), 0, 30);
    const anios = aniosIndependencia(s, r);
    escribir('i-nota', notaIndependencia(r));
    const salida = pieza('i-tasa');
    if (salida) salida.innerHTML = `<span class="cifra">${pctFino(s)}</span> del ingreso`;
    tasa!.setAttribute('aria-valuetext', `${s} % del ingreso`);
    escribirCifra('i-anios', num(anios, 1, 1));
    escribir('i-retorno-t', pctFino(r, 2));
    if (grafico) {
      grafico.innerHTML = graficoIndependencia(s, r);
      grafico.setAttribute('aria-label', `Curva de años hasta la independencia según la tasa de ahorro. Con el ${s} %, ${num(anios, 1, 1)} años.`);
    }
  }
  tasa.addEventListener('input', pintar);
  retorno.addEventListener('input', pintar);
  pintar();
}

// ---------- 4 · Subir el precio ----------

function iniciarPrecio(): void {
  const ids = ['p-precio', 'p-coste', 'p-unidades', 'p-subida', 'p-pierde'];
  const campos = ids.map(campo);
  const grafico = pieza('p-grafico');
  if (campos.some((c) => !c)) return;
  const [precio, coste, unidades, subida, pierde] = campos as HTMLInputElement[];

  function pintar(): void {
    const r = subirPrecio({
      precio: importe(precio),
      coste: importe(coste),
      unidades: importe(unidades),
      subidaPct: limitar(leerNumero(subida.value), 0, 1000),
      pierdePct: limitar(leerNumero(pierde.value), 0, 100),
    });
    escribirCifra('p-cambio', conSigno(r.cambio));
    escribir('p-cambio-pct', r.cambioPct === null ? '' : `${conSigno(r.cambioPct, 1)} %`);
    if (grafico) {
      grafico.innerHTML = graficoPrecio(r);
      grafico.style.setProperty('--gp-canal', `${canalPrecio(r)}px`);
      grafico.setAttribute('aria-label', `Beneficio mensual: ahora ${num(r.antes)}, con el precio nuevo ${num(r.despues)}`);
    }
    escribir(
      'p-equilibrio',
      r.equilibrioPct === null
        ? 'El precio nuevo no cubre el coste por unidad: cada venta resta.'
        : r.precioNuevo <= importe(precio)
          ? 'Sin subida de precio no hay margen que ganar: cada cliente que se va es beneficio perdido.'
          : r.equilibrioPct > 100
            ? 'Hoy cada venta resta. Con el precio nuevo ganas más que ahora aunque pierdas clientes.'
            : `Equilibrio: ganas lo mismo que ahora si se va el ${pctFino(r.equilibrioPct, 1)} de los clientes. Por debajo de eso, ganas más.`,
    );
  }
  campos.forEach((c) => c!.addEventListener('input', pintar));
  pintar();
}

// ---------- 5 · Evaluador ----------

function iniciarEvaluador(): void {
  const grupos = Array.from(document.querySelectorAll<HTMLElement>('[data-pregunta]'));
  const escala = pieza('e-escala');
  if (!grupos.length) return;

  function pintar(): void {
    const respuestas = grupos.map((g) => Number(g.querySelector<HTMLInputElement>('input:checked')?.value) || 1);
    const e = evaluarFuente(respuestas);
    escribirCifra('e-total', String(e.total));
    escribir('e-titulo', TEXTO_NIVEL[e.nivel].titulo);
    escribir('e-texto', TEXTO_NIVEL[e.nivel].texto);
    escribir('e-floja', textoMasFloja(respuestas, e.masFloja));
    if (escala) {
      escala.innerHTML = escalaEvaluador(e.total);
      escala.setAttribute('aria-label', `${e.total} de ${e.maximo} puntos`);
    }
  }
  grupos.forEach((g) => g.addEventListener('change', pintar));
  pintar();
}

// ---------- Banderas rojas ----------

function iniciarBanderas(): void {
  const casillas = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="bandera"]'));
  const cuenta = pieza('b-n');
  const borrar = pieza('b-borrar') as HTMLButtonElement | null;
  if (!casillas.length) return;

  function pintar(): void {
    const n = casillas.filter((c) => c.checked).length;
    if (cuenta) {
      cuenta.textContent = String(n);
      cuenta.classList.toggle('sello', n > 0); // el sello rojo aparece con la primera bandera
    }
    escribir('b-veredicto', veredictoBanderas(n));
    if (borrar) borrar.disabled = n === 0;
  }
  casillas.forEach((c) => c.addEventListener('change', pintar));
  borrar?.addEventListener('click', () => {
    casillas.forEach((c) => { c.checked = false; });
    pintar();
    casillas[0]?.focus();
  });
  pintar();
}

iniciarCompuesto();
iniciarReparto();
iniciarIndependencia();
iniciarPrecio();
iniciarEvaluador();
iniciarBanderas();
document.documentElement.classList.add('listo');
