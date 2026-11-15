// Cliente de la página Espacio: elección de palacio (puntero, teclado y #palacio-n),
// lista de comprobaciones guardada en store.espacio y puntuación en vivo.

import { alCambiar, guardar, leer, type Estado } from './store';
import { ponerArco } from './moneda';
import { pct } from './formato';
import { LO_SHU, posicion } from './loshu';

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));
const v = (nombre: string) => $(`[data-v="${nombre}"]`);

// ---------- Palacios ----------

const celdas = $$<HTMLButtonElement>('[data-palacio]');
const detalles = $$('[data-det]');
const rotuloDetalle = $('#detalle [data-etiqueta]');

function elegir(n: number, anotar = true): void {
  const celda = celdas.find((c) => Number(c.dataset.palacio) === n);
  if (!celda) return;
  celdas.forEach((c) => c.setAttribute('aria-pressed', c === celda ? 'true' : 'false'));
  detalles.forEach((d) => { d.hidden = Number(d.dataset.det) !== n; });
  const area = celda.dataset.area ?? '';
  if (rotuloDetalle) rotuloDetalle.textContent = area;
  const enlace = v('elegido');
  if (enlace) enlace.textContent = area;
  if (anotar) {
    try {
      history.replaceState(null, '', `#palacio-${n}`);
    } catch {
      /* sin historial: la elección vale para esta visita */
    }
  }
}

function delHash(): number | null {
  const m = /^#palacio-([1-9])$/.exec(location.hash);
  return m ? Number(m[1]) : null;
}

celdas.forEach((c) => {
  c.addEventListener('click', () => elegir(Number(c.dataset.palacio)));
  // Flechas: el foco se mueve por el cuadrado como por una retícula.
  c.addEventListener('keydown', (e) => {
    const paso: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const d = paso[e.key];
    if (!d) return;
    const p = posicion(Number(c.dataset.palacio));
    const fila = p.fila + d[0];
    const col = p.col + d[1];
    if (fila < 0 || fila > 2 || col < 0 || col > 2) return;
    e.preventDefault();
    celdas.find((x) => Number(x.dataset.palacio) === LO_SHU[fila][col])?.focus();
  });
});
window.addEventListener('hashchange', () => {
  const n = delHash();
  if (n) elegir(n, false);
});
const inicial = delHash();
if (inicial) elegir(inicial, false);

// ---------- Lista y puntuación ----------

const casillas = $$<HTMLInputElement>('[data-item]');
const total = casillas.reduce((t, c) => t + Number(c.dataset.peso), 0);

function pintar(s: Estado): void {
  let puntos = 0;
  let hechas = 0;
  let siguiente: HTMLInputElement | null = null;
  casillas.forEach((c) => {
    const hecho = s.espacio[c.dataset.item as string] === true;
    c.checked = hecho;
    c.closest('.esp-it')?.classList.toggle('hecho', hecho);
    if (hecho) {
      puntos += Number(c.dataset.peso);
      hechas++;
    } else if (!siguiente || Number(c.dataset.peso) > Number(siguiente.dataset.peso)) {
      siguiente = c;
    }
  });
  const avance = total ? puntos / total : 0;
  const frase = `${puntos} de ${total} puntos`;

  const cifra = v('punt-pct');
  if (cifra) cifra.textContent = pct(avance * 100);
  const lineaPuntos = v('punt-puntos');
  if (lineaPuntos) lineaPuntos.textContent = frase;
  const lineaHechas = v('punt-hechas');
  if (lineaHechas) lineaHechas.textContent = `${hechas} de ${casillas.length} comprobaciones`;
  ponerArco(v('punt-moneda'), avance, `Puntuación del espacio: ${frase}`);

  const sig = v('sig') as HTMLAnchorElement | null;
  const sigRotulo = v('sig-rotulo');
  if (sig && sigRotulo) {
    const pendiente = siguiente as HTMLInputElement | null;
    if (pendiente) {
      sigRotulo.textContent = 'Siguiente paso';
      sig.textContent = pendiente.dataset.titulo ?? '';
      sig.setAttribute('href', `#it-${pendiente.dataset.item}`);
      sig.hidden = false;
    } else {
      sigRotulo.textContent = 'Lista completa. Repásala cada semana.';
      sig.hidden = true;
    }
  }
  const vaciar = v('vaciar') as HTMLButtonElement | null;
  const confirma = v('confirma');
  if (vaciar && confirma) {
    if (!hechas) confirma.hidden = true;
    vaciar.hidden = hechas === 0 || !confirma.hidden;
  }
}

