// Ritual guiado: las sesiones, sus pasos y las notas del día.
//
// Las notas del día (la acción de hoy, lo que entró y salió, si el plan se sostuvo, la hora
// de inicio del bloque) y las de la revisión semanal viven en el mismo estado del store, en
// dos campos propios: `ritualDia` y `ritualSemana`. Así viajan con exportar e importar, se
// borran con reiniciar y avisan a las otras pestañas. El store no los conoce: los conserva
// tal cual porque `normalizar` copia los campos que no reconoce.

import { PASOS_RITUAL, claveDia, guardar, type Estado } from './store';

export type SesionId = 'manana' | 'noche';

export interface PasoSesion {
  /** Identificador del paso dentro de su sesión. */
  id: string;
  titulo: string;
  /** Duración orientativa. */
  detalle: string;
  /** id de la práctica de practicas.json que explica el porqué. */
  practica: string;
  /** id del paso de PASOS_RITUAL que se marca al completarlo; null si no tiene casilla propia. */
  ritual: string | null;
}

// Seis pasos guiados para las cinco casillas del ritual. «Obstáculo y plan» no tiene casilla
// propia: completa la visualización (contraste mental) y se anota en la nota del día.
export const MANANA: readonly PasoSesion[] = [
  { id: 'respirar', titulo: 'Respirar', detalle: '1 min', practica: 'respiracion-lenta', ritual: 'respirar' },
  { id: 'declaracion', titulo: 'Declaración', detalle: '2 min', practica: 'afirmacion-de-valores', ritual: 'declaracion' },
  { id: 'visualizar', titulo: 'Visualizar el proceso de hoy', detalle: '5 min', practica: 'visualizar-proceso', ritual: 'visualizar' },
  { id: 'plan', titulo: 'Obstáculo y plan', detalle: '2 min', practica: 'plan-si-entonces', ritual: null },
  { id: 'dar', titulo: 'Dar primero', detalle: '1 min', practica: 'gasto-prosocial', ritual: 'dar' },
  { id: 'bloque', titulo: 'Bloque de 90 minutos', detalle: '90 min', practica: 'habito-contexto-fijo', ritual: 'bloque' },
];

export const NOCHE: readonly PasoSesion[] = [
  { id: 'dinero', titulo: 'Dinero de hoy', detalle: '1 min', practica: 'registro-progreso', ritual: null },
  { id: 'evidencia', titulo: 'Una evidencia', detalle: '1 min', practica: 'autoeficacia', ritual: null },
  { id: 'revisar', titulo: 'El plan de hoy', detalle: '1 min', practica: 'plan-si-entonces', ritual: null },
];

export const SESIONES: Record<SesionId, { nombre: string; duracion: string; pasos: readonly PasoSesion[] }> = {
  manana: { nombre: 'Mañana', duracion: 'unos 12 min', pasos: MANANA },
  noche: { nombre: 'Noche', duracion: 'unos 3 min', pasos: NOCHE },
};

/** Índice dentro de PASOS_RITUAL del paso guiado, o −1 si no tiene casilla propia. */
export function indiceRitual(p: PasoSesion): number {
  return p.ritual ? PASOS_RITUAL.findIndex((x) => x.id === p.ritual) : -1;
}

// ---------- Respiración y relojes ----------
export const RESPIRA = { inhala: 4, exhala: 6, ciclos: 6 } as const;
export const MIN_VISUALIZAR = 5;
export const MIN_BLOQUE = 90;

// ---------- Notas del día y de la semana ----------
export type PlanHoy = 'si' | 'no' | 'sin-ocasion';

export interface NotaDia {
  /** La acción de hoy que acerca el ingreso. */
  accion?: string;
  /** Dinero que entró y que salió hoy. */
  entro?: number;
  salio?: number;
  /** Si el plan «si…, entonces…» se sostuvo. */
  plan?: PlanHoy;
  /** El paso «Obstáculo y plan» de la mañana. */
  planHecho?: boolean;
  /** Los tres pasos del cierre de la noche. */
  noche?: boolean[];
  /** Inicio del bloque de 90 minutos, en milisegundos. */
  bloque?: number;
}

export interface NotaSemana {
  /** El obstáculo que se repitió. */
  obstaculo?: string;
  /** La prioridad de la semana. */
  prioridad?: string;
}

export interface EstadoRitual extends Estado {
  ritualDia?: Record<string, NotaDia>;
  ritualSemana?: Record<string, NotaSemana>;
}

