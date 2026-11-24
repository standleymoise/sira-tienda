// Rutas del sitio (respetan BASE_PATH si la tienda vive en una subcarpeta).

/** Prefijo del sitio: "" en la raíz del dominio, "/tienda" en una subcarpeta. */
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Convierte "/favoritos" en la URL con el prefijo. */
export const url = (path: string) => (path.startsWith('/') ? `${base}${path}` : path);

export const rutas = {
  inicio: url('/'),
  favoritos: url('/favoritos'),
  cuenta: url('/cuenta'),
  productos: url('/productos/'),
  /** Testimonios de clientes (vienen de WordPress: CPT UI + ACF). */
  opiniones: url('/opiniones/'),
  novedades: url('/novedades/'),
  reversibles: url('/reversibles/'),
  colecciones: url('/colecciones/'),
  coleccion: (slug: string) => url(`/colecciones/${slug}/`),
  nosotros: url('/nosotros/'),
  contacto: url('/contacto/'),
  carrito: url('/carrito/'),
  /** Página propia de cada producto (la que indexa Google). */
  producto: (slug: string) => url(`/producto/${slug}/`),
};