casillas.forEach((c) => {
  c.addEventListener('change', () => {
    const id = c.dataset.item as string;
    const s = guardar((e) => {
      if (c.checked) e.espacio[id] = true;
      else delete e.espacio[id];
    });
    const puntos = casillas.reduce((t, x) => t + (s.espacio[x.dataset.item as string] ? Number(x.dataset.peso) : 0), 0);
    const estado = v('punt-estado');
    if (estado) estado.textContent = `Puntuación: ${puntos} de ${total} puntos.`;
  });
});

// Desmarcar todo, con confirmación en la página.
const vaciar = v('vaciar') as HTMLButtonElement | null;
const confirma = v('confirma');
vaciar?.addEventListener('click', () => {
  if (!confirma) return;
  confirma.hidden = false;
  vaciar.hidden = true;
  (v('no-vaciar') as HTMLButtonElement | null)?.focus();
});
v('no-vaciar')?.addEventListener('click', () => {
  if (!confirma || !vaciar) return;
  confirma.hidden = true;
  vaciar.hidden = false;
  vaciar.focus();
});
v('si-vaciar')?.addEventListener('click', () => {
  if (confirma) confirma.hidden = true;
  guardar((e) => { e.espacio = {}; });
  const estado = v('punt-estado');
  if (estado) estado.textContent = 'Lista desmarcada.';
  casillas[0]?.focus();
});

// Razones: abiertas en escritorio; en la tira, cerradas para que la lista se recorra de un vistazo.
const botonesRazon = $$<HTMLButtonElement>('.esp-it-ver');
const botonRazones = v('razones') as HTMLButtonElement | null;
const panelDe = (b: HTMLButtonElement) => document.getElementById(b.getAttribute('aria-controls') ?? '');
function ponerRazon(b: HTMLButtonElement, abierta: boolean): void {
  b.setAttribute('aria-expanded', abierta ? 'true' : 'false');
  const panel = panelDe(b);
  if (panel) panel.hidden = !abierta;
}
function anotarRazones(): void {
  const todas = botonesRazon.every((b) => b.getAttribute('aria-expanded') === 'true');
  botonRazones?.setAttribute('aria-pressed', todas ? 'true' : 'false');
}
function ponerRazones(abiertas: boolean): void {
  botonesRazon.forEach((b) => ponerRazon(b, abiertas));
  anotarRazones();
}
if (window.matchMedia('(max-width: 959px)').matches) ponerRazones(false);
botonRazones?.addEventListener('click', () => ponerRazones(botonRazones.getAttribute('aria-pressed') !== 'true'));
botonesRazon.forEach((b) => b.addEventListener('click', () => {
  ponerRazon(b, b.getAttribute('aria-expanded') !== 'true');
  anotarRazones();
}));

// Si se llega con el ancla de una comprobación, se abre su razón.
function abrirAncla(): void {
  const m = /^#it-[\w-]+$/.exec(location.hash);
  const li = m ? document.getElementById(location.hash.slice(1)) : null;
  const b = li?.querySelector<HTMLButtonElement>('.esp-it-ver');
  if (b) {
    ponerRazon(b, true);
    anotarRazones();
  }
}
window.addEventListener('hashchange', abrirAncla);
abrirAncla();

pintar(leer());
alCambiar(pintar);
document.documentElement.classList.add('listo');
