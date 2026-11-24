<?php
/**
 * Plugin Name: SIRA – Pago con Afinia desde Astro
 * Description: Permite que el sitio SIRA en Astro lleve al cliente directo a la página segura de Afinia (sin pasar por la página de pago de WordPress) y que, al volver de Afinia, regrese al «Gracias» del sitio en Astro. No toca la tarjeta: el cobro sigue ocurriendo en Afinia y la confirmación llega por su webhook, como siempre.
 * Version: 1.1.0
 * Requires Plugins: woocommerce
 *
 * Ruta: GET /wp-json/sira/v1/afinia/<pedido>?key=<clave del pedido>
 *   Devuelve los mismos datos que la página de pago de WordPress le pasa al script de Afinia
 *   (clave pública del comercio, monto, moneda, referencias, correo y si es modo de pruebas).
 *   Solo responde con la clave del pedido (la que WooCommerce pone en la URL de pago) y solo si el
 *   pedido es de Afinia y todavía necesita pago.
 *
 * Idioma (1.1.0): el carrito en inglés (/en/carrito/) manda «sira_idioma: en» en el POST /checkout
 *   de la Store API. Se guarda en el pedido (meta _sira_idioma) y, al volver de Afinia, el cliente
 *   llega al «Gracias» en inglés. Sin ese dato (pedidos en español o anteriores) todo sigue igual.
 */

defined( 'ABSPATH' ) || exit;

// Página «Gracias» del sitio en Astro (vista previa). Cambiar cuando exista el dominio propio.
const SIRA_ASTRO_GRACIAS = 'https://standleymoise.github.io/sira-tienda/carrito/';
// La misma página en inglés.
const SIRA_ASTRO_GRACIAS_EN = 'https://standleymoise.github.io/sira-tienda/en/carrito/';

// Idioma del pedido: el carrito de Astro lo manda explícito en el POST /checkout («sira_idioma»).
// Solo se acepta «en»; cualquier otro valor se ignora (español por defecto).
add_action(
	'woocommerce_store_api_checkout_update_order_from_request',
	function ( $pedido, $request ) {
		if ( ! $pedido || ! ( $request instanceof WP_REST_Request ) ) {
			return;
		}
		if ( 'en' === sanitize_key( (string) $request->get_param( 'sira_idioma' ) ) ) {
			$pedido->update_meta_data( '_sira_idioma', 'en' );
		} else {
			$pedido->delete_meta_data( '_sira_idioma' );
		}
	},
	10,
	2
);

/** La pasarela de Afinia, o null si no está activa. */
function sira_afinia_pasarela() {
	if ( ! function_exists( 'WC' ) ) {
		return null;
	}
	$pasarelas = WC()->payment_gateways() ? WC()->payment_gateways()->payment_gateways() : array();
	return $pasarelas['afinia_gateway'] ?? null;
}

/** Valor de un ajuste de Afinia buscado por el título del campo (el plugin no documenta las claves). */
function sira_afinia_ajuste( $pasarela, array $titulos ) {
	foreach ( (array) $pasarela->form_fields as $clave => $campo ) {
		$titulo = isset( $campo['title'] ) ? wp_strip_all_tags( (string) $campo['title'] ) : '';
		if ( in_array( strtolower( $titulo ), $titulos, true ) ) {
			return $pasarela->get_option( $clave );
		}
	}
	return '';
}

/**
 * Clave pública del comercio en Afinia (la misma que la página de pago de WordPress pone en el HTML).
 * El plugin de Afinia no documenta el nombre del ajuste: se busca por la propiedad o por el campo
 * cuyo nombre o título habla de «API» (y no es la «Security key» del webhook).
 */
