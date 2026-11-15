// Botones «Copiar» (componente videoteca/Copiar.astro). Primero navigator.clipboard; si no
// está o falla (página sin HTTPS, permiso denegado), selecciona el texto y prueba la copia
// clásica; si tampoco, deja el texto seleccionado para copiarlo a mano.

const AVISO_MS = 2400;

function seleccionar(el: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel) return false;
  const rango = document.createRange();
  rango.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(rango);
  return true;
}

async function copiar(texto: string, origen: HTMLElement): Promise<'copiado' | 'seleccionado' | 'nada'> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return 'copiado';
    }
  } catch {
    /* sigue con la selección */
  }
  if (!seleccionar(origen)) return 'nada';
  try {
    if (document.execCommand('copy')) return 'copiado';
  } catch {
    /* queda seleccionado */
  }
  return 'seleccionado';
}

/** Conecta todos los bloques [data-copia] de la página. */
export function iniciarCopiar(raiz: ParentNode = document): void {
  raiz.querySelectorAll<HTMLElement>('[data-copia]').forEach((bloque) => {
    const origen = bloque.querySelector<HTMLElement>('[data-copia-texto]');
    const boton = bloque.querySelector<HTMLButtonElement>('[data-copiar]');
    const estado = bloque.querySelector<HTMLElement>('[data-copia-estado]');
    if (!origen || !boton) return;
    const rotulo = boton.textContent || 'Copiar';
    let reloj = 0;
    boton.addEventListener('click', async () => {
      const resultado = await copiar(origen.textContent || '', origen);
      const corto = resultado === 'copiado' ? 'Copiado' : resultado === 'seleccionado' ? 'Seleccionado' : rotulo;
      const largo = resultado === 'copiado'
        ? 'Copiado al portapapeles.'
        : resultado === 'seleccionado'
          ? 'Texto seleccionado. Pulsa Ctrl + C o Cmd + C para copiarlo.'
          : 'No se pudo copiar. Selecciona el texto a mano.';
      boton.textContent = corto;
      bloque.dataset.copia = resultado;
      if (estado) estado.textContent = largo;
      window.clearTimeout(reloj);
      reloj = window.setTimeout(() => {
        boton.textContent = rotulo;
        bloque.dataset.copia = '';
        if (estado) estado.textContent = '';
      }, AVISO_MS);
    });
  });
}
