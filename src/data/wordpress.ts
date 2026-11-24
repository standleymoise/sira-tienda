// Contenido de WordPress (tipos creados con CPT UI y campos de ACF) leído al compilar.
//
// En WordPress, para cada tipo de contenido:
//   - CPT UI → el tipo: «Show in REST API» = Sí, y su «REST API base slug» (p. ej. testimonios).
//   - ACF → el grupo de campos de ese tipo: Ajustes → «Mostrar en la API REST» = Sí.
// La REST API de WordPress es pública (solo lo publicado): no hace falta ninguna clave.
// Al publicar o editar, el plugin wordpress/mu-plugins/tienda-publicar.php pide un build nuevo.

import { tiendaUrl } from './tienda';

/** Una entrada de WordPress tal como la devuelve /wp-json/wp/v2/<tipo> (con los campos que pedimos). */
export interface EntradaWp {
  id: number;
  slug: string;
  date: string;
  menu_order?: number;
  title: { rendered: string };
  acf?: Record<string, unknown>;
}

/** Quita etiquetas y entidades simples de los títulos que entrega WordPress («Ana &amp; Luis»). */
export const textoWp = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();

/**
 * Todas las entradas publicadas de un tipo de contenido.
 * - Sin PUBLIC_TIENDA_URL, o si el tipo todavía no existe en WordPress: lista vacía (la sección no se
 *   muestra y el build sigue). Así la plantilla compila aunque la tienda no use ACF.
 * - Si WordPress falla de otra forma, el build falla a propósito y queda publicada la versión anterior.
 */
export async function entradasWp(tipo: string): Promise<EntradaWp[]> {
  if (!tiendaUrl) return [];
  const lista: EntradaWp[] = [];
  for (let pagina = 1; ; pagina++) {
    const url =
      `${tiendaUrl}/wp-json/wp/v2/${tipo}?per_page=100&page=${pagina}` +
      // acf_format=standard: las imágenes llegan con URL y texto alternativo, no solo con su número.
      `&acf_format=standard&_fields=id,slug,date,menu_order,title,acf&orderby=date&order=desc`;
    const r = await fetch(url);
    if (r.status === 404) {
      const error = await r.json().catch(() => null);
      if (error?.code === 'rest_no_route') {
        console.warn(`[wordpress] El tipo «${tipo}» no existe o no está en la API REST: se omite.`);
        return [];
      }
    }
    if (!r.ok) throw new Error(`WordPress respondió ${r.status} en ${url}`);
    lista.push(...((await r.json()) as EntradaWp[]));
    if (pagina >= Number(r.headers.get('X-WP-TotalPages') ?? 1)) return lista;
  }
}
