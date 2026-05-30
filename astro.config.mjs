// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Astro + Tailwind v4 (vía plugin de Vite). Sitio 100% estático.
export default defineConfig({
  site: 'https://techsinhumo.es',
  vite: {
    plugins: [tailwindcss()],
  },
});
