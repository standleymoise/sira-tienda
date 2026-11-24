// Service worker de la app (/sw.js). Se genera en cada compilación con una versión nueva,
// así el navegador lo actualiza solo después de cada deploy.
//
// Qué guarda y qué no:
// - /_astro/* (JS, CSS, fuentes, fotos optimizadas): primero la caché; los nombres cambian por versión.
// - Páginas: primero la red (precios y textos al día), pero si el servidor tarda más de 1 s y hay
//   una copia guardada, se muestra la copia y la respuesta nueva queda guardada para la próxima.
//   Sin conexión: la última copia o /sin-conexion/.
// - Otros dominios (la API de WooCommerce: catálogo, carrito, cuenta, pagos): NUNCA se tocan.
import type { APIRoute } from 'astro';
import { tienda } from '../../tienda.config';

/** El código del service worker, como función normal (se convierte a texto al compilar). */
function serviceWorker(CACHE: string, PREFIJO: string, BASE: string) {
  const sw = self as unknown as ServiceWorkerGlobalScope;
  const SIN_CONEXION = BASE + '/sin-conexion/';
  // Cuánto se espera al servidor antes de mostrar la copia guardada de una página.
  const ESPERA_MS = 1000;

  sw.addEventListener('install', (e) => {
    e.waitUntil(
      caches
        .open(CACHE)
        .then((c) => c.addAll([SIN_CONEXION, BASE + '/']))
        .then(() => sw.skipWaiting()),
    );
  });

  sw.addEventListener('activate', (e) => {
    e.waitUntil(
      caches
        .keys()
        .then((claves) =>
          Promise.all(claves.filter((k) => k.startsWith(PREFIJO) && k !== CACHE).map((k) => caches.delete(k))),
        )
        .then(() => sw.clients.claim()),
    );
  });

  const guardar = (pedido: Request, respuesta: Response) => {
    if (respuesta.ok && respuesta.type === 'basic') {
      const copia = respuesta.clone();
      caches.open(CACHE).then((c) => c.put(pedido, copia));
    }
    return respuesta;
  };

  sw.addEventListener('fetch', (e) => {
    const pedido = e.request;
    const u = new URL(pedido.url);
    if (pedido.method !== 'GET' || u.origin !== sw.location.origin) return;

    if (u.pathname.startsWith(BASE + '/_astro/')) {
      e.respondWith(caches.match(pedido).then((r) => r || fetch(pedido).then((resp) => guardar(pedido, resp))));
      return;
    }

    if (pedido.mode === 'navigate') {
      const red = fetch(pedido).then((resp) => guardar(pedido, resp));
      // Aunque se muestre la copia, la respuesta de la red se termina de guardar.
      e.waitUntil(red.catch(() => undefined));
      const copia = () => caches.match(pedido, { ignoreSearch: true });
      const esperar = new Promise<Response | undefined>((listo) =>
        setTimeout(() => copia().then(listo), ESPERA_MS),
      );
      e.respondWith(
        Promise.race([red, esperar.then((r) => r || red)]).catch(() =>
          copia()
            .then((r) => r || caches.match(SIN_CONEXION))
            .then((r) => r || Response.error()),
        ),
      );
      return;
    }

    // Íconos, manifiesto, favicon…: la copia guardada al instante y se renueva por detrás.
    e.respondWith(
      caches.match(pedido).then((guardada) => {
        const red = fetch(pedido)
          .then((resp) => guardar(pedido, resp))
          .catch(() => guardada || Response.error());
        return guardada || red;
      }),
    );
  });
}

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const version = new Date().toISOString();
  const args = [`${tienda.prefijo}-app-${version}`, `${tienda.prefijo}-app-`, base].map((a) => JSON.stringify(a));
  const codigo = `// Generado al compilar: ${version}\n(${serviceWorker.toString()})(${args.join(', ')});\n`;
  return new Response(codigo, { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
};
