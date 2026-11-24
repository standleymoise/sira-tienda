<?php
/**
 * Plugin Name: Tienda – Cuentas para el frontend Astro
 * Description: Inicio de sesión, registro y «Mi cuenta» por API para el frontend en Astro. Usa un token propio en el encabezado X-Tienda-Token (las cookies de WordPress no sirven entre dominios). Con el token, la Store API también reconoce al cliente y sus pedidos quedan en su cuenta. Para quitarlo, borre este archivo.
 *
 * Rutas (todas en /wp-json/tienda/v1/):
 *   POST registro   { email, password, nombre, apellidos }  → { token, perfil }
 *   POST login      { email, password }                     → { token, perfil }
 *   POST recuperar  { email }                               → envía el correo de WordPress para cambiar la contraseña
 *   GET  cuenta                                             → { perfil, pedidos }   (requiere token)
 *   POST cuenta     { nombre, apellidos, telefono, ... }    → { perfil }            (requiere token)
 *   POST salir                                              → cierra esta sesión     (requiere token)
 *
 * Opcional en wp-config.php:
 *   define( 'TIENDA_SESION_DIAS', 30 );   // duración de la sesión
 *   define( 'TIENDA_INTENTOS', 8 );       // intentos por IP cada 15 minutos
 */

defined( 'ABSPATH' ) || exit;

const TIENDA_ENCABEZADO = 'X-Tienda-Token';
defined( 'TIENDA_SESION_DIAS' ) || define( 'TIENDA_SESION_DIAS', 30 );
defined( 'TIENDA_INTENTOS' ) || define( 'TIENDA_INTENTOS', 8 ); // por IP cada 15 minutos (login, registro y recuperar)

// ---------------------------------------------------------------- tokens

function tienda_hash( $token ) {
	return hash_hmac( 'sha256', $token, wp_salt( 'auth' ) );
}

function tienda_crear_token( $user_id ) {
	$token = bin2hex( random_bytes( 32 ) );
	$hash  = tienda_hash( $token );
	add_user_meta( $user_id, 'tienda_token', $hash );
	update_user_meta( $user_id, 'tienda_token_exp_' . $hash, time() + TIENDA_SESION_DIAS * DAY_IN_SECONDS );
	return $token;
}

