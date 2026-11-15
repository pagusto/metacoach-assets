import { defineConfig } from 'astro/config';

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
});
