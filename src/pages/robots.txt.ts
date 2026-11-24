// robots.txt con la dirección del sitemap (usa SITE_URL y BASE_PATH).
// Las páginas personales no se bloquean aquí: llevan <meta name="robots" content="noindex">,
// y Google solo puede leer esa etiqueta si la página no está bloqueada.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap-index.xml`, site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
