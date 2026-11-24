<?php
/**
 * Plugin Name: Tienda – CORS para el frontend Astro
 * Description: Permite que el frontend en Astro (otro dominio) use la Store API de WooCommerce y las rutas de cuenta: catálogo, carrito y checkout sin salir del sitio. Los dominios se definen en wp-config.php con TIENDA_FRONTEND_ORIGINS. Para quitarlo, borre este archivo.
 *
 * En wp-config.php (antes de «That's all, stop editing!»):
 *   define( 'TIENDA_FRONTEND_ORIGINS', 'https://midominio.com' );
 *   // Varios, separados por coma: 'https://midominio.com,https://www.midominio.com'
 */

defined( 'ABSPATH' ) || exit;

add_filter(
	'allowed_http_origins',
	function ( $origins ) {
		if ( ! defined( 'TIENDA_FRONTEND_ORIGINS' ) ) {
			return $origins;
		}
		foreach ( explode( ',', (string) TIENDA_FRONTEND_ORIGINS ) as $origen ) {
			$origen = untrailingslashit( trim( $origen ) );
			if ( preg_match( '#^https?://[^/\s]+$#', $origen ) ) {
				$origins[] = $origen;
			}
		}
		return $origins;
	}
);

// Aviso en el escritorio si falta configurar el dominio del frontend.
add_action(
	'admin_notices',
	function () {
		if ( defined( 'TIENDA_FRONTEND_ORIGINS' ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo '<div class="notice notice-warning"><p><strong>Tienda (Astro):</strong> falta definir <code>TIENDA_FRONTEND_ORIGINS</code> en <code>wp-config.php</code> con el dominio del frontend; sin eso el carrito del sitio en Astro no puede conectarse.</p></div>';
	}
);
