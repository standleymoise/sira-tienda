// Colecciones de contenido. Cada una lee un tipo de contenido de WordPress (CPT UI + ACF) al compilar
// y valida sus campos: si en ACF falta un campo obligatorio, el build lo dice en vez de publicar una
// sección rota. Para agregar otro tipo (sucursales, preguntas frecuentes…), copiar «testimonios».
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { entradasWp, textoWp } from './data/wordpress';

/**
 * Testimonios — en WordPress:
 *   CPT UI: tipo «testimonios» (REST base «testimonios», «Show in REST API» = Sí).
 *   ACF, grupo «Testimonio» asignado a ese tipo y con «Mostrar en la API REST» = Sí:
 *     texto     Área de texto (obligatorio)  — lo que dijo el cliente
 *     cargo     Texto                        — «Mamá de Sofía», «Cliente desde 2024»…
 *     estrellas Número 1 a 5                 — vacío = no se muestran estrellas
 *     foto      Imagen                       — opcional
 *   El título de la entrada es el nombre de quien opina.
 */
const testimonios = defineCollection({
  loader: async () =>
    (await entradasWp('testimonios')).map((t) => {
      const acf = t.acf ?? {};
      return {
        id: t.slug || String(t.id),
        nombre: textoWp(t.title.rendered),
        fecha: t.date,
        texto: acf.texto,
        cargo: acf.cargo || undefined,
        estrellas: acf.estrellas === '' || acf.estrellas == null ? undefined : acf.estrellas,
        // ACF devuelve false cuando la imagen está vacía.
        foto: acf.foto && typeof acf.foto === 'object' ? acf.foto : undefined,
      };
    }),
  schema: z.object({
    nombre: z.string().min(1),
    fecha: z.string(),
    texto: z.string().min(1, 'El testimonio no tiene texto (campo ACF «texto»).'),
    cargo: z.string().optional(),
    estrellas: z.coerce.number().int().min(1).max(5).optional(),
    foto: z
      .object({ url: z.string().url(), alt: z.string().default('') })
      .passthrough()
      .optional(),
  }),
});

export const collections = { testimonios };
