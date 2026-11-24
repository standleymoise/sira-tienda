// Idiomas del sitio: español (raíz) e inglés (/en/…).
// Cada página .astro recibe `lang` por props (por defecto «es»); la versión en inglés vive en
// src/pages/en/ y solo reutiliza la página en español con lang="en". Los textos de cada página
// están en la misma página: const t = { es: {…}, en: {…} }[lang].
import { base } from '../data/rutas';

export type Idioma = 'es' | 'en';
export const idiomas: Idioma[] = ['es', 'en'];

/** Para Intl, <html lang> y Open Graph. */
export const locale: Record<Idioma, string> = { es: 'es-CR', en: 'en-US' };

/** Idioma de una URL (por su ruta). */
export function idiomaDe(url: URL): Idioma {
  const ruta = url.pathname.slice(base.length);
  return ruta === '/en' || ruta.startsWith('/en/') ? 'en' : 'es';
}

/** La misma página en el otro idioma (para el selector ES | EN y las etiquetas hreflang). */
export function rutaEn(url: URL, destino: Idioma): string {
  let ruta = url.pathname.slice(base.length) || '/';
  if (ruta === '/en') ruta = '/en/';
  const sinIdioma = ruta.startsWith('/en/') ? ruta.slice(3) : ruta;
  return base + (destino === 'en' ? `/en${sinIdioma}` : sinIdioma);
}
