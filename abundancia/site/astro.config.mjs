import { defineConfig } from 'astro/config';
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Vercel sirve dist/ (vercel.json) y busca la página de «no encontrado» en su raíz. El sitio se
// compila en dist/shefa, así que al terminar se copia dist/shefa/404.html a dist/404.html.
const copiar404 = {
  name: 'shefa-404',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const origen = fileURLToPath(new URL('404.html', dir));
      if (existsSync(origen)) copyFileSync(origen, fileURLToPath(new URL('../404.html', dir)));
    },
  },
};

// El sitio vive bajo /shefa: así puede servirse dentro del sitio raíz
// (pabloagusto.vercel.app/shefa) y también en su propio dominio.
// Los archivos compilados quedan en dist/shefa para que la ruta física coincida con la URL.
export default defineConfig({
  site: 'https://pabloagusto.vercel.app',
  base: '/shefa',
  outDir: './dist/shefa',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [copiar404],
});
