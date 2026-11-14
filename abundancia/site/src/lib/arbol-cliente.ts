// Cliente de la página Árbol: selección de sefirá, medidas en vivo, controles de cada
// sefirá, libro de fuentes editable y copia de los datos. Sin dependencias.

import {
  METAS, alCambiar, claveDia, exportar, fmt, guardar, importar, ingresoReal, leer, medidas, reiniciar, uid, ultimosDias,
  type Estado, type EstadoFuente, type Fuente, type Medida, type SefiraId, type TipoFuente,
} from './store';
import { ORDEN } from './sefirot';
import { deISO, esc, fechaCorta, fechaLarga, fino, leerNumero, nombreDia, pct } from './formato';
import { diasSVG, monedaEstadoSVG, ponerArco } from './moneda';
import { iniciarAvisoMuestra } from './muestra';

const hoy = new Date();
const $ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => raiz.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => Array.from(raiz.querySelectorAll<T>(sel));
const v = <T extends HTMLElement = HTMLElement>(nombre: string) => $<T>(`[data-v="${nombre}"]`);
const esSefira = (x: string): x is SefiraId => (ORDEN as string[]).includes(x);

const nodos = $$<HTMLButtonElement>('.nodo');
const NOMBRE = Object.fromEntries(nodos.map((b) => [b.dataset.id, b.dataset.nombre || ''])) as Record<SefiraId, string>;
const CUALIDAD = Object.fromEntries(nodos.map((b) => [b.dataset.id, b.dataset.cualidad || ''])) as Record<SefiraId, string>;

// ---------- Fecha ----------
const fecha = $('[data-fecha]');
if (fecha) {
  fecha.setAttribute('datetime', claveDia(hoy));
  fecha.textContent = fechaLarga(hoy);
}

// ---------- Selección de sefirá ----------
// Orden de preferencia: la del enlace (#jesed), la del día de la semana, Jésed.
function inicial(): SefiraId {
  const h = location.hash.slice(1);
  if (esSefira(h)) return h;
  const porDia = nodos.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.id;
  const delDia = $$('.det').find((a) => a.dataset.dia === nombreDia(hoy))?.dataset.det;
  return (delDia || porDia || 'jesed') as SefiraId;
}
let actual: SefiraId = inicial();

function elegir(id: SefiraId, recordar = true): void {
  actual = id;
  nodos.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  $$('.det').forEach((a) => { a.hidden = a.dataset.det !== id; });
  const e = v('elegida');
  if (e) e.textContent = NOMBRE[id];
  if (recordar) history.replaceState(null, '', `#${id}`);
}

nodos.forEach((b, i) => {
  b.addEventListener('click', () => elegir(b.dataset.id as SefiraId));
  // Flechas: recorren los diez nodos en el orden del Árbol, de Kéter a Maljut.
  b.addEventListener('keydown', (ev) => {
    const paso = ev.key === 'ArrowDown' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowUp' || ev.key === 'ArrowLeft' ? -1 : 0;
    if (!paso) return;
    ev.preventDefault();
    const otro = nodos[(i + paso + nodos.length) % nodos.length];
    otro.focus();
    elegir(otro.dataset.id as SefiraId);
  });
});
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (esSefira(h)) elegir(h, false);
});

// ---------- Medidas en vivo ----------
function resto(id: SefiraId, m: Medida, s: Estado): string {
  const n = Number(m.valor);
  switch (id) {
    case 'jojma': return n === 1 ? 'idea capturada' : 'ideas capturadas';
    case 'bina': return s.fuentes.length ? 'fuentes con próxima acción' : 'Añade tu primera fuente';
    case 'jesed': return 'donado este mes';
    case 'guevura': return 'de ahorro este mes';
    case 'tiferet': return 'índice general, de 0 a 100';
    case 'netsaj': return n === 1 ? 'día de racha' : 'días de racha';
    case 'hod': return n === 1 ? 'evidencia esta semana' : 'evidencias esta semana';
    case 'yesod': return n === 1 ? 'fuente que ya ingresa' : 'fuentes que ya ingresan';
    default: return m.detalle;
  }
}
function meta(id: SefiraId, s: Estado): string {
  switch (id) {
    case 'keter': return 'declaración y cifra con fecha';
    case 'jojma': return `meta ${METAS.ideas} ideas`;
    case 'bina': return 'todas las fuentes';
    case 'jesed': return `meta ${pct(METAS.donado)}`;
    case 'guevura': return `meta ${pct(METAS.ahorro)}`;
    case 'tiferet': return '100';
    case 'netsaj': return `meta ${METAS.constancia} días`;
    case 'hod': return `meta ${METAS.gratitud} a la semana`;
    case 'yesod': return `meta ${METAS.canales} fuentes`;
    default: return s.cifra ? `meta ${fmt(s.cifra)} al mes` : 'sin cifra';
  }
}

