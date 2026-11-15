// Cliente de la videoteca: reproductor que solo se crea al pulsar, ruta de inicio, filtros,
// búsqueda, cuentas y videos vistos. Sin dependencias. La lista ya viene pintada: aquí solo
// se cambian atributos (hidden, aria-pressed, data-visto-si).

import { PERMISOS_REPRODUCTOR, incrustado, normalizar } from './videoteca';
import { alCambiarVistos, leerVistos, marcarVisto } from './videoteca-vistos';
import { fmt } from './store';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => raiz.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => Array.from(raiz.querySelectorAll<T>(sel));
const calmado = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

// ---------- Reproductor: un iframe a youtube-nocookie.com, solo tras pulsar ----------
let abierto: { marco: HTMLElement; boton: HTMLButtonElement; caja: HTMLElement } | null = null;

function cerrar(devolverFoco = false): void {
  if (!abierto) return;
  const { marco, boton, caja } = abierto;
  abierto = null;
  caja.remove();
  boton.hidden = false;
  marco.closest('.vt')?.classList.remove('vt-activo');
  if (devolverFoco) boton.focus();
}

function reproducir(boton: HTMLButtonElement): void {
  const marco = boton.closest<HTMLElement>('[data-marco]');
  const id = boton.dataset.ver;
  if (!marco || !id) return;
  cerrar();

  const caja = document.createElement('div');
  caja.className = 'vt-reproductor';
  const iframe = document.createElement('iframe');
  iframe.src = incrustado(id);
  iframe.title = boton.dataset.titulo || 'Video de YouTube';
  iframe.allow = PERMISOS_REPRODUCTOR;
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  const pie = document.createElement('p');
  const salir = document.createElement('button');
  salir.type = 'button';
  salir.className = 'boton-texto';
  salir.textContent = 'Cerrar el reproductor';
  salir.addEventListener('click', () => cerrar(true));
  pie.append(salir);
  caja.append(iframe, pie);

  boton.hidden = true;
  marco.append(caja);
  marco.closest('.vt')?.classList.add('vt-activo');
  abierto = { marco, boton, caja };
  iframe.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const boton = (e.target as Element).closest<HTMLButtonElement>('[data-ver]');
  if (boton) reproducir(boton);
});

// ---------- Biblioteca: fichas ----------
interface Ficha {
  li: HTMLElement;
  el: HTMLElement;
  id: string;
  categoria: string;
  idioma: string;
  maestro: string;
  texto: string;
}
const fichas: Ficha[] = $$('.vt[data-video]').map((el) => ({
  li: el.closest<HTMLElement>('li') ?? el,
  el,
  id: el.dataset.video || '',
  categoria: el.dataset.categoria || '',
  idioma: el.dataset.idioma || '',
  maestro: el.dataset.maestro || '',
  texto: normalizar($$('[data-busca]', el).map((x) => x.textContent || '').join(' ')),
}));

// ---------- Filtros ----------
type Faceta = 'categoria' | 'idioma' | 'maestro';
const filtro = { q: '', categoria: '', idioma: '', maestro: '', ocultar: false };

const form = $<HTMLFormElement>('[data-filtros]');
const campoQ = $<HTMLInputElement>('#vt-q');
const campoMaestro = $<HTMLSelectElement>('#vt-maestro');
const campoOcultar = form ? $<HTMLInputElement>('input[name="ocultar"]', form) : null;
const opciones = $$<HTMLButtonElement>('.vt-op');
const estado = $('[data-estado]');
const limpiar = $<HTMLButtonElement>('[data-limpiar]');
const vacio = $('[data-vacio]');
const lista = $('[data-lista]');
const nVistos = $('[data-n-vistos]');

