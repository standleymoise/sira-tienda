# Astro + WooCommerce: plantilla de tienda

Base reutilizable para montar un e-commerce con:

- **Frontend en Astro**: tienda con tarjetas deslizables (→ carrito, ← pasar, ↑ favorito, ↓ detalle),
  favoritos, carrito, checkout y «Mi cuenta». A pantalla completa, responsive, sin salir del sitio.
- **Backend WordPress + WooCommerce**: productos, precios, stock, pedidos, clientes, correos y pagos.
- **Despliegue automático**: cada push a `main` publica en Hostinger (o cualquier hosting con Git).

```
Visitante ──► midominio.com (Astro, archivos estáticos)
                 │  catálogo, carrito, checkout y cuenta por API
                 ▼
              tienda.midominio.com (WordPress + WooCommerce)
                 · Store API de WooCommerce (viene incluida)
                 · 2 plugins mínimos de esta plantilla (wordpress/mu-plugins)
```

## Qué se configura por tienda

| Qué | Dónde |
|---|---|
| Nombre, logo, colores, fuentes, país, regiones, textos de pago, SEO | `tienda.config.ts` |
| URL de WooCommerce y dominio del frontend | Variables del repo en GitHub (`PUBLIC_TIENDA_URL`, `SITE_URL`) |
| Dominio permitido en WordPress | `wp-config.php` → `TIENDA_FRONTEND_ORIGINS` |
| Productos, precios, fotos, stock, envíos, pagos | WooCommerce (se ven en vivo, sin volver a publicar) |

El resto del código no hace falta tocarlo.

---

## Nueva tienda, paso a paso (≈ 30 minutos)

Ejemplo: frontend en `midominio.com` y WooCommerce en `tienda.midominio.com`.

### 1. WordPress + WooCommerce (Hostinger)

1. **Dominios → Subdominios**: crear `tienda.midominio.com`.
2. Instalar **WordPress** en ese subdominio (instalador automático) y luego el plugin **WooCommerce**.
3. En WooCommerce → Ajustes → General: país de la tienda y moneda.
4. Activar al menos un método de pago (para probar: «Contra reembolso» o «Transferencia bancaria»).
5. Subir `tienda-cors.php` y `tienda-cuenta.php` de `wordpress/mu-plugins/` (y, si se quiere el ejemplo de
   texto destacado y mensaje de regalo, `tienda-extras.php`) a `wp-content/mu-plugins/` (Administrador de archivos).
6. Editar `wp-config.php` y agregar, antes de `/* That's all, stop editing! */`:
   ```php
   define( 'TIENDA_FRONTEND_ORIGINS', 'https://midominio.com' );
   ```
7. Cargar productos con **SKU**, precio, foto y stock.

Detalles y cómo comprobarlo: [`wordpress/README.md`](wordpress/README.md).

### 2. El repositorio

1. En GitHub, en esta plantilla: **Use this template → Create a new repository**.
2. Editar `tienda.config.ts` (nombre, colores, país…). Logo opcional: ponerlo en `public/` y
   escribir su ruta en `marca.logo` (por ejemplo `'/logo.svg'`). Cambiar también `public/favicon.svg`.
3. **Settings → Secrets and variables → Actions → Variables**, crear:
   - `SITE_URL` = `https://midominio.com`
   - `PUBLIC_TIENDA_URL` = `https://tienda.midominio.com`
4. Hacer un commit a `main`: el workflow **Publicar en Hostinger** compila y deja el sitio en la rama `hostinger`.

### 3. Publicar el frontend (Hostinger)

1. En el sitio `midominio.com`: **Avanzado → GIT → Continue with GitHub**.
2. Elegir el repositorio y la rama **`hostinger`**, directorio `public_html`, y **Deploy**.
3. Listo: cada push a `main` vuelve a publicar solo (1–2 minutos).

> ⚠️ Si WordPress vive en una **carpeta** de este mismo dominio (en vez de un subdominio),
> no cree páginas en Astro con ese mismo nombre: Hostinger guarda los subdominios como carpetas
> dentro de `public_html`.

### 4. Probar

1. Abrir `https://midominio.com`: deben aparecer los productos.
2. Deslizar uno a la derecha → el contador del carrito sube.
3. Carrito → Finalizar compra → pedido con «Contra reembolso» → debe aparecer en WooCommerce → Pedidos.
4. `/cuenta` → crear cuenta → hacer otro pedido → debe salir en «Mis pedidos».

---

## Desarrollo local

```bash
npm install
cp .env.example .env     # y poner la URL de la tienda
npm run dev              # http://localhost:4321
```

En `localhost` el **catálogo** se ve (se lee al compilar), pero WooCommerce **no** deja usar el
carrito desde `localhost` (solo desde los dominios de `TIENDA_FRONTEND_ORIGINS`). Para probar el
carrito en local, agregue temporalmente `http://localhost:4321` a esa constante.

## Cómo funciona

