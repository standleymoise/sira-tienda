import { tienda } from '../../tienda.config';

// Cliente de la Store API de WooCommerce y favoritos, compartido por las páginas de la tienda
// (inicio con swipe y /favoritos). Corre en el navegador.
//
// - El carrito se identifica con el encabezado Cart-Token (guardado en localStorage), así
//   funciona desde otro dominio sin cookies ni nonce.
// - Los favoritos son una lista de SKU en localStorage (no requieren cuenta).
// - La sesión del cliente es un token propio (X-Tienda-Token) que entrega el plugin
//   wordpress/mu-plugins/tienda-cuenta.php. Se envía también a la Store API, así WooCommerce
//   reconoce al cliente y el pedido queda en su cuenta.

export type Precio = { currency_code: string; currency_minor_unit: number };
export type Item = {
  key: string;
  id: number;
  name: string;
  quantity: number;
  images: { thumbnail: string; alt: string }[];
  totals: Precio & { line_total: string };
};
/** Datos del plugin de ejemplo tienda-extras.php (no existen si el plugin no está instalado). */
export type ExtrasCarrito = { nota_regalo: string; max: number };
export type Carrito = {
  items: Item[];
  items_count: number;
  payment_methods: string[];
  totals: Precio & { total_price: string };
  extensions?: { 'tienda-extras'?: ExtrasCarrito };
};
export type ProductoApi = {
  id: number;
  sku: string;
  name: string;
  short_description: string;
  description: string;
  is_purchasable: boolean;
  is_in_stock: boolean;
  stock_availability?: { text: string };
  images: { src: string; thumbnail?: string; srcset?: string; sizes?: string; alt: string }[];
  prices: Precio & { price: string };
  extensions?: { 'tienda-extras'?: { destacado?: string } };
};

/** Texto destacado del producto (plugin tienda-extras.php), o "". */
export const destacadoDe = (p: Pick<ProductoApi, 'extensions'>) => p.extensions?.['tienda-extras']?.destacado?.trim() ?? '';

const CLAVE_TOKEN = `${tienda.prefijo}-cart-token`;
const CLAVE_FAVS = `${tienda.prefijo}-favoritos`;
const CLAVE_SESION = `${tienda.prefijo}-sesion`;
const CLAVE_PERFIL = `${tienda.prefijo}-perfil`;
const ENCABEZADO_SESION = 'X-Tienda-Token';

export type Perfil = {
  email: string;
  nombre: string;
  apellidos: string;
  desde: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  postal: string;
};
export type Pedido = {
  numero: string;
  fecha: string;
  estado: string;
  estado_texto: string;
  total: number;
  moneda: string;
  pago: string;
  items: { nombre: string; cantidad: number; imagen: string }[];
};

// ---------- almacenamiento local (puede fallar en modo privado) ----------
export const leer = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
export const guardar = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* sin almacenamiento: los datos duran mientras la página esté abierta */
  }
};

// ---------- favoritos ----------
export function leerFavoritos(): Set<string> {
  try {
    const lista = JSON.parse(leer(CLAVE_FAVS) || '[]');
    return new Set(Array.isArray(lista) ? lista.map(String) : []);
  } catch {
    return new Set();
  }
}
export const guardarFavoritos = (favs: Set<string>) => guardar(CLAVE_FAVS, JSON.stringify([...favs]));

// ---------- sesión ----------
export const leerSesion = () => leer(CLAVE_SESION);
/** Perfil guardado al entrar (para pintar rápido el avatar y llenar el checkout). */
export function leerPerfil(): Perfil | null {
  try {
    return leerSesion() ? (JSON.parse(leer(CLAVE_PERFIL) || 'null') as Perfil | null) : null;
  } catch {
    return null;
  }
}
export function guardarSesion(token: string | null, perfil: Perfil | null = null) {
  guardar(CLAVE_SESION, token);
  guardar(CLAVE_PERFIL, token && perfil ? JSON.stringify(perfil) : null);
}
export const iniciales = (p: Pick<Perfil, 'nombre' | 'apellidos' | 'email'>) =>
  ((p.nombre?.[0] ?? '') + (p.apellidos?.[0] ?? '')).toUpperCase() || p.email[0].toUpperCase();

// ---------- formato ----------
export const formato = (valor: string, p: Precio) =>
  new Intl.NumberFormat(tienda.pais.locale, {
    style: 'currency',
    currency: p.currency_code,
    minimumFractionDigits: 0,
    maximumFractionDigits: p.currency_minor_unit,
  }).format(Number(valor) / 10 ** p.currency_minor_unit);

