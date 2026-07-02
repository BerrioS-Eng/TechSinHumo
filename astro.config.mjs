// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// Astro + Tailwind v4 (vía plugin de Vite) + MDX para el blog. Sitio 100% estático.
export default defineConfig({
  site: 'https://techsinhumo.com',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
