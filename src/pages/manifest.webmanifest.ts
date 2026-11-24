// Manifiesto de la app instalable: nombre, colores, íconos y accesos directos (de tienda.config.ts).
import type { APIRoute } from 'astro';
import { tienda } from '../../tienda.config';
import { url, rutas } from '../data/rutas';

export const GET: APIRoute = () => {
  const manifiesto = {
    id: url('/'),
    name: tienda.marca.nombre,
    short_name: tienda.app.nombreCorto || tienda.marca.nombre,
    description: tienda.marca.descripcion,
    lang: tienda.pais.locale,
    start_url: url('/'),
    scope: url('/'),
    display: 'standalone',
    orientation: 'portrait',
    background_color: tienda.app.fondo,
    theme_color: tienda.colores.primario,
    categories: ['shopping'],
    icons: [
      { src: url('/iconos/icono-192.png'), sizes: '192x192', type: 'image/png' },
      { src: url('/iconos/icono-512.png'), sizes: '512x512', type: 'image/png' },
      { src: url('/iconos/maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Mis favoritos', url: rutas.favoritos },
      { name: 'Mi cuenta', url: rutas.cuenta },
      { name: 'Todos los productos', url: rutas.productos },
    ],
  };
  return new Response(JSON.stringify(manifiesto, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