| Pieza | Archivo |
|---|---|
| Configuración de la tienda | `tienda.config.ts` |
| Tienda con swipe, detalle, carrito y checkout | `src/components/TiendaSwipe.astro` |
| Favoritos (en el navegador, por SKU) | `src/pages/favoritos.astro` |
| Login, registro, recuperar contraseña y «Mi cuenta» | `src/pages/cuenta.astro` |
| Cliente de la Store API, sesión y favoritos | `src/scripts/tienda-api.ts` |
| Catálogo al compilar | `src/data/tienda.ts` |
| Colores, fuentes, estilos base y etiquetas SEO | `src/layouts/Base.astro` |
| Página de cada producto (la que indexa Google) | `src/pages/producto/[slug].astro` |
| Catálogo en lista | `src/pages/productos.astro` |
| App instalable: manifiesto, íconos, service worker, página sin conexión | `src/pages/manifest.webmanifest.ts`, `src/pages/iconos/`, `src/pages/sw.js.ts`, `src/pages/sin-conexion.astro`, `src/data/pwa.ts` |
| `robots.txt` y sitemap | `src/pages/robots.txt.ts`, `astro.config.mjs` |
| Redirección www → sin www, caché y página 404 en Hostinger | `public/.htaccess`, `public/_astro/.htaccess` |
| Plugins de WordPress (CORS, cuentas y el ejemplo de plugin propio) | `wordpress/mu-plugins/` |
| Despliegue | `.github/workflows/deploy-hostinger.yml` |

- **Precios y stock en vivo**: la página trae el catálogo del último build (carga instantánea) y al
  abrirse lo compara con WooCommerce; precios, stock, productos nuevos y borrados se actualizan solos.
  El carrito y el checkout siempre usan el precio actual porque los calcula WooCommerce.
- **Carrito**: Store API con el encabezado `Cart-Token` (guardado en el navegador). No usa cookies,
  por eso funciona entre dominios.
- **Cuentas**: el plugin `tienda-cuenta.php` entrega un token (`X-Tienda-Token`, 30 días). Con él, la
  Store API sabe quién compra y el pedido queda en su cuenta. Máximo 8 intentos por IP cada 15 minutos.
- **Plugins de WooCommerce**: los que cambian reglas (descuentos, impuestos, envíos, pagos que redirigen)
  se aplican solos porque el total lo calcula WooCommerce. Los que **muestran** algo (puntos, cajas en el
  checkout) hay que dibujarlos en Astro leyendo sus datos: de la Store API (si el plugin es compatible
  con «Cart & Checkout Blocks»), de su propia API REST o de un plugin mínimo como los de `wordpress/`.
- **Plugin propio, sin claves**: `tienda-extras.php` es el modelo. Agrega datos a la Store API
  (`extensions` del producto y del carrito) y recibe lo que elige el cliente por `POST /cart/extensions`.
  Las claves de la API de WooCommerce (`/wc/v3`) nunca van en el frontend. Ver `wordpress/README.md`.

## SEO y velocidad

Lo que ya trae la plantilla:

- **Una página por producto** en `/producto/<slug>/` (el mismo slug de WooCommerce) con título,
  descripción, foto para compartir y **datos estructurados** (`Product` con precio, moneda y
  disponibilidad, y `BreadcrumbList`), y `/productos/` con la lista enlazada. La portada con swipe
  enlaza a esa lista, así Google llega a todos los productos.
- **URL canónica**, Open Graph y tarjeta de X en todas las páginas; `noindex` en favoritos, cuenta y 404.
- **`sitemap-index.xml`** (sin las páginas personales) y **`robots.txt`** que lo anuncia.
- **Fotos** convertidas a WebP en varios tamaños al compilar; la primera carga con prioridad y las demás
  cuando se acercan a la pantalla.
- **Fuentes servidas desde el propio dominio** (no se pide nada a Google al abrir la página), con la
  principal precargada y fuentes de respaldo ajustadas para que el texto no salte.
- **`.htaccess`**: `www.` → dominio sin `www` (301), página 404 real, compresión y caché de un año para
  `/_astro/` (los nombres cambian en cada versión). Las páginas se revisan en cada visita.
- **Build diario** (4:00 en Costa Rica): precio, stock y productos nuevos del HTML y de los datos
  estructurados quedan al día aunque nadie haga push. Para que se actualice al instante al guardar un
  producto o un testimonio, subir `wordpress/mu-plugins/tienda-publicar.php` (ver «Contenido editable»).

Después de publicar:

