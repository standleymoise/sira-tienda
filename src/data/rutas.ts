// Rutas del sitio (respetan BASE_PATH si la tienda vive en una subcarpeta).

/** Prefijo del sitio: "" en la raíz del dominio, "/tienda" en una subcarpeta. */
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Convierte "/favoritos" en la URL con el prefijo. */
export const url = (path: string) => (path.startsWith('/') ? `${base}${path}` : path);

/** Rutas de un idioma: «» = español (raíz), «/en» = inglés. */
export const crearRutas = (pre: '' | '/en' = '') => ({
  inicio: url(`${pre}/`),
  favoritos: url(`${pre}/favoritos`),
  cuenta: url(`${pre}/cuenta`),
  productos: url(`${pre}/productos/`),
  /** Testimonios de clientes (vienen de WordPress: CPT UI + ACF). */
  opiniones: url(`${pre}/opiniones/`),
  novedades: url(`${pre}/novedades/`),
  reversibles: url(`${pre}/reversibles/`),
  colecciones: url(`${pre}/colecciones/`),
  coleccion: (slug: string) => url(`${pre}/colecciones/${slug}/`),
  nosotros: url(`${pre}/nosotros/`),
  contacto: url(`${pre}/contacto/`),
  carrito: url(`${pre}/carrito/`),
  /** Página propia de cada producto (la que indexa Google). */
  producto: (slug: string) => url(`${pre}/producto/${slug}/`),
});

/** Rutas en español (por defecto). */
export const rutas = crearRutas('');
/** Rutas en inglés (/en/…). */
export const rutasEn = crearRutas('/en');
/** Rutas del idioma indicado. */
export const rutasPara = (lang: 'es' | 'en') => (lang === 'en' ? rutasEn : rutas);
