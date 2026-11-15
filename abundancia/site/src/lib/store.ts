// Estado del tablero: se guarda en este dispositivo (localStorage).
// Sin servidor ni cuentas; exportar/importar permite pasar los datos a otro dispositivo.

export type TipoFuente = 'Servicio' | 'Recurrente' | 'Producto' | 'Digital' | 'Activo';
export type EstadoFuente = 'idea' | 'probando' | 'ingresando';

export const TIPOS_FUENTE: readonly TipoFuente[] = ['Servicio', 'Recurrente', 'Producto', 'Digital', 'Activo'];
export const ESTADOS_FUENTE: readonly EstadoFuente[] = ['idea', 'probando', 'ingresando'];

export interface Fuente {
  id: string;
  nombre: string;
  tipo: TipoFuente;
  estado: EstadoFuente;
  mensual: number;
  accion: string;
  ejemplo?: boolean;
}

export interface Evidencia {
  id: string;
  fecha: string;
  texto: string;
}

export interface Estado {
  v: 2;
  declaracion: string;
  cifra: number;
  fechaMeta: string;
  moneda: string;
  fuentes: Fuente[];
  ideas: string[];
  donadoPct: number;
  ahorroPct: number;
  ritual: Record<string, boolean[]>;
  evidencias: Evidencia[];
  woop: { deseo: string; resultado: string; obstaculo: string; plan: string };
  espacio: Record<string, boolean>;
  ejemplo: boolean;
}

// Las cinco casillas del ritual de la mañana. Título y duración salen de aquí para Hoy y para el
// ritual guiado (src/lib/ritual.ts toma de aquí la duración de cada paso).
export const PASOS_RITUAL = [
  { id: 'respirar', titulo: 'Respirar', detalle: '1 min' },
  { id: 'declaracion', titulo: 'Leer la declaración en voz alta', detalle: '2 min' },
  { id: 'visualizar', titulo: 'Visualizar el proceso de hoy', detalle: '5 min' },
  { id: 'dar', titulo: 'Dar primero', detalle: '1 min' },
  { id: 'bloque', titulo: 'Bloque de trabajo sin distracciones', detalle: '90 min' },
] as const;

const CLAVE = 'shefa-v2';
const EVENTO = 'shefa:cambio';

// Datos de muestra: se ven la primera vez, marcados como ejemplo, y se borran con un clic.
export function estadoInicial(): Estado {
  return {
    v: 2,
    declaracion:
      'Soy un profesional que cumple lo que promete. Cada semana sirvo mejor y cobro lo justo. Voy a dominar mi oficio.',
    cifra: 10000,
    fechaMeta: '2027-06-30',
    moneda: '',
    fuentes: [
      { id: 'e1', nombre: 'Servicio principal', tipo: 'Servicio', estado: 'ingresando', mensual: 3200, accion: 'Subir precio 10 % a clientes nuevos', ejemplo: true },
      { id: 'e2', nombre: 'Contratos recurrentes', tipo: 'Recurrente', estado: 'probando', mensual: 600, accion: 'Ofrecer plan mensual a 5 clientes', ejemplo: true },
      { id: 'e3', nombre: 'Guía digital', tipo: 'Digital', estado: 'idea', mensual: 0, accion: 'Escribir el índice y validarlo con 3 personas', ejemplo: true },
    ],
    ideas: [],
    donadoPct: 4,
    ahorroPct: 12,
    ritual: {},
    evidencias: [],
    woop: { deseo: '', resultado: '', obstaculo: '', plan: '' },
    espacio: {},
    ejemplo: true,
  };
}

