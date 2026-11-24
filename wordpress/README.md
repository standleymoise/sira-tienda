# Plugins de WordPress

Cuatro *mu-plugins* (se activan solos, no aparecen en «Plugins»). Van en
`wp-content/mu-plugins/` del WordPress de la tienda; si la carpeta `mu-plugins` no existe, se crea.
Para quitar uno basta con borrar el archivo.

| Archivo | Para qué |
|---|---|
| `tienda-cors.php` | Deja que el frontend (otro dominio) use la Store API y las rutas de cuenta. **Requiere** `TIENDA_FRONTEND_ORIGINS` en `wp-config.php`. |
| `tienda-publicar.php` | Opcional: al publicar, editar o despublicar un producto o un testimonio (ACF + CPT UI), le pide a GitHub que recompile el sitio. Junta los cambios de un minuto. Requiere `TIENDA_GITHUB_REPO` y `TIENDA_GITHUB_TOKEN`. Sin él, el sitio se actualiza una vez al día. |
| `tienda-extras.php` | **Ejemplo opcional** de plugin propio conectado a Astro sin claves: un «Texto destacado» por producto (pestaña General del producto) y un «Mensaje de regalo» en el checkout que queda en el pedido y en el correo a la tienda. Si no se sube, el frontend no muestra nada de esto. |
| `tienda-cuenta.php` | Login, registro, recuperar contraseña y «Mi cuenta» (perfil y pedidos) con un token propio (`X-Tienda-Token`). Con el token, la Store API reconoce al cliente y sus pedidos quedan en su cuenta. |

## Configuración en `wp-config.php`

Antes de la línea `/* That's all, stop editing! */`:

```php
define( 'TIENDA_FRONTEND_ORIGINS', 'https://midominio.com' );
// Opcionales:
// define( 'TIENDA_SESION_DIAS', 30 );  // duración de la sesión del cliente
// define( 'TIENDA_INTENTOS', 8 );      // intentos de login/registro por IP cada 15 minutos

// Solo con tienda-publicar.php (ver README principal, «Contenido editable»):
// define( 'TIENDA_GITHUB_REPO', 'usuario/mi-tienda' );
// define( 'TIENDA_GITHUB_TOKEN', 'github_pat_…' );  // fine-grained, solo ese repo, Contents: Read and write
```

Mientras falte `TIENDA_FRONTEND_ORIGINS`, el escritorio de WordPress muestra un aviso.

## Comprobar que quedaron bien

```bash
# Debe responder con access-control-allow-origin: https://midominio.com
curl -s -D - -o /dev/null "https://tienda.midominio.com/wp-json/wc/store/v1/products" -H "Origin: https://midominio.com" | grep -i access-control-allow-origin

# Debe responder {"code":"tienda_login",...,"status":401}
curl -s -X POST "https://tienda.midominio.com/wp-json/tienda/v1/login" -H "Content-Type: application/json" -d '{"email":"nadie@example.com","password":"x"}'
```

Estos archivos **no** se publican con GitHub Actions (el workflow solo publica el frontend):
si se cambian aquí, hay que volver a subirlos al servidor.

## Cómo se conecta un plugin propio con Astro (modelo: `tienda-extras.php`)

Nunca con claves de la API de WooCommerce (`/wc/v3`) en el frontend: todo lo que va en el JavaScript
lo puede leer cualquiera. El plugin agrega lo suyo a la **Store API**, que es pública:

| Necesidad | En el plugin | En Astro |
|---|---|---|
| Mostrar un dato del producto | `ExtendSchema` → `ProductSchema` | `producto.extensions['tienda-extras'].destacado` (al compilar y en vivo) |
| Mostrar un dato del carrito | `ExtendSchema` → `CartSchema` | `carrito.extensions['tienda-extras'].nota_regalo` |
| Que el cliente guarde algo | `woocommerce_store_api_register_update_callback` | `POST /cart/extensions` `{namespace, data}` (`cliente.notaRegalo()`) |
| Llevarlo al pedido | `woocommerce_store_api_checkout_update_order_from_request` | nada |

El plugin valida y limpia todo en el servidor (largo máximo, `sanitize_*`); lo que manda el navegador
no se cree. Para datos privados del cliente (puntos, historial), una ruta propia con el token de
`tienda-cuenta.php`.

```bash
# Con el plugin subido: el producto trae su bloque de extensions
curl -s "https://tienda.midominio.com/wp-json/wc/store/v1/products?per_page=1" | grep -o '"tienda-extras":{[^}]*}'
```
