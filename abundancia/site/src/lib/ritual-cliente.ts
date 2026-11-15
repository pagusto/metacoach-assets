// Cliente de la página Ritual: sesión y paso visibles, respiración, relojes, campos que se
// guardan solos, lista de pasos, constancia y revisión semanal. Sin dependencias.

import {
  METAS, PASOS_RITUAL, alCambiar, claveDia, fmt, guardar, hechosEl, ingresoReal, leer, racha, uid, ultimosDias,
  type Estado,
} from './store';
import { MESES, deISO, esc, fechaLarga, frases, leerNumero, pct } from './formato';
import { diasSVG, ponerArco } from './moneda';
import { iniciarAvisoMuestra } from './muestra';
import {
  MIN_BLOQUE, MIN_VISUALIZAR, NOCHE, RESPIRA, SESIONES, anotarDia, anotarSemana, claveSemana, dinero, frasePlan, hora,
  marcarPaso, notaDia, notaSemana, pasoHecho, reloj,
  type NotaDia, type NotaSemana, type PlanHoy, type SesionId,
} from './ritual';

const hoy = new Date();
const dia = claveDia(hoy);
const semana = claveSemana(hoy);

const $ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => raiz.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => Array.from(raiz.querySelectorAll<T>(sel));
const v = <T extends HTMLElement = HTMLElement>(nombre: string) => $<T>(`[data-v="${nombre}"]`);
const texto = (nombre: string, t: string) => { const el = v(nombre); if (el && el.textContent !== t) el.textContent = t; };
type Campo = HTMLInputElement | HTMLTextAreaElement;
/** Escribe en un campo sin pisar el que tiene el foco. */
const poner = (el: Campo | null, valor: string) => {
  if (el && document.activeElement !== el && el.value !== valor) el.value = valor;
};
const esSesion = (x: string): x is SesionId => x === 'manana' || x === 'noche';
const clave = (s: SesionId, i: number) => `${s}:${i}`;
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Mueve el oro de un medidor; solo toca el DOM si el valor cambia. */
const anchoRegla = (raiz: HTMLElement | null, valor: number, etiqueta: string) => {
  const oro = raiz?.querySelector<HTMLElement>('.regla-oro');
  const ancho = `${Math.round(Math.max(0, Math.min(1, valor || 0)) * 1000) / 10}%`;
  if (oro && oro.style.width !== ancho) oro.style.width = ancho;
  const regla = raiz?.querySelector('.regla');
  if (regla && regla.getAttribute('aria-label') !== etiqueta) regla.setAttribute('aria-label', etiqueta);
};

// ---------- Fecha ----------
const fecha = $('[data-fecha]');
if (fecha) {
  fecha.setAttribute('datetime', dia);
  fecha.textContent = fechaLarga(hoy);
}

// ---------- Sesión y paso ----------
function sesionInicial(): SesionId {
  const h = location.hash.slice(1);
  if (esSesion(h)) return h;
  return hoy.getHours() >= 18 ? 'noche' : 'manana';
}
function primerPendiente(s: Estado, id: SesionId): number {
  const n = SESIONES[id].pasos.length;
  for (let i = 0; i < n; i++) if (!pasoHecho(s, dia, id, i)) return i;
  return n - 1;
}

let sesion: SesionId = sesionInicial();
const paso: Record<SesionId, number> = {
  manana: primerPendiente(leer(), 'manana'),
  noche: primerPendiente(leer(), 'noche'),
};

const paneles = $$('[data-panel]');
const porques = $$('[data-porque]');
const botonesSesion = $$<HTMLButtonElement>('[data-sesion]');
const navAnterior = $<HTMLButtonElement>('[data-nav="anterior"]');
const navSaltar = $<HTMLButtonElement>('[data-nav="saltar"]');
const navSiguiente = $<HTMLButtonElement>('[data-nav="siguiente"]');

