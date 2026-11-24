// Contenido fijo del sitio SIRA (textos del Figma, menú, colecciones y filtros).
// Lo que cambia seguido (productos, precios, stock) viene de WooCommerce; esto es la parte editorial.
import { rutas } from './rutas';

import imgEntreLineas from '../assets/sira/entre-lineas-silueta.png';
import imgFragmenta from '../assets/sira/chaqueta-durazno.png';
import imgArchivo from '../assets/sira/crmoda-fucsia.png';
import imgReversibleB from '../assets/sira/reversible-cara-b.png';
import imgAtelier from '../assets/sira/atelier-textiles.png';

/** Menú principal. Los que tienen «panel» abren el desplegable editorial (Figma: «Menú novedades»). */
export const menu = [
  {
    id: 'novedades',
    texto: 'Novedades',
    href: rutas.novedades,
    panel: {
      indice: '01 / SIRA',
      titulo: 'Novedades',
      descripcion: 'Lo que acaba de llegar al universo SIRA.',
      enlaces: [
        { texto: 'Nuevas piezas', href: rutas.novedades },
        { texto: 'Nueva colección', href: rutas.coleccion('entre-lineas') },
      ],
      imagen: imgFragmenta,
      imagenAlt: 'Chaqueta bordada durazno SIRA',
      firma: 'Diseñado con intención',
    },
  },
  {
    id: 'reversibles',
    texto: 'Reversibles',
    href: rutas.reversibles,
    panel: {
      indice: '02 / SIRA',
      titulo: 'Reversibles',
      descripcion: 'Una pieza, dos posibilidades.',
      enlaces: [
        { texto: 'Reversibles de mujer', href: `${rutas.reversibles}?genero=mujer#piezas` },
        { texto: 'Reversibles de hombre', href: `${rutas.reversibles}?genero=hombre#piezas` },
        { texto: 'La historia reversible', href: `${rutas.reversibles}#historia` },
      ],
      imagen: imgReversibleB,
      imagenAlt: 'Chaqueta reversible SIRA, cara B',
      firma: 'Dos caras. Una misma esencia.',
    },
  },
  {
    id: 'colecciones',
    texto: 'Colecciones',
    href: rutas.colecciones,
    panel: {
      indice: '03 / SIRA',
      titulo: 'Colecciones',
      descripcion: 'Universo SIRA: colecciones, cápsulas y archivo.',
      enlaces: [
        { texto: 'Entre Líneas', href: rutas.coleccion('entre-lineas') },
        { texto: 'Fragmenta', href: rutas.coleccion('fragmenta') },
        { texto: 'Archivo', href: rutas.coleccion('archivo') },
      ],
      imagen: imgEntreLineas,
      imagenAlt: 'Colección Entre Líneas SIRA',
      firma: 'Piezas de edición corta',
    },
  },
  { id: 'tienda', texto: 'Tienda', href: rutas.productos },
  {
    id: 'nosotros',
    texto: 'Nosotros',
    href: rutas.nosotros,
    panel: {
      indice: '05 / SIRA',
      titulo: 'Nosotros',
      descripcion: 'Costa Rican spirit. Global mindset.',
      enlaces: [
        { texto: 'Nuestra historia', href: rutas.nosotros },
        { texto: 'La diseñadora', href: `${rutas.nosotros}#disenadora` },
        { texto: 'Nuestra filosofía', href: `${rutas.nosotros}#filosofia` },
      ],
      imagen: imgAtelier,
      imagenAlt: 'Atelier y textiles SIRA',
      firma: 'Desde Costa Rica',
    },
  },
  { id: 'contacto', texto: 'Contacto', href: rutas.contacto },
] as const;

export type IdMenu = (typeof menu)[number]['id'];

/**
 * Colecciones. «categoria» es el slug de la categoría de WooCommerce con las piezas de la colección:
 * mientras no exista, la página muestra el texto editorial y un aviso de «pronto».
 */