function sira_afinia_apikey( $pasarela ) {
	foreach ( array( 'apikey', 'api_key', 'apiKey', 'APIKey' ) as $prop ) {
		if ( isset( $pasarela->$prop ) && '' !== (string) $pasarela->$prop ) {
			return (string) $pasarela->$prop;
		}
	}
	foreach ( (array) $pasarela->form_fields as $clave => $campo ) {
		$texto = $clave . ' ' . ( isset( $campo['title'] ) ? wp_strip_all_tags( (string) $campo['title'] ) : '' );
		if ( preg_match( '/api/i', $texto ) && ! preg_match( '/secur|segur|webhook/i', $texto ) ) {
			$valor = (string) $pasarela->get_option( $clave );
			if ( '' !== $valor ) {
				return $valor;
			}
		}
	}
	return '';
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'sira/v1',
			'/afinia/(?P<pedido>\d+)',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true', // se valida con la clave del pedido
				'callback'            => function ( WP_REST_Request $req ) {
					$pedido = wc_get_order( (int) $req['pedido'] );
					$clave  = sanitize_text_field( (string) $req->get_param( 'key' ) );
					if ( ! $pedido || '' === $clave || ! hash_equals( $pedido->get_order_key(), $clave ) ) {
						return new WP_Error( 'sira_pedido', 'Pedido no encontrado.', array( 'status' => 404 ) );
					}
					if ( 'afinia_gateway' !== $pedido->get_payment_method() ) {
						return new WP_Error( 'sira_metodo', 'Este pedido no se paga con Afinia.', array( 'status' => 400 ) );
					}
					if ( ! $pedido->needs_payment() ) {
						return new WP_Error( 'sira_pagado', 'Este pedido ya no necesita pago.', array( 'status' => 409 ) );
					}
					$pasarela = sira_afinia_pasarela();
					if ( ! $pasarela ) {
						return new WP_Error( 'sira_afinia', 'Afinia no está activa.', array( 'status' => 503 ) );
					}
					$prueba = 'yes' === sira_afinia_ajuste( $pasarela, array( 'test mode', 'modo de prueba' ) );
					$apikey = sira_afinia_apikey( $pasarela );
					if ( '' === $apikey ) {
						return new WP_Error( 'sira_afinia', 'Afinia no tiene la clave configurada.', array( 'status' => 503 ) );
					}
					$respuesta = rest_ensure_response(
						array(
							'apikey'     => $apikey,
							'email'      => $pedido->get_billing_email(),
							'moneda'     => $pedido->get_currency(),
							'monto'      => $pedido->get_total(),
							'referencia' => (string) $pedido->get_id(),
							'referencia2' => $pedido->get_order_key(),
							'prueba'     => $prueba,
							'script'     => $prueba
								? 'https://dashboard.afinia.site/gatewaycdn/V1.1/AfiniaPaymentsandbox.min.js'
								: 'https://dashboard.afinia.site/gatewaycdn/V1.1/AfiniaPayment.min.js',
							'pagoWordpress' => $pedido->get_checkout_payment_url( true ),
						)
					);
					$respuesta->header( 'Cache-Control', 'no-store' );
					return $respuesta;
				},
			)
		);
	}
);

// Al volver de Afinia, WooCommerce muestra su página «Gracias» (ahí el plugin de Afinia procesa el
// resultado). Para pedidos hechos desde el sitio en Astro (creados por la Store API), después de
// ese proceso se lleva al cliente al «Gracias» de Astro, en el idioma en que hizo el pedido.
add_action(
	'woocommerce_thankyou',
	function ( $pedido_id ) {
		$pedido = wc_get_order( $pedido_id );
		if ( ! $pedido || 'store-api' !== $pedido->get_created_via() ) {
			return;
		}
		$destino = add_query_arg(
			array(
				'pedido' => $pedido->get_id(),
				'estado' => $pedido->has_status( array( 'processing', 'completed', 'on-hold' ) ) ? 'ok' : $pedido->get_status(),
			),
			'en' === $pedido->get_meta( '_sira_idioma' ) ? SIRA_ASTRO_GRACIAS_EN : SIRA_ASTRO_GRACIAS
		);
		printf( '<script>location.replace(%s);</script>', wp_json_encode( esc_url_raw( $destino ) ) );
	},
	99
);