function pasa(f: Ficha, vistos: Set<string>, salvo?: Faceta | 'ocultar'): boolean {
  if ('caido' in f.el.dataset) return false;
  if (filtro.q && !filtro.q.split(' ').every((p) => f.texto.includes(p))) return false;
  if (salvo !== 'categoria' && filtro.categoria && f.categoria !== filtro.categoria) return false;
  if (salvo !== 'idioma' && filtro.idioma && f.idioma !== filtro.idioma) return false;
  if (salvo !== 'maestro' && filtro.maestro && f.maestro !== filtro.maestro) return false;
  if (salvo !== 'ocultar' && filtro.ocultar && vistos.has(f.id)) return false;
  return true;
}

function aplicar(): void {
  const vistos = leerVistos();
  const vivas = fichas.filter((f) => !('caido' in f.el.dataset));
  const total = vivas.length;

  // Si el foco está en una ficha que va a ocultarse, pasa a la siguiente que queda.
  const conFoco = fichas.find((f) => f.li.contains(document.activeElement));
  let n = 0;
  fichas.forEach((f) => {
    const ver = pasa(f, vistos);
    if (!ver && abierto && f.el.contains(abierto.marco)) cerrar();
    f.li.hidden = !ver;
    if (ver) n++;
  });
  if (conFoco && conFoco.li.hidden) {
    const i = fichas.indexOf(conFoco);
    const otra = fichas.slice(i + 1).find((f) => !f.li.hidden) ?? fichas.slice(0, i).reverse().find((f) => !f.li.hidden);
    (otra ? $('[data-visto]', otra.el) : campoOcultar)?.focus();
  }

  // Cuentas de cada opción: cuántos quedarían con esa opción y el resto de filtros.
  const cuenta = (faceta: Faceta, valor: string) =>
    fichas.filter((f) => pasa(f, vistos, faceta) && (!valor || f[faceta] === valor)).length;
  opciones.forEach((b) => {
    const faceta = b.dataset.filtro as Faceta;
    const valor = b.dataset.valor || '';
    const c = cuenta(faceta, valor);
    const cifra = $('[data-n]', b);
    if (cifra) cifra.textContent = fmt(c);
    b.setAttribute('aria-pressed', String(filtro[faceta] === valor));
    b.classList.toggle('vt-op-cero', c === 0 && filtro[faceta] !== valor);
  });
  if (campoMaestro) {
    Array.from(campoMaestro.options).forEach((o) => {
      if (!o.value) return;
      const c = cuenta('maestro', o.value);
      o.textContent = `${o.dataset.nombre ?? o.value} (${fmt(c)})`;
      o.disabled = c === 0 && filtro.maestro !== o.value;
    });
  }

  // Estado y vacío
  const activo = !!(filtro.q || filtro.categoria || filtro.idioma || filtro.maestro || filtro.ocultar);
  if (estado) {
    estado.textContent = n === total
      ? `Se muestran los ${fmt(total)} videos.`
      : `${plural(n, 'Se muestra', 'Se muestran')} ${fmt(n)} de ${fmt(total)} videos.`;
  }
  if (limpiar) limpiar.hidden = !activo;
  if (lista) lista.hidden = n === 0;
  if (vacio) {
    vacio.hidden = n > 0;
    if (n === 0) {
      const sinOcultar = fichas.filter((f) => pasa(f, vistos, 'ocultar')).length;
      const porVistos = filtro.ocultar && sinOcultar > 0;
      const titulo = $('[data-vacio-titulo]', vacio);
      const nota = $('[data-vacio-nota]', vacio);
      const boton = $<HTMLButtonElement>('[data-vacio-boton]', vacio);
      if (titulo) titulo.textContent = porVistos ? 'Ya has visto todo lo que hay aquí.' : 'Ningún video coincide con lo que buscas.';
      if (nota) {
        nota.textContent = porVistos
          ? `${plural(sinOcultar, 'Hay 1 video visto oculto', `Hay ${fmt(sinOcultar)} videos vistos ocultos`)} con estos filtros.`
          : 'Prueba con otra palabra o quita algún filtro.';
      }
      if (boton) {
        boton.textContent = porVistos ? 'Mostrar los vistos' : 'Quitar filtros';
        boton.dataset.accion = porVistos ? 'vistos' : 'todo';
      }
    }
  }
}

