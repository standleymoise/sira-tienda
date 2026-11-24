// Contenido fijo del sitio SIRA (textos del Figma, menú, colecciones y filtros), en español e inglés.
// Lo que cambia seguido (productos, precios, stock) viene de WooCommerce; esto es la parte editorial.
// Uso: menuPara(lang), coleccionesPara(lang), tiposDePrendaPara(lang), piePara(lang).
// Los nombres sin «Para» (menu, colecciones, tiposDePrenda, pie) son la versión en español.
import { crearRutas } from './rutas';
import type { Idioma } from '../i18n/idiomas';

import imgEntreLineas from '../assets/sira/entre-lineas-silueta.png';
import imgFragmenta from '../assets/sira/chaqueta-durazno.png';
import imgArchivo from '../assets/sira/crmoda-fucsia.png';
import imgReversibleB from '../assets/sira/reversible-cara-b.png';
import imgAtelier from '../assets/sira/atelier-textiles.png';

const tr = <T,>(lang: Idioma, es: T, en: T) => (lang === 'en' ? en : es);

/** Menú principal. Los que tienen «panel» abren el desplegable editorial (Figma: «Menú novedades»). */
export function menuPara(lang: Idioma) {
  const r = crearRutas(lang === 'en' ? '/en' : '');
  return [
    {
      id: 'novedades',
      texto: tr(lang, 'Novedades', 'New in'),
      href: r.novedades,
      panel: {
        indice: '01 / SIRA',
        titulo: tr(lang, 'Novedades', 'New in'),
        descripcion: tr(lang, 'Lo que acaba de llegar al universo SIRA.', 'Just arrived in the SIRA universe.'),
        enlaces: [
          { texto: tr(lang, 'Nuevas piezas', 'New pieces'), href: r.novedades },
          { texto: tr(lang, 'Nueva colección', 'New collection'), href: r.coleccion('entre-lineas') },
        ],
        imagen: imgFragmenta,
        imagenAlt: tr(lang, 'Chaqueta bordada durazno SIRA', 'SIRA peach embroidered jacket'),
        firma: tr(lang, 'Diseñado con intención', 'Designed with intention'),
      },
    },
    {
      id: 'reversibles',
      texto: tr(lang, 'Reversibles', 'Reversibles'),
      href: r.reversibles,
      panel: {
        indice: '02 / SIRA',
        titulo: tr(lang, 'Reversibles', 'Reversibles'),
        descripcion: tr(lang, 'Una pieza, dos posibilidades.', 'One piece, two possibilities.'),
        enlaces: [
          { texto: tr(lang, 'Reversibles de mujer', 'Women’s reversibles'), href: `${r.reversibles}?genero=mujer#piezas` },
          { texto: tr(lang, 'Reversibles de hombre', 'Men’s reversibles'), href: `${r.reversibles}?genero=hombre#piezas` },
          { texto: tr(lang, 'La historia reversible', 'The reversible story'), href: `${r.reversibles}#historia` },
        ],
        imagen: imgReversibleB,
        imagenAlt: tr(lang, 'Chaqueta reversible SIRA, cara B', 'SIRA reversible jacket, side B'),
        firma: tr(lang, 'Dos caras. Una misma esencia.', 'Two sides. One essence.'),
      },
    },
    {
      id: 'colecciones',
      texto: tr(lang, 'Colecciones', 'Collections'),
      href: r.colecciones,
      panel: {
        indice: '03 / SIRA',
        titulo: tr(lang, 'Colecciones', 'Collections'),
        descripcion: tr(
          lang,
          'Universo SIRA: colecciones, cápsulas y archivo.',
          'The SIRA universe: collections, capsules and archive.',
        ),
        enlaces: [
          { texto: 'Entre Líneas', href: r.coleccion('entre-lineas') },
          { texto: 'Fragmenta', href: r.coleccion('fragmenta') },
          { texto: tr(lang, 'Archivo', 'Archive'), href: r.coleccion('archivo') },
        ],
        imagen: imgEntreLineas,
        imagenAlt: tr(lang, 'Colección Entre Líneas SIRA', 'SIRA Entre Líneas collection'),
        firma: tr(lang, 'Piezas de edición corta', 'Short-run pieces'),
      },
    },
    { id: 'tienda', texto: tr(lang, 'Tienda', 'Shop'), href: r.productos },
    {
      id: 'nosotros',
      texto: tr(lang, 'Nosotros', 'About'),
      href: r.nosotros,
      panel: {
        indice: '05 / SIRA',
        titulo: tr(lang, 'Nosotros', 'About'),
        descripcion: 'Costa Rican spirit. Global mindset.',
        enlaces: [
          { texto: tr(lang, 'Nuestra historia', 'Our story'), href: r.nosotros },
          { texto: tr(lang, 'La diseñadora', 'The designer'), href: `${r.nosotros}#disenadora` },
          { texto: tr(lang, 'Nuestra filosofía', 'Our philosophy'), href: `${r.nosotros}#filosofia` },
        ],
        imagen: imgAtelier,
        imagenAlt: tr(lang, 'Atelier y textiles SIRA', 'SIRA atelier and textiles'),
        firma: tr(lang, 'Desde Costa Rica', 'From Costa Rica'),
      },
    },
    { id: 'contacto', texto: tr(lang, 'Contacto', 'Contact'), href: r.contacto },
  ] as const;
}
export const menu = menuPara('es');