function pintarMedidas(s: Estado): Record<SefiraId, Medida> {
  const ms = medidas(s, hoy);
  for (const b of nodos) {
    const id = b.dataset.id as SefiraId;
    const m = ms[id];
    const valor = fino(m.valor);
    const frase = fino(m.detalle);
    const cifra = $('.nodo-v', b);
    if (cifra) {
      cifra.textContent = valor;
      cifra.classList.toggle('largo', valor.length > 5);
    }
    ponerArco(b, m.avance);
    b.setAttribute('aria-label', `${NOMBRE[id]}, ${CUALIDAD[id]}. ${frase}`);
    $$(`[data-frase="${id}"]`).forEach((el) => { el.textContent = frase; });

    const det = $(`[data-det="${id}"]`);
    if (!det) continue;
    $('[data-valor]', det)!.textContent = valor;
    $('[data-resto]', det)!.textContent = fino(resto(id, m, s));
    $<HTMLElement>('.regla-oro', det)!.style.width = `${m.avance * 100}%`;
    $('.regla', det)!.setAttribute('aria-label', `Avance hacia la meta: ${pct(m.avance * 100)}`);
    $('[data-hasta]', det)!.textContent = meta(id, s);
  }
  return ms;
}

// ---------- Controles de cada sefirá ----------
const campo = (f: HTMLFormElement, n: string) => f.elements.namedItem(n) as HTMLInputElement;
const poner = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null, valor: string) => {
  if (el && document.activeElement !== el && el.value !== valor) el.value = valor;
};
function avisar(f: HTMLElement, texto: string): void {
  const e = $('.campo-estado', f);
  if (!e) return;
  e.textContent = texto;
  window.setTimeout(() => { if (e.textContent === texto) e.textContent = ''; }, 2500);
}
const decimal = (n: number) => String(n).replace('.', ',');

function pintarControles(s: Estado, ms: Record<SefiraId, Medida>): void {
  const k = $<HTMLFormElement>('[data-form="keter"]');
  if (k) {
    poner(campo(k, 'declaracion'), s.declaracion);
    poner(campo(k, 'cifra'), s.cifra ? fmt(s.cifra) : '');
    poner(campo(k, 'fechaMeta'), s.fechaMeta);
  }
  const je = $<HTMLFormElement>('[data-form="jesed"]');
  if (je) poner(campo(je, 'valor'), decimal(s.donadoPct));
  const gu = $<HTMLFormElement>('[data-form="guevura"]');
  if (gu) poner(campo(gu, 'valor'), decimal(s.ahorroPct));

  const ideas = $('[data-lista="ideas"]');
  if (ideas) {
    ideas.innerHTML = s.ideas.length
      ? s.ideas.map((t, i) => `<li><span>${esc(t)}</span><button class="boton-texto" type="button" data-quitar-idea="${i}" aria-label="Quitar la idea: ${esc(t)}">Quitar</button></li>`).join('')
      : '<li class="lista-vacia">Aún no has capturado ideas.</li>';
  }

  const limite = new Date(hoy);
  limite.setDate(limite.getDate() - 6);
  const desde = claveDia(limite);
  const evid = $('[data-lista="evidencias"]');
  if (evid) {
    const semana = s.evidencias.filter((e) => e.fecha >= desde).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    evid.innerHTML = semana.length
      ? semana.map((e) => {
        const d = deISO(e.fecha);
        return `<li><span><span class="rotulo">${d ? fechaCorta(d) : ''}</span>${esc(e.texto)}</span><button class="boton-texto" type="button" data-quitar-evidencia="${esc(e.id)}" aria-label="Quitar la evidencia: ${esc(e.texto)}">Quitar</button></li>`;
      }).join('')
      : '<li class="lista-vacia">Aún no hay evidencias esta semana.</li>';
  }

  const dias = v('dias14');
  if (dias) {
    const ult = ultimosDias(s, 14, hoy);
    dias.innerHTML = diasSVG(ult);
    dias.setAttribute('role', 'img');
    dias.setAttribute('aria-label', `Ritual completado en ${ult.filter((d) => d.hechos >= 4).length} de los últimos 14 días`);
  }

  const desglose = v('desglose');
  if (desglose) {
    desglose.innerHTML = ORDEN.filter((id) => id !== 'tiferet').map((id) => {
      const p = ms[id].avance * 100;
      return `<li><span>${esc(NOMBRE[id])} <span class="texto-3">${esc(CUALIDAD[id])}</span></span>`
        + `<span class="regla regla-s" aria-hidden="true"><span class="regla-oro" style="width:${p}%"></span></span>`
        + `<span class="cifra">${Math.round(p)}</span></li>`;
    }).join('');
  }
}

