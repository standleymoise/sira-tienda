// Catálogo de WooCommerce leído al compilar (carga instantánea de la página).
//
// PUBLIC_TIENDA_URL = URL del WordPress + WooCommerce (p. ej. https://tienda.midominio.com).
// Astro lee la Store API pública (sin claves) al compilar; en el navegador la tienda vuelve a
// consultarla al abrirse, así precios y stock siempre están al día.
// Sin la variable, la tienda muestra cómo configurarla.

import { tienda } from '../../tienda.config';

/** URL de la tienda sin la barra final, o "" si el modo tienda está apagado. */
export const tiendaUrl = (import.meta.env.PUBLIC_TIENDA_URL ?? '').trim().replace(/\/+$/, '');
export const tiendaActiva = tiendaUrl !== '';

export interface Producto {
  id: number;
  sku: string;
  /** Parte final de la URL (/producto/<slug>/), la misma que en WooCommerce. */
  slug: string;
  nombre: string;
  resumen: string;
  /** Descripción larga, en párrafos de texto plano. */
  descripcion: string[];
  precio: string;
  /** Precio antes de la oferta (texto), solo si hay rebaja. */
  precioAntes?: string;
  /** Precio como número decimal («5900», «19.99») y moneda ISO, para los datos estructurados. */
  precioNumero: string;
  moneda: string;
  categorias: string[];
  enStock: boolean;
  /** «50 disponibles», «Agotado»… tal como lo dice WooCommerce. */
  stockTexto: string;
  imagen?: { src: string; alt: string };
  imagenes: { src: string; alt: string }[];
  /** Ficha del producto en la tienda. */
  fichaUrl: string;
  /**
   * Texto destacado («Envío gratis»…) del plugin de ejemplo wordpress/mu-plugins/tienda-extras.php.
   * Vacío si el plugin no está instalado o el producto no lo tiene.
   */
  destacado: string;
}

interface StoreApiProducto {
  id: number;
  sku: string;
  slug: string;
  name: string;
  permalink: string;
  categories?: { name: string }[];
  short_description: string;
  description: string;
  stock_availability?: { text: string };
  is_purchasable: boolean;
  is_in_stock: boolean;
  images: { src: string; alt: string }[];
  prices: {
    price: string;
    regular_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  /** Datos que agregan los plugins con ExtendSchema, por espacio de nombres. */
  extensions?: { 'tienda-extras'?: { destacado?: string } };
}

const sinHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Precio en unidades menores («6500») → texto con el formato del país («₡6 500»). */
export const formatoPrecio = (valor: string, moneda: string, decimales: number) =>
  new Intl.NumberFormat(tienda.pais.locale, {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(Number(valor) / 10 ** decimales);

const parrafos = (html: string) =>
  html
    .split(/<\/p>|<br\s*\/?>|\n{2,}/i)
    .map(sinHtml)
    .filter(Boolean);

const aProducto = (p: StoreApiProducto): Producto => ({
  id: p.id,
  sku: p.sku,
  slug: p.slug || String(p.id),
  nombre: p.name,
  resumen: sinHtml(p.short_description),
  descripcion: parrafos(p.description),
  precio: formatoPrecio(p.prices.price, p.prices.currency_code, p.prices.currency_minor_unit),
  precioAntes:
    Number(p.prices.regular_price) > Number(p.prices.price)
      ? formatoPrecio(p.prices.regular_price, p.prices.currency_code, p.prices.currency_minor_unit)
      : undefined,
  precioNumero: (Number(p.prices.price) / 10 ** p.prices.currency_minor_unit).toFixed(p.prices.currency_minor_unit),
  moneda: p.prices.currency_code,
  categorias: (p.categories ?? []).map((c) => c.name),
  enStock: p.is_purchasable && p.is_in_stock,
  stockTexto: p.stock_availability?.text || (p.is_in_stock ? 'Disponible' : 'Agotado'),
  imagen: p.images[0] ? { src: p.images[0].src, alt: p.images[0].alt || p.name } : undefined,
  imagenes: p.images.map((i) => ({ src: i.src, alt: i.alt || p.name })),
  fichaUrl: p.permalink,
  destacado: p.extensions?.['tienda-extras']?.destacado?.trim() ?? '',
});

let cache: Promise<Producto[]> | undefined;

/** Todos los productos publicados. Una sola petición por compilación. */
export function getProductos(): Promise<Producto[]> {
  if (!tiendaActiva) return Promise.resolve([]);
  cache ??= fetch(`${tiendaUrl}/wp-json/wc/store/v1/products?per_page=100&orderby=title&order=asc`).then(
    async (r) => {
      // Si la tienda no responde, la compilación falla a propósito:
      // así no se publica un sitio sin precios y queda la versión anterior.
      if (!r.ok) throw new Error(`La tienda respondió ${r.status} en ${r.url}`);
      return ((await r.json()) as StoreApiProducto[]).map(aProducto);
    },
  );
  return cache;
}

/** Base de la Store API, para el carrito y el checkout desde el navegador. */
export const storeApiUrl = tiendaActiva ? `${tiendaUrl}/wp-json/wc/store/v1` : '';

/** Producto por SKU. */
export async function getProducto(sku: string) {
  return (await getProductos()).find((p) => p.sku === sku);
}
