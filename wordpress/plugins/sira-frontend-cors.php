<?php
/**
 * Plugin Name: SIRA – Permitir el sitio en Astro (CORS)
 * Description: Deja que el sitio SIRA en Astro use el carrito y el pago de WooCommerce (Store API) desde otro dominio. Igual que tienda-cors.php de la plantilla, pero con los dominios escritos aquí, para instalarlo desde wp-admin sin editar wp-config.php. Si wp-config.php ya define TIENDA_FRONTEND_ORIGINS, se usa ese valor.
 * Version: 1.0.0
 */

defined( 'ABSPATH' ) || exit;

// Dominios del sitio en Astro, separados por coma (sin barra final).
// Vista previa en GitHub Pages; agregar el dominio propio cuando exista.
const SIRA_FRONTEND_ORIGINS = 'https://standleymoise.github.io';

add_filter(
	'allowed_http_origins',
	function ( $origins ) {
		$lista = defined( 'TIENDA_FRONTEND_ORIGINS' ) ? TIENDA_FRONTEND_ORIGINS : SIRA_FRONTEND_ORIGINS;
		foreach ( explode( ',', (string) $lista ) as $origen ) {
			$origen = untrailingslashit( trim( $origen ) );
			if ( preg_match( '#^https?://[^/\s]+$#', $origen ) ) {
				$origins[] = $origen;
			}
		}
		return $origins;
	}
);