function mostrar(enfocar = false): void {
  const actual = clave(sesion, paso[sesion]);
  const n = SESIONES[sesion].pasos.length;
  const ultimo = paso[sesion] === n - 1;
  paneles.forEach((p) => { p.hidden = p.dataset.panel !== actual; });
  porques.forEach((p) => { p.hidden = p.dataset.porque !== actual; });
  botonesSesion.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sesion === sesion)));
  $$('[data-lista]').forEach((l) => { l.hidden = l.dataset.lista !== sesion; });
  $$<HTMLButtonElement>('[data-ir]').forEach((b) => {
    if (b.dataset.ir === actual) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  });
  const etiqueta = $('#sesion [data-etiqueta]');
  if (etiqueta) etiqueta.textContent = SESIONES[sesion].nombre;

  if (navAnterior) navAnterior.disabled = paso[sesion] === 0;
  // El último paso de la mañana es el bloque: lo cierra su propio reloj, no «Siguiente».
  const sinSiguiente = ultimo && sesion === 'manana';
  if (navSiguiente) {
    navSiguiente.hidden = sinSiguiente;
    navSiguiente.textContent = ultimo ? 'Terminar' : 'Siguiente';
  }
  if (navSaltar) navSaltar.hidden = ultimo;
  texto('nav-estado', '');
  pintarLista(leer());
  if (enfocar) $(`[data-panel="${actual}"] .rt-titulo`)?.focus();
}

function ir(i: number, enfocar = true): void {
  const n = SESIONES[sesion].pasos.length;
  paso[sesion] = Math.max(0, Math.min(n - 1, i));
  mostrar(enfocar);
}

botonesSesion.forEach((b) => b.addEventListener('click', () => {
  const id = b.dataset.sesion || '';
  if (!esSesion(id) || id === sesion) return;
  sesion = id;
  history.replaceState(null, '', `#${id}`);
  mostrar();
}));
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (esSesion(h) && h !== sesion) { sesion = h; mostrar(); }
});

navAnterior?.addEventListener('click', () => ir(paso[sesion] - 1));
navSaltar?.addEventListener('click', () => ir(paso[sesion] + 1));
navSiguiente?.addEventListener('click', () => {
  const i = paso[sesion];
  const n = SESIONES[sesion].pasos.length;
  marcarPaso(dia, sesion, i, true);
  if (i < n - 1) { ir(i + 1); return; }
  const s = leer();
  const hechos = NOCHE.filter((_, j) => pasoHecho(s, dia, 'noche', j)).length;
  texto('nav-estado', hechos === n ? 'Cierre de hoy completo. Hasta mañana.' : `Cierre de hoy: ${hechos} de ${n} pasos.`);
});

// Lista de pasos: la casilla marca o desmarca; el nombre abre el paso.
$$<HTMLInputElement>('[data-hecho]').forEach((c) => c.addEventListener('change', () => {
  const [id, i] = (c.dataset.hecho || '').split(':');
  if (!esSesion(id)) return;
  const p = SESIONES[id].pasos[Number(i)];
  const hecho = c.checked;      // se lee antes de guardar: al guardar se repinta la casilla
  // Al desmarcar el bloque se pone su reloj a cero, para que no vuelva a marcarse solo.
  if (p?.id === 'bloque' && !hecho) anotarDia(dia, (n) => { delete n.bloque; });
  marcarPaso(dia, id, Number(i), hecho);
}));
$$<HTMLButtonElement>('[data-ir]').forEach((b) => b.addEventListener('click', () => {
  const [id, i] = (b.dataset.ir || '').split(':');
  if (!esSesion(id)) return;
  sesion = id;
  ir(Number(i));
}));

function pintarLista(s: Estado): void {
  for (const id of ['manana', 'noche'] as const) {
    SESIONES[id].pasos.forEach((_, i) => {
      const hecho = pasoHecho(s, dia, id, i);
      const c = $<HTMLInputElement>(`[data-hecho="${clave(id, i)}"]`);
      if (c) c.checked = hecho;
      $(`[data-fila="${clave(id, i)}"]`)?.classList.toggle('hecho', hecho);
      $$(`[data-seg="${clave(id, i)}"]`).forEach((seg) => seg.classList.toggle('hecho', hecho));
    });
  }
  const pasos = SESIONES[sesion].pasos;
  const hechos = pasos.filter((_, i) => pasoHecho(s, dia, sesion, i)).length;
  const etiqueta = $('.rt-lista [data-etiqueta]');
  if (etiqueta) etiqueta.textContent = `${hechos} de ${pasos.length}`;
}