const esObjeto = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const cadena = (x: unknown): string => (typeof x === 'string' ? x : x == null || typeof x === 'object' ? '' : String(x));
const positivo = (x: unknown): number => {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
/** Solo las entradas cuyo valor es un objeto: descarta lo que un archivo editado a mano traiga de más. */
function soloObjetos<T>(x: unknown): Record<string, T> {
  const salida: Record<string, T> = {};
  if (esObjeto(x)) for (const [k, valor] of Object.entries(x)) if (esObjeto(valor)) salida[k] = valor as T;
  return salida;
}

// Lo guardado puede venir de un archivo importado o editado a mano: cada campo se lleva a su
// tipo y lo que no encaja se descarta, para que ninguna página falle al pintarlo.
function normalizar(d: Partial<Estado> | null): Estado {
  const base = estadoInicial();
  if (!esObjeto(d)) return base;
  const s: Estado = { ...base, ...d, v: 2 };
  s.declaracion = cadena(s.declaracion);
  s.fechaMeta = /^\d{4}-\d{2}-\d{2}$/.test(cadena(s.fechaMeta)) ? cadena(s.fechaMeta) : '';
  s.moneda = cadena(s.moneda);
  s.fuentes = Array.isArray(d.fuentes)
    ? (d.fuentes as unknown[]).filter(esObjeto).map((f) => {
        const fuente: Fuente = {
          id: cadena(f.id) || uid(),
          nombre: cadena(f.nombre),
          tipo: TIPOS_FUENTE.includes(f.tipo as TipoFuente) ? (f.tipo as TipoFuente) : 'Servicio',
          estado: ESTADOS_FUENTE.includes(f.estado as EstadoFuente) ? (f.estado as EstadoFuente) : 'idea',
          mensual: positivo(f.mensual),
          accion: cadena(f.accion),
        };
        if (f.ejemplo === true) fuente.ejemplo = true;
        return fuente;
      })
    : base.fuentes;
  s.ideas = Array.isArray(d.ideas) ? (d.ideas as unknown[]).filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
  s.evidencias = Array.isArray(d.evidencias)
    ? (d.evidencias as unknown[])
        .filter(esObjeto)
        .filter((e) => typeof e.fecha === 'string' && typeof e.texto === 'string')
        .map((e) => ({ id: cadena(e.id) || uid(), fecha: e.fecha as string, texto: e.texto as string }))
    : [];
  s.ritual = {};
  if (esObjeto(d.ritual)) {
    for (const [dia, pasos] of Object.entries(d.ritual)) if (Array.isArray(pasos)) s.ritual[dia] = pasos.map(Boolean);
  }
  s.espacio = {};
  if (esObjeto(d.espacio)) for (const [k, valor] of Object.entries(d.espacio)) s.espacio[k] = valor === true;
  const woop = esObjeto(d.woop) ? d.woop : {};
  s.woop = { deseo: cadena(woop.deseo), resultado: cadena(woop.resultado), obstaculo: cadena(woop.obstaculo), plan: cadena(woop.plan) };
  s.cifra = Math.round(positivo(s.cifra));
  s.donadoPct = positivo(s.donadoPct);
  s.ahorroPct = positivo(s.ahorroPct);
  s.ejemplo = d.ejemplo === true;
  // Notas del ritual (src/lib/ritual.ts): el store las conserva, pero solo si tienen forma de registro.
  const extra = s as unknown as Record<string, unknown>;
  for (const k of ['ritualDia', 'ritualSemana']) if (k in extra) extra[k] = soloObjetos(extra[k]);
  return s;
}

let memoria: Estado | null = null;

export function leer(): Estado {
  if (memoria) return memoria;
  try {
    const crudo = localStorage.getItem(CLAVE);
    memoria = normalizar(crudo ? JSON.parse(crudo) : null);
  } catch {
    memoria = estadoInicial();
  }
  return memoria;
}

export function guardar(cambio: (s: Estado) => void): Estado {
  const s = leer();
  cambio(s);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(s));
  } catch {
    /* almacenamiento no disponible: el estado sigue en memoria durante la visita */
  }
  document.dispatchEvent(new CustomEvent(EVENTO, { detail: s }));
  return s;
}

export function alCambiar(fn: (s: Estado) => void): void {
  document.addEventListener(EVENTO, (e) => fn((e as CustomEvent<Estado>).detail));
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) {
      memoria = null;
      fn(leer());
    }
  });
}

export function borrarEjemplos(): Estado {
  return guardar((s) => {
    s.fuentes = s.fuentes.filter((f) => !f.ejemplo);
    if (s.ejemplo) {
      const base = estadoInicial();
      s.declaracion = '';
      s.donadoPct = 0;
      s.ahorroPct = 0;
      // La cifra y su fecha de muestra también se van; si la persona las cambió, se quedan.
      if (s.cifra === base.cifra && s.fechaMeta === base.fechaMeta) {
        s.cifra = 0;
        s.fechaMeta = '';
      }
    }
    s.ejemplo = false;
  });
}

export function exportar(): string {
  return JSON.stringify(leer(), null, 2);
}

export function importar(texto: string): boolean {
  try {
    const d = JSON.parse(texto);
    if (!d || typeof d !== 'object' || !Array.isArray(d.fuentes)) return false;
    memoria = normalizar(d);
    guardar(() => {});
    return true;
  } catch {
    return false;
  }
}

export function reiniciar(): Estado {
  memoria = estadoInicial();
  return guardar(() => {});
}

// ---------- fechas ----------