$<HTMLFormElement>('[data-form="keter"]')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = ev.currentTarget as HTMLFormElement;
  guardar((s) => {
    s.declaracion = campo(f, 'declaracion').value.trim();
    s.cifra = Math.round(leerNumero(campo(f, 'cifra').value));
    s.fechaMeta = campo(f, 'fechaMeta').value;
  });
  avisar(f, 'Guardado');
});
(['jesed', 'guevura'] as const).forEach((id) => {
  $<HTMLFormElement>(`[data-form="${id}"]`)?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget as HTMLFormElement;
    const n = Math.min(100, leerNumero(campo(f, 'valor').value));
    campo(f, 'valor').blur();
    guardar((s) => { if (id === 'jesed') s.donadoPct = n; else s.ahorroPct = n; });
    avisar(f, 'Guardado');
  });
});
$<HTMLFormElement>('[data-form="jojma"]')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const c = campo(ev.currentTarget as HTMLFormElement, 'idea');
  const t = c.value.trim();
  if (!t) return;
  c.value = '';
  guardar((s) => { s.ideas.push(t); });
});
$<HTMLFormElement>('[data-form="hod"]')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const c = campo(ev.currentTarget as HTMLFormElement, 'texto');
  const t = c.value.trim();
  if (!t) return;
  c.value = '';
  guardar((s) => { s.evidencias.push({ id: uid(), fecha: claveDia(hoy), texto: t }); });
});
document.addEventListener('click', (ev) => {
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-quitar-idea], [data-quitar-evidencia]');
  if (!b) return;
  if (b.dataset.quitarIdea !== undefined) {
    const i = Number(b.dataset.quitarIdea);
    guardar((s) => { s.ideas.splice(i, 1); });
  } else {
    const id = b.dataset.quitarEvidencia;
    guardar((s) => { s.evidencias = s.evidencias.filter((e) => e.id !== id); });
  }
});

// ---------- Libro de fuentes ----------
const filas = v<HTMLTableSectionElement>('filas');
const plantilla = $<HTMLTemplateElement>('#fila-fuente');
type CampoFuente = 'nombre' | 'tipo' | 'estado' | 'mensual' | 'accion';
const celda = (tr: HTMLElement, c: CampoFuente) => $<HTMLInputElement>(`[data-campo="${c}"]`, tr)!;

// Alto automático de los campos de varias líneas donde el navegador aún no lo hace solo.
const autoAlto = !(window.CSS && CSS.supports('field-sizing', 'content'));
function ajustarAlto(el: HTMLElement): void {
  if (!autoAlto || el.tagName !== 'TEXTAREA') return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}
if (autoAlto) window.addEventListener('resize', () => $$('textarea.celda').forEach(ajustarAlto));

function ajustarMonto(el: HTMLInputElement): void {
  el.style.setProperty('--n', String(Math.max(5, el.value.length)));
}

function crearFila(f: Fuente): HTMLTableRowElement {
  const tr = plantilla!.content.firstElementChild!.cloneNode(true) as HTMLTableRowElement;
  tr.dataset.id = f.id;
  const cambiar = (c: CampoFuente) => {
    const el = celda(tr, c);
    guardar((s) => {
      const x = s.fuentes.find((y) => y.id === f.id);
      if (!x) return;
      if (c === 'mensual') x.mensual = Math.round(leerNumero(el.value));
      else if (c === 'tipo') x.tipo = el.value as TipoFuente;
      else if (c === 'estado') x.estado = el.value as EstadoFuente;
      else x[c] = el.value.replace(/\s+/g, ' ').trim();
      delete x.ejemplo; // una fuente editada ya es tuya: no se borra con los ejemplos
    });
  };
  (['nombre', 'tipo', 'estado', 'mensual', 'accion'] as const).forEach((c) => {
    const el = celda(tr, c);
    el.addEventListener('change', () => cambiar(c));
    el.addEventListener('input', () => ajustarAlto(el));
    // Intro confirma el campo (no añade saltos de línea en nombre ni en acción).
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && el.tagName !== 'SELECT') { ev.preventDefault(); el.blur(); }
    });
  });
  const monto = celda(tr, 'mensual');
  monto.addEventListener('focus', () => { monto.select(); });
  monto.addEventListener('input', () => ajustarMonto(monto));

  const confirma = $('.confirma', tr)!;
  const quitar = $<HTMLButtonElement>('[data-quitar]', tr)!;
  const accion = celda(tr, 'accion');
  const pedir = (si: boolean) => {
    confirma.hidden = !si;
    accion.hidden = si;
    quitar.hidden = si;
    tr.classList.toggle('quitando', si);
  };
  quitar.addEventListener('click', () => { pedir(true); $<HTMLButtonElement>('[data-no]', tr)!.focus(); });
  $('[data-no]', tr)!.addEventListener('click', () => { pedir(false); quitar.focus(); });
  $('[data-si]', tr)!.addEventListener('click', () => {
    guardar((s) => { s.fuentes = s.fuentes.filter((y) => y.id !== f.id); });
    v('anadir')?.focus();
  });
  return tr;
}