function quitarFiltros(): void {
  filtro.q = '';
  filtro.categoria = '';
  filtro.idioma = '';
  filtro.maestro = '';
  filtro.ocultar = false;
  if (campoQ) campoQ.value = '';
  if (campoMaestro) campoMaestro.value = '';
  if (campoOcultar) campoOcultar.checked = false;
  aplicar();
}

form?.addEventListener('submit', (e) => e.preventDefault());
campoQ?.addEventListener('input', () => { filtro.q = normalizar(campoQ.value); aplicar(); });
campoMaestro?.addEventListener('change', () => { filtro.maestro = campoMaestro.value; aplicar(); });
campoOcultar?.addEventListener('change', () => { filtro.ocultar = campoOcultar.checked; aplicar(); });
opciones.forEach((b) => b.addEventListener('click', () => {
  filtro[b.dataset.filtro as Faceta] = b.dataset.valor || '';
  aplicar();
}));
limpiar?.addEventListener('click', () => { quitarFiltros(); campoQ?.focus(); });
$('[data-vacio-boton]')?.addEventListener('click', (e) => {
  if ((e.currentTarget as HTMLElement).dataset.accion === 'vistos') {
    filtro.ocultar = false;
    if (campoOcultar) campoOcultar.checked = false;
    aplicar();
    campoOcultar?.focus();
  } else {
    quitarFiltros();
    campoQ?.focus();
  }
});

// Las barras del palacio «Por categoría» filtran la biblioteca y llevan a ella.
const tituloBib = $('#h-biblioteca');
$$<HTMLButtonElement>('[data-ir-categoria]').forEach((b) => b.addEventListener('click', () => {
  quitarFiltros();
  filtro.categoria = b.dataset.irCategoria || '';
  aplicar();
  $('#biblioteca')?.scrollIntoView({ behavior: calmado() ? 'auto' : 'smooth', block: 'start' });
  tituloBib?.focus({ preventScroll: true });
}));

// ---------- Miniaturas ----------
// Si la miniatura no existe, el video ya no está en YouTube: la ficha se retira. Pero si no
// carga ninguna (sin conexión o imágenes bloqueadas), las fichas se quedan con un marco vacío.
let algunaCargo = false;
const enEspera = new Set<Ficha>();
const fichaDe = (img: HTMLImageElement) => fichas.find((f) => f.el.contains(img));

function retirar(f: Ficha): void {
  f.el.dataset.caido = '';
  aplicar();
}
function miniCaida(img: HTMLImageElement): void {
  img.dataset.caida = '';
  const f = fichaDe(img);
  if (!f || navigator.onLine === false) return;
  if (algunaCargo) retirar(f);
  else enEspera.add(f);
}
function miniCargada(img: HTMLImageElement): void {
  // YouTube responde con un marcador de 120 × 90 cuando la miniatura no existe.
  if (img.naturalWidth <= 120) {
    if (img.hasAttribute('srcset')) {
      // Falta la miniatura grande: se queda con la de 320 px.
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      return;
    }
    miniCaida(img);
    return;
  }
  delete img.dataset.caida;
  if (!algunaCargo) {
    algunaCargo = true;
    enEspera.forEach(retirar);
    enEspera.clear();
  }
}
$$<HTMLImageElement>('img[data-mini]').forEach((img) => {
  img.addEventListener('load', () => miniCargada(img));
  img.addEventListener('error', () => miniCaida(img));
  if (!img.complete) return;
  if (img.naturalWidth > 0) {
    miniCargada(img);
  } else {
    // Terminó sin imagen antes de que este código escuchara: se comprueba con una carga aparte,
    // por si el navegador da por «completa» una imagen perezosa que aún no ha pedido.
    const prueba = new Image();
    prueba.addEventListener('error', () => miniCaida(img));
    prueba.src = img.src;
  }
});

