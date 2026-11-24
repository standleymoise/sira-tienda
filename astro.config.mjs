// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { tienda } from './tienda.config.ts';

// SITE_URL y BASE_PATH llegan como variables de entorno en el build (ver .github/workflows).
// Con dominio propio en la raíz: SITE_URL=https://mitienda.com BASE_PATH=/
const f = tienda.fuentes;

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  // Las fotos de productos vienen de WooCommerce (https): Astro las optimiza al compilar.
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  // Fuentes servidas desde el propio dominio (la página no le pide nada a Google al cargar),
  // con fuentes de respaldo ajustadas para que el texto no «salte» al terminar de cargar.
  fonts: [
    {
      provider: fontProviders.google(),
      name: f.texto.familia,
      cssVariable: '--fuente-texto',
      weights: f.texto.pesos,
      styles: ['normal'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: f.titulos.familia,
      cssVariable: '--fuente-titulos',
      weights: f.titulos.pesos,
      styles: ['normal'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  // Al pasar el mouse por un enlace, la página siguiente se descarga antes del clic.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    // sitemap-index.xml con todas las páginas, menos las personales.
    sitemap({ filter: (pagina) => !/\/(favoritos|cuenta|sin-conexion)\/?$/.test(pagina) }),
  ],
});
