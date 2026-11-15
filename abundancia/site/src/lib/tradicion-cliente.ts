// Tradición · cliente. Sin dependencias y sin red.
//   iniciarIndice()   marca en el índice de la página la sección que se está leyendo
//   iniciarFiltro()   filtra las filas de una tabla con un grupo de botones

/** Índice de la página: aria-current en el enlace de la sección que se está leyendo. */
export function iniciarIndice(): void {
  const nav = document.querySelector<HTMLElement>('[data-indice]');
  if (!nav) return;
  const enlaces = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
  const secciones = enlaces
    .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
    .filter((el): el is HTMLElement => el !== null);
  if (!secciones.length) return;
  const pista = nav.querySelector<HTMLElement>('ol') ?? nav;

  let actual = '';
  const marcar = (): void => {
    // La sección actual es la más baja de las que ya pasaron la línea de lectura. Si dos
    // palacios comparten fila (mismo borde superior), manda la que se pidió en la dirección
    // (#ancla); si no se pidió ninguna de las dos, la primera.
    const linea = nav.getBoundingClientRect().bottom + 40;
    const pedida = decodeURIComponent(window.location.hash.slice(1));
    let id = secciones[0].id;
    let borde = -Infinity;
    for (const s of secciones) {
      const top = s.getBoundingClientRect().top;
      if (top > linea) continue;
      if (top > borde + 4) {
        id = s.id;
        borde = top;
      } else if (Math.abs(top - borde) <= 4 && s.id === pedida) {
        id = s.id;
      }
    }
    if (id === actual) return;
    actual = id;
    for (const a of enlaces) {
      const es = decodeURIComponent(a.hash.slice(1)) === id;
      if (es) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
      // En la tira el índice se desplaza en horizontal: deja a la vista la entrada actual.
      if (es && pista.scrollWidth > pista.clientWidth) {
        pista.scrollLeft = Math.max(0, a.offsetLeft - pista.offsetLeft - 16);
      }
    }
  };

  let pendiente = false;
  const alMover = (): void => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      marcar();
    });
  };
  window.addEventListener('scroll', alMover, { passive: true });
  window.addEventListener('resize', alMover, { passive: true });
  window.addEventListener('hashchange', alMover);
  marcar();
}

/**
 * Filtro por botones. Los botones llevan data-filtro="valor" (vacío = todo) dentro de
 * [data-filtros="grupo"]; las filas, data-fila="grupo" y data-valor="valor". El texto de
 * [data-filtro-estado="grupo"] (role="status") dice cuántas se ven.
 */
export function iniciarFiltro(grupo: string, frase: (visibles: number, total: number, valor: string) => string): void {
  const caja = document.querySelector<HTMLElement>(`[data-filtros="${grupo}"]`);
  if (!caja) return;
  const botones = Array.from(caja.querySelectorAll<HTMLButtonElement>('button[data-filtro]'));
  const filas = Array.from(document.querySelectorAll<HTMLElement>(`[data-fila="${grupo}"]`));
  const estado = document.querySelector<HTMLElement>(`[data-filtro-estado="${grupo}"]`);

  const aplicar = (valor: string): void => {
    let visibles = 0;
    for (const f of filas) {
      const ver = !valor || f.dataset.valor === valor;
      f.hidden = !ver;
      if (ver) visibles++;
    }
    for (const b of botones) b.setAttribute('aria-pressed', String((b.dataset.filtro ?? '') === valor));
    if (estado) estado.textContent = frase(visibles, filas.length, valor);
  };

  for (const b of botones) b.addEventListener('click', () => aplicar(b.dataset.filtro ?? ''));
}