export type IdMenu = 'novedades' | 'reversibles' | 'colecciones' | 'tienda' | 'nosotros' | 'contacto';

/**
 * Colecciones. «categoria» es el slug de la categoría de WooCommerce con las piezas de la colección:
 * mientras no exista, la página muestra el texto editorial y un aviso de «pronto».
 */
export function coleccionesPara(lang: Idioma) {
  return [
    {
      slug: 'entre-lineas',
      etiqueta: tr(lang, 'Colección actual', 'Current collection'),
      etiquetaPagina: tr(lang, 'Nueva colección', 'New collection'),
      nombre: 'ENTRE LÍNEAS',
      lema: 'Where geometry meets the organic.',
      texto: tr(
        lang,
        'Líneas gráficas, proporciones limpias y textiles con textura orgánica conviven en prendas reversibles y siluetas atemporales.',
        'Graphic lines, clean proportions and organically textured textiles come together in reversible garments and timeless silhouettes.',
      ),
      imagen: imgEntreLineas,
      imagenAlt: tr(lang, 'Colección Entre Líneas SIRA', 'SIRA Entre Líneas collection'),
      categoria: 'entre-lineas',
    },
    {
      slug: 'fragmenta',
      etiqueta: tr(lang, 'Colección cápsula', 'Capsule collection'),
      etiquetaPagina: tr(lang, 'Colección cápsula', 'Capsule collection'),
      nombre: 'FRAGMENTA',
      lema: tr(lang, 'Textiles recuperados, memoria y contraste.', 'Reclaimed textiles, memory and contrast.'),
      texto: tr(
        lang,
        'Piezas irrepetibles construidas a partir de remanentes textiles, bordados botánicos y combinaciones inesperadas.',
        'One-of-a-kind pieces built from textile remnants, botanical embroidery and unexpected combinations.',
      ),
      imagen: imgFragmenta,
      imagenAlt: tr(lang, 'Colección Fragmenta SIRA', 'SIRA Fragmenta collection'),
      categoria: 'fragmenta',
    },
    {
      slug: 'archivo',
      etiqueta: tr(lang, 'Archivo SIRA', 'SIRA archive'),
      etiquetaPagina: tr(lang, 'Archivo SIRA', 'SIRA archive'),
      nombre: tr(lang, 'ARCHIVO', 'ARCHIVE'),
      lema: tr(lang, 'Piezas de pasarela y ediciones históricas.', 'Runway pieces and historic editions.'),
      texto: tr(
        lang,
        'Un recorrido por las prendas escultóricas y siluetas clave que han definido la evolución estética de la casa.',
        'A journey through the sculptural garments and key silhouettes that have shaped the house’s aesthetic evolution.',
      ),
      imagen: imgArchivo,
      imagenAlt: tr(lang, 'Archivo SIRA: vestido de pasarela', 'SIRA archive: runway dress'),
      categoria: 'archivo',
    },
  ];
}
export const colecciones = coleccionesPara('es');