1. **Google Search Console** → agregar el dominio → enviar `https://midominio.com/sitemap-index.xml`.
2. Probar una ficha en la [prueba de resultados enriquecidos](https://search.google.com/test/rich-results)
   y la velocidad en [PageSpeed Insights](https://pagespeed.web.dev/) (versión móvil).
3. **Que el WordPress no compita con el sitio**: en `tienda.midominio.com` → Ajustes → Lectura →
   «Pedir a los motores de búsqueda que no indexen este sitio». Si ya tenía un sitemap de Yoast/Rank
   Math en el subdominio, quitarlo de Search Console.
4. En `tienda.config.ts` → `seo`: título de la portada, imagen para compartir (1200×630, mejor JPG o
   PNG que WebP para WhatsApp) y perfiles de redes.

## Contenido editable desde WordPress (ACF + CPT UI)

Secciones que el dueño cambia sin tocar código: testimonios (incluido) y, copiando el ejemplo,
sucursales, preguntas frecuentes, equipo… Astro las lee de la REST API de WordPress **al compilar**
(sin claves: solo lo publicado) y las valida; las páginas siguen siendo estáticas y rápidas.

**En WordPress** (plugins *Advanced Custom Fields* y *Custom Post Type UI*):
1. CPT UI → Agregar tipo: slug `testimonios`, «Show in REST API» = **Sí**, REST base `testimonios`.
2. ACF → Grupo «Testimonio», ubicación «Tipo de contenido = testimonios», en Ajustes «Mostrar en la
   API REST» = **Sí**. Campos: `texto` (área de texto, obligatorio), `cargo` (texto), `estrellas`
   (número 1-5), `foto` (imagen). El título de la entrada es el nombre de la persona.
3. Comprobar: `https://tienda.midominio.com/wp-json/wp/v2/testimonios?acf_format=standard` muestra
   los testimonios con su bloque `acf`.

**En Astro**: `src/content.config.ts` (colección y validación), `src/data/wordpress.ts` (lectura con
paginación), `src/components/Testimonios.astro`. Se muestran 3 debajo de `/productos/` y todos en
`/opiniones/`; si no hay ninguno (o el tipo no existe), no aparece nada y `/opiniones/` no se genera.

**Que se publique solo al guardar**: subir `wordpress/mu-plugins/tienda-publicar.php` y en `wp-config.php`:
```php
define( 'TIENDA_GITHUB_REPO', 'usuario/mi-tienda' );
define( 'TIENDA_GITHUB_TOKEN', 'github_pat_…' );
// define( 'TIENDA_TIPOS_PUBLICAR', 'product,testimonios,sucursales' ); // por defecto: product,testimonios
```
El token lo crea el dueño en GitHub → Settings → Developer settings → *Fine-grained tokens*: solo este
repositorio, permiso *Contents: Read and write*, con vencimiento (y renovarlo). Vive solo en el
servidor. El plugin junta los cambios de un minuto en un aviso; el sitio se ve actualizado ~2 minutos
después. Si el aviso falla (token vencido, sin permiso), el escritorio de WordPress lo dice.

Otro tipo de contenido = copiar el bloque `testimonios` en `src/content.config.ts` con sus campos, un
componente que lo dibuje y agregarlo a `TIENDA_TIPOS_PUBLICAR`. Campos de relación o de entrada
devuelven números (IDs): resolverlos en el loader con otra consulta.

## App instalable (PWA)

En el celular, la tienda se puede agregar a la pantalla de inicio y abre como una app (sin barra del
navegador). Android/Chrome ofrece «Instalar app»; en iPhone: Compartir → «Agregar a inicio».

- **Nombre, ícono y colores**: bloque `app` de `tienda.config.ts`. Los PNG (192, 512, «maskable» y el
  de iPhone) se generan al compilar desde ese ícono; no hay que dibujarlos aparte.
- **Botón «Instalar app»** (`src/components/InstalarApp.astro`): aviso arriba de la pantalla a los
  4 segundos, solo si el navegador permite instalar (Android/Chrome/Edge) o en iPhone/iPad (ahí explica
  Compartir → «Agregar a inicio», porque Safari no tiene instalación directa). No sale si ya está
  instalada ni durante 14 días después de cerrarlo. En «Mi cuenta» hay además un botón fijo; cualquier
  elemento con `data-instalar-app hidden` funciona igual.
- **Sin conexión**: el service worker (`/sw.js`) guarda los archivos del sitio y las páginas visitadas.
  Sin internet se abren las páginas ya vistas y, si no, `/sin-conexion/`. **Nunca** guarda la API de
  WooCommerce (catálogo en vivo, carrito, cuenta, pagos): eso siempre va por la red.
- **Actualizaciones**: cada compilación genera un `sw.js` nuevo; el navegador lo cambia solo y borra
  la caché vieja. El `.htaccess` evita que `sw.js` y el manifiesto queden guardados en el navegador.
- Probar: Chrome → F12 → *Application* → *Manifest* (sin errores) y *Service workers* (activo); luego
  *Network → Offline* y recargar una página ya visitada.

## Antes de vender en serio

- [ ] Pasarela de pago real (en modo prueba primero) y probar un pago completo.
- [ ] Probar registro, login, recuperar contraseña y un pedido con sesión.
- [ ] Revisión de seguridad de los plugins de `wordpress/`.
- [ ] Páginas legales (términos, privacidad, devoluciones) y textos de envío.
- [ ] Correos de WooCommerce con la marca (WooCommerce → Ajustes → Correos electrónicos).
- [ ] Copias de seguridad de WordPress activadas en el hosting.
- [ ] Sitemap enviado a Search Console, WordPress en «no indexar» y nombre del sitio de WordPress
      igual a la marca (sale en los correos de pedido).