// ---------- 1 · Respirar ----------
const CICLO = RESPIRA.inhala + RESPIRA.exhala;
const moneda = v('respira-moneda');
const botonRespira = v<HTMLButtonElement>('respira-boton');
let respiraInicio = 0;      // 0: parado
let respiraFase = '';

function respiraParar(completo: boolean): void {
  respiraInicio = 0;
  respiraFase = '';
  moneda?.removeAttribute('data-fase');
  texto('respira-senal', completo ? 'Hecho' : 'Inhala');
  texto('respira-seg', completo ? '0' : String(RESPIRA.inhala));
  texto('respira-ciclo', completo ? `${RESPIRA.ciclos} ciclos completos` : `Ciclo 1 de ${RESPIRA.ciclos}`);
  if (!completo) ponerArco(moneda, 0);
  if (botonRespira) botonRespira.textContent = completo ? 'Repetir' : 'Empezar';
}

function respiraTic(): void {
  if (!respiraInicio) return;
  const t = (Date.now() - respiraInicio) / 1000;
  if (t >= CICLO * RESPIRA.ciclos) {
    ponerArco(moneda, 1);
    respiraParar(true);
    return;
  }
  const ciclo = Math.floor(t / CICLO);
  const enCiclo = t - ciclo * CICLO;
  const fase = enCiclo < RESPIRA.inhala ? 'inhala' : 'exhala';
  const resta = fase === 'inhala' ? RESPIRA.inhala - enCiclo : CICLO - enCiclo;
  if (fase !== respiraFase) {
    respiraFase = fase;
    if (moneda && !sinMovimiento()) moneda.dataset.fase = fase;
    texto('respira-senal', fase === 'inhala' ? 'Inhala' : 'Exhala');
    ponerArco(moneda, ciclo / RESPIRA.ciclos);
  }
  texto('respira-seg', String(Math.ceil(resta)));
  texto('respira-ciclo', `Ciclo ${ciclo + 1} de ${RESPIRA.ciclos}`);
}

botonRespira?.addEventListener('click', () => {
  if (respiraInicio) { respiraParar(false); return; }
  ponerArco(moneda, 0);
  respiraInicio = Date.now();
  respiraFase = '';
  botonRespira.textContent = 'Detener';
  respiraTic();
});

// ---------- 3 · Visualizar: reloj de cinco minutos ----------
const VIS_MS = MIN_VISUALIZAR * 60000;
const botonVis = v<HTMLButtonElement>('vis-boton');
const reiniciarVis = v<HTMLButtonElement>('vis-reiniciar');
let visFin = 0;             // marca de tiempo en la que acaba (en marcha)
let visResta = VIS_MS;      // lo que queda (en pausa)

function visPintar(): void {
  const resta = visFin ? Math.max(0, visFin - Date.now()) : visResta;
  texto('vis-tiempo', reloj(resta / 1000));
  const avance = 1 - resta / VIS_MS;
  anchoRegla(v('vis-regla'), avance, `Tiempo transcurrido: ${pct(avance * 100)}`);
  if (botonVis) botonVis.textContent = visFin ? 'Pausar' : resta === 0 ? 'Repetir' : resta < VIS_MS ? 'Reanudar' : 'Empezar';
  if (reiniciarVis) reiniciarVis.hidden = !!visFin || resta === VIS_MS || resta === 0;
}
function visTic(): void {
  if (!visFin) return;
  if (Date.now() >= visFin) {
    visFin = 0;
    visResta = 0;
    texto('vis-estado', 'Cinco minutos. Abre los ojos.');
  }
  visPintar();
}
botonVis?.addEventListener('click', () => {
  if (visFin) {
    visResta = Math.max(0, visFin - Date.now());
    visFin = 0;
  } else {
    if (visResta === 0) visResta = VIS_MS;
    visFin = Date.now() + visResta;
    texto('vis-estado', '');
  }
  visPintar();
});
reiniciarVis?.addEventListener('click', () => {
  visFin = 0;
  visResta = VIS_MS;
  texto('vis-estado', '');
  visPintar();
  botonVis?.focus();
});