function tienda_token_de_la_peticion() {
	$token = isset( $_SERVER['HTTP_X_TIENDA_TOKEN'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_TIENDA_TOKEN'] ) ) : '';
	return preg_match( '/^[a-f0-9]{64}$/', $token ) ? $token : '';
}

function tienda_usuario_por_token( $token ) {
	$hash = tienda_hash( $token );
	$ids  = get_users(
		array(
			'meta_key'   => 'tienda_token',
			'meta_value' => $hash,
			'number'     => 1,
			'fields'     => 'ID',
		)
	);
	if ( ! $ids ) {
		return 0;
	}
	$id  = (int) $ids[0];
	$exp = (int) get_user_meta( $id, 'tienda_token_exp_' . $hash, true );
	if ( $exp < time() ) {
		tienda_borrar_token( $id, $hash );
		return 0;
	}
	return $id;
}

function tienda_borrar_token( $user_id, $hash ) {
	delete_user_meta( $user_id, 'tienda_token', $hash );
	delete_user_meta( $user_id, 'tienda_token_exp_' . $hash );
}

// El token identifica al usuario solo en peticiones a la API REST (incluida la Store API,
// así los pedidos del checkout quedan asociados a la cuenta).
add_filter(
	'determine_current_user',
	function ( $user_id ) {
		if ( $user_id ) {
			return $user_id;
		}
		$uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '';
		if ( false === strpos( $uri, '/wp-json/' ) && false === strpos( $uri, 'rest_route=' ) ) {
			return $user_id;
		}
		$token = tienda_token_de_la_peticion();
		return $token ? ( tienda_usuario_por_token( $token ) ?: $user_id ) : $user_id;
	},
	30
);

// CORS: permitir el encabezado del token (el origen lo permite tienda-cors.php).
add_filter(
	'rest_allowed_cors_headers',
	function ( $encabezados ) {
		$encabezados[] = TIENDA_ENCABEZADO;
		return $encabezados;
	}
);

// ---------------------------------------------------------------- utilidades

function tienda_limite( $accion ) {
	$ip    = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$clave = 'tienda_' . $accion . '_' . md5( $ip );
	$n     = (int) get_transient( $clave );
	if ( $n >= TIENDA_INTENTOS ) {
		return new WP_Error( 'tienda_limite', 'Demasiados intentos. Espere unos minutos e intente de nuevo.', array( 'status' => 429 ) );
	}
	set_transient( $clave, $n + 1, 15 * MINUTE_IN_SECONDS );
	return true;
}

function tienda_perfil( $user_id ) {
	$u        = get_userdata( $user_id );
	$cliente  = new WC_Customer( $user_id );
	$nombre   = $cliente->get_first_name() ?: $u->first_name;
	$apellido = $cliente->get_last_name() ?: $u->last_name;
	return array(
		'email'     => $u->user_email,
		'nombre'    => $nombre,
		'apellidos' => $apellido,
		'desde'     => mysql2date( 'Y-m-d', $u->user_registered ),
		'telefono'  => $cliente->get_billing_phone(),
		'direccion' => $cliente->get_billing_address_1(),
		'ciudad'    => $cliente->get_billing_city(),
		'provincia' => $cliente->get_billing_state(),
		'postal'    => $cliente->get_billing_postcode(),
	);
}

function tienda_pedidos( $user_id ) {
	$pedidos = wc_get_orders(
		array(
			'customer_id' => $user_id,
			'limit'       => 30,
			'orderby'     => 'date',
			'order'       => 'DESC',
		)
	);
	return array_map(
		function ( $o ) {
			$items = array();
			foreach ( $o->get_items() as $item ) {
				$producto = $item->get_product();
				$items[]  = array(
					'nombre'   => $item->get_name(),
					'cantidad' => $item->get_quantity(),
					'imagen'   => $producto ? (string) wp_get_attachment_image_url( $producto->get_image_id(), 'woocommerce_thumbnail' ) : '',
				);
			}
			return array(
				'numero' => $o->get_order_number(),
				'fecha'  => $o->get_date_created() ? $o->get_date_created()->date( 'Y-m-d' ) : '',
				'estado' => $o->get_status(),
				'estado_texto' => wc_get_order_status_name( $o->get_status() ),
				'total'  => (float) $o->get_total(),
				'moneda' => $o->get_currency(),
				'pago'   => $o->get_payment_method_title(),
				'items'  => $items,
			);
		},
		$pedidos
	);
}

function tienda_texto( $req, $campo, $max = 120 ) {
	return mb_substr( sanitize_text_field( (string) $req->get_param( $campo ) ), 0, $max );
}

// ---------------------------------------------------------------- rutas

add_action(
	'rest_api_init',
	function () {
		$ns = 'tienda/v1';

		register_rest_route(
			$ns,
			'/registro',
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $req ) {
					$limite = tienda_limite( 'registro' );
					if ( is_wp_error( $limite ) ) {
						return $limite;
					}
					$email    = sanitize_email( (string) $req->get_param( 'email' ) );
					$password = (string) $req->get_param( 'password' );
					$nombre   = tienda_texto( $req, 'nombre' );
					$apellido = tienda_texto( $req, 'apellidos' );
					if ( ! is_email( $email ) ) {
						return new WP_Error( 'tienda_email', 'Escriba un correo electrónico válido.', array( 'status' => 400 ) );
					}
					if ( strlen( $password ) < 8 ) {
						return new WP_Error( 'tienda_password', 'La contraseña debe tener al menos 8 caracteres.', array( 'status' => 400 ) );
					}
					if ( '' === $nombre ) {
						return new WP_Error( 'tienda_nombre', 'Escriba su nombre.', array( 'status' => 400 ) );
					}
					if ( email_exists( $email ) ) {
						return new WP_Error( 'tienda_existe', 'Ya existe una cuenta con ese correo. Inicie sesión.', array( 'status' => 409 ) );
					}
					$id = wc_create_new_customer(
						$email,
						wc_create_new_customer_username( $email ),
						$password,
						array(
							'first_name' => $nombre,
							'last_name'  => $apellido,
						)
					);
					if ( is_wp_error( $id ) ) {
						return new WP_Error( 'tienda_registro', wp_strip_all_tags( $id->get_error_message() ), array( 'status' => 400 ) );
					}
					$cliente = new WC_Customer( $id );
					$cliente->set_billing_first_name( $nombre );
					$cliente->set_billing_last_name( $apellido );
					$cliente->set_billing_email( $email );
					$cliente->set_billing_country( WC()->countries->get_base_country() );
					$cliente->save();
					return array(
						'token'  => tienda_crear_token( $id ),
						'perfil' => tienda_perfil( $id ),
					);
				},
			)
		);

		register_rest_route(
			$ns,
			'/login',
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $req ) {
					$limite = tienda_limite( 'login' );
					if ( is_wp_error( $limite ) ) {
						return $limite;
					}
					$email    = trim( (string) $req->get_param( 'email' ) );
					$password = (string) $req->get_param( 'password' );
					$usuario  = wp_authenticate( $email, $password );
					if ( is_wp_error( $usuario ) ) {
						return new WP_Error( 'tienda_login', 'Correo o contraseña incorrectos.', array( 'status' => 401 ) );
					}
					return array(
						'token'  => tienda_crear_token( $usuario->ID ),
						'perfil' => tienda_perfil( $usuario->ID ),
					);
				},
			)
		);

		register_rest_route(
			$ns,
			'/recuperar',
			array(
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $req ) {
					$limite = tienda_limite( 'recuperar' );
					if ( is_wp_error( $limite ) ) {
						return $limite;
					}
					$email = sanitize_email( (string) $req->get_param( 'email' ) );
					if ( is_email( $email ) && email_exists( $email ) ) {
						retrieve_password( $email );
					}
					// Misma respuesta exista o no la cuenta (no revela qué correos están registrados).
					return array( 'ok' => true );
				},
			)
		);

		register_rest_route(
			$ns,
			'/cuenta',
			array(
				array(
					'methods'             => 'GET',
					'permission_callback' => 'is_user_logged_in',
					'callback'            => function () {
						$id = get_current_user_id();
						return array(
							'perfil'  => tienda_perfil( $id ),
							'pedidos' => tienda_pedidos( $id ),
						);
					},
				),
				array(
					'methods'             => 'POST',
					'permission_callback' => 'is_user_logged_in',
					'callback'            => function ( WP_REST_Request $req ) {
						$id      = get_current_user_id();
						$cliente = new WC_Customer( $id );
						$nombre  = tienda_texto( $req, 'nombre' );
						$apell   = tienda_texto( $req, 'apellidos' );
						if ( '' === $nombre ) {
							return new WP_Error( 'tienda_nombre', 'Escriba su nombre.', array( 'status' => 400 ) );
						}
						$cliente->set_first_name( $nombre );
						$cliente->set_last_name( $apell );
						$cliente->set_billing_first_name( $nombre );
						$cliente->set_billing_last_name( $apell );
						$cliente->set_billing_phone( tienda_texto( $req, 'telefono', 40 ) );
						$cliente->set_billing_address_1( tienda_texto( $req, 'direccion', 200 ) );
						$cliente->set_billing_city( tienda_texto( $req, 'ciudad' ) );
						$cliente->set_billing_state( tienda_texto( $req, 'provincia', 10 ) );
						$cliente->set_billing_postcode( tienda_texto( $req, 'postal', 10 ) );
						$cliente->set_billing_country( WC()->countries->get_base_country() );
						$cliente->save();
						return array( 'perfil' => tienda_perfil( $id ) );
					},
				),
			)
		);

		register_rest_route(
			$ns,
			'/salir',
			array(
				'methods'             => 'POST',
				'permission_callback' => 'is_user_logged_in',
				'callback'            => function () {
					$token = tienda_token_de_la_peticion();
					if ( $token ) {
						tienda_borrar_token( get_current_user_id(), tienda_hash( $token ) );
					}
					return array( 'ok' => true );
				},
			)
		);
	}
);