export const colecciones = [
  {
    slug: 'entre-lineas',
    etiqueta: 'Colección actual',
    etiquetaPagina: 'Nueva colección',
    nombre: 'ENTRE LÍNEAS',
    lema: 'Where geometry meets the organic.',
    texto:
      'Líneas gráficas, proporciones limpias y textiles con textura orgánica conviven en prendas reversibles y siluetas atemporales.',
    imagen: imgEntreLineas,
    imagenAlt: 'Colección Entre Líneas SIRA',
    categoria: 'entre-lineas',
  },
  {
    slug: 'fragmenta',
    etiqueta: 'Colección cápsula',
    etiquetaPagina: 'Colección cápsula',
    nombre: 'FRAGMENTA',
    lema: 'Textiles recuperados, memoria y contraste.',
    texto:
      'Piezas irrepetibles construidas a partir de remanentes textiles, bordados botánicos y combinaciones inesperadas.',
    imagen: imgFragmenta,
    imagenAlt: 'Colección Fragmenta SIRA',
    categoria: 'fragmenta',
  },
  {
    slug: 'archivo',
    etiqueta: 'Archivo SIRA',
    etiquetaPagina: 'Archivo SIRA',
    nombre: 'ARCHIVO',
    lema: 'Piezas de pasarela y ediciones históricas.',
    texto:
      'Un recorrido por las prendas escultóricas y siluetas clave que han definido la evolución estética de la casa.',
    imagen: imgArchivo,
    imagenAlt: 'Archivo SIRA: vestido de pasarela',
    categoria: 'archivo',
  },
];

/**
 * Filtros por tipo de prenda (Figma: Ver todo · Chaquetas · Blusas y tops · …).
 * «categorias»: slugs de WooCommerce que cuentan como ese tipo.
 */
export const tiposDePrenda = [
  { id: 'chaquetas', texto: 'Chaquetas', categorias: ['chaquetas', 'chaquetas-reversibles'] },
  { id: 'blusas', texto: 'Blusas y tops', categorias: ['blusas', 'blusas-y-tops', 'tops'] },
  { id: 'vestidos', texto: 'Vestidos', categorias: ['vestidos'] },
  { id: 'faldas', texto: 'Faldas', categorias: ['faldas'] },
  { id: 'pantalones', texto: 'Pantalones', categorias: ['pantalones'] },
];

/** Categoría de WooCommerce de «Novedades» (si no existe o está vacía, se muestran todas). */
export const categoriaNovedades = 'nuevos-ingresos';

/** Pie de página (Figma: «Pie de página»). */
export const pie = {
  filosofia: ['Piezas únicas y prendas reversibles', 'diseñadas con intención desde Costa Rica.'],
  instagram: { texto: 'Instagram · @siraconsciousapparel', href: 'https://www.instagram.com/siraconsciousapparel/' },
  columnas: [
    {
      titulo: 'Explorar',
      enlaces: [
        { texto: 'Novedades', href: rutas.novedades },
        { texto: 'Reversibles', href: rutas.reversibles },
        { texto: 'Colecciones', href: rutas.colecciones },
        { texto: 'Tienda', href: rutas.productos },
      ],
    },
    {
      titulo: 'Universo SIRA',
      enlaces: [
        { texto: 'SIRA - Nuestra historia', href: rutas.nosotros },
        { texto: 'La diseñadora', href: `${rutas.nosotros}#disenadora` },
        { texto: 'Nuestra filosofía', href: `${rutas.nosotros}#filosofia` },
        { texto: 'Diseño consciente', href: `${rutas.nosotros}#consciente` },
        { texto: 'Historias', href: `${rutas.inicio}#historias` },
      ],
    },
    {
      titulo: 'Contacto y servicio',
      enlaces: [
        { texto: 'Contacto', href: rutas.contacto },
        { texto: 'Envíos y devoluciones', href: `${rutas.contacto}#servicio` },
        { texto: 'Guía de tallas', href: `${rutas.contacto}#servicio` },
        { texto: 'Preguntas frecuentes', href: `${rutas.contacto}#servicio` },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} SIRA Conscious Apparel · Costa Rica`,
  legales: [
    { texto: 'Términos', href: `${rutas.contacto}#servicio` },
    { texto: 'Privacidad', href: `${rutas.contacto}#servicio` },
  ],
};
