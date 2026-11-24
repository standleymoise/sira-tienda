// Íconos PNG de la app (/iconos/icono-192.png, …), generados al compilar.
import type { APIRoute } from 'astro';
import { iconos, iconoPng, type NombreIcono } from '../../data/pwa';

export const getStaticPaths = () => Object.keys(iconos).map((icono) => ({ params: { icono } }));

export const GET: APIRoute = async ({ params }) =>
  new Response(await iconoPng(params.icono as NombreIcono), { headers: { 'Content-Type': 'image/png' } });
