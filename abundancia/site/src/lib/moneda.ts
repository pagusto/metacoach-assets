// La moneda (círculo con hueco cuadrado) dibujada en SVG, como cadena.
// La usan los componentes de Astro al construir y el cliente al repintar,
// de modo que el dibujo es uno solo.

import type { EstadoFuente } from './store';
import { esc } from './formato';

const acotar = (x: number) => Math.max(0, Math.min(1, Number(x) || 0));
const dash = (valor: number) => {
  const p = Math.round(acotar(valor) * 1000) / 10;
  return `${p} ${Math.round((100 - p) * 10) / 10}`;
};

export interface OpcionesMoneda {
  /** Texto para lectores de pantalla. Sin él, la moneda es decorativa. */
  etiqueta?: string;
  /** Texto corto dentro del hueco (una cifra). */
  texto?: string;
  /** Clases extra para el <svg>. */
  clase?: string;
}

/** Moneda medidora: el arco de oro recorre el canto de 0 a 1; el hueco queda abierto. */
export function monedaSVG(valor: number, o: OpcionesMoneda = {}): string {
  const acc = o.etiqueta ? `role="img" aria-label="${esc(o.etiqueta)}"` : 'aria-hidden="true"';
  const texto = o.texto
    ? `<text class="cifra" x="120" y="121" text-anchor="middle" dominant-baseline="central">${esc(o.texto)}</text>`
    : '';
  return (
    `<svg class="moneda-medida${o.clase ? ' ' + o.clase : ''}" viewBox="0 0 240 240" ${acc}>` +
    '<circle class="canto" cx="120" cy="120" r="119.25"/>' +
    '<circle class="listel" cx="120" cy="120" r="103.5"/>' +
    `<circle class="arco" cx="120" cy="120" r="111.5" pathLength="100" stroke-dasharray="${dash(valor)}" transform="rotate(-90 120 120)"/>` +
    '<rect class="hueco" x="80" y="80" width="80" height="80"/>' +
    texto +
    '</svg>'
  );
}

/** Actualiza el arco (y la etiqueta) de una moneda o de un nodo ya dibujados. */
export function ponerArco(raiz: Element | null, valor: number, etiqueta?: string): void {
  if (!raiz) return;
  const arco = raiz.matches('.arco') ? raiz : raiz.querySelector('.arco');
  if (arco) arco.setAttribute('stroke-dasharray', dash(valor));
  if (etiqueta) {
    const svg = raiz.matches('svg') ? raiz : raiz.querySelector('svg');
    if (svg && svg.getAttribute('role') === 'img') svg.setAttribute('aria-label', etiqueta);
  }
}

/** Anillo de un nodo del Árbol: disco con arco de oro, sin hueco (dentro va la cifra). */
export function nodoSVG(valor: number): string {
  return (
    '<svg viewBox="0 0 72 72" aria-hidden="true">' +
    '<circle class="disco" cx="36" cy="36" r="35.25"/>' +
    `<circle class="arco" cx="36" cy="36" r="32" pathLength="100" stroke-dasharray="${dash(valor)}" transform="rotate(-90 36 36)"/>` +
    '</svg>'
  );
}

const CLASE_ESTADO: Record<EstadoFuente, string> = {
  ingresando: 'm-ingresa',
  probando: 'm-prueba',
  idea: 'm-idea',
};

/** Moneda de estado de una fuente: llena en azul, contorno o contorno discontinuo. */
export function monedaEstadoSVG(estado: EstadoFuente): string {
  return (
    `<svg class="${CLASE_ESTADO[estado] || 'm-idea'}" viewBox="0 0 96 96" aria-hidden="true">` +
    '<path fill-rule="evenodd" vector-effect="non-scaling-stroke" d="M48 1a47 47 0 1 0 0 94a47 47 0 1 0 0-94zM32 32h32v32H32z"/>' +
    '</svg>'
  );
}

/** Cien círculos en una retícula de 10 × 10; se llenan de abajo arriba, de izquierda a derecha. */
export function puntosSVG(porcentaje: number, etiqueta?: string): string {
  const llenos = Math.max(0, Math.min(100, Math.round(Number(porcentaje) || 0)));
  const acc = etiqueta ? `role="img" aria-label="${esc(etiqueta)}"` : 'aria-hidden="true"';
  let c = '';
  for (let i = 0; i < 100; i++) {
    const x = 10 + (i % 10) * 20;
    const y = 190 - Math.floor(i / 10) * 20;
    c += i < llenos
      ? `<circle class="lleno" cx="${x}" cy="${y}" r="6.5"/>`
      : `<circle class="vacio" cx="${x}" cy="${y}" r="6"/>`;
  }
  return `<svg class="puntos" viewBox="0 0 200 200" ${acc}>${c}</svg>`;
}

/** Fila de puntos de la racha: uno por día, lleno si el día cuenta. */
export function rachaSVG(dias: boolean[]): string {
  const paso = 11;
  const ancho = dias.length * paso - 3;
  const c = dias
    .map((hecho, i) => (hecho
      ? `<circle class="hecho" cx="${4 + i * paso}" cy="4" r="4"/>`
      : `<circle cx="${4 + i * paso}" cy="4" r="3.5"/>`))
    .join('');
  return `<svg viewBox="0 0 ${ancho} 8" width="${ancho}" height="8" aria-hidden="true">${c}</svg>`;
}

/** Tira de días: un cuadrado por día con su círculo (lleno en oro si se cumplió el ritual). */
export function diasSVG(dias: { hechos: number; clave: string }[], minimo = 4): string {
  return dias
    .map((d, i) => {
      const hecho = d.hechos >= minimo;
      const hoy = i === dias.length - 1;
      const r = hecho ? 6 : d.hechos > 0 ? 5.5 : 0;
      return (
        `<svg class="${hecho ? 'hecho' : ''}${hoy ? ' hoy' : ''}" viewBox="0 0 20 20" aria-hidden="true">` +
        '<rect x=".75" y=".75" width="18.5" height="18.5"/>' +
        (r ? `<circle cx="10" cy="10" r="${r}"${hecho ? '' : ' stroke-dasharray="2 2"'}/>` : '') +
        '</svg>'
      );
    })
    .join('');
}
