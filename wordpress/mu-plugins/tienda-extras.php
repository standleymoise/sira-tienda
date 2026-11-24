<?php
/**
 * Plugin Name: Tienda – Extras de ejemplo (dato del producto y mensaje de regalo)
 * Description: Ejemplo de cómo un plugin propio se conecta con el frontend en Astro sin claves: agrega a la Store API un texto «destacado» por producto y un mensaje de regalo en el carrito que queda guardado en el pedido. Para quitarlo, borre este archivo (el frontend oculta todo solo).
 *
 * Cómo se usa desde Astro (sin API keys; la Store API es pública y el carrito va con Cart-Token):
 *   GET  /wp-json/wc/store/v1/products            → producto.extensions['tienda-extras'].destacado
 *   GET  /wp-json/wc/store/v1/cart                → carrito.extensions['tienda-extras'].nota_regalo
 *   POST /wp-json/wc/store/v1/cart/extensions
 *        {"namespace":"tienda-extras","data":{"nota_regalo":"¡Feliz cumpleaños!"}}
 * Al confirmar el pedido, el mensaje se copia al pedido y se ve en wp-admin y en el correo a la tienda.
 */

defined( 'ABSPATH' ) || exit;

const TIENDA_EXTRAS_NS        = 'tienda-extras';
const TIENDA_EXTRAS_META_DEST = '_tienda_destacado';
const TIENDA_EXTRAS_META_NOTA = '_tienda_nota_regalo';
const TIENDA_EXTRAS_SESION    = 'tienda_nota_regalo';
const TIENDA_EXTRAS_MAX_DEST  = 60;
const TIENDA_EXTRAS_MAX_NOTA  = 300;

/** Recorta sin partir letras con tilde. */
function tienda_extras_recortar( string $texto, int $max ): string {
	return function_exists( 'mb_substr' ) ? mb_substr( $texto, 0, $max ) : substr( $texto, 0, $max );
}

// ---------------------------------------------------------------------------
// 1. Campo en el producto (wp-admin → Productos → Editar → pestaña General)
// ---------------------------------------------------------------------------
add_action(
	'woocommerce_product_options_general_product_data',
	function () {
		woocommerce_wp_text_input(
			array(
				'id'                => TIENDA_EXTRAS_META_DEST,
				'label'             => 'Texto destacado',
				'description'       => 'Frase corta que la tienda muestra junto al precio (p. ej. «Envío gratis» o «Hecho en Costa Rica»). Vacío = no se muestra.',
				'desc_tip'          => true,
				'custom_attributes' => array( 'maxlength' => TIENDA_EXTRAS_MAX_DEST ),
			)
		);
	}
);

add_action(
	'woocommerce_admin_process_product_object',
	function ( WC_Product $producto ) {
		// WooCommerce ya verificó el nonce y el permiso de edición antes de este gancho.
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$valor = isset( $_POST[ TIENDA_EXTRAS_META_DEST ] ) ? sanitize_text_field( wp_unslash( $_POST[ TIENDA_EXTRAS_META_DEST ] ) ) : '';
		$valor = tienda_extras_recortar( $valor, TIENDA_EXTRAS_MAX_DEST );
		if ( '' === $valor ) {
			$producto->delete_meta_data( TIENDA_EXTRAS_META_DEST );
		} else {
			$producto->update_meta_data( TIENDA_EXTRAS_META_DEST, $valor );
		}
	}
);