// ---------- Ruta de inicio ----------
const pasos = $$('.vt-paso');
const botonesRuta = $$<HTMLButtonElement>('[data-elegir]');
const escena = $('#ruta');
const rotuloEscena = escena ? $('[data-etiqueta]', escena) : null;
const orden = $('.vt-orden');
const rotuloOrden = orden ? $('[data-etiqueta]', orden) : null;
let paso = 0;

function elegir(i: number, alElegir = false): void {
  const n = pasos.length;
  if (!n) return;
  if (abierto && abierto.marco.closest('.vt-paso')) cerrar();
  paso = ((i % n) + n) % n;
  pasos.forEach((p, j) => { p.hidden = j !== paso; });
  botonesRuta.forEach((b, j) => {
    b.setAttribute('aria-pressed', String(j === paso));
    const cifra = $('.vt-ruta-n', b);
    cifra?.classList.toggle('sello', j === paso);
    cifra?.classList.toggle('sello-s', j === paso);
  });
  if (rotuloEscena) rotuloEscena.textContent = `Paso ${paso + 1} de ${n}`;
  // En la tira de una columna el reproductor queda arriba: se lleva la vista hasta él.
  if (alElegir && escena) {
    const r = escena.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.5) {
      escena.scrollIntoView({ behavior: calmado() ? 'auto' : 'smooth', block: 'start' });
    }
  }
}
botonesRuta.forEach((b, j) => b.addEventListener('click', () => elegir(j, true)));
$$<HTMLButtonElement>('[data-ir]').forEach((b) => b.addEventListener('click', () => elegir(paso + Number(b.dataset.ir))));

// ---------- Vistos ----------
function pintarVistos(vistos: Set<string>): void {
  $$<HTMLInputElement>('input[data-visto]').forEach((c) => { c.checked = vistos.has(c.dataset.visto || ''); });
  fichas.forEach((f) => f.el.toggleAttribute('data-visto-si', vistos.has(f.id)));

  const enRuta = botonesRuta.filter((b) => vistos.has(b.dataset.video || '')).length;
  botonesRuta.forEach((b) => {
    const marca = $('[data-marca-visto]', b);
    if (marca) marca.hidden = !vistos.has(b.dataset.video || '');
  });
  const n = botonesRuta.length;
  if (rotuloOrden) rotuloOrden.textContent = `${enRuta} de ${n} vistos`;
  const medidor = $('[data-ruta-medidor]');
  if (medidor && n) {
    const oro = $('.regla-oro', medidor);
    if (oro) oro.style.width = `${(enRuta / n) * 100}%`;
    $('.regla', medidor)?.setAttribute('aria-label', `Videos vistos de la ruta: ${enRuta} de ${n}`);
  }

  const enBiblioteca = fichas.filter((f) => vistos.has(f.id) && !('caido' in f.el.dataset)).length;
  if (nVistos) {
    nVistos.textContent = enBiblioteca
      ? `${fmt(enBiblioteca)} ${plural(enBiblioteca, 'visto', 'vistos')}`
      : 'Ninguno visto';
  }
  aplicar();
}

document.addEventListener('change', (e) => {
  const c = (e.target as Element).closest<HTMLInputElement>('input[data-visto]');
  if (c) marcarVisto(c.dataset.visto || '', c.checked);
});

// La ruta se abre en el primer paso que aún no has visto.
const vistosAhora = leerVistos();
const primero = botonesRuta.findIndex((b) => !vistosAhora.has(b.dataset.video || ''));
elegir(primero < 0 ? 0 : primero);
pintarVistos(vistosAhora);
alCambiarVistos(pintarVistos);
document.documentElement.classList.add('listo');