// ---------- 6 · Bloque de 90 minutos ----------
const BLOQUE_MS = MIN_BLOQUE * 60000;
const iBloque = PASOS_RITUAL.findIndex((p) => p.id === 'bloque');
const botonBloque = v<HTMLButtonElement>('bloque-boton');
const confirmaBloque = v('bloque-confirma');
let bloqueVisto = '';

function bloquePintar(s: Estado): void {
  const inicio = notaDia(s, dia).bloque || 0;
  const ahora = Date.now();
  const hecho = iBloque >= 0 && !!(s.ritual[dia] || [])[iBloque];
  const pasado = inicio ? ahora - inicio : 0;
  const completo = !!inicio && pasado >= BLOQUE_MS;

  // Al cumplirse el tiempo, el paso se marca solo (una vez).
  if (completo && !hecho && iBloque >= 0) {
    guardar((e) => {
      const pasos = PASOS_RITUAL.map((_, i) => !!(e.ritual[dia] || [])[i]);
      pasos[iBloque] = true;
      e.ritual[dia] = pasos;
    });
    return;
  }

  const resta = inicio ? Math.max(0, BLOQUE_MS - pasado) : BLOQUE_MS;
  texto('bloque-tiempo', reloj(resta / 1000));
  const avance = inicio ? Math.min(1, pasado / BLOQUE_MS) : 0;
  anchoRegla(v('bloque-regla'), avance, `Bloque: ${pct(avance * 100)}`);

  // El texto del final solo se reescribe cuando cambia, para no repetirlo al lector de pantalla.
  const fin = new Date((inicio || ahora) + BLOQUE_MS);
  const frase = completo
    ? `Bloque completo: de las <b class="cifra">${hora(new Date(inicio))}</b> a las <b class="cifra">${hora(fin)}</b>`
    : inicio
      ? `Empezó a las ${hora(new Date(inicio))}. Termina a las <b class="cifra">${hora(fin)}</b>`
      : `Si empiezas ahora, termina a las <b class="cifra">${hora(fin)}</b>`;
  if (frase !== bloqueVisto) {
    bloqueVisto = frase;
    const el = v('bloque-fin');
    if (el) el.innerHTML = frase;
  }
  if (botonBloque) {
    const rotulo = completo ? 'Empezar otro bloque' : inicio ? 'Detener' : 'Empezar el bloque';
    if (botonBloque.textContent !== rotulo) botonBloque.textContent = rotulo;
    botonBloque.classList.toggle('boton', !inicio);
    botonBloque.classList.toggle('boton-2', !!inicio);
  }
}

botonBloque?.addEventListener('click', () => {
  const inicio = notaDia(leer(), dia).bloque || 0;
  if (!inicio || Date.now() - inicio >= BLOQUE_MS) {
    const ahora = Date.now();
    anotarDia(dia, (n) => { n.bloque = ahora; });
    texto('bloque-aviso', `Bloque en marcha. Termina a las ${hora(new Date(ahora + BLOQUE_MS))}.`);
    return;
  }
  if (confirmaBloque) {
    confirmaBloque.hidden = false;
    v<HTMLButtonElement>('bloque-no')?.focus();
  }
});
v('bloque-si')?.addEventListener('click', () => {
  if (confirmaBloque) confirmaBloque.hidden = true;
  anotarDia(dia, (n) => { delete n.bloque; });
  texto('bloque-aviso', 'Bloque detenido.');
  botonBloque?.focus();
});
v('bloque-no')?.addEventListener('click', () => {
  if (confirmaBloque) confirmaBloque.hidden = true;
  botonBloque?.focus();
});

