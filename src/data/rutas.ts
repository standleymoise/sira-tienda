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
  /** Página propia de cada producto (la que indexa Google). */
  producto: (slug: string) => url(`/producto/${slug}/`),
};