const DIAS_GUARDADOS = 62;
const SEMANAS_GUARDADAS = 26;

function podar<T>(registro: Record<string, T>, maximo: number): void {
  const claves = Object.keys(registro).sort();
  for (const c of claves.slice(0, Math.max(0, claves.length - maximo))) delete registro[c];
}

export function notaDia(s: Estado, dia: string): NotaDia {
  const r = (s as EstadoRitual).ritualDia;
  return (r && typeof r === 'object' && r[dia]) || {};
}

export function notaSemana(s: Estado, semana: string): NotaSemana {
  const r = (s as EstadoRitual).ritualSemana;
  return (r && typeof r === 'object' && r[semana]) || {};
}

export function anotarDia(dia: string, cambio: (n: NotaDia) => void): void {
  guardar((s) => {
    const e = s as EstadoRitual;
    if (!e.ritualDia || typeof e.ritualDia !== 'object') e.ritualDia = {};
    const n = e.ritualDia[dia] || (e.ritualDia[dia] = {});
    cambio(n);
    podar(e.ritualDia, DIAS_GUARDADOS);
  });
}

export function anotarSemana(semana: string, cambio: (n: NotaSemana) => void): void {
  guardar((s) => {
    const e = s as EstadoRitual;
    if (!e.ritualSemana || typeof e.ritualSemana !== 'object') e.ritualSemana = {};
    const n = e.ritualSemana[semana] || (e.ritualSemana[semana] = {});
    cambio(n);
    podar(e.ritualSemana, SEMANAS_GUARDADAS);
  });
}

/** Clave de la semana: la fecha de su lunes. */
export function claveSemana(d: Date = new Date()): string {
  const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  return claveDia(lunes);
}

/** Marca o desmarca la casilla del ritual de un día sin tocar las demás. */
export function marcarRitual(dia: string, indice: number, hecho: boolean): void {
  if (indice < 0) return;
  guardar((s) => {
    const pasos = PASOS_RITUAL.map((_, i) => !!(s.ritual[dia] || [])[i]);
    pasos[indice] = hecho;
    s.ritual[dia] = pasos;
  });
}

/** ¿Está hecho el paso i de la sesión? */
export function pasoHecho(s: Estado, dia: string, sesion: SesionId, i: number): boolean {
  const paso = SESIONES[sesion].pasos[i];
  if (!paso) return false;
  if (sesion === 'noche') return !!(notaDia(s, dia).noche || [])[i];
  const idx = indiceRitual(paso);
  return idx >= 0 ? !!(s.ritual[dia] || [])[idx] : !!notaDia(s, dia).planHecho;
}

export function marcarPaso(dia: string, sesion: SesionId, i: number, hecho: boolean): void {
  const paso = SESIONES[sesion].pasos[i];
  if (!paso) return;
  if (sesion === 'noche') {
    anotarDia(dia, (n) => {
      const lista = NOCHE.map((_, j) => !!(n.noche || [])[j]);
      lista[i] = hecho;
      n.noche = lista;
    });
    return;
  }
  const idx = indiceRitual(paso);
  if (idx >= 0) marcarRitual(dia, idx, hecho);
  else anotarDia(dia, (n) => { n.planHecho = hecho; });
}

// ---------- Texto ----------

/** Quita «si» o «entonces» del principio y la puntuación del final, para componer la frase. */
export function limpiarClausula(texto: string, palabra: 'si' | 'entonces'): string {
  return String(texto || '')
    .trim()
    .replace(new RegExp(`^${palabra}\\b[\\s,:…]*`, 'i'), '')
    .replace(/[\s.,;:…]+$/, '')
    .trim();
}

/** «Si me distraigo, entonces cierro el correo» (sin punto final) o cadena vacía si falta alguna parte. */
export function frasePlan(obstaculo: string, plan: string): string {
  const si = limpiarClausula(obstaculo, 'si');
  const entonces = limpiarClausula(plan, 'entonces');
  if (!si || !entonces) return '';
  const minus = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  return `Si ${minus(si)}, entonces ${minus(entonces)}`;
}

/** «5:00», «89:59». */
export function reloj(segundos: number): string {
  const t = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Cantidad de dinero con hasta dos decimales, a la española: «1.250,5». */
export function dinero(n: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: 'always' } as Intl.NumberFormatOptions).format(n || 0);
}

/** «10:42» */
export function hora(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