export const textoPlano = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent?.trim() || '';
};

// ---------- Store API ----------
export function crearCliente(API: string) {
  let token = leer(CLAVE_TOKEN);

  async function api<T>(ruta: string, cuerpo?: unknown, reintento = true): Promise<T> {
    // Sin Cart-Token, WooCommerce exige un nonce en los POST, y desde otro dominio no se
    // puede leer. Un GET /cart primero entrega el token y con él no hace falta el nonce.
    if (cuerpo !== undefined && !token) await api('/cart');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Cart-Token'] = token;
    const sesion = leerSesion();
    if (sesion) headers[ENCABEZADO_SESION] = sesion;
    const r = await fetch(API + ruta, {
      method: cuerpo === undefined ? 'GET' : 'POST',
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const nuevo = r.headers.get('Cart-Token');
    if (nuevo && nuevo !== token) {
      token = nuevo;
      guardar(CLAVE_TOKEN, token);
    }
    const datos = await r.json().catch(() => null);
    if (!r.ok) {
      // Token vencido o inválido: se empieza un carrito nuevo una sola vez.
      if ((r.status === 401 || r.status === 403) && token && reintento) {
        token = null;
        guardar(CLAVE_TOKEN, null);
        return api<T>(ruta, cuerpo, false);
      }
      throw new Error(datos?.message ? textoPlano(datos.message) : `Error ${r.status}`);
    }
    return datos as T;
  }

  // Rutas del plugin de cuentas: /wp-json/tienda/v1/… (misma base que la Store API).
  const WP = API.replace(/\/wc\/store\/v1\/?$/, '') + '/tienda/v1';
  async function cuentaApi<T>(ruta: string, cuerpo?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const sesion = leerSesion();
    if (sesion) headers[ENCABEZADO_SESION] = sesion;
    const r = await fetch(WP + ruta, {
      method: cuerpo === undefined ? 'GET' : 'POST',
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const datos = await r.json().catch(() => null);
    if (!r.ok) {
      // Sesión vencida o cerrada en otro lado.
      if (r.status === 401 && sesion && ruta === '/cuenta') guardarSesion(null);
      const err = new Error(datos?.message ? textoPlano(datos.message) : `Error ${r.status}`) as Error & {
        status?: number;
      };
      err.status = r.status;
      throw err;
    }
    return datos as T;
  }
  const entrarCon = async (ruta: string, cuerpo: unknown) => {
    const r = await cuentaApi<{ token: string; perfil: Perfil }>(ruta, cuerpo);
    guardarSesion(r.token, r.perfil);
    return r.perfil;
  };

  return {
    api,
    conSesion: () => !!leerSesion(),
    login: (email: string, password: string) => entrarCon('/login', { email, password }),
    registro: (datos: { email: string; password: string; nombre: string; apellidos: string }) =>
      entrarCon('/registro', datos),
    recuperar: (email: string) => cuentaApi<{ ok: boolean }>('/recuperar', { email }),
    cuenta: async () => {
      const r = await cuentaApi<{ perfil: Perfil; pedidos: Pedido[] }>('/cuenta');
      guardar(CLAVE_PERFIL, JSON.stringify(r.perfil));
      return r;
    },
    guardarCuenta: async (datos: Partial<Perfil>) => {
      const r = await cuentaApi<{ perfil: Perfil }>('/cuenta', datos);
      guardar(CLAVE_PERFIL, JSON.stringify(r.perfil));
      return r.perfil;
    },
    salir: async () => {
      await cuentaApi('/salir', {}).catch(() => {});
      guardarSesion(null);
    },
    tieneCarrito: () => !!token,
    productos: () => api<ProductoApi[]>('/products?per_page=100&orderby=title&order=asc'),
    carrito: () => api<Carrito>('/cart'),
    agregar: (id: number) => api<Carrito>('/cart/add-item', { id, quantity: 1 }),
    cambiar: (key: string, quantity: number) =>
      quantity > 0
        ? api<Carrito>('/cart/update-item', { key, quantity })
        : api<Carrito>('/cart/remove-item', { key }),
    /**
     * Guarda el mensaje de regalo en el carrito (plugin tienda-extras.php). Es la forma general de
     * mandar datos de un plugin al carrito: POST /cart/extensions con su espacio de nombres.
     */
    notaRegalo: (nota_regalo: string) =>
      api<Carrito>('/cart/extensions', { namespace: 'tienda-extras', data: { nota_regalo } }),
  };
}