// ---------- Campos que se guardan solos ----------
/** Guarda al dejar de escribir (400 ms) y al salir del campo. */
function alEscribir(el: Campo, guardarValor: (valor: string) => void): void {
  let espera = 0;
  const ahora = () => { window.clearTimeout(espera); guardarValor(el.value); };
  el.addEventListener('input', () => { window.clearTimeout(espera); espera = window.setTimeout(ahora, 400); });
  el.addEventListener('change', ahora);
}
function avisar(nombre: string, t: string): void {
  const el = v(nombre);
  if (!el) return;
  el.textContent = t;
  window.setTimeout(() => { if (el.textContent === t) el.textContent = ''; }, 2500);
}

type ClaveWoop = keyof Estado['woop'];
$$<Campo>('[data-woop]').forEach((el) => alEscribir(el, (valor) => {
  const k = el.dataset.woop as ClaveWoop;
  if (leer().woop[k] === valor.trim()) return;
  guardar((s) => { s.woop[k] = valor.trim(); });
  if (el.closest('.rt-semanal')) avisar('sem-estado', 'Guardado en este dispositivo');
}));

$$<Campo>('[data-nota="accion"]').forEach((el) => alEscribir(el, (valor) => {
  if ((notaDia(leer(), dia).accion || '') === valor.trim()) return;
  anotarDia(dia, (n) => { n.accion = valor.trim(); });
}));

$$<HTMLInputElement>('[data-dinero]').forEach((el) => alEscribir(el, (valor) => {
  const k = el.dataset.dinero as 'entro' | 'salio';
  const n = leerNumero(valor);
  if ((notaDia(leer(), dia)[k] || 0) === n) return;
  anotarDia(dia, (nota) => { nota[k] = n; });
}));

$$<Campo>('[data-semana]').forEach((el) => alEscribir(el, (valor) => {
  const k = el.dataset.semana as keyof NotaSemana;
  if ((notaSemana(leer(), semana)[k] || '') === valor.trim()) return;
  anotarSemana(semana, (n) => { n[k] = valor.trim(); });
  avisar('sem-estado', 'Guardado en este dispositivo');
}));

// Noche 2 · Evidencias de hoy
const formEvidencia = $<HTMLFormElement>('[data-form="evidencia"]');
formEvidencia?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const campo = formEvidencia.elements.namedItem('texto') as HTMLInputElement;
  const t = campo.value.trim();
  if (!t) { campo.focus(); return; }
  guardar((s) => { s.evidencias.push({ id: uid(), fecha: dia, texto: t }); });
  campo.value = '';
  campo.focus();
});
v('evidencias')?.addEventListener('click', (ev) => {
  const boton = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-quitar]');
  if (!boton) return;
  const id = boton.dataset.quitar;
  guardar((s) => { s.evidencias = s.evidencias.filter((e) => e.id !== id); });
  $<HTMLInputElement>('#rt-evidencia')?.focus();
});

// Noche 3 · ¿Se sostuvo el plan?
const CONSEJO: Record<PlanHoy, string> = {
  si: 'Anotado. Un plan que funciona se repite mañana tal cual.',
  no: 'Anotado. Mañana, en el paso 4, cambia la señal o haz la acción más pequeña.',
  'sin-ocasion': 'Anotado. Si pasa varios días, elige un obstáculo que sí aparezca.',
};
$$<HTMLInputElement>('input[name="rt-plan"]').forEach((r) => r.addEventListener('change', () => {
  if (r.checked) anotarDia(dia, (n) => { n.plan = r.value as PlanHoy; });
}));

// ---------- Pintar el estado ----------
function saldoTexto(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (!r) return '0';
  return `${r > 0 ? '+' : '−'}${dinero(Math.abs(r))}`;
}

