import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shefa.vercel.app',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
