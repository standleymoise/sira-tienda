// robots.txt con la dirección del sitemap (usa SITE_URL y BASE_PATH).
// Las páginas personales no se bloquean aquí: llevan <meta name="robots" content="noindex">,
// y Google solo puede leer esa etiqueta si la página no está bloqueada.
//
// Un solo dominio: si WordPress vive en una carpeta del mismo dominio (PUBLIC_TIENDA_URL =
// https://dominio.com/tienda), esa carpeta no se indexa (la tienda que ve Google es la de Astro),
// pero las fotos de productos sí (wp-content/uploads), para que aparezcan en Google Imágenes.
import type { APIRoute } from 'astro';
import { tiendaUrl } from '../data/tienda';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap-index.xml`, site);
  let reglas = 'User-agent: *\nAllow: /\n';
  try {
    const tienda = new URL(tiendaUrl);
    const carpeta = tienda.pathname.replace(/\/+$/, '');
    if (site && tienda.host === site.host && carpeta) {
      reglas = `User-agent: *\nAllow: ${carpeta}/wp-content/uploads/\nDisallow: ${carpeta}/\nAllow: /\n`;
    }
  } catch {
    /* sin PUBLIC_TIENDA_URL: robots normal */
  }
  return new Response(`${reglas}\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