/**
 * Filtros por tipo de prenda (Figma: Ver todo · Chaquetas · Blusas y tops · …).
 * «categorias»: slugs de WooCommerce que cuentan como ese tipo.
 */
export function tiposDePrendaPara(lang: Idioma) {
  return [
    { id: 'chaquetas', texto: tr(lang, 'Chaquetas', 'Jackets'), categorias: ['chaquetas', 'chaquetas-reversibles'] },
    { id: 'blusas', texto: tr(lang, 'Blusas y tops', 'Blouses & tops'), categorias: ['blusas', 'blusas-y-tops', 'tops'] },
    { id: 'vestidos', texto: tr(lang, 'Vestidos', 'Dresses'), categorias: ['vestidos'] },
    { id: 'faldas', texto: tr(lang, 'Faldas', 'Skirts'), categorias: ['faldas'] },
    { id: 'pantalones', texto: tr(lang, 'Pantalones', 'Trousers'), categorias: ['pantalones'] },
  ];
}
export const tiposDePrenda = tiposDePrendaPara('es');

/** Categoría de WooCommerce de «Novedades» (si no existe o está vacía, se muestran todas). */
export const categoriaNovedades = 'nuevos-ingresos';

/** Pie de página (Figma: «Pie de página»). */
export function piePara(lang: Idioma) {
  const r = crearRutas(lang === 'en' ? '/en' : '');
  return {
    filosofia: tr(
      lang,
      ['Piezas únicas y prendas reversibles', 'diseñadas con intención desde Costa Rica.'],
      ['Unique pieces and reversible garments', 'designed with intention from Costa Rica.'],
    ),
    instagram: { texto: 'Instagram · @siraconsciousapparel', href: 'https://www.instagram.com/siraconsciousapparel/' },
    columnas: [
      {
        titulo: tr(lang, 'Explorar', 'Explore'),
        enlaces: [
          { texto: tr(lang, 'Novedades', 'New in'), href: r.novedades },
          { texto: tr(lang, 'Reversibles', 'Reversibles'), href: r.reversibles },
          { texto: tr(lang, 'Colecciones', 'Collections'), href: r.colecciones },
          { texto: tr(lang, 'Tienda', 'Shop'), href: r.productos },
        ],
      },
      {
        titulo: tr(lang, 'Universo SIRA', 'SIRA universe'),
        enlaces: [
          { texto: tr(lang, 'SIRA - Nuestra historia', 'SIRA - Our story'), href: r.nosotros },
          { texto: tr(lang, 'La diseñadora', 'The designer'), href: `${r.nosotros}#disenadora` },
          { texto: tr(lang, 'Nuestra filosofía', 'Our philosophy'), href: `${r.nosotros}#filosofia` },
          { texto: tr(lang, 'Diseño consciente', 'Conscious design'), href: `${r.nosotros}#consciente` },
          { texto: tr(lang, 'Historias', 'Stories'), href: `${r.inicio}#historias` },
        ],
      },
      {
        titulo: tr(lang, 'Contacto y servicio', 'Contact & service'),
        enlaces: [
          { texto: tr(lang, 'Contacto', 'Contact'), href: r.contacto },
          { texto: tr(lang, 'Envíos y devoluciones', 'Shipping & returns'), href: `${r.contacto}#servicio` },
          { texto: tr(lang, 'Guía de tallas', 'Size guide'), href: `${r.contacto}#servicio` },
          { texto: tr(lang, 'Preguntas frecuentes', 'FAQ'), href: `${r.contacto}#servicio` },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} SIRA Conscious Apparel · Costa Rica`,
    legales: [
      { texto: tr(lang, 'Términos', 'Terms'), href: `${r.contacto}#servicio` },
      { texto: tr(lang, 'Privacidad', 'Privacy'), href: `${r.contacto}#servicio` },
    ],
  };
}
export const pie = piePara('es');