function pintar(s: Estado): void {
  const nota: NotaDia = notaDia(s, dia);

  // Mañana 2 · Declaración
  const decl = v('declaracion');
  if (decl) {
    const t = s.declaracion.trim();
    decl.innerHTML = t
      ? frases(t).map((x) => `<span>${esc(x)}</span>`).join('')
      : '<span class="rt-vacia">Aún no has escrito tu declaración: quién eres, a quién sirves y qué vas a dominar.</span>';
    decl.classList.toggle('larga', t.length > 160 || !t);
  }

  // Mañana 3 · Acción de hoy, y su eco en el bloque
  $$<Campo>('[data-nota="accion"]').forEach((el) => poner(el, nota.accion || ''));
  const eco = v('bloque-accion');
  if (eco) {
    eco.innerHTML = nota.accion
      ? esc(nota.accion)
      : '<span class="rt-vacia">La acción de hoy, la del paso 3.</span>';
  }

  // Mañana 4 y revisión semanal · WOOP
  $$<Campo>('[data-woop]').forEach((el) => poner(el, s.woop[el.dataset.woop as ClaveWoop] || ''));
  const frase = frasePlan(s.woop.obstaculo, s.woop.plan);
  const fp = v('frase-plan');
  if (fp) {
    fp.innerHTML = frase
      ? `«${esc(frase)}».`
      : '<span class="rt-vacia">Escribe las dos partes y aquí se compone la frase.</span>';
  }
  const fpn = v('frase-plan-noche');
  if (fpn) {
    fpn.innerHTML = frase
      ? `«${esc(frase)}».`
      : '<span class="rt-vacia">Aún no hay plan escrito. Mañana, en el paso 4.</span>';
  }

  // Mañana 5 · Dar primero
  const total = ingresoReal(s);
  const sugerido = (total * METAS.donado) / 100;
  const cifra = v('dar-cifra');
  if (cifra) {
    const t = fmt(sugerido);
    cifra.textContent = t;
    cifra.style.setProperty('--n', String(Math.max(4, t.length)));
  }
  texto('dar-nota', total ? `el ${pct(METAS.donado)} de ${fmt(total)} al mes` : 'aún no hay ingresos en el libro');
  const libro = v('dar-libro');
  if (libro) libro.hidden = total > 0;
  texto('dar-donado', pct(s.donadoPct, 1));
  anchoRegla(v('dar-regla'), s.donadoPct / METAS.donado, `Donado este mes: ${pct(s.donadoPct, 1)}`);

  // Mañana 6 · Bloque
  bloquePintar(s);

  // Noche 1 · Dinero de hoy
  $$<HTMLInputElement>('[data-dinero]').forEach((el) => {
    const n = nota[el.dataset.dinero as 'entro' | 'salio'] || 0;
    poner(el, n ? dinero(n) : '');
  });
  const saldo = v('saldo');
  if (saldo) {
    const t = saldoTexto((nota.entro || 0) - (nota.salio || 0));
    saldo.textContent = t;
    saldo.style.setProperty('--n', String(Math.max(4, t.length)));
  }

  // Noche 2 · Evidencias de hoy
  const lista = v('evidencias');
  if (lista) {
    const deHoy = s.evidencias.filter((e) => e.fecha === dia);
    lista.innerHTML = deHoy.length
      ? deHoy.map((e) => `<li><span>${esc(e.texto)}</span><button class="boton-texto" type="button" data-quitar="${esc(e.id)}" aria-label="Quitar: ${esc(e.texto)}">Quitar</button></li>`).join('')
      : '<li class="lista-vacia">Aún no hay evidencias de hoy.</li>';
  }

  const limite = new Date(hoy);
  limite.setDate(limite.getDate() - 6);
  const enSemana = s.evidencias.filter((e) => e.fecha >= claveDia(limite)).length;
  texto('evid-semana', String(enSemana));
  texto('evid-semana-u', enSemana === 1 ? 'evidencia en 7 días' : 'evidencias en 7 días');
  anchoRegla(v('evid-regla'), enSemana / METAS.gratitud, `Evidencias en 7 días: ${enSemana} de ${METAS.gratitud}`);

  // Noche 3 · El plan de hoy
  $$<HTMLInputElement>('input[name="rt-plan"]').forEach((r) => { r.checked = r.value === nota.plan; });
  texto('plan-consejo', nota.plan ? CONSEJO[nota.plan] : '');

  // Lista de pasos y constancia
  pintarLista(s);
  const r = racha(s, hoy);
  texto('racha', String(r));
  texto('racha-u', r === 1 ? 'día de racha' : 'días de racha');
  const d14 = ultimosDias(s, 14, hoy);
  const dias14 = v('dias14');
  if (dias14) {
    dias14.innerHTML = diasSVG(d14);
    const completos = d14.filter((d) => d.hechos >= 4).length;
    dias14.setAttribute('aria-label', `Últimos 14 días: ${completos} con el ritual completo`);
  }
  texto('hoy-cuenta', String(hechosEl(s, dia)));
  texto('noche-cuenta', String(NOCHE.filter((_, i) => pasoHecho(s, dia, 'noche', i)).length));

  // Revisión semanal
  const lunes = deISO(semana);
  if (lunes) {
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    const mismoMes = lunes.getMonth() === domingo.getMonth();
    texto('semana', `Semana del ${lunes.getDate()}${mismoMes ? '' : ` de ${MESES[lunes.getMonth()]}`} al ${domingo.getDate()} de ${MESES[domingo.getMonth()]}`);
  }
  const filas = v('sem-fuentes');
  if (filas) {
    filas.innerHTML = s.fuentes.length
      ? s.fuentes.map((f) => `<tr><th scope="row">${esc(f.nombre || 'Sin nombre')}</th><td>${esc(f.estado)}</td><td class="num">${fmt(f.mensual)}</td></tr>`).join('')
      : '<tr><td colspan="3" class="rt-vacia">Aún no hay fuentes en el libro.</td></tr>';
  }
  texto('sem-total', fmt(total));
  const d7 = ultimosDias(s, 7, hoy);
  const completos7 = d7.filter((d) => d.hechos >= 4).length;
  texto('sem-dias', String(completos7));
  const dias7 = v('dias7');
  if (dias7) {
    dias7.innerHTML = diasSVG(d7);
    dias7.setAttribute('aria-label', `Últimos 7 días: ${completos7} con el ritual completo`);
  }
  const planes = d7.map((d) => notaDia(s, d.clave).plan).filter(Boolean) as PlanHoy[];
  const veces = (n: number) => (n === 1 ? '1 vez' : `${n} veces`);
  const cuenta = (p: PlanHoy) => planes.filter((x) => x === p).length;
  const partes = [
    cuenta('si') ? `se sostuvo ${veces(cuenta('si'))}` : '',
    cuenta('no') ? `falló ${veces(cuenta('no'))}` : '',
    cuenta('sin-ocasion') ? `no hizo falta ${veces(cuenta('sin-ocasion'))}` : '',
  ].filter(Boolean);
  const lista7 = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : partes[0];
  texto('sem-plan', planes.length
    ? `Últimos 7 días: el plan ${lista7}.`
    : 'Aún no hay cierres de noche en los últimos 7 días.');
  const ns = notaSemana(s, semana);
  $$<Campo>('[data-semana]').forEach((el) => poner(el, ns[el.dataset.semana as keyof NotaSemana] || ''));
}

// ---------- Arranque ----------
respiraParar(false);
visPintar();
pintar(leer());
mostrar();
alCambiar(pintar);
iniciarAvisoMuestra();
document.documentElement.classList.add('listo');

// Un solo reloj para la respiración, la visualización y el bloque. Todo se calcula con la
// hora del dispositivo, así que no se atrasa si la pestaña queda en segundo plano.
window.setInterval(() => {
  respiraTic();
  visTic();
  bloquePintar(leer());
}, 200);

// Si la pestaña sigue abierta al cambiar el día, se vuelve a cargar al volver a ella.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && claveDia() !== dia) location.reload();
});
