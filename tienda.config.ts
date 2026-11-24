// ============================================================================
//  Configuración de la tienda: lo único que hay que editar para una tienda nueva.
//  (Además: la URL de WooCommerce va en la variable PUBLIC_TIENDA_URL y el
//  dominio del frontend en SITE_URL — ver README.)
// ============================================================================

export const tienda = {
  marca: {
    nombre: 'Mi Tienda',
    /** Ruta a un logo en /public (SVG o PNG). Vacío = se muestra el nombre como texto. */
    logo: '',
    /** Descripción para Google y al compartir el enlace. */
    descripcion: 'Descubra nuestros productos deslizando: a la derecha al carrito, arriba a favoritos.',
  },

  /** App instalable (PWA): «Agregar a la pantalla de inicio» en el celular. */
  app: {
    /** Nombre bajo el ícono (corto, hasta ~12 letras). Vacío = nombre de la marca. */
    nombreCorto: '',
    /** Ícono cuadrado en /public (SVG o PNG de 512 px o más). */
    icono: '/favicon.svg',
    /** Fondo detrás del ícono en Android/iPhone (se ve en los bordes). */
    fondoIcono: '#ffffff',
    /** Fondo de la pantalla mientras abre la app. */
    fondo: '#ffffff',
  },

  /** SEO: cómo aparece la tienda en Google y al compartir un enlace. */
  seo: {
    /** Título de la portada en Google (hasta ~60 caracteres). Vacío = nombre de la marca. */
    tituloInicio: '',
    /** Imagen al compartir la portada (1200×630, archivo en /public). Vacío = foto del primer producto. */
    imagenCompartir: '',
    /** Perfiles oficiales (Facebook, Instagram, TikTok…) para los datos estructurados. */
    redes: [] as string[],
  },

  /** Colores de la marca. Se aplican a toda la tienda. */
  colores: {
    /** Títulos, precios y textos fuertes. */
    primario: '#0a4383',
    /** Íconos y enlaces secundarios. */
    secundario: '#0474ba',
    /** Botones principales, contadores y «pasar». */
    acento: '#ed2853',
    /** Botones principales al pasar el mouse. */
    acentoOscuro: '#d11a43',
    /** Texto normal. */
    texto: '#526377',
    /** Bordes suaves. */
    borde: 'rgba(4, 116, 186, 0.29)',
    /** Fondo suave de las fotos y del degradado de la página. */
    suave: '#e7f1ff',
    /** «Al carrito» y disponibilidad. */
    exito: '#17a35c',
    /** Favoritos. */
    favorito: '#f0a500',
  },

  /** Tipografías de Google Fonts (familia y pesos). */
  fuentes: {
    texto: { familia: 'Inter', pesos: [400, 500, 600, 700] },
    titulos: { familia: 'Sarabun', pesos: [500, 800] },
  },

  /** País de envío: formatos, moneda y regiones del formulario de entrega. */
  pais: {
    codigo: 'CR', // código ISO de WooCommerce
    locale: 'es-CR', // formato de números y fechas
    /** Provincias / estados con el código que usa WooCommerce (Ajustes → General). */
    regiones: [
      ['CR-SJ', 'San José'],
      ['CR-A', 'Alajuela'],
      ['CR-C', 'Cartago'],
      ['CR-H', 'Heredia'],
      ['CR-G', 'Guanacaste'],
      ['CR-P', 'Puntarenas'],
      ['CR-L', 'Limón'],
    ] as [string, string][],
    etiquetaRegion: 'Provincia',
    etiquetaCiudad: 'Cantón / ciudad',
    codigoPostal: {
      /** WooCommerce lo exige para algunos países (para CR sí). */
      requerido: true,
      patron: '[0-9]{5}',
      ayuda: '5 números',
    },
  },

  /** Nombres de los métodos de pago (id de WooCommerce → texto que ve el cliente). */
  pagos: {
    cod: 'Pago contra entrega',
    bacs: 'Transferencia bancaria',
    cheque: 'Cheque',
  } as Record<string, string>,

  /**
   * Prefijo de lo que se guarda en el navegador (carrito, favoritos, sesión).
   * Cambiarlo si hay dos tiendas en el mismo dominio.
   */
  prefijo: 'tienda',
};

export type ConfigTienda = typeof tienda;