export function claveDia(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function hechosEl(s: Estado, clave: string): number {
  const pasos = s.ritual[clave];
  return Array.isArray(pasos) ? pasos.filter(Boolean).length : 0;
}

// Racha: días seguidos con al menos 4 de los 5 pasos. Hoy cuenta si ya está completo.
export function racha(s: Estado, hoy: Date = new Date()): number {
  const d = new Date(hoy);
  let n = 0;
  if (hechosEl(s, claveDia(d)) < 4) d.setDate(d.getDate() - 1);
  while (hechosEl(s, claveDia(d)) >= 4) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function ultimosDias(s: Estado, n: number, hoy: Date = new Date()): { clave: string; hechos: number }[] {
  const out: { clave: string; hechos: number }[] = [];
  const d = new Date(hoy);
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const clave = claveDia(d);
    out.push({ clave, hechos: hechosEl(s, clave) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ---------- dinero ----------

export function ingresoReal(s: Estado): number {
  return s.fuentes.reduce((t, f) => t + (Number(f.mensual) || 0), 0);
}

export function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions).format(
    Math.round(n || 0),
  );
}

export function fmtPct(n: number, dec = 0): string {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: dec }).format(n || 0)} %`;
}

// ---------- las diez medidas del Árbol ----------

export type SefiraId =
  | 'keter' | 'jojma' | 'bina' | 'jesed' | 'guevura'
  | 'tiferet' | 'netsaj' | 'hod' | 'yesod' | 'maljut';

export interface Medida {
  id: SefiraId;
  valor: string;      // lo que se lee dentro del nodo
  detalle: string;    // frase corta bajo el nombre
  avance: number;     // 0 a 1, el arco del anillo
}

export const METAS = { donado: 10, ahorro: 20, ideas: 10, constancia: 66, gratitud: 7, canales: 3 };

const acotar = (x: number) => Math.max(0, Math.min(1, x || 0));

export function medidas(s: Estado, hoy: Date = new Date()): Record<SefiraId, Medida> {
  const total = ingresoReal(s);
  const fuentes = s.fuentes.length;
  const conAccion = s.fuentes.filter((f) => (f.accion || '').trim()).length;
  const ingresando = s.fuentes.filter((f) => f.estado === 'ingresando' && f.mensual > 0).length;
  const ideas = s.ideas.length + s.fuentes.filter((f) => f.estado === 'idea').length;
  const r = racha(s, hoy);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() - 6);
  const desde = claveDia(limite);
  const evid = s.evidencias.filter((e) => e.fecha >= desde).length;
  const intencion = (String(s.declaracion || '').trim() ? 0.5 : 0) + (s.cifra > 0 && s.fechaMeta ? 0.5 : 0);

  const m: Record<string, Medida> = {
    keter: {
      id: 'keter', valor: fmtPct(intencion * 100), avance: intencion,
      detalle: intencion === 1 ? 'Declaración y cifra escritas' : intencion > 0 ? 'Falta la declaración o la cifra con fecha' : 'Escribe tu declaración y tu cifra',
    },
    jojma: { id: 'jojma', valor: String(ideas), avance: acotar(ideas / METAS.ideas), detalle: ideas === 1 ? '1 idea capturada' : `${ideas} ideas capturadas` },
    bina: {
      id: 'bina', valor: fuentes ? `${conAccion}/${fuentes}` : '0', avance: fuentes ? conAccion / fuentes : 0,
      detalle: fuentes ? `${conAccion} de ${fuentes} fuentes con próxima acción` : 'Añade tu primera fuente',
    },
    jesed: { id: 'jesed', valor: fmtPct(s.donadoPct, 1), avance: acotar(s.donadoPct / METAS.donado), detalle: `${fmtPct(s.donadoPct, 1)} donado (meta ${METAS.donado} %)` },
    guevura: { id: 'guevura', valor: fmtPct(s.ahorroPct, 1), avance: acotar(s.ahorroPct / METAS.ahorro), detalle: `${fmtPct(s.ahorroPct, 1)} de ahorro (meta ${METAS.ahorro} %)` },
    netsaj: { id: 'netsaj', valor: String(r), avance: acotar(r / METAS.constancia), detalle: r === 1 ? 'Racha de 1 día' : `Racha de ${r} días` },
    hod: { id: 'hod', valor: String(evid), avance: acotar(evid / METAS.gratitud), detalle: evid === 1 ? '1 evidencia esta semana' : `${evid} evidencias esta semana` },
    yesod: {
      id: 'yesod', valor: String(ingresando), avance: acotar(ingresando / METAS.canales),
      detalle: ingresando === 1 ? '1 fuente que ya ingresa' : `${ingresando} fuentes que ya ingresan`,
    },
    maljut: {
      id: 'maljut', valor: s.cifra ? fmtPct(acotar(total / s.cifra) * 100) : fmt(total), avance: s.cifra ? acotar(total / s.cifra) : 0,
      detalle: s.cifra ? `${fmt(total)} de ${fmt(s.cifra)} al mes` : `${fmt(total)} al mes`,
    },
  };
  const otras = Object.values(m).map((x) => x.avance);
  const indice = otras.reduce((a, b) => a + b, 0) / otras.length;
  m.tiferet = { id: 'tiferet', valor: String(Math.round(indice * 100)), avance: indice, detalle: `Índice general: ${Math.round(indice * 100)}` };
  return m as Record<SefiraId, Medida>;
}

export function uid(): string {
  return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
