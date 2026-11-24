# SIRA en un solo dominio (sin subdominio) — guía de migración

Hoy (vista previa):

```
standleymoise.github.io/sira-tienda/            → sitio en Astro (GitHub Pages)
darkseagreen-dogfish-296774.hostingersite.com   → WordPress + WooCommerce (dominio temporal de Hostinger)
```

Con el dominio propio (ejemplo `sira.cr`), todo en el mismo dominio y en el mismo hosting de Hostinger:

```
sira.cr/            → sitio en Astro        (carpeta public_html,        publicado por Git)
sira.cr/tienda/     → WordPress+WooCommerce (carpeta public_html/tienda, solo «backend»)
```

En Hostinger esto es exactamente igual que un subdominio por dentro (también sería la carpeta
`public_html/tienda`); solo cambia la dirección. Como todo queda en el mismo dominio, el carrito ya no
necesita el permiso CORS.

**Regla que no se rompe:** el sitio en Astro no puede tener una página `/tienda` (la Tienda es
`/productos/`). Así nunca choca con la carpeta de WordPress.

---

## 0. Antes de empezar

- Copia de seguridad del WordPress actual (Hostinger → Copias de seguridad, y/o All-in-One WP Migration,
  que ya está instalado).
- Elegir un momento sin ventas (la tienda queda unos minutos en mantenimiento).
- Tener a mano el panel de Afinia: hay que actualizar la dirección del aviso de pago (webhook).

## 1. Dominio en Hostinger

1. Comprar o conectar el dominio en hPanel → **Dominios**. Si se compró afuera, apuntar los DNS a Hostinger.
2. hPanel → **Sitios web → Agregar sitio** con ese dominio (vacío, sin instalar WordPress en la raíz).
3. Activar SSL (hPanel → Seguridad → SSL) y «forzar HTTPS».

## 2. Astro en la raíz (`public_html`)

1. En GitHub (`standleymoise/sira-tienda` → Settings → Secrets and variables → Actions → Variables):
   - `DESTINO` = `hostinger` (deja de publicar la vista previa en GitHub Pages)
   - `SITE_URL` = `https://sira.cr`
   - `PUBLIC_TIENDA_URL` = `https://sira.cr/tienda`
   - `BASE_PATH` = `/` (o borrarla)
2. Correr una vez el workflow «Publicar en Hostinger» (Actions → Run workflow): crea la rama `hostinger`.
   *(Va a fallar el build si WordPress todavía no responde en `sira.cr/tienda`: es a propósito para no
   publicar una tienda vacía. Hacer primero el paso 3, o correrlo dos veces.)*
3. hPanel → sitio `sira.cr` → **Avanzado → GIT**: repositorio `https://github.com/standleymoise/sira-tienda.git`,
   rama `hostinger`, carpeta vacía (= `public_html`). Activar el despliegue automático (webhook) que
   ofrece Hostinger y pegarlo en GitHub → Settings → Webhooks.

## 3. WordPress en `public_html/tienda`

Opción recomendada (copia limpia, cambia todas las direcciones sola):

1. En el WordPress actual: **All-in-One WP Migration → Exportar → Archivo**. Descargar el `.wpress`.
2. hPanel → sitio `sira.cr` → **WordPress → Instalar**, en el **directorio `tienda`**
   (queda en `sira.cr/tienda`). Usuario y contraseña nuevos (los pone el dueño).
3. En ese WordPress nuevo: instalar All-in-One WP Migration → **Importar** el `.wpress`.
   Reemplaza todo y cambia las direcciones de `darkseagreen-…hostingersite.com` a `sira.cr/tienda`
   (también dentro de Elementor, ACF y WooCommerce).
   *Si el archivo pesa más de lo que permite la versión gratuita, usar la herramienta de migración de
   Hostinger o pedirle a su soporte que mueva el sitio a esa carpeta.*
4. Entrar a `sira.cr/tienda/wp-admin` con el usuario del sitio viejo y revisar:
   - Ajustes → Generales: **Dirección de WordPress** y **Dirección del sitio** = `https://sira.cr/tienda`.
   - Ajustes → Enlaces permanentes → **Guardar** (regenera el `.htaccess` de la carpeta).
   - Ajustes → Lectura → **«Disuadir a los motores de búsqueda»** activado (Google ve la tienda de Astro).
5. Plugins del sitio en Astro (carpeta `wordpress/plugins/` del repo):
   - `sira-afinia-astro.php`: cambiar `SIRA_ASTRO_GRACIAS` a `https://sira.cr/carrito/` y
     `SIRA_ASTRO_GRACIAS_EN` a `https://sira.cr/en/carrito/`; volver a subirlo (Plugins → Añadir → Subir →
     «Reemplazar el actual»).
   - `sira-frontend-cors.php`: ya no hace falta (mismo dominio). Se puede desactivar; si se deja, poner
     `https://sira.cr` en `SIRA_FRONTEND_ORIGINS`.
6. **Afinia**: pedirles que la URL de aviso de pago (webhook) y la de regreso sean las de
   `https://sira.cr/tienda/…` (antes eran las del dominio temporal).

## 4. Publicar y probar

1. Hacer un cambio cualquiera o correr el workflow: GitHub compila con `sira.cr/tienda` y Hostinger lo publica.
2. Revisar:
   - `https://sira.cr/` abre el sitio en Astro; `https://sira.cr/en/` la versión en inglés.
   - `https://sira.cr/tienda/wp-admin` abre WordPress.
   - `https://sira.cr/robots.txt` dice `Disallow: /tienda/` y `Allow: /tienda/wp-content/uploads/`
     (lo arma solo el sitio cuando WordPress está en la misma dirección).
   - `www.sira.cr` redirige a `sira.cr` (lo hace `public/.htaccess`).
   - Agregar al carrito, ir al carrito, pedido de prueba con **transferencia** → aparece en
     WooCommerce → Pedidos. Cancelarlo.
   - Pago con tarjeta (cuando Afinia tenga las claves): Astro → página de Afinia → «Gracias» en Astro.
3. Google Search Console: agregar `sira.cr` y enviar `https://sira.cr/sitemap-index.xml`.
4. Apagar el sitio temporal viejo (o dejarlo en mantenimiento) para que no haya dos tiendas abiertas.

## 5. Por qué así y no de otra forma

- **No** se instala WordPress en la raíz: la raíz es del sitio en Astro (el que ve el cliente).
- La carpeta `tienda` no la toca el despliegue de Astro: Git solo actualiza sus propios archivos.
- Las reglas del `.htaccess` de Astro (caché, www→sin www) también aplican a `/tienda`, pero las de
  WordPress (en `public_html/tienda/.htaccess`) mandan dentro de su carpeta: no se pisan.
- Si algún día se quiere el `wp-admin` en otra dirección, se puede cambiar `tienda` por otro nombre
  (por ejemplo `admin-sira`): solo hay que ajustar `PUBLIC_TIENDA_URL` y los dos plugins.
