// Videos vistos de la videoteca. Se guardan en este dispositivo (localStorage, clave
// «shefa-vistos») como una lista de identificadores de YouTube. Módulo propio de la
// videoteca: no toca el estado del tablero (store.ts).
//
//   import { leerVistos, marcarVisto, alCambiarVistos } from '../lib/videoteca-vistos';
//   marcarVisto('JfqDvi8b4gg', true);
//   alCambiarVistos((vistos) => pintar(vistos));   // también si cambia en otra pestaña

export const CLAVE_VISTOS = 'shefa-vistos';
const EVENTO = 'shefa:vistos';

// Sin almacenamiento (modo privado estricto), la lista vale para esta visita.
let memoria: string[] = [];
let sinAlmacen = false;

const esId = (x: unknown): x is string => typeof x === 'string' && /^[\w-]{6,20}$/.test(x);

/** Identificadores de los videos marcados como vistos. */
export function leerVistos(): Set<string> {
  try {
    const crudo = localStorage.getItem(CLAVE_VISTOS);
    if (crudo === null) return new Set(sinAlmacen ? memoria : []);
    const lista: unknown = JSON.parse(crudo);
    return new Set(Array.isArray(lista) ? lista.filter(esId) : []);
  } catch {
    sinAlmacen = true;
    return new Set(memoria);
  }
}

function escribir(vistos: Set<string>): void {
  memoria = [...vistos];
  try {
    if (memoria.length) localStorage.setItem(CLAVE_VISTOS, JSON.stringify(memoria));
    else localStorage.removeItem(CLAVE_VISTOS);
    sinAlmacen = false;
  } catch {
    sinAlmacen = true;
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

/** Marca o desmarca un video y avisa a quien escucha. */
export function marcarVisto(id: string, visto: boolean): void {
  if (!esId(id)) return;
  const vistos = leerVistos();
  if (visto === vistos.has(id)) return;
  if (visto) vistos.add(id);
  else vistos.delete(id);
  escribir(vistos);
}

/** Llama a fn cuando cambia la lista, en esta pestaña o en otra. Devuelve cómo dejar de escuchar. */
export function alCambiarVistos(fn: (vistos: Set<string>) => void): () => void {
  const aqui = () => fn(leerVistos());
  const fuera = (e: StorageEvent) => { if (e.key === CLAVE_VISTOS || e.key === null) fn(leerVistos()); };
  window.addEventListener(EVENTO, aqui);
  window.addEventListener('storage', fuera);
  return () => {
    window.removeEventListener(EVENTO, aqui);
    window.removeEventListener('storage', fuera);
  };
}