// ---------------------------------------------------------------------------
// 2. Exponerlo en la Store API (productos y carrito)
// ---------------------------------------------------------------------------
add_action(
	'woocommerce_blocks_loaded',
	function () {
		if ( ! class_exists( '\Automattic\WooCommerce\StoreApi\StoreApi' ) || ! function_exists( 'woocommerce_store_api_register_update_callback' ) ) {
			return;
		}
		$extend = \Automattic\WooCommerce\StoreApi\StoreApi::container()->get( \Automattic\WooCommerce\StoreApi\Schemas\ExtendSchema::class );

		// Producto → extensions['tienda-extras'].destacado (solo lectura).
		$extend->register_endpoint_data(
			array(
				'endpoint'        => \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER,
				'namespace'       => TIENDA_EXTRAS_NS,
				'data_callback'   => function ( $producto ) {
					return array( 'destacado' => (string) $producto->get_meta( TIENDA_EXTRAS_META_DEST ) );
				},
				'schema_callback' => function () {
					return array(
						'destacado' => array(
							'description' => 'Texto destacado del producto.',
							'type'        => 'string',
							'readonly'    => true,
						),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);

		// Carrito → extensions['tienda-extras'].nota_regalo.
		$extend->register_endpoint_data(
			array(
				'endpoint'        => \Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema::IDENTIFIER,
				'namespace'       => TIENDA_EXTRAS_NS,
				'data_callback'   => function () {
					$nota = WC()->session ? WC()->session->get( TIENDA_EXTRAS_SESION, '' ) : '';
					return array(
						'nota_regalo' => (string) $nota,
						'max'         => TIENDA_EXTRAS_MAX_NOTA,
					);
				},
				'schema_callback' => function () {
					return array(
						'nota_regalo' => array(
							'description' => 'Mensaje de regalo del carrito.',
							'type'        => 'string',
							'readonly'    => true,
						),
						'max'         => array(
							'description' => 'Largo máximo del mensaje.',
							'type'        => 'integer',
							'readonly'    => true,
						),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);

		// POST /cart/extensions con namespace tienda-extras: guardar el mensaje en la sesión del carrito.
		woocommerce_store_api_register_update_callback(
			array(
				'namespace' => TIENDA_EXTRAS_NS,
				'callback'  => function ( $datos ) {
					$nota = sanitize_textarea_field( (string) ( $datos['nota_regalo'] ?? '' ) );
					if ( ( function_exists( 'mb_strlen' ) ? mb_strlen( $nota ) : strlen( $nota ) ) > TIENDA_EXTRAS_MAX_NOTA ) {
						throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException(
							'tienda_nota_larga',
							sprintf( 'El mensaje de regalo puede tener hasta %d caracteres.', TIENDA_EXTRAS_MAX_NOTA ),
							400
						);
					}
					WC()->session->set( TIENDA_EXTRAS_SESION, $nota );
				},
			)
		);
	}
);

// ---------------------------------------------------------------------------
// 3. Al confirmar el pedido por la Store API: copiar el mensaje al pedido
// ---------------------------------------------------------------------------
add_action(
	'woocommerce_store_api_checkout_update_order_from_request',
	function ( WC_Order $pedido ) {
		$nota = WC()->session ? (string) WC()->session->get( TIENDA_EXTRAS_SESION, '' ) : '';
		if ( '' === $nota ) {
			$pedido->delete_meta_data( TIENDA_EXTRAS_META_NOTA );
		} else {
			$pedido->update_meta_data( TIENDA_EXTRAS_META_NOTA, $nota );
		}
		// WooCommerce guarda el pedido después de este gancho.
	}
);

// Pedido creado: el carrito siguiente empieza sin mensaje.
add_action(
	'woocommerce_store_api_checkout_order_processed',
	function () {
		if ( WC()->session ) {
			WC()->session->set( TIENDA_EXTRAS_SESION, null );
		}
	}
);

// ---------------------------------------------------------------------------
// 4. Mostrar el mensaje en wp-admin y en el correo de pedido nuevo a la tienda
// ---------------------------------------------------------------------------
add_action(
	'woocommerce_admin_order_data_after_shipping_address',
	function ( $pedido ) {
		$nota = $pedido->get_meta( TIENDA_EXTRAS_META_NOTA );
		if ( $nota ) {
			echo '<p><strong>Mensaje de regalo:</strong><br>' . nl2br( esc_html( $nota ) ) . '</p>';
		}
	}
);

add_action(
	'woocommerce_email_after_order_table',
	function ( $pedido, $para_admin, $texto_plano ) {
		if ( ! $para_admin ) {
			return; // El cliente ya conoce su mensaje; solo se avisa a la tienda.
		}
		$nota = $pedido->get_meta( TIENDA_EXTRAS_META_NOTA );
		if ( ! $nota ) {
			return;
		}
		if ( $texto_plano ) {
			echo "\nMensaje de regalo:\n" . esc_html( $nota ) . "\n";
		} else {
			echo '<h2>Mensaje de regalo</h2><p>' . nl2br( esc_html( $nota ) ) . '</p>';
		}
	},
	10,
	3
);
