// ============================================================================
//  Configuración de la tienda: lo único que hay que editar para una tienda nueva.
//  (Además: la URL de WooCommerce va en la variable PUBLIC_TIENDA_URL y el
//  dominio del frontend en SITE_URL — ver README.)
// ============================================================================

export const tienda = {
  marca: {
    nombre: 'SIRA',
    /** Ruta a un logo en /public (SVG o PNG). Vacío = se muestra el nombre como texto. */
    logo: '/img/logo-sira.png',
    /** Descripción para Google y al compartir el enlace. */
    descripcion:
      'SIRA Conscious Apparel: piezas únicas y prendas reversibles diseñadas con intención desde Costa Rica.',
  },

  /** App instalable (PWA): «Agregar a la pantalla de inicio» en el celular. */
  app: {
    /** Nombre bajo el ícono (corto, hasta ~12 letras). Vacío = nombre de la marca. */
    nombreCorto: '',
    /** Ícono cuadrado en /public (SVG o PNG de 512 px o más). */
    icono: '/favicon.svg',
    /** Fondo detrás del ícono en Android/iPhone (se ve en los bordes). */
    fondoIcono: '#fdfaf6',
    /** Fondo de la pantalla mientras abre la app. */
    fondo: '#fdfaf6',
  },

  /** SEO: cómo aparece la tienda en Google y al compartir un enlace. */
  seo: {
    /** Título de la portada en Google (hasta ~60 caracteres). Vacío = nombre de la marca. */
    tituloInicio: 'SIRA · Piezas únicas y prendas reversibles · Costa Rica',
    /** Imagen al compartir la portada (1200×630, archivo en /public). Vacío = foto del primer producto. */
    imagenCompartir: '',
    /** Perfiles oficiales (Facebook, Instagram, TikTok…) para los datos estructurados. */
    redes: ['https://www.instagram.com/siraconsciousapparel/'] as string[],
  },

  /** Colores de la marca. Se aplican a toda la tienda. */
  colores: {
    /** Títulos, precios y textos fuertes. */
    primario: '#1c1a18',
    /** Íconos y enlaces secundarios. */
    secundario: '#6a635c',
    /** Botones principales, contadores y «pasar». */
    acento: '#1c1a18',
    /** Botones principales al pasar el mouse. */
    acentoOscuro: '#000000',
    /** Texto normal. */
    texto: '#292621',
    /** Bordes suaves. */
    borde: '#e7e2db',
    /** Fondo suave de las fotos y del degradado de la página. */
    suave: '#f7f2eb',
    /** «Al carrito» y disponibilidad. */
    exito: '#5f7a4e',
    /** Favoritos y etiqueta «Reversible». */
    favorito: '#ac8338',
  },

  /** Tipografías de Google Fonts (familia y pesos). */
  fuentes: {
    texto: { familia: 'Montserrat', pesos: [400, 500, 600, 700] },
    titulos: { familia: 'Cormorant Garamond', pesos: [300, 400] },
  },

  /** País de envío: formatos, moneda y regiones del formulario de entrega. */
  pais: {
    codigo: 'CR', // código ISO de WooCommerce
    locale: 'es-CR', // formato de números y fechas
    /** Provincias / estados con el código que usa WooCommerce (Ajustes → General). */
    regiones: [
      // Códigos que acepta ESTE WooCommerce (comprobado con la Store API; otras tiendas usan CR-SJ…).
      ['SJ', 'San José'],
      ['AL', 'Alajuela'],
      ['CG', 'Cartago'],
      ['HD', 'Heredia'],
      ['GT', 'Guanacaste'],
      ['PT', 'Puntarenas'],
      ['LM', 'Limón'],
    ] as [string, string][],
    etiquetaRegion: 'Provincia',
    etiquetaCiudad: 'Cantón',
    codigoPostal: {
      /** WooCommerce lo exige para algunos países (para CR sí). */
      requerido: true,
      patron: '[0-9]{5}',
      ayuda: '5 números',
    },
  },

  /** Nombres de los métodos de pago (id de WooCommerce → texto que ve el cliente). */
  pagos: {
    afinia_gateway: 'Tarjeta de crédito o débito',
    cod: 'Pago contra entrega',
    bacs: 'Transferencia bancaria',
    cheque: 'Cheque',
  } as Record<string, string>,

  /**
   * Prefijo de lo que se guarda en el navegador (carrito, favoritos, sesión).
   * Cambiarlo si hay dos tiendas en el mismo dominio.
   */
  prefijo: 'sira',
};

export type ConfigTienda = typeof tienda;