function pintarLibro(s: Estado): void {
  if (!filas || !plantilla) return;
  const ids = new Set(s.fuentes.map((f) => f.id));
  $$<HTMLTableRowElement>('tr', filas).forEach((tr) => { if (!ids.has(tr.dataset.id || '')) tr.remove(); });
  s.fuentes.forEach((f, i) => {
    let tr = $<HTMLTableRowElement>(`tr[data-id="${f.id}"]`, filas);
    if (!tr) tr = crearFila(f);
    if (filas.children[i] !== tr) filas.insertBefore(tr, filas.children[i] || null);
    poner(celda(tr, 'nombre'), f.nombre);
    poner(celda(tr, 'tipo'), f.tipo);
    poner(celda(tr, 'estado'), f.estado);
    poner(celda(tr, 'mensual'), fmt(f.mensual));
    poner(celda(tr, 'accion'), f.accion);
    ajustarMonto(celda(tr, 'mensual'));
    ajustarAlto(celda(tr, 'nombre'));
    ajustarAlto(celda(tr, 'accion'));
    const moneda = $('[data-moneda]', tr)!;
    if (moneda.dataset.estado !== f.estado) {
      moneda.dataset.estado = f.estado;
      moneda.innerHTML = monedaEstadoSVG(f.estado);
    }
    const nombre = f.nombre || 'fuente sin nombre';
    $('[data-quitar]', tr)!.setAttribute('aria-label', `Quitar ${nombre}`);
  });
  const n = s.fuentes.length;
  const etiqueta = $('#libro [data-etiqueta]');
  if (etiqueta) etiqueta.textContent = n === 1 ? '1 fuente' : `${n} fuentes`;
  const vacio = v('libro-vacio');
  if (vacio) vacio.hidden = n > 0;
  $('#libro table')?.classList.toggle('vacia', n === 0);
}

v('anadir')?.addEventListener('click', () => {
  const id = uid();
  guardar((s) => { s.fuentes.push({ id, nombre: '', tipo: 'Servicio', estado: 'idea', mensual: 0, accion: '' }); });
  $<HTMLElement>(`tr[data-id="${id}"] [data-campo="nombre"]`)?.focus();
});

// ---------- Medidor de meta ----------
function pintarMeta(s: Estado): void {
  const total = ingresoReal(s);
  const avance = s.cifra ? Math.min(1, total / s.cifra) : 0;
  const t = v('meta-total');
  if (t) t.textContent = fmt(total);
  const n = v('meta-nota');
  if (n) n.textContent = s.cifra ? `de ${fmt(s.cifra)} al mes` : 'al mes; aún no hay cifra';
  const p = v('meta-pct');
  if (p) p.textContent = pct(avance * 100);
  ponerArco(v('meta-moneda'), avance, `Moneda medidora: ${fmt(total)} de ${fmt(s.cifra)}, el ${pct(avance * 100)}`);
}

// ---------- Copia de los datos ----------
const estadoDatos = v('estado-datos');
const decir = (texto: string) => { if (estadoDatos) estadoDatos.textContent = texto; };

v('exportar')?.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([exportar()], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `shefa-${claveDia()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  decir(`Copia guardada como ${a.download}`);
});
v<HTMLInputElement>('importar')?.addEventListener('change', async (ev) => {
  const entrada = ev.currentTarget as HTMLInputElement;
  const archivo = entrada.files?.[0];
  if (!archivo) return;
  let ok = false;
  try {
    ok = importar(await archivo.text());
  } catch {
    ok = false;
  }
  entrada.value = '';
  decir(ok ? 'Datos importados' : 'Ese archivo no es una copia de Shefa. No se cambió nada.');
});
const confirma = v('confirma');
const botonReiniciar = v('reiniciar');
v('reiniciar')?.addEventListener('click', () => {
  if (confirma) confirma.hidden = false;
  decir('');
  v('no-reiniciar')?.focus();
});
v('no-reiniciar')?.addEventListener('click', () => {
  if (confirma) confirma.hidden = true;
  botonReiniciar?.focus();
});
v('si-reiniciar')?.addEventListener('click', () => {
  reiniciar();
  if (confirma) confirma.hidden = true;
  decir('Datos reiniciados: vuelves a ver la muestra');
  botonReiniciar?.focus();
});

// ---------- Arranque ----------
function pintar(s: Estado): void {
  const ms = pintarMedidas(s);
  pintarControles(s, ms);
  pintarLibro(s);
  pintarMeta(s);
}

elegir(actual, false);
pintar(leer());
alCambiar(pintar);
iniciarAvisoMuestra();
document.documentElement.classList.add('listo');
